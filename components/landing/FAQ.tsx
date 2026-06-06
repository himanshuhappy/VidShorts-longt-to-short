"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "How does the AI know which parts to clip?",
    answer:
      "Our AI analyzes multiple signals: speech energy and pacing, facial expressions, background music intensity, audience retention patterns from 10M+ analyzed videos, keyword density, and structural hooks (stories, questions, surprises). It then scores each segment and surfaces the highest-potential clips.",
  },
  {
    question: "What video formats and lengths does VidShorts support?",
    answer:
      "We support MP4, MOV, AVI, MKV, WebM, and FLV up to 4K resolution. Free plans support videos up to 30 minutes; Pro plans up to 3 hours; Team plans support unlimited length. You can also paste YouTube, Vimeo, Loom, or Google Drive links.",
  },
  {
    question: "How accurate are the auto-captions?",
    answer:
      "Our captions achieve 98.5% accuracy in English using our fine-tuned Whisper model. For other languages, accuracy varies between 94–97%. You can always manually edit captions in our editor before exporting.",
  },
  {
    question: "Can I use VidShorts if I have no video editing experience?",
    answer:
      "Absolutely. VidShorts is designed for creators without editing backgrounds. The AI handles all the technical work — you just review and approve clips. If you want more control, our editor gives you timeline trimming, caption editing, and template options.",
  },
  {
    question: "Do the generated clips have watermarks?",
    answer:
      "The free Starter plan includes a small VidShorts watermark on exports. All paid plans (Pro and Team) export completely watermark-free, with your own custom branding available on Team plans.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, you can cancel at any time directly from your account settings. There are no cancellation fees. If you cancel a yearly plan, you keep access until the end of your billing period.",
  },
  {
    question: "Is there an API for developers or businesses?",
    answer:
      "Yes! Our REST API is available on Team plans and above. You can programmatically upload videos, trigger clip generation, retrieve results, and integrate VidShorts into your own workflows or products. Full documentation is available in our developer portal.",
  },
  {
    question: "How fast is video processing?",
    answer:
      "Processing speed depends on video length. A typical 60-minute video takes under 3 minutes on our GPU-accelerated infrastructure. During peak hours, this may extend slightly, but Team plan users get priority queue access.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full bg-[oklch(0.65_0.25_280/0.05)] blur-[100px]" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full bg-[oklch(0.65_0.22_195/0.05)] blur-[100px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Badge
              variant="outline"
              className="gap-2 px-3 py-1 border-[oklch(0.65_0.25_280/0.3)] bg-[oklch(0.65_0.25_280/0.06)] text-[oklch(0.70_0.18_280)]"
            >
              <HelpCircle className="size-3" />
              FAQ
            </Badge>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            <span className="text-white">Frequently Asked </span>
            <span className="gradient-glow-text">Questions</span>
          </h2>
          <p className="text-[oklch(0.55_0.015_270)] text-lg">
            Everything you need to know about VidShorts.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={cn(
                  "rounded-xl border transition-all duration-300 overflow-hidden",
                  isOpen
                    ? "border-[oklch(0.65_0.25_280/0.4)] bg-[oklch(0.12_0.012_270)]"
                    : "border-white/8 bg-white/3 hover:border-white/12 hover:bg-white/4"
                )}
              >
                <button
                  id={`faq-item-${index}`}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left group"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span className={cn("text-sm font-semibold transition-colors duration-200", isOpen ? "text-white" : "text-[oklch(0.75_0.01_270)] group-hover:text-white")}>
                    {faq.question}
                  </span>
                  <div
                    className={cn(
                      "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300",
                      isOpen
                        ? "gradient-brand text-white"
                        : "bg-white/8 text-[oklch(0.55_0.01_270)]"
                    )}
                  >
                    {isOpen ? (
                      <Minus className="size-3.5" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                  </div>
                </button>

                <div
                  className={cn(
                    "transition-all duration-300 ease-in-out",
                    isOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="px-5 pb-5">
                    <div className="w-full h-px bg-white/8 mb-4" />
                    <p className="text-sm text-[oklch(0.55_0.01_270)] leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Still have questions */}
        <div className="mt-12 text-center glass-card rounded-2xl p-8">
          <p className="text-white font-semibold mb-2">Still have questions?</p>
          <p className="text-sm text-[oklch(0.50_0.01_270)] mb-4">
            Our team is here to help. Reach out and we'll get back to you within 24 hours.
          </p>
          <a
            href="mailto:support@vidshorts.ai"
            id="faq-contact-link"
            className="inline-flex items-center gap-2 text-sm gradient-brand-text font-semibold hover:opacity-80 transition-opacity"
          >
            support@vidshorts.ai →
          </a>
        </div>
      </div>
    </section>
  );
}
