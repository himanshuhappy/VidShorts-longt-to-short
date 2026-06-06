import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { projects, users, clips } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";

export const runtime = "nodejs";

/**
 * POST /api/project/[projectId]/clip/[clipId]/render
 * Triggers clip rendering via Inngest.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; clipId: string }> }
) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, clipId } = await params;
    const numericClipId = parseInt(clipId, 10);
    if (isNaN(numericClipId)) {
      return NextResponse.json({ error: "Invalid clip ID" }, { status: 400 });
    }

    const [dbUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify project belongs to user
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.projectId, projectId), eq(projects.userId, dbUser.id)))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    // Verify clip exists for this project
    const [clip] = await db
      .select()
      .from(clips)
      .where(and(eq(clips.id, numericClipId), eq(clips.projectId, projectId)))
      .limit(1);

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // Trigger Inngest function for rendering
    await inngest.send({
      name: "clip/render.requested",
      data: {
        clipId: numericClipId,
        projectId,
      },
    });

    // Update clip render status in the DB
    await db
      .update(clips)
      .set({
        renderStatus: "rendering",
        renderProgress: 0,
      })
      .where(eq(clips.id, numericClipId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/project/.../clip/.../render] POST Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
