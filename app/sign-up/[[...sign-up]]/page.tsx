import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata = {
  title: "Sign Up – VidShorts",
  description: "Create your VidShorts account and start turning long videos into viral clips.",
};

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[oklch(0.09_0.01_270)]">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[oklch(0.65_0.22_195/0.10)] blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[oklch(0.55_0.28_310/0.08)] blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(oklch(1 0 0 / 20%) 1px, transparent 1px),
                              linear-gradient(90deg, oklch(1 0 0 / 20%) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Logo */}
      <Link
        href="/"
        className="relative z-10 flex items-center gap-2.5 mb-8 group"
        id="signup-logo"
      >
        <div className="relative">
          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center glow-primary transition-all duration-300 group-hover:scale-110">
            <Zap className="size-5 text-white fill-white" />
          </div>
          <div className="absolute inset-0 rounded-xl gradient-brand opacity-0 group-hover:opacity-40 blur-md transition-all duration-300" />
        </div>
        <span className="text-xl font-bold tracking-tight">
          <span className="text-white">Vid</span>
          <span className="gradient-brand-text">Shorts</span>
        </span>
      </Link>

      {/* Clerk SignUp component */}
      <div className="relative z-10">
        <SignUp
          appearance={{
            variables: {
              colorPrimary: "oklch(0.65 0.25 280)",
              colorBackground: "oklch(0.12 0.012 270)",
              colorInputBackground: "oklch(0.10 0.01 270)",
              colorInputText: "oklch(0.96 0.005 270)",
              colorText: "oklch(0.96 0.005 270)",
              colorTextSecondary: "oklch(0.55 0.01 270)",
              colorNeutral: "oklch(0.55 0.01 270)",
              colorDanger: "oklch(0.65 0.22 25)",
              borderRadius: "0.75rem",
              fontFamily: "var(--font-sans), Inter, sans-serif",
            },
            elements: {
              rootBox: "w-full",
              card: [
                "shadow-2xl shadow-black/50",
                "border border-white/10",
                "bg-[oklch(0.12_0.012_270)]",
              ].join(" "),
              headerTitle:
                "text-white font-bold text-2xl tracking-tight",
              headerSubtitle: "text-[oklch(0.55_0.01_270)]",
              socialButtonsBlockButton: [
                "border-white/10 bg-white/5 text-white",
                "hover:bg-white/10 hover:border-white/20",
                "transition-all duration-200",
              ].join(" "),
              socialButtonsBlockButtonText: "text-white font-medium",
              dividerLine: "bg-white/10",
              dividerText: "text-[oklch(0.45_0.01_270)]",
              formFieldLabel: "text-[oklch(0.70_0.01_270)] font-medium",
              formFieldInput: [
                "bg-[oklch(0.10_0.01_270)]",
                "border-white/10",
                "text-white placeholder:text-[oklch(0.40_0.01_270)]",
                "focus:border-[oklch(0.65_0.25_280/0.6)]",
                "focus:ring-2 focus:ring-[oklch(0.65_0.25_280/0.2)]",
                "transition-all duration-200",
              ].join(" "),
              formButtonPrimary: [
                "bg-gradient-to-r from-[oklch(0.65_0.25_280)] to-[oklch(0.65_0.22_195)]",
                "text-white font-semibold",
                "hover:opacity-90 hover:scale-[1.01]",
                "transition-all duration-200",
                "shadow-lg shadow-[oklch(0.65_0.25_280/0.3)]",
              ].join(" "),
              footerActionLink:
                "text-[oklch(0.70_0.18_280)] hover:text-[oklch(0.80_0.22_280)] font-semibold",
              identityPreviewText: "text-white",
              identityPreviewEditButton:
                "text-[oklch(0.70_0.18_280)] hover:text-[oklch(0.80_0.22_280)]",
              formFieldSuccessText: "text-[oklch(0.65_0.22_160)]",
              formFieldErrorText: "text-[oklch(0.65_0.22_25)]",
              alertText: "text-[oklch(0.65_0.22_25)]",
            },
          }}
        />
      </div>

      {/* Back to home */}
      <p className="relative z-10 mt-6 text-sm text-[oklch(0.40_0.01_270)]">
        <Link
          href="/"
          id="signup-back-home"
          className="hover:text-[oklch(0.65_0.25_280)] transition-colors duration-200"
        >
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
