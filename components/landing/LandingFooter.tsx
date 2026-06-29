import Link from "next/link";

const LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#briefing", label: "Briefing" },
  { href: "#features", label: "Features" },
  { href: "/demo", label: "Demo" },
  { href: "/sign-up", label: "Sign up" },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-[color:var(--lp-line)] px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="fr-heading text-lg font-semibold tracking-tight">
            <span className="text-[color:var(--lp-text)]">Fin</span>
            <span className="text-[color:var(--lp-cyan)]">Rel</span>
          </Link>
          <span className="lp-mono text-[10px] tracking-wider text-[color:var(--lp-faint)] uppercase">
            <span className="text-[color:var(--lp-cyan)]">●</span> operational
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="lp-mono text-xs text-[color:var(--lp-muted)] transition-colors hover:text-[color:var(--lp-text)]"
            >
              {label}
            </Link>
          ))}
        </nav>

        <p className="lp-mono text-[11px] text-[color:var(--lp-faint)]">
          © {new Date().getFullYear()} Finerel
        </p>
      </div>
    </footer>
  );
}
