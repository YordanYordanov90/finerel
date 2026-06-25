# Feature 20 — Ticker Autocomplete

## Status: ✅ Done (June 25, 2026)

## Summary

Autocomplete dropdown on the watchlist Add Ticker input. As the user types, up to 8 matching tickers are suggested from a static bundled list of ~250 major US stocks, preventing invalid symbols from being added.

## Files

- `lib/data/tickers.ts` — `TickerEntry[]` (symbol + company name). `searchTickers(query, limit)` ranks results: exact symbol match → symbol prefix match → company name substring match. `isKnownTicker(symbol)` predicate.
- `components/watchlist/AddTickerInput.tsx` — Client component with combobox pattern. Dropdown appears on first keystroke, dismisses on Escape/click-outside/select. Keyboard navigation: ↑↓ arrows move highlight, Enter selects, Escape closes.
- `lib/schemas/watchlist.ts` — Ticker regex updated from `^[A-Za-z]+$` to `^[A-Za-z.]+$` to allow dotted tickers like `BRK.B`.

## Behaviour

- Suggestions ranked: exact match → prefix → name substring.
- `onMouseDown` (not `onClick`) on suggestion items prevents blur-then-dismiss race condition.
- `onFocus` re-opens suggestions if value already has matches.
- ARIA: input has `role="combobox"`, list has `role="listbox"`, items have `role="option"` with `aria-selected`.
- Max 5 characters enforced by both the input `maxLength` and the `TICKER_PATTERN` guard — still supports `BRK.B` (5 chars including the dot).
