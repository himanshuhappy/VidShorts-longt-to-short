"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Zap,
  Crown,
  Building2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Perfect for exploring AI video editing.",
    badge: null,
    features: [
      "5 videos per month",
      "Up to 30 min video length",
      "3 clips per video",
      "Auto-captions (English)",
      "720p export quality",
      "VidShorts watermark",
      "Email support",
    ],
    cta: "Get Started Free",
    ctaVariant: "outline" as const,
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    icon: Crown,
    monthlyPrice: 29,
    yearlyPrice: 19,
    description: "For creators serious about short-form content.",
    badge: "Most Popular",
    features: [
      "Unlimited videos",
      "Up to 3 hour video length",
      "Unlimited clips per video",
      "Auto-captions (50+ languages)",
      "4K export quality",
      "No watermark",
      "Virality score & analytics",
      "Direct platform publishing",
      "Custom branding & templates",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    ctaVariant: "default" as const,
    highlight: true,
  },
  {
    id: "team",
    name: "Team",
    icon: Building2,
    monthlyPrice: 79,
    yearlyPrice: 59,
    description: "Built for agencies and content teams.",
    badge: null,
    features: [
      "Everything in Pro",
      "5 team seats included",
      "Bulk video processing",
      "API access",
      "White-label exports",
      "Custom AI fine-tuning",
      "Dedicated account manager",
      "SLA & uptime guarantee",
    ],
    cta: "Start Team Trial",
    ctaVariant: "outline" as const,
    highlight: false,
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[oklch(0.65_0.22_195/0.06)] blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Badge
              variant="outline"
              className="gap-2 px-3 py-1 border-[oklch(0.65_0.25_280/0.3)] bg-[oklch(0.65_0.25_280/0.06)] text-[oklch(0.70_0.18_280)]"
            >
              <Sparkles className="size-3" />
              Simple Pricing
            </Badge>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            <span className="text-white">Choose Your </span>
            <span className="gradient-glow-text">Growth Plan</span>
          </h2>
          <p className="text-[oklch(0.55_0.015_270)] text-lg max-w-xl mx-auto mb-8">
            Start free. Scale as you grow. No hidden fees, cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={cn("text-sm font-medium transition-colors", !isYearly ? "text-white" : "text-[oklch(0.50_0.01_270)]")}>
              Monthly
            </span>
            <button
              id="pricing-billing-toggle"
              onClick={() => setIsYearly(!isYearly)}
              className={cn(
                "relative w-14 h-7 rounded-full transition-all duration-300",
                isYearly ? "gradient-brand" : "bg-white/10"
              )}
              aria-label="Toggle billing period"
            >
              <div
                className={cn(
                  "absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300",
                  isYearly ? "left-8" : "left-1"
                )}
              />
            </button>
            <span className={cn("text-sm font-medium transition-colors flex items-center gap-2", isYearly ? "text-white" : "text-[oklch(0.50_0.01_270)]")}>
              Yearly
              <span className="text-xs gradient-brand-text font-bold bg-[oklch(0.65_0.25_280/0.12)] border border-[oklch(0.65_0.25_280/0.3)] px-2 py-0.5 rounded-full">
                Save 34%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-2xl p-8 flex flex-col transition-all duration-300",
                  plan.highlight
                    ? "border border-[oklch(0.65_0.25_280/0.5)] bg-[oklch(0.12_0.015_270)] shadow-xl shadow-[oklch(0.65_0.25_280/0.15)]"
                    : "glass-card glass-card-hover"
                )}
              >
                {/* Popular badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="gradient-brand text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Glow for popular */}
                {plan.highlight && (
                  <div className="absolute inset-0 rounded-2xl bg-[oklch(0.65_0.25_280/0.04)] pointer-events-none" />
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        plan.highlight
                          ? "gradient-brand"
                          : "bg-white/8 border border-white/10"
                      )}
                    >
                      <Icon className={cn("size-5", plan.highlight ? "text-white" : "text-[oklch(0.65_0.01_270)]")} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-[oklch(0.50_0.01_270)]">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6 pb-6 border-b border-white/8">
                  <div className="flex items-end gap-2">
                    <span className={cn("text-5xl font-extrabold", plan.highlight ? "gradient-glow-text" : "text-white")}>
                      {price === 0 ? "Free" : `$${price}`}
                    </span>
                    {price !== 0 && (
                      <span className="text-[oklch(0.45_0.01_270)] mb-2">
                        / mo{isYearly ? " · billed yearly" : ""}
                      </span>
                    )}
                  </div>
                  {isYearly && plan.monthlyPrice > 0 && (
                    <p className="text-xs text-[oklch(0.45_0.01_270)] mt-1">
                      Was <span className="line-through">${plan.monthlyPrice}/mo</span>
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                          plan.highlight
                            ? "gradient-brand"
                            : "bg-[oklch(0.65_0.22_195/0.15)] border border-[oklch(0.65_0.22_195/0.3)]"
                        )}
                      >
                        <Check className="size-2.5 text-white" />
                      </div>
                      <span className="text-sm text-[oklch(0.65_0.01_270)]">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/sign-up"
                  id={`pricing-cta-${plan.id}`}
                  className={cn(
                    "w-full h-11 rounded-md font-semibold text-sm transition-all duration-200 inline-flex items-center justify-center gap-2",
                    plan.highlight
                      ? "gradient-brand text-white border-0 glow-primary hover:opacity-90 hover:scale-[1.02]"
                      : "border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white"
                  )}
                >
                  {plan.cta}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-[oklch(0.45_0.01_270)] mt-8">
          All plans include a 14-day free trial. No credit card required to start.
        </p>
      </div>
    </section>
  );
}
