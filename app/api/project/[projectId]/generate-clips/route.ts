import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { projects, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import { ajAi } from "@/lib/arcjet";
import { fixedWindow } from "@arcjet/next";

export const runtime = "nodejs";

/**
 * POST /api/project/[projectId]/generate-clips
 *
 * Retriggers the Inngest pipeline from the beginning (transcription → clip generation).
 * If transcription is already done (analysisStatus = 'done'), resets to 'transcribing'
 * and runs the full pipeline again so clips are regenerated.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.projectId, projectId), eq(projects.userId, dbUser.id)))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const videoUrl = project.s3Url ?? project.sourceUrl;
    if (!videoUrl) {
      return NextResponse.json(
        { error: "No video URL — upload must complete before generating clips" },
        { status: 400 }
      );
    }

    if (!project.transcription) {
      return NextResponse.json(
        { error: "Video must be transcribed first before generating clips" },
        { status: 400 }
      );
    }

    // ── 1.5 Arcjet Security (Rate Limit & Prompt Injection) ─────────────────
    // We add a specific rate limit for AI generations to prevent abuse
    const ajGenerate = ajAi.withRule(
      fixedWindow({
        mode: "LIVE",
        max: 50, // Increased to 50 for testing
        window: "1d",
      })
    );

    const decision = await ajGenerate.protect(_request, {
      fingerprint: clerkUser.id,
      requested: 1,
      // We pass the entire transcript as the prompt to scan for jailbreaks
      detectPromptInjectionMessage: project.transcription,
    } as any);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          { error: "AI rate limit exceeded. You can only generate clips 5 times per day." },
          { status: 429 }
        );
      }
      if (decision.reason.isPromptInjection()) {
        return NextResponse.json(
          { error: "Malicious prompt injection detected in video transcript. Generation blocked." },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Reset status so the pipeline reruns the clip generation step
    await db
      .update(projects)
      .set({ analysisStatus: "transcribing", errorMsg: null, updatedAt: new Date() })
      .where(eq(projects.projectId, projectId));

    // Fire the Inngest event — it will re-run all steps (Inngest caches completed steps
    // so transcription won't be called twice unless it needs to)
    await inngest.send({
      name: "project/analysis.requested",
      data: {
        projectId,
        videoUrl,
        userId: dbUser.id,
      },
    });

    return NextResponse.json({ ok: true, projectId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/project/generate-clips] Error:", message);
    return NextResponse.json(
      {
        error: "Internal server error",
        ...(process.env.NODE_ENV === "development" && { detail: message }),
      },
      { status: 500 }
    );
  }
}
