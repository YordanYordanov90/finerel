import { auth } from "@clerk/nextjs/server";

type AiRouteHandler = (
  request: Request,
  userId: string,
) => Promise<Response>;

export function protectAiRoute(handler: AiRouteHandler) {
  return async (request: Request): Promise<Response> => {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      return await handler(request, userId);
    } catch (error) {
      console.error("[ai-route] unhandled error", {
        error: error instanceof Error ? error.message : "unknown",
      });
      return Response.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}