# Feature 21 — Settings PATCH + Interactive Time Picker

## Status: ✅ Done (June 25, 2026)

## Summary

Completes the settings page: adds a `PATCH /api/settings` endpoint to update `briefingTime`, and converts `BriefingTimeSection` from a static read-only display into an interactive hourly time picker.

## Files

- `app/api/settings/route.ts` — Added `PATCH` handler. Validates `{ briefingTime: string }` body with `HH:MM` regex + range check. Updates `users.briefingTime` and `users.updatedAt` for the authenticated user. Returns `{ data: { briefingTime } }`.
- `components/settings/BriefingTimeSection.tsx` — Now a `"use client"` component. Renders a native `<select>` with hourly options 06:00–22:00 EEST. Save button appears only when the value differs from the stored value (`isDirty`). Disabled for `readOnly` (demo) users. Calls `PATCH /api/settings` and shows a toast on success/failure.
- `app/(app)/settings/page.tsx` — Passes `readOnly` prop to `BriefingTimeSection`.

## Constraints

- Only whole-hour values are offered in the dropdown (06:00, 07:00, … 22:00). This aligns with the QStash cron firing on `:00` — sub-hour values would never be matched.
- Demo users see the dropdown but no Save button (read-only enforcement is both UI and server-side).
