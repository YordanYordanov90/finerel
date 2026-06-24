import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/demo(.*)",
  "/api/health",
  "/api/webhooks/clerk",
  "/api/cron/(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

function isDemoApiRequest(request: Request): boolean {
  const url = new URL(request.url);
  return url.searchParams.get("demo") === "true" && url.pathname.startsWith("/api/");
}

export default clerkMiddleware(async (auth, request) => {
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