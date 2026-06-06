import Link from "next/link";
import { syncUser } from "@/lib/actions/syncUser";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  Video,
  Clock,
  ArrowRight,
  Plus,
  Play,
} from "lucide-react";

export const metadata = {
  title: "My Videos – VidShorts",
  description: "View all your uploaded videos and generated clips.",
};

export default async function VideosPage() {
  // Fetch current user and sync with Neon DB
  const dbUser = await syncUser();

  if (!dbUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white">
        <p className="text-sm text-[oklch(0.50_0.01_270)]">Please sign in to view your videos.</p>
      </div>
    );
  }

  // Fetch projects uploaded by this user
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, dbUser.id))
    .orderBy(desc(projects.createdAt));

  // Pre-generate play URLs for S3 videos so they can stream directly as thumbnails
  const projectsWithUrls = await Promise.all(
    userProjects.map(async (project) => {
      let playUrl = project.s3Url ?? project.sourceUrl;
      if (project.s3Url) {
        try {
          const { getPresignedUrl } = await import("@/lib/s3/presign");
          playUrl = await getPresignedUrl(project.s3Url);
        } catch (err) {
          console.error("Failed to generate presigned URL for thumbnail:", err);
        }
      }
      return {
        ...project,
        playUrl,
      };
    })
  );

  return (
    <div className="min-h-screen bg-[oklch(0.09_0.01_270)] relative overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full bg-[oklch(0.65_0.25_280/0.04)] blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-[oklch(0.65_0.22_195/0.03)] blur-[100px]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              My <span className="gradient-glow-text">Videos</span>
            </h1>
            <p className="text-sm text-[oklch(0.50_0.01_270)] mt-1">
              Manage your uploads and browse their AI-generated viral short clips.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-sm font-bold text-white gradient-brand border-0 glow-primary hover:opacity-90 hover:scale-[1.02] transition-all duration-200"
          >
            <Plus className="size-4" />
            Upload Video
          </Link>
        </div>

        {/* Video Grid list */}
        {projectsWithUrls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsWithUrls.map((project) => {
              // YouTube cover image construction
              const youtubeCover =
                project.sourceType === "youtube" && project.youtubeId
                  ? `https://img.youtube.com/vi/${project.youtubeId}/mqdefault.jpg`
                  : null;

              return (
                <Link
                  key={project.projectId}
                  href={`/dashboard/project/${project.projectId}`}
                  className="group relative flex flex-col justify-between glass-card glass-card-hover rounded-2xl p-5 border border-white/8 overflow-hidden cursor-pointer"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[oklch(0.65_0.25_280/0.03)] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[oklch(0.65_0.25_280/0.06)] transition-all duration-300" />
                  
                  <div className="space-y-4">
                    {/* Thumbnail / Video Preview container */}
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/40 border border-white/5 group-hover:border-[oklch(0.65_0.25_280/0.2)] transition-all duration-300 flex items-center justify-center">
                      {youtubeCover ? (
                        <img
                          src={youtubeCover}
                          alt={project.title}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      ) : project.playUrl ? (
                        <video
                          src={project.playUrl}
                          className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                          muted
                          preload="metadata"
                          playsInline
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <Video className="size-6 text-[oklch(0.40_0.01_270)]" />
                        </div>
                      )}

                      {/* Play Hover Overlay (only show if video/youtube is present) */}
                      {(youtubeCover || project.playUrl) && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-100 group-hover:bg-black/5 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[oklch(0.65_0.25_280)] group-hover:border-transparent transition-all duration-300 shadow-lg shadow-black/45">
                            <Play className="size-4 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-white group-hover:text-[oklch(0.65_0.25_280)] transition-colors line-clamp-2 leading-snug">
                          {project.title}
                        </h3>
                        <p className="text-xs text-[oklch(0.50_0.01_270)] mt-1.5 flex items-center gap-1">
                          <Clock className="size-3" />
                          Uploaded {new Date(project.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider h-fit mt-0.5 ${
                        project.status === "ready"
                          ? "bg-[oklch(0.65_0.22_195/0.1)] text-[oklch(0.65_0.22_195)] border border-[oklch(0.65_0.22_195/0.2)]"
                          : project.status === "failed"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                      }`}>
                        {project.status === "ready" && "Ready"}
                        {project.status === "failed" && "Failed"}
                        {project.status !== "ready" && project.status !== "failed" && project.statusLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-5">
                    <span className="text-[10px] text-[oklch(0.45_0.01_270)] uppercase tracking-wider font-semibold">
                      Source: {project.sourceType === "youtube" ? "YouTube" : "Local Upload"}
                    </span>
                    <span className="text-xs font-semibold text-[oklch(0.65_0.25_280)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Clips <ArrowRight className="size-3" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="glass-card rounded-2xl p-12 text-center max-w-md mx-auto border border-white/8 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mx-auto shadow-inner">
              <Video className="size-8 text-[oklch(0.45_0.01_270)]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">No videos uploaded yet</h3>
              <p className="text-sm text-[oklch(0.50_0.01_270)] max-w-xs mx-auto">
                Upload your first video to start generating AI viral clips and subtitles.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-sm font-bold text-white gradient-brand border-0 glow-primary hover:opacity-90 active:scale-[0.98] transition-all duration-200"
            >
              <Plus className="size-4" />
              Upload First Video
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
