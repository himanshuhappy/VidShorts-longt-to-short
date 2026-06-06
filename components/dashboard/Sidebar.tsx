"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  Zap,
  Home,
  Video,
  Calendar,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  {
    label: "Home",
    icon: Home,
    href: "/dashboard",
  },
  {
    label: "My Videos",
    icon: Video,
    href: "/dashboard/videos",
  },
  {
    label: "Schedule Post",
    icon: Calendar,
    href: "/dashboard/schedule",
  },
  {
    label: "Pricing",
    icon: CreditCard,
    href: "/pricing",
  },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[oklch(0.09_0.01_270)] border-r border-white/8 text-white">
      {/* Logo */}
      <div className="p-6 border-b border-white/8">
        <Link href="/" className="flex items-center gap-2.5 group w-fit">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center glow-primary">
            <Zap className="size-4 text-white fill-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-white">Vid</span>
            <span className="gradient-brand-text">Shorts</span>
          </span>
        </Link>
      </div>

      {/* Menu Options */}
      <div className="flex-1 px-4 py-6 space-y-2">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200",
              pathname === route.href
                ? "bg-white/10 text-white"
                : "text-[oklch(0.55_0.01_270)] hover:text-white hover:bg-white/5"
            )}
          >
            <route.icon className={cn("size-5", pathname === route.href ? "text-[oklch(0.65_0.25_280)]" : "")} />
            {route.label}
          </Link>
        ))}
      </div>

      {/* Footer User Settings */}
      <div className="p-4 border-t border-white/8 mt-auto min-h-[64px]">
        {mounted && (
          <div className="flex items-center gap-3 px-2 py-1">
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
                  avatarBox: "w-9 h-9 ring-2 ring-[oklch(0.65_0.25_280/0.4)] hover:ring-[oklch(0.65_0.25_280/0.7)] transition-all duration-200",
                  userButtonPopoverCard: "bg-[oklch(0.12_0.012_270)] border border-white/10 shadow-2xl shadow-black/50",
                  userButtonPopoverFooter: "border-white/8",
                },
              }}
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{user?.firstName || "User"}</span>
              <span className="text-xs text-[oklch(0.55_0.01_270)] truncate">Settings</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
