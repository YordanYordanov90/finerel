import { and, asc, desc, eq } from "drizzle-orm";
import { generateId, type UIMessage } from "ai";

import { chatMessages, chatThreads, db } from "@/lib/db";

const TITLE_MAX = 80;

export type ChatThreadSummary = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

type MessageRole = "user" | "assistant" | "system";

function extractTextFromParts(parts: UIMessage["parts"]): string {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .trim();
}

export async function createThread(userId: string, id?: string): Promise<string> {
  const threadId = id ?? generateId();

  await db
    .insert(chatThreads)
    .values({
      id: threadId,
      userId,
      title: null,
    })
    .onConflictDoNothing({ target: chatThreads.id });

  return threadId;
}

export async function getOwnedThread(
  userId: string,
  threadId: string,
): Promise<typeof chatThreads.$inferSelect | null> {
  const [thread] = await db
    .select()
    .from(chatThreads)
    .where(and(eq(chatThreads.id, threadId), eq(chatThreads.userId, userId)))
    .limit(1);

  return thread ?? null;
}

export async function resolveThreadId(
  userId: string,
  threadId?: string,
): Promise<{ threadId: string; created: boolean }> {
  if (!threadId) {
    return { threadId: await createThread(userId), created: true };
  }

  const [existing] = await db
    .select({ userId: chatThreads.userId })
    .from(chatThreads)
    .where(eq(chatThreads.id, threadId))
    .limit(1);

  if (existing) {
    if (existing.userId !== userId) {
      throw new ChatAccessError();
    }
    return { threadId, created: false };
  }

  await createThread(userId, threadId);

  const [created] = await db
    .select({ userId: chatThreads.userId })
    .from(chatThreads)
    .where(eq(chatThreads.id, threadId))
    .limit(1);

  if (!created || created.userId !== userId) {
    throw new ChatAccessError();
  }

  return { threadId, created: true };
}

export class ChatAccessError extends Error {
  constructor() {
    super("Thread not accessible");
    this.name = "ChatAccessError";
  }
}

export async function listThreads(userId: string): Promise<ChatThreadSummary[]> {
  const rows = await db
    .select({
      id: chatThreads.id,
      title: chatThreads.title,
      createdAt: chatThreads.createdAt,
      updatedAt: chatThreads.updatedAt,
    })
    .from(chatThreads)
    .where(eq(chatThreads.userId, userId))
    .orderBy(desc(chatThreads.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function loadMessages(threadId: string): Promise<UIMessage[]> {
  const rows = await db
    .select({
      id: chatMessages.id,
      role: chatMessages.role,
      parts: chatMessages.parts,
    })
    .from(chatMessages)
    .where(eq(chatMessages.threadId, threadId))
    .orderBy(asc(chatMessages.createdAt), desc(chatMessages.role));

  return rows.map((row) => ({
    id: row.id,
    role: row.role as MessageRole,
    parts: row.parts as UIMessage["parts"],
  }));
}

export async function loadThreadMessages(
  userId: string,
  threadId: string,
): Promise<UIMessage[]> {
  const thread = await getOwnedThread(userId, threadId);
  if (!thread) {
    throw new ChatAccessError();
  }

  return loadMessages(threadId);
}

export async function appendTurn(
  threadId: string,
  userMessage: UIMessage,
  assistantMessage: UIMessage,
): Promise<void> {
  const userCreatedAt = new Date();
  const assistantCreatedAt = new Date(userCreatedAt.getTime() + 1);

  await db.transaction(async (tx) => {
    await tx
      .insert(chatMessages)
      .values([
        {
          id: userMessage.id,
          threadId,
          role: userMessage.role,
          parts: userMessage.parts,
          createdAt: userCreatedAt,
        },
        {
          id: assistantMessage.id,
          threadId,
          role: assistantMessage.role,
          parts: assistantMessage.parts,
          createdAt: assistantCreatedAt,
        },
      ])
      .onConflictDoNothing({ target: chatMessages.id });

    const [thread] = await tx
      .select({ title: chatThreads.title })
      .from(chatThreads)
      .where(eq(chatThreads.id, threadId))
      .limit(1);

    const titleFromMessage = extractTextFromParts(userMessage.parts).slice(
      0,
      TITLE_MAX,
    );

    await tx
      .update(chatThreads)
      .set({
        updatedAt: assistantCreatedAt,
        ...(thread?.title === null && titleFromMessage
          ? { title: titleFromMessage }
          : {}),
      })
      .where(eq(chatThreads.id, threadId));
  });
}