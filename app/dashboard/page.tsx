// Removed UserButton as it's moved to sidebar
import Link from "next/link";
import { syncUser } from "@/lib/actions/syncUser";
import { VideoUploader } from "@/components/dashboard/VideoUploader";
import {
  Zap,
  Play,
  TrendingUp,
  Clock,
  Upload,
  Sparkles,
  BarChart3,
  ArrowRight,
  Video,
  Settings,
} from "lucide-react";

export const metadata = {
  title: "Dashboard – VidShorts",
  description: "Your VidShorts creator dashboard.",
};

const stats = [
  {
    label: "Clips Generated",
    value: "0",
    icon: Sparkles,
    color: "oklch(0.65_0.25_280)",
    bg: "oklch(0.65_0.25_280/0.1)",
  },
  {
    label: "Videos Processed",
    value: "0",
    icon: Video,
    color: "oklch(0.65_0.22_195)",
    bg: "oklch(0.65_0.22_195/0.1)",
  },
  {
    label: "Total Views",
    value: "0",
    icon: TrendingUp,
    color: "oklch(0.55_0.28_310)",
    bg: "oklch(0.55_0.28_310/0.1)",
  },
  {
    label: "Hours Saved",
    value: "0",
    icon: Clock,
    color: "oklch(0.65_0.18_60)",
    bg: "oklch(0.65_0.18_60/0.1)",
  },
];

export default async function DashboardPage() {
  // Sync Clerk user → Neon DB on every visit (upsert, safe to call repeatedly)
  const dbUser = await syncUser();

  const firstName = dbUser?.firstName ?? "Creator";
  const imageUrl = dbUser?.imageUrl ?? null;

  return (
    <div className="min-h-screen bg-[oklch(0.09_0.01_270)]">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full bg-[oklch(0.65_0.25_280/0.05)] blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-[oklch(0.65_0.22_195/0.04)] blur-[100px]" />
      </div>

      {/* Header moved to Sidebar */}

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome banner */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={firstName}
                className="w-12 h-12 rounded-full ring-2 ring-[oklch(0.65_0.25_280/0.4)]"
              />
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, <span className="gradient-glow-text">{firstName}</span> 👋
              </h1>
              <p className="text-sm text-[oklch(0.50_0.01_270)] mt-0.5">
                Ready to create some viral clips today?
              </p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="glass-card glass-card-hover rounded-2xl p-5"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${stat.bg}`, color: stat.color }}
                >
                  <Icon className="size-5" style={{ color: stat.color }} />
                </div>
                <p className="text-2xl font-extrabold text-white mb-1">{stat.value}</p>
                <p className="text-xs text-[oklch(0.50_0.01_270)] font-medium">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Main panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload panel */}
          <div className="lg:col-span-2">
            <VideoUploader />

            {/* Recent clips placeholder */}
            <div className="mt-6 glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white">Recent Clips</h3>
                <Link
                  href="/dashboard/clips"
                  id="dashboard-view-all-clips"
                  className="text-xs text-[oklch(0.65_0.25_280)] hover:text-[oklch(0.75_0.22_280)] font-medium flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight className="size-3" />
                </Link>
              </div>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center mb-3">
                  <Sparkles className="size-6 text-[oklch(0.45_0.01_270)]" />
                </div>
                <p className="text-sm text-[oklch(0.50_0.01_270)]">No clips yet</p>
                <p className="text-xs text-[oklch(0.35_0.01_270)] mt-1">
                  Upload your first video to start generating clips
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            {/* Quick actions */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: "New Project", icon: Upload, id: "qa-new-project" },
                  { label: "View Analytics", icon: BarChart3, id: "qa-analytics" },
                  { label: "Account Settings", icon: Settings, id: "qa-settings" },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      id={action.id}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[oklch(0.60_0.01_270)] hover:text-white hover:bg-white/5 transition-all duration-200 group text-left"
                    >
                      <Icon className="size-4 text-[oklch(0.45_0.01_270)] group-hover:text-[oklch(0.65_0.25_280)] transition-colors" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plan info */}
            <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[oklch(0.65_0.25_280/0.08)] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md gradient-brand flex items-center justify-center">
                    <Zap className="size-3 text-white fill-white" />
                  </div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Starter Plan</span>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-[oklch(0.50_0.01_270)] mb-1.5">
                    <span>Videos used</span>
                    <span>0 / 5</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/8">
                    <div className="h-full w-0 rounded-full gradient-brand" />
                  </div>
                </div>
                <Link
                  href="/#pricing"
                  id="dashboard-upgrade-btn"
                  className="inline-flex items-center justify-center w-full h-8 rounded-lg text-xs font-semibold text-white gradient-brand border-0 hover:opacity-90 transition-opacity gap-1"
                >
                  Upgrade to Pro
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>

            {/* Getting started */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3">Getting Started</h3>
              <div className="space-y-3">
                {[
                  { step: "1", label: "Upload your first video", done: false },
                  { step: "2", label: "Review AI-generated clips", done: false },
                  { step: "3", label: "Export & publish", done: false },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      item.done
                        ? "gradient-brand text-white"
                        : "border border-white/15 text-[oklch(0.45_0.01_270)]"
                    }`}>
                      {item.step}
                    </div>
                    <span className={`text-xs ${
                      item.done ? "text-[oklch(0.50_0.01_270)] line-through" : "text-[oklch(0.60_0.01_270)]"
                    }`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
