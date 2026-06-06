import Link from "next/link";
import { Zap, Share2, Play, MessageSquare, Globe, ExternalLink } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Changelog", href: "#" },
    { label: "Roadmap", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Tutorials", href: "#" },
    { label: "Status", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press Kit", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Affiliates", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "GDPR", href: "#" },
  ],
};

const socials = [
  { label: "X / Twitter", icon: MessageSquare, href: "#", id: "footer-social-twitter" },
  { label: "YouTube", icon: Play, href: "#", id: "footer-social-youtube" },
  { label: "Instagram", icon: Share2, href: "#", id: "footer-social-instagram" },
  { label: "LinkedIn", icon: Globe, href: "#", id: "footer-social-linkedin" },
  { label: "GitHub", icon: ExternalLink, href: "#", id: "footer-social-github" },
];

const platforms = [
  { name: "TikTok", emoji: "🎵" },
  { name: "Reels", emoji: "📱" },
  { name: "Shorts", emoji: "▶️" },
  { name: "LinkedIn", emoji: "💼" },
  { name: "Twitter/X", emoji: "𝕏" },
  { name: "Pinterest", emoji: "📌" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none bg-[oklch(0.075_0.01_270/0.8)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Platform strip */}
        <div className="py-8 border-b border-white/6">
          <p className="text-xs text-[oklch(0.40_0.01_270)] text-center mb-4 uppercase tracking-widest font-medium">
            Publish directly to
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {platforms.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-2 text-sm text-[oklch(0.50_0.01_270)] bg-white/4 border border-white/6 rounded-full px-4 py-1.5 hover:border-white/12 hover:text-white transition-all duration-200"
              >
                <span>{p.emoji}</span>
                <span className="font-medium">{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main footer content */}
        <div className="py-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 mb-4 group w-fit" id="footer-logo">
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center glow-primary">
                <Zap className="size-4 text-white fill-white" />
              </div>
              <span className="text-lg font-bold">
                <span className="text-white">Vid</span>
                <span className="gradient-brand-text">Shorts</span>
              </span>
            </Link>

            <p className="text-sm text-[oklch(0.45_0.01_270)] leading-relaxed max-w-xs mb-6">
              AI-powered long to short video conversion for modern content creators. 
              Turn hours of footage into viral clips in minutes.
            </p>

            {/* Social links */}
            <div className="flex gap-3">
              {socials.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    id={social.id}
                    aria-label={social.label}
                    className="w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-[oklch(0.45_0.01_270)] hover:text-white hover:bg-white/10 hover:border-white/16 transition-all duration-200"
                  >
                    <Icon className="size-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[oklch(0.45_0.01_270)] hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[oklch(0.35_0.01_270)]">
            © {new Date().getFullYear()} VidShorts, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-[oklch(0.35_0.01_270)]">
            <span>Made with</span>
            <span className="text-[oklch(0.65_0.25_280)]">♥</span>
            <span>for content creators worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
