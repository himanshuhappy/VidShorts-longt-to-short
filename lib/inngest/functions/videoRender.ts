import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { clips, projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { renderVideo, getRenderStatus } from "@/lib/remotion";
import { appendFileSync } from "fs";
import { join } from "path";

function logToFile(msg: string) {
  try {
    const filePath = join(process.cwd(), "render.log");
    appendFileSync(filePath, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (err) {
    console.error("Failed to write log to file:", err);
  }
}

async function updateClip(
  clipId: number,
  patch: {
    renderStatus?: string;
    renderProgress?: number;
    videoUrl?: string | null;
  }
) {
  await db
    .update(clips)
    .set({ ...patch })
    .where(eq(clips.id, clipId));
}

export const videoRenderFunction = inngest.createFunction(
  {
    id: "video-render",
    name: "Video Clip Rendering",
    retries: 1,
    triggers: [{ event: "clip/render.requested" }],

    onFailure: async ({ event, error }) => {
      const { clipId } = (event.data ?? {}) as { clipId?: number };
      logToFile(`onFailure triggered for clipId ${clipId}. Error: ${error.message}`);
      if (clipId) {
        await updateClip(clipId, {
          renderStatus: "failed",
          renderProgress: 0,
        });
      }
    },
  },
  async ({ event, step }) => {
    const { clipId, projectId } = event.data as {
      clipId: number;
      projectId: string;
    };

    logToFile(`Starting videoRenderFunction for clipId ${clipId}, projectId ${projectId}`);

    // ── Step 1: Mark rendering started ─────────────────────────────────────
    await step.run("render-start", async () => {
      logToFile(`Step render-start: setting progress to 5 for clipId ${clipId}`);
      await updateClip(clipId, {
        renderStatus: "rendering",
        renderProgress: 5,
      });
    });

    // ── Step 2: Fetch Clip and Project details ──────────────────────────────
    const info = await step.run("fetch-details", async () => {
      logToFile(`Step fetch-details: querying DB for clipId ${clipId}`);
      const [dbClip] = await db
        .select()
        .from(clips)
        .where(and(eq(clips.id, clipId), eq(clips.projectId, projectId)))
        .limit(1);

      if (!dbClip) {
        logToFile(`Error: Clip ${clipId} not found in DB.`);
        throw new Error(`Clip ${clipId} not found.`);
      }

      const [dbProject] = await db
        .select()
        .from(projects)
        .where(eq(projects.projectId, projectId))
        .limit(1);

      if (!dbProject) {
        logToFile(`Error: Project ${projectId} not found in DB.`);
        throw new Error(`Project ${projectId} not found.`);
      }

      const videoSource = dbProject.s3Url ?? dbProject.sourceUrl;
      if (!videoSource) {
        logToFile(`Error: No video source URL found for project ${projectId}`);
        throw new Error("No video source URL found for this project.");
      }

      logToFile(`Step fetch-details complete. videoSource is: ${videoSource}`);
      return {
        clip: {
          ...dbClip,
          createdAt: dbClip.createdAt.toISOString() // convert Date to string to ensure safe JSON serialization
        },
        videoSource,
      };
    });

    // ── Step 3: Generate presigned URL if source is in S3 ────────────────────
    const presignedUrl = await step.run("get-presigned-url", async () => {
      logToFile(`Step get-presigned-url: checking prefix of ${info.videoSource}`);
      if (info.videoSource.startsWith("http")) {
        logToFile("videoSource is already an http URL.");
        return info.videoSource;
      }
      logToFile("videoSource is a relative path. Generating presigned S3 URL...");
      const { getPresignedUrl } = await import("@/lib/s3/presign");
      const url = await getPresignedUrl(info.videoSource);
      logToFile(`Presigned URL generated: ${url}`);
      return url;
    });

    // ── Step 4: Trigger Remotion Lambda render ───────────────────────────────
    const renderInfo = await step.run("trigger-render", async () => {
      const serveUrl = process.env.REMOTION_SERVE_URL;
      logToFile(`Step trigger-render: REMOTION_SERVE_URL = ${serveUrl}`);
      if (!serveUrl) {
        logToFile("Error: REMOTION_SERVE_URL is not configured.");
        throw new Error("REMOTION_SERVE_URL is not configured.");
      }

      const inputProps = {
        src: presignedUrl,
        startTimeSec: info.clip.startTime,
        endTimeSec: info.clip.endTime,
        captions: info.clip.captions,
        fontFamily: info.clip.fontFamily,
        textColor: info.clip.textColor,
        highlightColor: info.clip.highlightColor,
        highlightTextColor: info.clip.highlightTextColor,
        captionStyle: info.clip.captionStyle,
      };

      logToFile(`Triggering renderMediaOnLambda for clipId ${clipId}. Timing: ${info.clip.startTime}s to ${info.clip.endTime}s`);
      const result = await renderVideo({
        serveUrl,
        composition: "ClipVideoComposition",
        inputProps,
      });

      logToFile(`Render triggered successfully. renderId: ${result.renderId}, bucketName: ${result.bucketName}`);
      return {
        renderId: result.renderId,
        bucketName: result.bucketName,
      };
    });

    // ── Step 5: Poll progress from Lambda and update DB ──────────────────────
    let done = false;
    let pollCount = 0;
    while (!done) {
      pollCount++;
      logToFile(`Step poll-progress: poll attempt ${pollCount} for renderId ${renderInfo.renderId}`);
      const status = await step.run(`check-render-status-attempt-${pollCount}`, async () => {
        return await getRenderStatus(renderInfo.renderId, renderInfo.bucketName);
      });

      logToFile(`Poll attempt ${pollCount} status: done=${status.done}, progress=${status.overallProgress}, fatalError=${status.fatalError}`);

      if (status.fatalError) {
        const errorMsg = status.errors && status.errors.length > 0
          ? status.errors.map(e => e.message).join(", ")
          : "Remotion Lambda encountered a fatal error during rendering.";
        logToFile(`Error: Render failed with fatal error: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      if (status.done && status.outputUrl) {
        done = true;
        logToFile(`Render complete. outputUrl: ${status.outputUrl}`);
        await step.run("mark-render-complete", async () => {
          await updateClip(clipId, {
            renderStatus: "ready",
            renderProgress: 100,
            videoUrl: status.outputUrl,
          });
        });
      } else {
        const progressPercent = Math.max(5, Math.round((status.overallProgress || 0) * 100));
        logToFile(`Render in progress: progressPercent = ${progressPercent}`);
        await step.run(`update-render-progress-${pollCount}`, async () => {
          await updateClip(clipId, {
            renderStatus: "rendering",
            renderProgress: Math.min(99, progressPercent),
          });
        });
        // Sleep for 2 seconds before polling again
        logToFile(`Sleeping 2 seconds before poll attempt ${pollCount + 1}`);
        await step.sleep(`wait-before-poll-${pollCount}`, "2s");
      }
    }

    logToFile(`videoRenderFunction complete for clipId ${clipId}`);
    return { clipId, status: "ready" };
  }
);
