import Link from "next/link";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#briefing", label: "Briefing" },
  { href: "#features", label: "Features" },
] as const;

export function LandingNavbar() {
  return (
    <div className="sticky top-0 z-50 border-b border-[color:var(--lp-line)] bg-[color:var(--lp-ink)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-1.5">
        <p className="lp-mono text-[10px] tracking-[0.18em] text-[color:var(--lp-faint)] uppercase">
          <span className="text-[color:var(--lp-cyan)]">●</span> briefing engine
          · next run 09:00 EEST
        </p>
      </div>

      <div className="border-t border-[color:var(--lp-line)]/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-6">
          <Link
            href="/"
            className="fr-heading shrink-0 text-xl font-semibold tracking-tight"
          >
            <span className="text-[color:var(--lp-text)]">Fin</span>
            <span className="text-[color:var(--lp-cyan)]">Rel</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="lp-mono text-xs tracking-wide text-[color:var(--lp-muted)] uppercase transition-colors hover:text-[color:var(--lp-text)]"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/demo"
              className="hidden text-sm font-medium text-[color:var(--lp-muted)] transition-colors hover:text-[color:var(--lp-text)] sm:inline-flex"
            >
              Demo
            </Link>
            <Link href="/sign-up" className="fr-cta-btn shrink-0 px-4 py-2 text-sm">
              Get started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
