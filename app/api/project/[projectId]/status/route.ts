import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * GET /api/project/[projectId]/status
 *
 * Polling endpoint called every 2s by the VideoUploader component.
 * Returns: { status, progress, statusLabel, errorMsg }
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

    const [project] = await db
      .select({
        status: projects.status,
        progress: projects.progress,
        statusLabel: projects.statusLabel,
        errorMsg: projects.errorMsg,
      })
      .from(projects)
      .where(eq(projects.projectId, projectId))
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: project.status,
      progress: project.progress,
      statusLabel: project.statusLabel,
      errorMsg: project.errorMsg,
    });
  } catch (err) {
    console.error("[/api/project/status] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
