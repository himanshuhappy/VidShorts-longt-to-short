"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Zap, Menu, X, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Show,
  UserButton,
} from "@clerk/nextjs";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-[oklch(0.09_0.01_270/0.92)] backdrop-blur-xl border-b border-white/6 shadow-lg shadow-black/20"
          : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" id="nav-logo">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center glow-primary transition-all duration-300 group-hover:scale-110">
                <Zap className="size-4 text-white fill-white" />
              </div>
              <div className="absolute inset-0 rounded-lg gradient-brand opacity-0 group-hover:opacity-40 blur-md transition-all duration-300" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-white">Vid</span>
              <span className="gradient-brand-text">Shorts</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-[oklch(0.65_0.01_270)] hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200 font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Buttons — auth-aware */}
          <div className="hidden md:flex items-center gap-3">
            {/* Signed out: show Sign In + Get Started */}
            <Show when="signed-out">
              <Link
                href="/sign-in"
                id="nav-signin"
                className="px-3 py-1.5 text-sm text-[oklch(0.65_0.01_270)] hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200 font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                id="nav-get-started"
                className="inline-flex items-center justify-center h-8 gap-1.5 px-5 rounded-md text-sm font-semibold text-white gradient-brand border-0 glow-primary hover:opacity-90 hover:scale-105 transition-all duration-200"
              >
                Get Started Free
              </Link>
            </Show>

            {/* Signed in: show Dashboard link + Clerk UserButton */}
            <Show when="signed-in">
              <Link
                href="/dashboard"
                id="nav-dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-[oklch(0.65_0.01_270)] hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200 font-medium"
              >
                <LayoutDashboard className="size-3.5" />
                Dashboard
              </Link>
              <UserButton
                appearance={{
                  variables: {
                    colorPrimary: "oklch(0.65 0.25 280)",
                    colorBackground: "oklch(0.12 0.012 270)",
                    colorText: "oklch(0.96 0.005 270)",
                    colorTextSecondary: "oklch(0.55 0.01 270)",
                    borderRadius: "0.75rem",
                  },
                  elements: {
                    avatarBox:
                      "w-8 h-8 ring-2 ring-[oklch(0.65_0.25_280/0.4)] hover:ring-[oklch(0.65_0.25_280/0.7)] transition-all duration-200",
                    userButtonPopoverCard:
                      "bg-[oklch(0.12_0.012_270)] border border-white/10 shadow-2xl shadow-black/50",
                    userButtonPopoverFooter: "border-white/8",
                  },
                }}
              />
            </Show>
          </div>

          {/* Mobile menu toggle */}
          <button
            id="nav-mobile-menu"
            className="md:hidden p-2 rounded-lg text-[oklch(0.65_0.01_270)] hover:text-white hover:bg-white/5 transition-all duration-200"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden transition-all duration-300 overflow-hidden",
            menuOpen ? "max-h-96 pb-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col gap-1 pt-2 border-t border-white/6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-3 text-sm text-[oklch(0.65_0.01_270)] hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-white/6">
              {/* Mobile: signed out */}
              <Show when="signed-out">
                <Link
                  href="/sign-in"
                  className="w-full inline-flex items-center justify-center h-8 px-4 rounded-md text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all duration-200"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="w-full inline-flex items-center justify-center h-8 px-4 rounded-md text-sm font-semibold text-white gradient-brand border-0 transition-all duration-200"
                  onClick={() => setMenuOpen(false)}
                >
                  Get Started Free
                </Link>
              </Show>

              {/* Mobile: signed in */}
              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  className="w-full inline-flex items-center justify-center gap-2 h-8 px-4 rounded-md text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all duration-200"
                  onClick={() => setMenuOpen(false)}
                >
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
                <div className="flex items-center gap-3 px-3 py-2">
                  <UserButton
                    appearance={{
                      variables: {
                        colorPrimary: "oklch(0.65 0.25 280)",
                        colorBackground: "oklch(0.12 0.012 270)",
                        colorText: "oklch(0.96 0.005 270)",
                        borderRadius: "0.75rem",
                      },
                      elements: {
                        avatarBox: "w-8 h-8",
                        userButtonPopoverCard:
                          "bg-[oklch(0.12_0.012_270)] border border-white/10 shadow-2xl shadow-black/50",
                      },
                    }}
                  />
                  <span className="text-sm text-[oklch(0.55_0.01_270)]">Account</span>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
