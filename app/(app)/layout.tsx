import { AppShell } from "@/components/AppShell";
import { AskChatProvider } from "@/components/chat/ask-panel";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AskChatProvider>
      <AppShell>{children}</AppShell>
    </AskChatProvider>
  );
}
