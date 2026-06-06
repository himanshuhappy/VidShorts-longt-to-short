import { Badge } from "@/components/ui/badge";
import { Upload, Cpu, Scissors, Share2 } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Upload,
    title: "Upload Your Video",
    description:
      "Paste a YouTube link, upload from your device, or connect Google Drive. We support MP4, MOV, AVI, and 20+ formats up to 4K quality.",
    highlight: "Supports YouTube, Drive & 20+ formats",
  },
  {
    step: "02",
    icon: Cpu,
    title: "AI Does the Magic",
    description:
      "Our AI analyzes speech patterns, emotional peaks, visual composition, and audience retention signals to find the most impactful moments.",
    highlight: "Processes 1 hour in under 3 minutes",
  },
  {
    step: "03",
    icon: Scissors,
    title: "Review & Customize",
    description:
      "Preview your generated clips, tweak captions, adjust timing, apply templates, and add your branding with our intuitive editor.",
    highlight: "One-click caption customization",
  },
  {
    step: "04",
    icon: Share2,
    title: "Export & Publish",
    description:
      "Download in platform-perfect formats or publish directly to TikTok, Instagram Reels, YouTube Shorts, and LinkedIn — all from one place.",
    highlight: "Direct publish to 6+ platforms",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="absolute inset-0 bg-[oklch(0.065_0.01_270/0.5)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <Badge
              variant="outline"
              className="gap-2 px-3 py-1 border-[oklch(0.65_0.22_195/0.3)] bg-[oklch(0.65_0.22_195/0.06)] text-[oklch(0.70_0.18_195)]"
            >
              How It Works
            </Badge>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            <span className="gradient-glow-text">4 Simple Steps</span>
            <span className="text-white block">to Viral Content</span>
          </h2>
          <p className="text-[oklch(0.55_0.015_270)] text-lg max-w-xl mx-auto">
            From raw footage to share-ready clips in minutes. No editing skills required.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-14 left-[calc(12.5%+1.5rem)] right-[calc(12.5%+1.5rem)] h-px">
            <div className="h-full bg-gradient-to-r from-[oklch(0.65_0.25_280/0.3)] via-[oklch(0.65_0.22_195/0.5)] to-[oklch(0.65_0.25_280/0.3)]" />
            <div className="absolute inset-0 h-px bg-gradient-to-r from-[oklch(0.65_0.25_280)] via-[oklch(0.65_0.22_195)] to-[oklch(0.65_0.25_280)] blur-sm opacity-50" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;
              return (
                <div
                  key={step.step}
                  className="relative flex flex-col items-center text-center group"
                >
                  {/* Step circle */}
                  <div className="relative mb-6">
                    {/* Glow ring */}
                    <div className="absolute inset-0 rounded-full bg-[oklch(0.65_0.25_280/0.2)] blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-all duration-500" />

                    {/* Outer ring */}
                    <div className="w-28 h-28 rounded-full border border-white/10 bg-[oklch(0.12_0.012_270)] flex items-center justify-center relative group-hover:border-[oklch(0.65_0.25_280/0.4)] transition-colors duration-300">
                      {/* Step number */}
                      <span className="absolute -top-2 -right-1 text-[10px] font-black gradient-brand-text">
                        {step.step}
                      </span>
                      {/* Icon bg */}
                      <div className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                        style={{ boxShadow: "0 0 30px oklch(0.65 0.25 280 / 25%)" }}
                      >
                        <Icon className="size-7 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:gradient-brand-text transition-all duration-200">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[oklch(0.50_0.01_270)] leading-relaxed mb-3">
                    {step.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[oklch(0.65_0.22_195)] bg-[oklch(0.65_0.22_195/0.08)] border border-[oklch(0.65_0.22_195/0.2)] rounded-full px-3 py-1">
                    ✦ {step.highlight}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
