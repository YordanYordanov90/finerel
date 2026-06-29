"use client";

import {
  Clock3,
  LayoutDashboard,
  List,
  Network,
  Newspaper,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/graph", label: "Graph", icon: Network },
  { href: "/history", label: "History", icon: Clock3 },
  { href: "/watchlist", label: "Watchlist", icon: List },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function isActiveRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AppSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  isDemo?: boolean;
};

export function AppSidebar({ isOpen, onClose, isDemo = false }: AppSidebarProps) {
  const pathname = usePathname();
  const prefix = isDemo ? "/demo" : "";

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col border-r border-zinc-800 bg-[#111111]",
        "transition-transform duration-200 ease-out md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}
    >
      <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-5">
        <Link
          href={`${prefix}/overview`}
          className="fr-heading text-xl font-semibold tracking-tight"
          onClick={onClose}
        >
          <span className="text-zinc-100">Fine</span>
          <span className="text-cyan-400">rel</span>
        </Link>
        <button
          type="button"
          className="rounded-md p-1 text-zinc-400 transition-colors hover:text-zinc-100 md:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.filter(({ href }) => !isDemo || href !== "/settings").map(({ href, label, icon: Icon }) => {
          const fullHref = `${prefix}${href}`;
          const active = isActiveRoute(pathname, fullHref);

          return (
            <Link
              key={href}
              href={fullHref}
              onClick={onClose}
              className={[
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "fr-nav-muted hover:bg-zinc-900/60",
              ].join(" ")}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}