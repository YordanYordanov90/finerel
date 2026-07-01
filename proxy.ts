import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/demo(.*)",
  "/api/health",
  "/api/webhooks/clerk",
  "/api/cron/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const isLandingRoute = createRouteMatcher(["/"]);

function isDemoApiRequest(request: Request): boolean {
  const url = new URL(request.url);
  return url.searchParams.get("demo") === "true" && url.pathname.startsWith("/api/");
}

export default clerkMiddleware(async (auth, request) => {
  // The marketing page is public, but a signed-in user landing here (bookmark,
  // browser back, stale link) should end up in the app, not stuck on the pitch.
  if (isLandingRoute(request)) {
    const { userId } = await auth();
    if (userId) {
      return NextResponse.redirect(new URL("/overview", request.url));
    }
    return;
  }

  if (!isPublicRoute(request) && !isDemoApiRequest(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};