import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { projects, users, clips } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * PUT /api/project/[projectId]/clip/[clipId]
 * Updates styling configuration for a specific clip of a project.
 */
export async function PUT(
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

    // Parse body for styling properties
    const body = await request.json();
    const { fontFamily, textColor, highlightColor, highlightTextColor, captionStyle } = body;

    // Update the clip's style properties and reset rendering state since styling changed
    const [updatedClip] = await db
      .update(clips)
      .set({
        fontFamily: fontFamily ?? "sans-serif",
        textColor: textColor ?? "#FFE600",
        highlightColor: highlightColor ?? "#FFE600",
        highlightTextColor: highlightTextColor ?? "#000000",
        captionStyle: captionStyle ?? "highlight",
        videoUrl: null,
        renderStatus: "idle",
        renderProgress: 0,
      })
      .where(and(eq(clips.id, numericClipId), eq(clips.projectId, projectId)))
      .returning();

    if (!updatedClip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, clip: updatedClip });
  } catch (err) {
    console.error("[/api/project/.../clip] PUT Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
