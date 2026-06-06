import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

export default function CTA() {
  return (
    <section id="cta" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        {/* Large glow orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[oklch(0.65_0.25_280/0.12)] blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-[oklch(0.65_0.22_195/0.08)] blur-[80px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl gradient-brand flex items-center justify-center glow-primary-lg animate-float">
              <Zap className="size-10 text-white fill-white" />
            </div>
            <div className="absolute inset-0 rounded-2xl gradient-brand opacity-40 blur-xl scale-110 animate-pulse-glow" />
          </div>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
          <span className="text-white">Start Creating</span>
          <span className="gradient-glow-text block">Viral Short Videos</span>
          <span className="text-white">Today — For Free</span>
        </h2>

        <p className="text-lg text-[oklch(0.55_0.015_270)] max-w-xl mx-auto mb-10 leading-relaxed">
          Join 2 million creators already using VidShorts to repurpose their content and 
          grow their audiences. No credit card required.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Link
            href="/sign-up"
            id="cta-section-primary"
            className="group inline-flex items-center justify-center gap-2 h-14 px-10 rounded-md text-base font-semibold text-white gradient-brand border-0 glow-primary hover:opacity-90 hover:scale-105 transition-all duration-200"
          >
            Get Started For Free
            <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="#features"
            id="cta-section-secondary"
            className="inline-flex items-center justify-center h-14 px-10 rounded-md text-base font-medium border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white backdrop-blur-sm transition-all duration-200"
          >
            Explore Features
          </Link>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[oklch(0.45_0.01_270)]">
          {[
            "✓ Free forever plan",
            "✓ No credit card required",
            "✓ 14-day Pro trial",
            "✓ Cancel anytime",
          ].map((item) => (
            <span key={item} className="flex items-center gap-1">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
