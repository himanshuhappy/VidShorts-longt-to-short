import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { projects, users, clips } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/project/[projectId]
 * Returns full project data for the project detail page.
 * Polled every 3s while analysis is in progress.
 */
export async function GET(
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

    // Fetch clips for this project
    const projectClips = await db
      .select()
      .from(clips)
      .where(eq(clips.projectId, projectId));

    // Generate pre-signed URL for S3 videos so they can stream directly on the client
    const videoUrl = project.s3Url ?? project.sourceUrl;
    let playUrl = videoUrl;

    if (project.s3Url) {
      try {
        const { getPresignedUrl } = await import("@/lib/s3/presign");
        playUrl = await getPresignedUrl(project.s3Url);
      } catch (err) {
        console.error("Failed to generate presigned URL for player:", err);
      }
    }

    return NextResponse.json({
      ...project,
      playUrl,
      clips: projectClips,
    });
  } catch (err) {
    console.error("[/api/project] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
