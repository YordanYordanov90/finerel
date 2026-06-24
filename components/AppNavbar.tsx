"use client";

import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/overview": "Overview",
  "/graph": "Graph",
  "/history": "History",
  "/watchlist": "Watchlist",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  const normalized = pathname.replace(/^\/demo/, "");

  if (PAGE_TITLES[normalized]) {
    return PAGE_TITLES[normalized];
  }

  const match = Object.keys(PAGE_TITLES)
    .sort((a, b) => b.length - a.length)
    .find((path) => normalized.startsWith(`${path}/`));

  return match ? PAGE_TITLES[match] : "Dashboard";
}

type AppNavbarProps = {
  onMenuClick: () => void;
  isDemo?: boolean;
};

export function AppNavbar({ onMenuClick, isDemo = false }: AppNavbarProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="fr-nav flex h-14 items-center justify-between gap-4 px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md p-1.5 text-zinc-400 transition-colors hover:text-zinc-100 md:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="fr-heading text-lg font-semibold text-zinc-100">
          {pageTitle}
        </h1>
      </div>

      {isDemo ? (
        <div className="flex items-center gap-2">
          <SignInButton mode="redirect" forceRedirectUrl="/overview">
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:text-zinc-100"
            >
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="redirect" forceRedirectUrl="/overview">
            <button
              type="button"
              className="rounded-md bg-cyan-500 px-3 py-1.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-cyan-400"
            >
              Sign up
            </button>
          </SignUpButton>
        </div>
      ) : (
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      )}
    </header>
  );
}