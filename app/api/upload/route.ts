import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { projects, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import os from "os";

import { fixedWindow } from "@arcjet/next";
import { aj } from "@/lib/arcjet";

const ajUpload = aj.withRule(
  fixedWindow({
    mode: "LIVE",
    max: 2, // Maximum 2 uploads
    window: "1d", // Per day
  })
);

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/upload
 *
 * Accepts multipart/form-data with:
 *   - file: Video file (for local uploads)
 *   - sourceType: 'local' | 'youtube'
 *   - youtubeId: YouTube video ID (for youtube uploads)
 *   - youtubeUrl: Full YouTube URL (for youtube uploads)
 *   - title: Video title (defaults to filename or "YouTube Video")
 *
 * Flow:
 *   1. Auth check
 *   2. For local: write file to /tmp
 *   3. Insert project row (status: 'pending')
 *   4. Fire Inngest event (non-fatal — project is created regardless)
 *   5. Return { projectId }
 */
export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth ──────────────────────────────────────────────────────────────
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 1.5 Rate Limiting ────────────────────────────────────────────────────
    const decision = await (ajUpload as any).protect(request, { fingerprint: clerkUser.id, requested: 1 });
    
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          { error: "Rate limit exceeded. You can only upload 2 videos per day." },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get DB user id
    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found in DB — visit /dashboard once to sync your account" },
        { status: 404 }
      );
    }

    // ── 2. Parse form data ───────────────────────────────────────────────────
    const formData = await request.formData();
    const sourceType = formData.get("sourceType") as "local" | "youtube";
    const youtubeId = formData.get("youtubeId") as string | null;
    const youtubeUrl = formData.get("youtubeUrl") as string | null;
    let title = (formData.get("title") as string) || "";
    let sourceUrl: string | null = null;

    if (sourceType === "local") {
      const file = formData.get("file") as File | null;
      if (!file || file.size === 0) {
        return NextResponse.json({ error: "No video file provided" }, { status: 400 });
      }
      if (!title) title = file.name;

      // Write to /tmp so the Inngest function can access it
      const tmpDir = path.join(os.tmpdir(), "vidshorts");
      await mkdir(tmpDir, { recursive: true });
      const tmpPath = path.join(tmpDir, `${Date.now()}_${file.name}`);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(tmpPath, buffer);
      sourceUrl = tmpPath;
    } else if (sourceType === "youtube") {
      if (!youtubeId) {
        return NextResponse.json({ error: "No YouTube ID provided" }, { status: 400 });
      }
      if (!title) title = "YouTube Video";
      sourceUrl = youtubeUrl ?? `https://youtube.com/watch?v=${youtubeId}`;
    } else {
      return NextResponse.json({ error: "Invalid sourceType" }, { status: 400 });
    }

    // ── 3. Insert project row ────────────────────────────────────────────────
    const [project] = await db
      .insert(projects)
      .values({
        userId: dbUser.id,
        title,
        sourceType,
        sourceUrl,
        youtubeId: youtubeId ?? null,
        status: "pending",
        progress: 0,
        statusLabel: "Creating project…",
      })
      .returning();

    const projectId = project.projectId;

    // ── 4. Fire Inngest event (non-fatal) ────────────────────────────────────
    // If the Inngest Dev Server is not running, log a warning and mark the
    // project as failed so the client doesn't poll forever.
    // To fix: run `npx inngest-cli@latest dev` in a second terminal.
    try {
      await inngest.send({
        name: "video/upload.requested",
        data: {
          projectId,
          sourceType,
          sourceUrl,
          youtubeId,
          title,
          userId: dbUser.id,
        },
      });
    } catch (inngestErr) {
      const inngestMsg =
        inngestErr instanceof Error ? inngestErr.message : String(inngestErr);
      console.warn(
        "[/api/upload] ⚠️  Inngest send failed — is `npx inngest-cli@latest dev` running?\n",
        inngestMsg
      );
      await db
        .update(projects)
        .set({
          status: "failed",
          statusLabel: "Workflow service unavailable",
          errorMsg: `Inngest send failed: ${inngestMsg}`,
          updatedAt: new Date(),
        })
        .where(eq(projects.projectId, projectId));
    }

    // ── 5. Return projectId to client ────────────────────────────────────────
    return NextResponse.json({ projectId }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/upload] Unexpected error:", message, err);
    return NextResponse.json(
      {
        error: "Internal server error",
        ...(process.env.NODE_ENV === "development" && { detail: message }),
      },
      { status: 500 }
    );
  }
}
