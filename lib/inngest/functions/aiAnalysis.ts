import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { transcribeVideo } from "@/lib/deepgram/transcribe";

// ─── Helper ───────────────────────────────────────────────────────────────────

async function updateProject(
  projectId: string,
  patch: {
    analysisStatus?: string;
    transcription?: string;
    captions?: string;
    transcriptionDuration?: number;
  }
) {
  await db
    .update(projects)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(projects.projectId, projectId));
}

// ─── Inngest Function ─────────────────────────────────────────────────────────

/**
 * `project/analysis.requested`
 *
 * Triggered when the user clicks "AI Analysis" on the project page.
 *
 * Steps:
 *   1. analysis-start   — Mark analysisStatus = transcribing
 *   2. transcribe       — Call Deepgram, get full transcript + SRT captions
 *   3. save-results     — Persist transcript + captions to DB
 */
export const aiAnalysisFunction = inngest.createFunction(
  {
    id: "ai-analysis",
    name: "AI Video Analysis — Transcription",
    retries: 1,
    triggers: [{ event: "project/analysis.requested" }],

    onFailure: async ({ event, error }) => {
      // In Inngest v3, original event payload is inside event.data.event.data for failures
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalData = (event.data as any)?.event?.data ?? {};
      const projectId = originalData.projectId;
      
      if (projectId) {
        await db
          .update(projects)
          .set({
            analysisStatus: "failed",
            errorMsg: error.message || "Unknown error during transcription",
            updatedAt: new Date(),
          })
          .where(eq(projects.projectId, projectId));
      }
    },
  },
  async ({ event, step }) => {
    const { projectId, videoUrl } = event.data as {
      projectId: string;
      videoUrl: string;
    };

    // ── Step 1: Mark as transcribing ───────────────────────────────────────
    await step.run("analysis-start", async () => {
      await updateProject(projectId, { analysisStatus: "transcribing" });
    });

    // ── Step 2: Transcribe with Deepgram ───────────────────────────────────
    const transcriptionResult = await step.run("transcribe", async () => {
      console.log(`[aiAnalysis] Transcribing project ${projectId} from: ${videoUrl}`);

      // Generate a presigned URL if the video is in S3 so Deepgram can download it
      const { getPresignedUrl } = await import("@/lib/s3/presign");
      const presignedUrl = await getPresignedUrl(videoUrl);

      const result = await transcribeVideo(presignedUrl);

      console.log(
        `[aiAnalysis] Transcription done — ${result.words.length} words, ` +
        `${result.duration.toFixed(1)}s, SRT segments: ${result.srt.split("\n\n").length}`
      );

      return {
        transcript: result.transcript,
        srt: result.srt,
        duration: Math.round(result.duration),
      };
    });

    // ── Step 3: Save results to DB ─────────────────────────────────────────
    await step.run("save-results", async () => {
      await updateProject(projectId, {
        analysisStatus: "transcribing",
        transcription: transcriptionResult.transcript,
        captions: transcriptionResult.srt,
        transcriptionDuration: transcriptionResult.duration,
      });
    });

    // ── Step 4: Generate Short Clips with Gemini ───────────────────────────
    const generatedClips = await step.run("generate-clips", async () => {
      console.log(`[aiAnalysis] Generating clips for project ${projectId}...`);
      const { generateShortClips, getCaptionsForTimeRange } = await import("@/lib/gemini");
      const { clips } = await import("@/lib/db/schema");

      // Generate clip timestamps and metadata using Gemini
      const aiClips = await generateShortClips(transcriptionResult.srt);

      console.log(`[aiAnalysis] Gemini generated ${aiClips.length} clips.`);

      // For each clip, filter the SRT and save to the database
      const dbClipsToInsert = aiClips.map((clip) => {
        const filteredCaptions = getCaptionsForTimeRange(
          transcriptionResult.srt,
          clip.startTime,
          clip.endTime
        );
        return {
          projectId,
          startTime: clip.startTime,
          endTime: clip.endTime,
          reason: clip.reason,
          seoRanking: clip.seoRanking,
          captions: filteredCaptions,
          status: "pending",
        };
      });

      // Delete old clips if they exist for this project to prevent duplication
      await db.delete(clips).where(eq(clips.projectId, projectId));

      if (dbClipsToInsert.length > 0) {
        await db.insert(clips).values(dbClipsToInsert);
      }

      // Mark analysis as done now that clips are successfully generated
      await updateProject(projectId, {
        analysisStatus: "done",
      });

      return dbClipsToInsert.length;
    });

    return {
      projectId,
      transcriptLength: transcriptionResult.transcript.length,
      duration: transcriptionResult.duration,
    };
  }
);
