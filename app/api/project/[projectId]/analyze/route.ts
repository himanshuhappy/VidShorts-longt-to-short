import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { projects, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";

export const runtime = "nodejs";

/**
 * POST /api/project/[projectId]/analyze
 *
 * Triggers the AI analysis Inngest function for a project.
 * The project must have status='ready' and a valid s3Url.
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

    // Fetch the project and verify ownership
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
      .where(
        and(
          eq(projects.projectId, projectId),
          eq(projects.userId, dbUser.id)
        )
      )
      .limit(1);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const videoUrl = project.s3Url ?? project.sourceUrl;
    if (!videoUrl) {
      return NextResponse.json(
        { error: "No video URL — upload must complete before analysis" },
        { status: 400 }
      );
    }

    if (project.analysisStatus === "transcribing") {
      return NextResponse.json(
        { error: "Analysis already in progress" },
        { status: 409 }
      );
    }

    // Mark as transcribing immediately so the UI can show the loading state
    await db
      .update(projects)
      .set({ analysisStatus: "transcribing", updatedAt: new Date() })
      .where(eq(projects.projectId, projectId));

    // Fire the Inngest event
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
    console.error("[/api/project/analyze] Error:", message);
    return NextResponse.json(
      {
        error: "Internal server error",
        ...(process.env.NODE_ENV === "development" && { detail: message }),
      },
      { status: 500 }
    );
  }
}
