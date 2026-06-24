export function isDemoUser(userId: string): boolean {
  const demoUserId = process.env.DEMO_USER_ID;

  if (!demoUserId) {
    return false;
  }

  return userId === demoUserId;
}

export function getDemoUserId(): string {
  const demoUserId = process.env.DEMO_USER_ID;

  if (!demoUserId) {
    throw new Error("DEMO_USER_ID is not set");
  }

  return demoUserId;
}

export async function getAuthOrDemoUserId(
  request: Request,
): Promise<string | null> {
  const url = new URL(request.url);

  if (url.searchParams.get("demo") === "true") {
    const demoUserId = process.env.DEMO_USER_ID;

    if (!demoUserId) {
      console.warn(
        "[auth] demo=true requested but DEMO_USER_ID is not configured",
      );
      return null;
    }

    return demoUserId;
  }

  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  return userId;
}