import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { uploadVideoToS3 } from "@/lib/s3/uploadVideo";
import { existsSync } from "fs";
import { unlink } from "fs/promises";

// ─── Helper ───────────────────────────────────────────────────────────────────

async function updateProject(
  projectId: string,
  patch: {
    status?: string;
    progress?: number;
    statusLabel?: string;
    errorMsg?: string;
    s3Url?: string;
    sourceUrl?: string;
  }
) {
  await db
    .update(projects)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(projects.projectId, projectId));
}

// ─── Inngest Function ─────────────────────────────────────────────────────────

export const videoUploadFunction = inngest.createFunction(
  {
    id: "video-upload",
    name: "Video Upload & Processing",
    retries: 1,
    triggers: [{ event: "video/upload.requested" }],

    // Called when ALL retries are exhausted — marks DB as failed
    onFailure: async ({ event, error }) => {
      // In Inngest failure events, the original event payload is inside event.data.event.data
      const originalData = (event.data as any)?.event?.data ?? {};
      const projectId = originalData.projectId;
      if (projectId) {
        await updateProject(projectId, {
          status: "failed",
          statusLabel: "Upload failed",
          errorMsg: error?.message ?? "Unknown error",
        });
      }
    },
  },
  async ({ event, step }) => {
    const { projectId, sourceType, sourceUrl, title } = event.data as {
      projectId: string;
      sourceType: "local" | "youtube";
      sourceUrl: string | null;
      youtubeId: string | null;
      title: string;
      userId: number;
    };

    // ── Step 1: Mark uploading ─────────────────────────────────────────────
    await step.run("upload-start", async () => {
      await updateProject(projectId, {
        status: "uploading",
        progress: 10,
        statusLabel: "Starting upload…",
      });
    });

    // ── Step 2: Upload to S3 or validate YouTube URL ───────────────────────
    const s3Result = await step.run("upload-to-s3", async () => {
      if (sourceType === "local") {
        if (!sourceUrl || !existsSync(sourceUrl)) {
          throw new Error(
            `Temp file not found at: ${sourceUrl}. Please re-upload the video.`
          );
        }

        const fileName = sourceUrl.split(/[\\/]/).pop() ?? title ?? "video.mp4";

        let result: { s3Url: string; s3Key: string };
        try {
          result = await uploadVideoToS3({
            filePath: sourceUrl,
            fileName,
            keyPrefix: `videos/uploads/${projectId}/`,
            onProgress: async (percent) => {
              // Map S3 upload 0–100% → overall progress 15–85%
              const overall = 15 + Math.round(percent * 0.70);
              await updateProject(projectId, {
                status: "uploading",
                progress: overall,
                statusLabel: `Uploading to S3… (${percent}%)`,
              });
            },
          });
        } catch (s3Err) {
          const msg = s3Err instanceof Error ? s3Err.message : String(s3Err);
          console.error("[Inngest] S3 upload failed:", msg);
          await updateProject(projectId, {
            status: "failed",
            statusLabel: "Upload to S3 failed",
            errorMsg: msg,
          });
          throw s3Err; // Re-throw so Inngest records the step as failed
        }


        await updateProject(projectId, {
          status: "uploading",
          progress: 88,
          statusLabel: "Finalising upload…",
        });

        return { s3Url: result.s3Url, s3Key: result.s3Key };
      } else {
        // YouTube — no byte upload needed
        await updateProject(projectId, {
          status: "uploading",
          progress: 60,
          statusLabel: "YouTube URL validated…",
        });
        await updateProject(projectId, {
          status: "uploading",
          progress: 80,
          statusLabel: "Fetching video metadata…",
        });
        return { s3Url: null, s3Key: null };
      }
    });

    // ── Step 3: Processing ─────────────────────────────────────────────────
    await step.run("processing-start", async () => {
      await updateProject(projectId, {
        status: "processing",
        progress: 92,
        statusLabel: "Processing video…",
      });
    });

    await step.sleep("wait-processing", "1s");

    // ── Step 4: Mark complete ──────────────────────────────────────────────
    await step.run("mark-complete", async () => {
      await updateProject(projectId, {
        status: "ready",
        progress: 100,
        statusLabel: "Ready to generate clips!",
        ...(s3Result.s3Url
          ? { s3Url: s3Result.s3Url, sourceUrl: s3Result.s3Url }
          : {}),
      });

      // Clean up the temp file
      if (sourceType === "local" && sourceUrl) {
        try {
          await unlink(sourceUrl);
        } catch {
          // Non-fatal
        }
      }
    });

    return { projectId, status: "ready", s3Url: s3Result.s3Url };
  }
);
