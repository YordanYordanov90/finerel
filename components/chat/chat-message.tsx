"use client";

import { Loader2 } from "lucide-react";
import type { UIMessage } from "ai";

import {
  Message,
  MessageContent,
  MessageFooter,
  MessageGroup,
} from "@/components/ui/message";

import { Bubble } from "@/components/chat/bubble";
import { MarkdownContent } from "@/components/chat/markdown-content";
import { renderToolPart } from "@/components/chat/tool-call-chip";

type ChatMessageProps = {
  message: UIMessage;
  isStreaming?: boolean;
  showTypingIndicator?: boolean;
};

function getTextContent(parts: UIMessage["parts"]): string {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function ChatMessageRow({
  message,
  isStreaming = false,
  showTypingIndicator = false,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const text = getTextContent(message.parts);
  const toolParts = message.parts.filter(
    (part) => part.type.startsWith("tool-") || part.type === "dynamic-tool",
  );

  return (
    <MessageGroup>
      <Message align={isUser ? "end" : "start"}>
        <MessageContent>
          {toolParts.map((part) => renderToolPart(part))}
          {text ? (
            <Bubble variant={isUser ? "user" : "assistant"}>
              {isUser ? (
                <p className="whitespace-pre-wrap">{text}</p>
              ) : (
                <MarkdownContent content={text} />
              )}
            </Bubble>
          ) : null}
          {showTypingIndicator ? (
            <MessageFooter>
              <span className="inline-flex items-center gap-2 text-zinc-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking…
              </span>
            </MessageFooter>
          ) : null}
          {isStreaming && text ? (
            <span
              className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-cyan-400"
              aria-hidden="true"
            />
          ) : null}
        </MessageContent>
      </Message>
    </MessageGroup>
  );
}