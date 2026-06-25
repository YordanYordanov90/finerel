# UI Context

## Brand

Product name: **FinRel**. Logo wordmark: `Fin` + accent `Rel` (cyan-400/500).
Design language shared with PineForge: zinc surfaces + cyan `#06B6D4` accent.

## Theme

**Dark only.** No light mode for MVP. The visual language is a calm, data-dense
financial intelligence workspace — the same zinc terminal aesthetic as PineForge,
applied to a research and relationship graph context. Near-black zinc backgrounds,
layered surfaces, and cyan `#06B6D4` as the single primary accent.

Every visual decision reinforces the product's core promise: signal over noise.
Not loud, not noisy — a tool that feels like a trusted research terminal.

## Colors

All components use Tailwind classes mapped to PineForge's zinc + cyan system.
**No hardcoded hex values in components.**
**Cyan (`#06B6D4`) is the single primary accent.** Do not introduce purple
or green as primary accents — use the relationship edge palette only for graph edges.


| Role             | Tailwind Class                                               | Usage                                      |
| ---------------- | ------------------------------------------------------------ | ------------------------------------------ |
| Page background  | `pf-page` gradient `#0a0a0a → #151515` + cyan radial glow    | Root page base                             |
| Card surface     | `bg-[#111111]`                                               | Standard cards, sidebar, panels            |
| Card elevated    | `bg-[#111111]/80` + `backdrop-blur`                          | Modals, dropdowns, floating panels         |
| Border           | `border-zinc-800` / `#27272a`                                | All card and input borders                 |
| Accent           | `bg-cyan-500` (`#06B6D4`)                                    | Primary CTA buttons, active nav indicators |
| Accent hover     | `hover:bg-cyan-500/10`                                       | Outlined button hover state                |
| Accent text      | `text-cyan-300` / `text-cyan-400`                            | Accent labels, links, active states        |
| Focus ring       | `focus-visible:ring-cyan-500/30`                             | All inputs and buttons                     |
| Body text        | `text-zinc-100`                                              | Primary readable text                      |
| Muted text       | `text-zinc-400`                                              | Labels, hints, metadata, secondary info    |
| Subtle text      | `text-zinc-600`                                              | Placeholder, disabled states               |
| Code / mono text | `text-cyan-300/95` + `font-mono`                             | Ticker symbols, confidence scores, IDs     |
| Code background  | `bg-black/55`                                                | Ticker pill background, data containers    |
| Error background | `bg-rose-500/10`                                             | Error state card background                |
| Error border     | `border-rose-500/30`                                         | Error state card border                    |
| Error text       | `text-rose-200`                                              | Error message text                         |
| Warning / info   | `text-amber-400` + `border-amber-500/30` + `bg-amber-500/10` | Medium confidence, caution states          |


### Semantic State Colors

Use only when state semantics genuinely apply — not as generic palette variety.


| State                     | Tokens                                                       | FinRel usage                      |
| ------------------------- | ------------------------------------------------------------ | --------------------------------- |
| Positive / success / high | `text-cyan-400` + `border-cyan-500/40` + `bg-cyan-500/10`    | High confidence (≥ 0.8), verified |
| Warning / medium / info   | `text-amber-400` + `border-amber-500/30` + `bg-amber-500/10` | Medium confidence (0.5–0.79)      |
| Negative / error / low    | `text-rose-400` + `border-rose-500/40` + `bg-rose-500/10`    | Low confidence (< 0.5), errors    |


### Relationship Edge Colors (React Flow only)

These colors are used exclusively for graph edges — not as UI accent colors.


| Relationship type       | Tailwind approx | Hex       |
| ----------------------- | --------------- | --------- |
| `partnership`           | cyan-500        | `#06B6D4` |
| `supply_chain`          | violet-400      | `#a78bfa` |
| `investment`            | emerald-400     | `#34d399` |
| `executive_mention`     | amber-400       | `#fbbf24` |
| `product_collaboration` | pink-400        | `#f472b6` |


Partnership edges use the cyan accent — it's the most significant relationship
type and the most likely to appear on a user's watchlist.

### Muted Metadata Badge

Used for non-critical metadata (ticker pills, relation type labels, impact level,
date stamps). Do **not** color-code by value here — semantic state tokens handle
that in confidence displays and health states.

```
inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]
font-medium uppercase tracking-wider
dark: border-zinc-700 bg-zinc-900/60 text-zinc-400
```

Ticker symbols specifically:

```
font-mono text-cyan-300/95 bg-black/55 border border-zinc-800
rounded-md px-1.5 py-0.5 text-xs
```

## Typography


| Role             | Font       | Variable / Class        | Notes                                        |
| ---------------- | ---------- | ----------------------- | -------------------------------------------- |
| Body / UI        | Inter      | `font-sans`             | All body text, labels, navigation            |
| Headings / brand | Syne       | `font-heading`          | Page titles, section headings, logo wordmark |
| All mono / data  | Geist Mono | `font-mono`             | Tickers, confidence scores, IDs, timestamps  |
| Landing hero     | Syne       | `text-3xl` → `text-6xl` | Responsive hero headline                     |
| Card titles      | —          | `text-xl font-semibold` |                                              |
| Labels           | —          | `text-sm text-zinc-400` |                                              |
| Helper text      | —          | `text-xs text-zinc-400` |                                              |


Ticker symbols (`NVDA`, `TSMC`, `AAPL`) are always rendered in `font-mono`
with the ticker pill pattern above — they are data, not prose.

## Border Radius

Matches PineForge exactly for visual consistency across the portfolio.


| Context                  | Class                          |
| ------------------------ | ------------------------------ |
| Pills / badges / tickers | `rounded-full` or `rounded-md` |
| Inputs / buttons         | `rounded-md`                   |
| Cards / panels           | `rounded-xl`                   |
| Modals / drawers         | `rounded-xl`                   |


## Component Library

shadcn/ui on top of Tailwind CSS v4. Components live in `components/ui/`.
Use the CLI to add new components — never hand-edit generated files.

```
npx shadcn@latest add <component>
```

shadcn Sheet is used for the node detail drawer (slides in from right on graph
node click).

## Shell Utilities (`globals.css`)

Define these utilities to match PineForge's `.pf-*` pattern — consistent naming
makes the codebase readable and avoids re-implementing dark/light variants per component.


| Utility         | Purpose                                              |
| --------------- | ---------------------------------------------------- |
| `.fr-page`      | Root page background (`#0a0a0a`) + cyan radial glow  |
| `.fr-nav`       | Sticky navbar background + backdrop-blur             |
| `.fr-nav-muted` | Muted nav link / inactive pill                       |
| `.fr-card`      | Standard card surface + zinc-800 border              |
| `.fr-badge`     | Muted metadata badge (ticker, relation type, impact) |
| `.fr-heading`   | Heading typography (Syne)                            |
| `.fr-cta-btn`   | Primary cyan-accent CTA button                       |


## Layout Patterns

- **Dashboard shell**: Fixed left sidebar (240px), `border-zinc-800` separator, main content fills remaining width. Top navbar sticky with `bg-zinc-950/80 backdrop-blur-md` and bottom border.
- **Overview page**: 2-column grid — relationship feed on left (wider), today's briefing summary card on right. Collapses to single column on mobile.
- **Relationship graph**: Full-width React Flow canvas with floating controls. Node detail drawer (shadcn Sheet) slides in from right on node click — does not navigate away.
- **Briefing history**: Data table with filters bar at top (relation type, confidence threshold, date range, ticker). Load-more pattern — no pagination modals.
- **Settings page**: Single column, grouped sections with `text-zinc-400` headings. Shows briefing time display (read-only) and email address (read-only, from Clerk). No Telegram section in MVP.
- **Landing page**: Full-viewport hero, minimal sections — value proposition, 3-step how it works, demo CTA, signup. Max width `max-w-7xl mx-auto px-6`. Use `overflow-x-clip` (not `overflow-x-hidden`) on page shell.
- **News feed page**: Single-column list of article cards. Each card: headline (clickable link → external), 2-line clamped summary, source name, relative timestamp (`3h ago`), ticker pills. "Up to date / Checking…" status + manual Refresh button (hidden in demo mode). Background Finnhub refresh fires on mount; stored news shows instantly.
- **Ticker autocomplete**: Dropdown beneath the ticker input. Appears on first keystroke, lists up to 8 matches ranked exact → prefix → name. Keyboard-navigable (↑↓ arrows, Enter to select, Escape to dismiss). Click also selects. ARIA `combobox`/`listbox`/`option` roles for accessibility. Suggestion rows: ticker symbol in `font-mono text-cyan-300/95` (fixed 56px width), company name in `text-zinc-400`.
- **Demo banner**: Sticky top banner on demo dashboard — cyan-accented, read-only notice with signup CTA. Never dismissible in demo mode.
- **Navbar**: Landing wraps ticker + navbar inside a single `sticky top-0 z-50` container. Background `bg-zinc-950/80 backdrop-blur-md`.

## Relationship Graph Specifics (React Flow)

- **Company nodes**: Rounded rectangle (`rounded-xl`), `bg-[#111111]` surface, `border-zinc-800`. Company name in `font-sans text-zinc-100`, ticker symbol in `font-mono text-cyan-300/95` below.
- **Watchlist nodes**: Larger size + `border-cyan-500/50` border to distinguish from discovered/peripheral companies.
- **Edges**: Colored by relation type (see edge color table above). Label shown on hover only to avoid clutter.
- **Edge thickness**: Scales with `confidence` score — thicker = higher confidence.
- **Layout**: Force-directed (`dagre` or `elk`) for initial positioning.

## Icons

Lucide React. Stroke-based only. Matches PineForge.


| Context          | Size class |
| ---------------- | ---------- |
| Inline / labels  | `h-4 w-4`  |
| Buttons          | `h-4 w-4`  |
| Navigation items | `h-5 w-5`  |
| Empty states     | `h-8 w-8`  |


## Confidence Score Display

Confidence (0–1 float) always displayed as percentage + label using semantic state tokens.


| Score    | Token                   | Label    |
| -------- | ----------------------- | -------- |
| ≥ 0.8    | `text-cyan-400`         | "High"   |
| 0.5–0.79 | `text-amber-400`        | "Medium" |
| < 0.5    | `text-rose-400`         | "Low"    |


Always show both the percentage and the label. Never show raw decimal values to users.