# Feature 22 — HTML Briefing Email

## Status: ✅ Done (June 25, 2026)

## Summary

Replaces the plain-text morning briefing email with a branded HTML template that lists extracted relationships as structured cards, matching the FinRel dark/cyan visual language.

## Files

- `lib/agent/tools/briefing-email-template.ts` — Two exports:
  - `buildBriefingHtml(summary, relationships)` — Inline-style HTML email (email-client safe). Header: FinRel wordmark (`Fin` zinc + `Rel` cyan), "Morning Briefing", formatted date. Body: AI summary paragraph. Relationships section: one card per relationship with source → target company names, ticker symbols in `font-mono` cyan, relation-type badge, color-coded impact (red/amber/zinc), confidence %, context snippet, "Read source →" link. Footer: tagline + separator.
  - `buildBriefingText(summary, relationships)` — Plain-text fallback for email clients that don't render HTML.
- `lib/agent/tools/send-briefing-email.ts` — Signature changed from `(userId, summary)` to `(output: ExtractionOutput)` to give the template access to the full relationships array. Sends both `html` and `text` fields to Resend.
- `lib/agent/process-user-briefing.ts` — Updated call site: `sendBriefingEmail(output)` instead of `sendBriefingEmail(userId, output.summary)`.

## Email Structure

```
[FinRel wordmark]   Morning Briefing   [Date]
──────────────────────────────────────────────
[AI summary paragraph]

RELATIONSHIPS FOUND (N)

┌─────────────────────────────────────────┐
│ NVIDIA NVDA → Taiwan Semiconductor TSM  │
│ Supply chain · high impact · 92%        │
│ NVIDIA confirmed it has expanded…       │
│ Read source →                           │
└─────────────────────────────────────────┘
… (one card per relationship)

──────────────────────────────────────────────
FinRel — your watchlist relationship intelligence
```

## Notes

- All values are HTML-escaped via `escapeHtml()` before insertion — no XSS risk from LLM output or news content.
- Inline styles only — no external CSS, no `<style>` blocks — for maximum email client compatibility.
- Sender configured via `RESEND_FROM_EMAIL` env var (default: `briefing@finrel.dev`). Requires a verified domain in Resend for delivery to users other than the Resend account owner.
