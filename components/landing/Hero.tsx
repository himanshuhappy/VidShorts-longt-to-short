"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Play,
  Sparkles,
  TrendingUp,
  Clock,
} from "lucide-react";

const stats = [
  { value: "10M+", label: "Clips Generated" },
  { value: "2M+", label: "Creators" },
  { value: "50x", label: "Faster Editing" },
  { value: "99%", label: "Satisfaction" },
];

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
    >
      {/* Background decorative orbs */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary violet orb */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-[oklch(0.65_0.25_280/0.12)] blur-[120px] animate-pulse-glow" />
        {/* Cyan orb */}
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-[oklch(0.65_0.22_195/0.10)] blur-[100px] animate-pulse-glow" style={{ animationDelay: "2s" }} />
        {/* Glow orb top-right */}
        <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] rounded-full bg-[oklch(0.55_0.28_310/0.08)] blur-[80px] animate-pulse-glow" style={{ animationDelay: "4s" }} />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(oklch(1 0 0 / 20%) 1px, transparent 1px),
                              linear-gradient(90deg, oklch(1 0 0 / 20%) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        {/* Announcement badge */}
        <div className="flex justify-center mb-8 animate-slide-up">
          <Badge
            variant="outline"
            className="gap-2 px-4 py-1.5 text-sm border-[oklch(0.65_0.25_280/0.4)] bg-[oklch(0.65_0.25_280/0.08)] text-[oklch(0.75_0.2_280)] hover:bg-[oklch(0.65_0.25_280/0.12)] transition-colors cursor-default"
          >
            <Sparkles className="size-3.5 text-[oklch(0.75_0.2_280)]" />
            Introducing AI Scene Detection 2.0
            <ArrowRight className="size-3.5" />
          </Badge>
        </div>

        {/* Main heading */}
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight mb-6 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="text-white block leading-none mb-2">Turn Long Videos</span>
          <span className="block leading-none">
            <span className="gradient-glow-text">Into Viral Clips</span>
          </span>
          <span className="text-white block leading-none mt-2">In Seconds</span>
        </h1>

        {/* Subheading */}
        <p
          className="text-lg sm:text-xl text-[oklch(0.60_0.015_270)] max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          VidShorts uses advanced AI to automatically identify the most engaging
          moments, add captions, and repurpose your long-form content into
          scroll-stopping short videos for TikTok, Reels & Shorts.
        </p>

        {/* CTA buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-slide-up"
          style={{ animationDelay: "0.3s" }}
        >
          <Link
            href="/sign-up"
            id="hero-cta-primary"
            className="group inline-flex items-center justify-center gap-2 h-12 px-8 rounded-md text-base font-semibold text-white gradient-brand border-0 glow-primary hover:opacity-90 hover:scale-105 transition-all duration-200"
          >
            Start For Free
            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button
            id="hero-cta-demo"
            className="group inline-flex items-center justify-center gap-2 h-12 px-8 rounded-md text-base font-medium border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white backdrop-blur-sm transition-all duration-200"
          >
            <Play className="size-4 fill-current group-hover:scale-110 transition-transform" />
            Watch Demo
          </button>
        </div>

        {/* Hero mockup / video player visual */}
        <div
          className="relative max-w-4xl mx-auto animate-slide-up"
          style={{ animationDelay: "0.4s" }}
        >
          {/* Glow behind card */}
          <div className="absolute inset-0 rounded-2xl bg-[oklch(0.65_0.25_280/0.15)] blur-[60px] scale-95" />

          {/* Main card */}
          <div className="relative rounded-2xl border border-white/10 bg-[oklch(0.12_0.012_270)] overflow-hidden shadow-2xl shadow-black/50">
            {/* Top bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-[oklch(0.10_0.012_270)]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[oklch(0.65_0.22_25)]" />
                <div className="w-3 h-3 rounded-full bg-[oklch(0.70_0.18_60)]" />
                <div className="w-3 h-3 rounded-full bg-[oklch(0.65_0.22_160)]" />
              </div>
              <div className="flex-1 mx-4">
                <div className="h-5 rounded-md bg-white/5 border border-white/8 flex items-center px-3">
                  <span className="text-xs text-[oklch(0.45_0.01_270)]">vidshorts.ai/editor</span>
                </div>
              </div>
            </div>

            {/* Editor content area */}
            <div className="p-6">
              <div className="flex gap-4 h-48">
                {/* Left: video preview with scan animation */}
                <div className="flex-1 relative rounded-xl bg-[oklch(0.09_0.01_270)] border border-white/8 overflow-hidden flex items-center justify-center">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 gradient-brand opacity-20" />
                  {/* Scan line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[oklch(0.65_0.25_280)] to-transparent animate-[scan_2s_ease-in-out_infinite]"
                    style={{
                      animation: "scan 2.5s ease-in-out infinite",
                    }}
                  />
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center glow-primary">
                      <Play className="size-5 text-white fill-white ml-0.5" />
                    </div>
                    <p className="text-xs text-[oklch(0.55_0.01_270)]">AI Analyzing video...</p>
                  </div>
                  {/* Highlight boxes on video */}
                  <div className="absolute top-4 left-4 right-4">
                    <div className="h-6 rounded bg-[oklch(0.65_0.25_280/0.3)] border border-[oklch(0.65_0.25_280/0.5)] flex items-center px-2 gap-2">
                      <TrendingUp className="size-3 text-[oklch(0.75_0.2_280)]" />
                      <span className="text-[10px] text-[oklch(0.75_0.2_280)] font-medium">Viral moment detected – 98% score</span>
                    </div>
                  </div>
                </div>

                {/* Right: clips panel */}
                <div className="w-44 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-[oklch(0.50_0.01_270)] uppercase tracking-wider">Generated Clips</p>
                  {[
                    { label: "Clip #1 – Hook", score: "98%", time: "0:15" },
                    { label: "Clip #2 – Key Moment", score: "92%", time: "0:30" },
                    { label: "Clip #3 – CTA", score: "87%", time: "0:20" },
                  ].map((clip, i) => (
                    <div
                      key={i}
                      className={`glass-card rounded-lg p-2.5 cursor-pointer transition-all duration-200 hover:border-[oklch(0.65_0.25_280/0.4)] ${i === 0 ? "border-[oklch(0.65_0.25_280/0.4)] bg-[oklch(0.65_0.25_280/0.08)]" : ""}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[10px] font-medium text-white truncate">{clip.label}</p>
                        <span className="text-[10px] gradient-brand-text font-bold">{clip.score}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="size-2.5 text-[oklch(0.45_0.01_270)]" />
                        <span className="text-[9px] text-[oklch(0.45_0.01_270)]">{clip.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress bar at bottom */}
            <div className="px-6 pb-4">
              <div className="flex items-center gap-3 text-xs text-[oklch(0.45_0.01_270)]">
                <Sparkles className="size-3 text-[oklch(0.65_0.25_280)]" />
                <span>Processing: <span className="text-white font-medium">interview_full_1hr.mp4</span></span>
                <div className="flex-1 h-1.5 rounded-full bg-white/8">
                  <div className="h-full w-3/4 rounded-full gradient-brand animate-pulse" />
                </div>
                <span className="text-[oklch(0.65_0.25_280)] font-medium">75%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mt-16 animate-slide-up"
          style={{ animationDelay: "0.5s" }}
        >
          {stats.map((stat) => (
            <div key={stat.value} className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold gradient-glow-text mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-[oklch(0.50_0.01_270)] font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 20%; }
          50% { top: 80%; }
          100% { top: 20%; }
        }
      `}</style>
    </section>
  );
}
