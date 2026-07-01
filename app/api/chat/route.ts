import {
  convertToModelMessages,
  generateId,
  stepCountIs,
  streamText,
  validateUIMessages,
  type UIMessage,
  type UIMessageStreamOnFinishCallback,
} from "ai";
import { z } from "zod";

import { buildChatTools } from "@/lib/agent/chat-tools";
import { protectAiRoute } from "@/lib/agent/protect-ai-route";
import { isDemoUser } from "@/lib/auth";
import {
  appendTurn,
  ChatAccessError,
  loadMessages,
  resolveThreadId,
} from "@/lib/data/chat";
import { models } from "@/lib/models";

export const maxDuration = 60;

const TOOL_STEP_CAP = 5;

const SYSTEM_PROMPT = `You are the Finerel Watchlist Agent — a read-only research assistant for the signed-in user's portfolio data.

You answer questions about the user's watchlist, extracted company relationships, news, briefing history, and relationship graph. Ground every answer in tool results; never invent relationships, news, or holdings.

Rules:
- Call only the tools needed for the current question.
- When data is missing or a tool returns an error, say so plainly — do not fabricate an answer.
- Never provide buy/sell signals, price targets, or investment recommendations.
- Cite specific companies, tickers, and sources from tool output when relevant.
- Keep answers concise and scannable.`;

const chatMessageSchema = z.object({
  id: z.string().min(1),
  role: z.literal("user"),
  parts: z.array(z.record(z.string(), z.unknown())).min(1),
});

// Sanitized, size-capped view descriptor sent only by the docked Ask panel
// (feature 27). A hint that frames the question — never affects userId or tool
// scope (26-chat-api-route.md → Page-context seeding).
const pageContextSchema = z
  .object({
    page: z.string().min(1).max(40),
    focus: z.object({ ticker: z.string().max(12) }).partial().strict().optional(),
  })
  .strict();

const chatPostSchema = z.object({
  threadId: z.string().min(1).optional(),
  id: z.string().min(1).optional(),
  message: chatMessageSchema,
  context: pageContextSchema.optional(),
});

function buildSystemPrompt(
  context?: z.infer<typeof pageContextSchema>,
): string {
  if (!context) {
    return SYSTEM_PROMPT;
  }

  const focusTicker = context.focus?.ticker;
  const view = focusTicker
    ? `${context.page} (focused on ${focusTicker})`
    : context.page;

  return `${SYSTEM_PROMPT}

Current view: the user is on the "${view}" page of the app. Use this only to resolve vague references like "this" or "here" — it never changes which user's data you may access.`;
}

function getAssistantMessage(messages: UIMessage[]): UIMessage | undefined {
  const last = messages.at(-1);
  return last?.role === "assistant" ? last : undefined;
}

type ParsedChatRequest = z.infer<typeof chatPostSchema>;

async function parseChatRequest(
  request: Request,
): Promise<{ data: ParsedChatRequest } | { errorResponse: Response }> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      errorResponse: Response.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }

  const parsed = chatPostSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input";
    return { errorResponse: Response.json({ error: message }, { status: 400 }) };
  }

  return { data: parsed.data };
}

async function resolveChatThread(
  userId: string,
  requestedThreadId: string | undefined,
): Promise<{ threadId: string } | { errorResponse: Response }> {
  try {
    const { threadId } = await resolveThreadId(userId, requestedThreadId);
    return { threadId };
  } catch (error) {
    if (error instanceof ChatAccessError) {
      return { errorResponse: Response.json({ error: "Forbidden" }, { status: 403 }) };
    }
    throw error;
  }
}

async function buildValidatedMessages(
  priorMessages: UIMessage[],
  userMessage: UIMessage,
  logContext: { userId: string; threadId: string },
): Promise<{ messages: UIMessage[] } | { errorResponse: Response }> {
  try {
    const messages = await validateUIMessages({
      messages: [...priorMessages, userMessage],
    });
    return { messages };
  } catch (error) {
    console.error("[api/chat] message validation failed", {
      ...logContext,
      error: error instanceof Error ? error.message : "unknown",
    });
    return {
      errorResponse: Response.json({ error: "Invalid message format" }, { status: 400 }),
    };
  }
}

function createOnFinish(
  userId: string,
  threadId: string,
  userMessage: UIMessage,
): UIMessageStreamOnFinishCallback<UIMessage> {
  return async ({ messages, isAborted }) => {
    if (isDemoUser(userId) || isAborted) {
      return;
    }

    const assistantMessage = getAssistantMessage(messages);
    if (!assistantMessage) {
      return;
    }

    try {
      await appendTurn(threadId, userMessage, {
        ...assistantMessage,
        // Defensive: never persist an empty id even if id generation is bypassed.
        id: assistantMessage.id || generateId(),
      });
    } catch (error) {
      console.error("[api/chat] persistence failed", {
        userId,
        threadId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  };
}

export const POST = protectAiRoute(async (request, userId) => {
  const parsedRequest = await parseChatRequest(request);
  if ("errorResponse" in parsedRequest) {
    return parsedRequest.errorResponse;
  }

  const { message, context } = parsedRequest.data;
  const requestedThreadId = parsedRequest.data.threadId ?? parsedRequest.data.id;

  const resolvedThread = await resolveChatThread(userId, requestedThreadId);
  if ("errorResponse" in resolvedThread) {
    return resolvedThread.errorResponse;
  }
  const { threadId } = resolvedThread;

  const priorMessages = await loadMessages(threadId);

  const userMessage: UIMessage = {
    id: message.id,
    role: message.role,
    parts: message.parts as UIMessage["parts"],
  };

  const validated = await buildValidatedMessages(priorMessages, userMessage, {
    userId,
    threadId,
  });
  if ("errorResponse" in validated) {
    return validated.errorResponse;
  }
  const { messages: validatedMessages } = validated;

  const tools = buildChatTools(userId);

  const result = streamText({
    model: models.chat,
    system: buildSystemPrompt(context),
    tools,
    messages: await convertToModelMessages(validatedMessages),
    stopWhen: stepCountIs(TOOL_STEP_CAP),
    onError: ({ error }) => {
      console.error("[api/chat] stream error", {
        userId,
        threadId,
        error: error instanceof Error ? error.message : "unknown",
      });
    },
  });

  if (!isDemoUser(userId)) {
    void Promise.resolve(result.consumeStream()).catch((error: unknown) => {
      console.error("[api/chat] consume stream error", {
        userId,
        threadId,
        error: error instanceof Error ? error.message : "unknown",
      });
    });
  }

  return result.toUIMessageStreamResponse({
    headers: { "X-Thread-Id": threadId },
    originalMessages: validatedMessages,
    // Without this the assistant message id is empty; since chat_messages.id is
    // the primary key, only the first assistant message ever persists and every
    // later turn collides on "" (chat_messages_pkey). Generate a real id.
    generateMessageId: generateId,
    onFinish: createOnFinish(userId, threadId, userMessage),
    onError: () => "Something went wrong. Please try again.",
  });
});