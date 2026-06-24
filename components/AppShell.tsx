"use client";

import { SignUpButton } from "@clerk/nextjs";
import { useState } from "react";

import { AppNavbar } from "@/components/AppNavbar";
import { AppSidebar } from "@/components/AppSidebar";

type AppShellProps = {
  children: React.ReactNode;
  isDemo?: boolean;
};

export function AppShell({ children, isDemo = false }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="fr-page flex min-h-full">
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isDemo={isDemo}
      />

      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation overlay"
        />
      ) : null}

      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <AppNavbar onMenuClick={() => setSidebarOpen(true)} isDemo={isDemo} />
        {isDemo ? (
          <div className="border-b border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-center text-sm text-cyan-300">
            You&apos;re viewing the demo dashboard (read-only).{" "}
            <SignUpButton mode="redirect" forceRedirectUrl="/overview">
              <button
                type="button"
                className="font-medium underline underline-offset-2 hover:text-cyan-100"
              >
                Sign up
              </button>
            </SignUpButton>{" "}
            to create your own.
          </div>
        ) : null}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}