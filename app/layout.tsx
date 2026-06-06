import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VidShorts – AI Long to Short Video Generator",
  description:
    "Transform long-form videos into viral short clips in seconds. AI-powered editing, auto-captions, and smart scene detection for creators.",
  keywords: [
    "AI video editor",
    "long to short video",
    "video clips generator",
    "auto captions",
    "short form content",
    "viral clips",
    "content creator tools",
  ],
  authors: [{ name: "VidShorts" }],
  openGraph: {
    title: "VidShorts – AI Long to Short Video Generator",
    description:
      "Transform long-form videos into viral short clips in seconds with AI.",
    type: "website",
  },
};

import { dark } from "@clerk/themes";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <html
        lang="en"
        className={cn("dark h-full antialiased", inter.variable)}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
