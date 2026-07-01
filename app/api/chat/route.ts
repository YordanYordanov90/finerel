import {
  convertToModelMessages,
  generateId,
  stepCountIs,
  streamText,
  validateUIMessages,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { buildChatTools } from "@/lib/agent/chat-tools";
import { protectAiRoute } from "@/lib/agent/protect-ai-route";
import { isDemoUser } from "@/lib/auth";
import {
  appendTurn,
  ChatAccessError,
  loadThreadMessages,
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

export const POST = protectAiRoute(async (request, userId) => {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = chatPostSchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input";
    return Response.json({ error: message }, { status: 400 });
  }

  const { message } = parsed.data;
  const requestedThreadId = parsed.data.threadId ?? parsed.data.id;

  let threadId: string;

  try {
    ({ threadId } = await resolveThreadId(userId, requestedThreadId));
  } catch (error) {
    if (error instanceof ChatAccessError) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    throw error;
  }

  const priorMessages = await loadThreadMessages(userId, threadId);

  const userMessage: UIMessage = {
    id: message.id,
    role: message.role,
    parts: message.parts as UIMessage["parts"],
  };

  const tools = buildChatTools(userId);

  let validatedMessages: UIMessage[];

  try {
    validatedMessages = await validateUIMessages({
      messages: [...priorMessages, userMessage],
    });
  } catch (error) {
    console.error("[api/chat] message validation failed", {
      userId,
      threadId,
      error: error instanceof Error ? error.message : "unknown",
    });
    return Response.json({ error: "Invalid message format" }, { status: 400 });
  }

  const result = streamText({
    model: models.chat,
    system: buildSystemPrompt(parsed.data.context),
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
    result.consumeStream();
  }

  return result.toUIMessageStreamResponse({
    headers: { "X-Thread-Id": threadId },
    originalMessages: validatedMessages,
    // Without this the assistant message id is empty; since chat_messages.id is
    // the primary key, only the first assistant message ever persists and every
    // later turn collides on "" (chat_messages_pkey). Generate a real id.
    generateMessageId: generateId,
    onFinish: async ({ messages, isAborted }) => {
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
    },
    onError: () => "Something went wrong. Please try again.",
  });
});