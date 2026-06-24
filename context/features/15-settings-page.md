# 15 — Settings Page

**Depends on:** `08-api-routes-settings.md`, `10-app-shell.md`

---

## Purpose

User settings page — displays email address and briefing time. Read-only in MVP.

---

## Files to Create

| Path | Purpose |
|---|---|
| `app/(app)/settings/page.tsx` | Settings page |
| `components/settings/BriefingTimeSection.tsx` | Briefing time display (read-only) |

---

## Requirements

### Layout (from ui-context.md)

- ui-context.md: "Settings page: Single column, grouped sections with text-zinc-400
  headings. Shows briefing time display (read-only) and email address (read-only,
  from Clerk). No Telegram section in MVP."

### Email Address Section

- Displays the user's email address (read-only, sourced from Clerk).
- Not editable — managed via Clerk account settings.

### Briefing Time Section

- Displays the current briefing time: `09:00 EEST`.
- Read-only in MVP — not user-configurable (project-overview.md: "briefing
  time preference").
- Note: "Briefing time is fixed at 09:00 EEST during the beta."
  (Architecture.md data flow: "QStash (09:00 EEST cron)".)

### Demo Mode

- Architecture.md invariant 6: demo user cannot mutate settings.
- Show note: "Demo account — settings are read-only."

---

## Acceptance Criteria

1. Settings page loads with email address and `briefingTime` displayed.
2. Email address is read-only, sourced from Clerk.
3. Briefing time section is read-only with correct time displayed.
4. Demo user sees read-only state with explanation text.

---

**Before closing this session:** Update `progress-tracker.md` — move settings page to Completed.
