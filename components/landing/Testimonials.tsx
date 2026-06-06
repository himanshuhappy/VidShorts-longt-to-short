import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    handle: "@sarahcreates",
    role: "YouTube Creator · 1.2M subscribers",
    avatar: "SC",
    avatarColor: "from-[oklch(0.65_0.25_280)] to-[oklch(0.55_0.28_310)]",
    stars: 5,
    quote:
      "VidShorts transformed my workflow completely. I went from spending 8 hours editing one video to under 20 minutes. My Reels engagement is up 340% this month.",
    metric: "+340% engagement",
  },
  {
    name: "Marcus Rivera",
    handle: "@marcustalks",
    role: "Podcaster · 500K listeners",
    avatar: "MR",
    avatarColor: "from-[oklch(0.65_0.22_195)] to-[oklch(0.65_0.25_280)]",
    stars: 5,
    quote:
      "Every podcast episode I upload gets converted into 12-15 killer clips. The virality scoring is scary accurate — my most-viral clip was the one it scored 97/100.",
    metric: "15 clips per episode",
  },
  {
    name: "Priya Sharma",
    handle: "@priyafit",
    role: "Fitness Creator · 800K followers",
    avatar: "PS",
    avatarColor: "from-[oklch(0.55_0.28_310)] to-[oklch(0.65_0.22_195)]",
    stars: 5,
    quote:
      "The auto-captions are better than anything I've used manually. They're accurate even with my accent, and the animations look premium. My TikTok grew 100K in 6 weeks.",
    metric: "+100K TikTok followers",
  },
  {
    name: "Jake Thompson",
    handle: "@jakemedia",
    role: "Marketing Agency Owner",
    avatar: "JT",
    avatarColor: "from-[oklch(0.65_0.18_60)] to-[oklch(0.65_0.25_280)]",
    stars: 5,
    quote:
      "We manage 40+ clients and VidShorts has cut our video production costs by 60%. The bulk processing and white-label export is a game-changer for agencies.",
    metric: "60% cost reduction",
  },
  {
    name: "Aisha Williams",
    handle: "@aishalearns",
    role: "EdTech Creator · 300K subscribers",
    avatar: "AW",
    avatarColor: "from-[oklch(0.65_0.25_280)] to-[oklch(0.65_0.18_60)]",
    stars: 5,
    quote:
      "Multi-language captions opened up audiences in India, Brazil, and Spain for me. My channel is now 40% international viewers when it used to be 5%.",
    metric: "40% international reach",
  },
  {
    name: "Tom Edwards",
    handle: "@tomedtech",
    role: "Tech Reviewer · 600K subscribers",
    avatar: "TE",
    avatarColor: "from-[oklch(0.65_0.22_195)] to-[oklch(0.55_0.28_310)]",
    stars: 5,
    quote:
      "I was skeptical about AI clipping but VidShorts genuinely understands what makes content compelling. It finds hooks I wouldn't have thought to clip myself.",
    metric: "3x more clips per video",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="absolute inset-0 bg-[oklch(0.065_0.01_270/0.5)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[oklch(0.65_0.25_280/0.04)] blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <Badge
              variant="outline"
              className="gap-2 px-3 py-1 border-[oklch(0.65_0.25_280/0.3)] bg-[oklch(0.65_0.25_280/0.06)] text-[oklch(0.70_0.18_280)]"
            >
              <Star className="size-3 fill-current" />
              Loved by Creators
            </Badge>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            <span className="text-white">Trusted by </span>
            <span className="gradient-glow-text">2M+ Creators</span>
          </h2>
          <p className="text-[oklch(0.55_0.015_270)] text-lg max-w-xl mx-auto">
            See how creators are growing their audiences and saving hours every week.
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {testimonials.map((t, index) => (
            <div
              key={t.handle}
              className="glass-card glass-card-hover rounded-2xl p-6 break-inside-avoid group"
            >
              {/* Quote icon */}
              <Quote className="size-8 text-[oklch(0.65_0.25_280/0.3)] mb-4 group-hover:text-[oklch(0.65_0.25_280/0.5)] transition-colors" />

              {/* Stars */}
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-3.5 text-[oklch(0.75_0.18_60)] fill-[oklch(0.75_0.18_60)]"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-[oklch(0.70_0.01_270)] leading-relaxed mb-4">
                "{t.quote}"
              </p>

              {/* Metric */}
              <div className="inline-flex items-center gap-2 text-xs font-semibold gradient-brand-text bg-[oklch(0.65_0.25_280/0.08)] border border-[oklch(0.65_0.25_280/0.2)] rounded-full px-3 py-1 mb-4">
                ✦ {t.metric}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/8">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatarColor} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-[oklch(0.45_0.01_270)]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
