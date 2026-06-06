import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { createMiddleware } from "@arcjet/next";
import { aj } from "@/lib/arcjet";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

const clerk = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(req: NextRequest, event: any) {
  // Inngest webhooks act like bots, bypass them
  if (req.nextUrl.pathname.startsWith("/api/inngest")) {
    return clerk(req, event);
  }

  // Run Arcjet manually to see the decision
  const decision = await aj.protect(req);
  
  if (decision.isDenied()) {
    console.error(`[Arcjet Middleware] Denied request to ${req.nextUrl.pathname}`);
    console.error(`[Arcjet Middleware] Reason:`, decision.reason);
    
    if (decision.reason.isRateLimit()) {
      return NextResponse.json({ error: "Too Many Requests", reason: decision.reason }, { status: 429 });
    }
    return NextResponse.json({ error: "Forbidden", reason: decision.reason }, { status: 403 });
  }

  return clerk(req, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
