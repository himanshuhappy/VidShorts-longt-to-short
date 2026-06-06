import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Scissors,
  Captions,
  Wand2,
  BarChart3,
  Languages,
  Layers,
  Download,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Wand2,
    title: "AI Scene Detection",
    description:
      "Our AI scans every second of your video to find the most engaging, high-retention moments automatically.",
    gradient: "from-[oklch(0.65_0.25_280)] to-[oklch(0.55_0.28_310)]",
    glowColor: "oklch(0.65_0.25_280/0.2)",
  },
  {
    icon: Scissors,
    title: "Smart Clip Cutter",
    description:
      "Intelligent trimming that respects natural speech patterns, avoids mid-sentence cuts, and maintains context.",
    gradient: "from-[oklch(0.65_0.22_195)] to-[oklch(0.65_0.25_280)]",
    glowColor: "oklch(0.65_0.22_195/0.2)",
  },
  {
    icon: Captions,
    title: "Auto-Captions",
    description:
      "Generate word-perfect, animated captions in 50+ languages. Customizable fonts, colors, and styles.",
    gradient: "from-[oklch(0.55_0.28_310)] to-[oklch(0.65_0.25_280)]",
    glowColor: "oklch(0.55_0.28_310/0.2)",
  },
  {
    icon: BarChart3,
    title: "Virality Score",
    description:
      "Each clip gets a virality score based on pacing, emotion, hooks, and engagement signals from 10M+ videos.",
    gradient: "from-[oklch(0.65_0.18_60)] to-[oklch(0.65_0.22_195)]",
    glowColor: "oklch(0.65_0.18_60/0.2)",
  },
  {
    icon: Languages,
    title: "Multi-Language",
    description:
      "Transcribe, translate, and caption your clips in 50+ languages to reach a global audience effortlessly.",
    gradient: "from-[oklch(0.65_0.25_280)] to-[oklch(0.65_0.22_195)]",
    glowColor: "oklch(0.65_0.25_280/0.2)",
  },
  {
    icon: Layers,
    title: "Multi-Format Export",
    description:
      "Export in 9:16, 1:1, or 16:9 formats. Auto-resizing B-roll and text safe zones for every platform.",
    gradient: "from-[oklch(0.65_0.22_195)] to-[oklch(0.55_0.28_310)]",
    glowColor: "oklch(0.65_0.22_195/0.2)",
  },
  {
    icon: Download,
    title: "Bulk Processing",
    description:
      "Upload entire playlists or channels. Process hundreds of videos simultaneously with our cloud pipeline.",
    gradient: "from-[oklch(0.55_0.28_310)] to-[oklch(0.65_0.18_60)]",
    glowColor: "oklch(0.55_0.28_310/0.2)",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Process a 1-hour video in under 3 minutes. Our GPU-accelerated infrastructure ensures speed at scale.",
    gradient: "from-[oklch(0.65_0.18_60)] to-[oklch(0.65_0.25_280)]",
    glowColor: "oklch(0.65_0.18_60/0.2)",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[oklch(0.65_0.25_280/0.06)] blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <Badge
              variant="outline"
              className="gap-2 px-3 py-1 border-[oklch(0.65_0.25_280/0.3)] bg-[oklch(0.65_0.25_280/0.06)] text-[oklch(0.70_0.18_280)]"
            >
              <Sparkles className="size-3" />
              Powerful Features
            </Badge>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            <span className="text-white">Everything You Need to</span>{" "}
            <span className="gradient-glow-text block sm:inline">Go Viral</span>
          </h2>
          <p className="text-[oklch(0.55_0.015_270)] text-lg max-w-2xl mx-auto leading-relaxed">
            From raw footage to platform-ready clips — VidShorts handles the
            entire creative pipeline so you can focus on creating more content.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="glass-card glass-card-hover rounded-2xl p-6 relative group"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(ellipse at 30% 30%, ${feature.glowColor}, transparent 70%)`,
                  }}
                />

                {/* Icon */}
                <div className="relative mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
                    style={{
                      boxShadow: `0 8px 24px ${feature.glowColor}`,
                    }}
                  >
                    <Icon className="size-6 text-white" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-[oklch(0.80_0.15_280)] transition-colors duration-200">
                  {feature.title}
                </h3>
                <p className="text-sm text-[oklch(0.50_0.01_270)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
