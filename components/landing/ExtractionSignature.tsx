"use client";

import { useEffect, useRef, useState } from "react";

type Extraction = {
  source: string;
  outlet: string;
  time: string;
  from: { name: string; ticker: string };
  to: { name: string; ticker: string };
  type: string;
  typeLabel: string;
  confidence: number;
  impact: "high" | "medium" | "low";
};

const EXTRACTIONS: Extraction[] = [
  {
    source:
      "TSMC confirmed expanded wafer capacity for NVIDIA's Blackwell production through 2026.",
    outlet: "Reuters",
    time: "06:14",
    from: { name: "NVIDIA", ticker: "NVDA" },
    to: { name: "TSMC", ticker: "TSM" },
    type: "supply_chain",
    typeLabel: "Supply chain",
    confidence: 82,
    impact: "high",
  },
  {
    source:
      "Microsoft extended its multiyear partnership and investment in OpenAI's frontier models.",
    outlet: "Bloomberg",
    time: "05:02",
    from: { name: "Microsoft", ticker: "MSFT" },
    to: { name: "OpenAI", ticker: "—" },
    type: "investment",
    typeLabel: "Investment",
    confidence: 76,
    impact: "high",
  },
  {
    source:
      "Apple and Google renewed their long-running search distribution agreement.",
    outlet: "WSJ",
    time: "07:38",
    from: { name: "Apple", ticker: "AAPL" },
    to: { name: "Alphabet", ticker: "GOOGL" },
    type: "partnership",
    typeLabel: "Partnership",
    confidence: 64,
    impact: "medium",
  },
];

const CYCLE_MS = 5200;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

function Node({
  company,
  align,
}: {
  company: { name: string; ticker: string };
  align: "left" | "right";
}) {
  return (
    <div
      className={`lp-panel flex flex-col gap-1.5 px-3 py-2.5 ${
        align === "right" ? "items-end text-right" : "items-start"
      }`}
      style={{ minWidth: "108px" }}
    >
      <span className="fr-heading text-sm font-semibold text-[color:var(--lp-text)]">
        {company.name}
      </span>
      <span className="lp-ticker">{company.ticker}</span>
    </div>
  );
}

export function ExtractionSignature() {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState(0);
  const frameRef = useRef<number | null>(null);

  const current = EXTRACTIONS[index];

  useEffect(() => {
    if (reduced) {
      return;
    }

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % EXTRACTIONS.length);
    }, CYCLE_MS);

    return () => clearInterval(interval);
  }, [reduced]);

  useEffect(() => {
    const target = current.confidence;

    if (reduced) {
      setDisplayed(target);
      return;
    }

    setDisplayed(0);
    const startDelay = 650;
    const duration = 750;
    let start: number | null = null;

    const timeout = setTimeout(() => {
      const step = (timestamp: number) => {
        if (start === null) {
          start = timestamp;
        }
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayed(Math.round(target * eased));

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(step);
        }
      };
      frameRef.current = requestAnimationFrame(step);
    }, startDelay);

    return () => {
      clearTimeout(timeout);
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [index, current.confidence, reduced]);

  const meterFilled = Math.round((displayed / 100) * 12);

  return (
    <div className="lp-panel relative overflow-hidden p-5">
      <div className="flex items-center justify-between border-b border-[color:var(--lp-line)] pb-3">
        <span className="lp-eyebrow">Live extraction</span>
        <span className="lp-mono text-[11px] text-[color:var(--lp-faint)]">
          agent · 09:00 run
        </span>
      </div>

      <div key={index} className="pt-4">
        <div className="lp-anim-rise lp-delay-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="lp-mono text-[10px] tracking-wider text-[color:var(--lp-cyan)] uppercase">
              {current.outlet}
            </span>
            <span className="lp-mono text-[10px] text-[color:var(--lp-faint)]">
              {current.time}
            </span>
          </div>
          <p className="lp-mono text-[12.5px] leading-relaxed text-[color:var(--lp-muted)]">
            &ldquo;{current.source}&rdquo;
          </p>
        </div>

        <div className="my-4 flex items-center gap-2">
          <span className="h-px flex-1 bg-[color:var(--lp-line)]" />
          <span className="lp-mono text-[10px] tracking-wider text-[color:var(--lp-faint)] uppercase">
            extract
          </span>
          <span className="h-px flex-1 bg-[color:var(--lp-line)]" />
        </div>

        <div className="relative flex items-center justify-between gap-3">
          <div className="lp-anim-rise lp-delay-2">
            <Node company={current.from} align="left" />
          </div>

          <svg
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            width="120"
            height="40"
            viewBox="0 0 120 40"
            fill="none"
            aria-hidden="true"
          >
            <line
              className="lp-anim-draw"
              x1="4"
              y1="20"
              x2="104"
              y2="20"
              stroke="var(--lp-cyan-deep)"
              strokeWidth="1.5"
              style={{ ["--lp-dash" as string]: "110" }}
            />
            <line
              className="lp-anim-flow"
              x1="4"
              y1="20"
              x2="104"
              y2="20"
              stroke="var(--lp-cyan)"
              strokeWidth="1.5"
              opacity="0.9"
            />
            <path
              className="lp-anim-rise lp-delay-3"
              d="M104 20 L96 16 L96 24 Z"
              fill="var(--lp-cyan)"
            />
          </svg>

          <div className="lp-anim-rise lp-delay-2">
            <Node company={current.to} align="right" />
          </div>
        </div>

        <div className="lp-anim-rise lp-delay-4 mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className={`lp-edge-chip lp-edge--${current.type}`}>
            {current.typeLabel}
          </span>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-[2px]" aria-hidden="true">
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="h-3 w-[3px] rounded-full"
                  style={{
                    backgroundColor:
                      i < meterFilled
                        ? "var(--lp-cyan)"
                        : "var(--lp-line-bright)",
                  }}
                />
              ))}
            </div>
            <span className="lp-mono text-sm font-medium text-[color:var(--lp-text)]">
              {displayed}%
            </span>
            {current.impact === "high" ? (
              <span
                className="lp-mono ml-1 flex items-center gap-1 text-[10px] tracking-wider uppercase"
                style={{ color: "var(--lp-amber)" }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "var(--lp-amber)" }}
                />
                High impact
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[color:var(--lp-line)] pt-3">
        <span className="lp-mono text-[10px] tracking-wider text-[color:var(--lp-faint)] uppercase">
          5 relationship types · confidence-scored
        </span>
        <div className="flex gap-1.5">
          {EXTRACTIONS.map((item, i) => (
            <span
              key={item.from.ticker}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === index ? "16px" : "6px",
                backgroundColor:
                  i === index ? "var(--lp-cyan)" : "var(--lp-line-bright)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
