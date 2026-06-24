import { AppShell } from "@/components/AppShell";

export default function DemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell isDemo>{children}</AppShell>;
}
