# Prompt: Add Smoke Test Checklist

Read `AGENTS.md` first.

## Task
Create a manual smoke test checklist that you run before every deploy to catch breaking changes.

## Why this matters
You don't have automated tests. Without a checklist you'll deploy bugs to production. 5-minute manual test prevents 5-day debugging sessions.

## Step 1: Create SMOKE_TEST.md

Create `SMOKE_TEST.md` in repo root:

```markdown
# FXEDGE Smoke Test Checklist

> Run this before every deploy. Takes ~5 minutes.

## How to run
1. Build locally: `npm run build`
2. Run prod build: `npm start`
3. Open `http://localhost:3000`
4. Use a test account (not your main one)
5. Tick each box as you verify

---

## Auth
- [ ] Magic link signup → email arrives → click link → logged in
- [ ] Logout works
- [ ] Re-login works
- [ ] Refresh page while logged in → stays logged in

## Trade Logging
- [ ] Open Log Trade modal (button or `n` shortcut)
- [ ] Fill all fields including pair, direction, RR
- [ ] Paste/upload a screenshot for pre-trade
- [ ] Paste/upload a screenshot for post-trade
- [ ] Save → trade appears in Journal
- [ ] Edit the trade → all values load correctly
- [ ] Delete the trade → confirmation prompt → removed from Journal
- [ ] Delete also removes screenshots from Storage

## Daily Plan
- [ ] Open Daily tab → New Daily Plan
- [ ] Select pairs in focus
- [ ] Set bias for each
- [ ] Add screenshot
- [ ] Save → appears in Daily list
- [ ] Edit → loads correctly
- [ ] Delete → removed

## Weekly Plan
- [ ] Open Weekly tab → New Weekly Plan
- [ ] Set week dates, pair biases
- [ ] Add notes and screenshots
- [ ] Save → appears in list
- [ ] Edit → loads
- [ ] Delete → removed

## Analytics & Heatmap
- [ ] Dashboard shows accurate KPIs (Total R, Win Rate, Avg RR)
- [ ] Equity curve renders correctly
- [ ] Heatmap calendar shows colored days
- [ ] Click a colored day → drilldown shows correct trades
- [ ] Day of Week view shows bars
- [ ] Session Grid shows data
- [ ] Drawdown view renders

## Other Tabs
- [ ] Psychology / Mind tab loads, shows emotion data
- [ ] Playbook tab loads
- [ ] Calculator works (input numbers, see calculation)
- [ ] Gallery shows screenshots, lightbox opens
- [ ] AI Analysis runs and returns coaching text
- [ ] Export downloads CSV

## Themes
- [ ] Switch to PAPER (light) → all text readable, no broken contrast
- [ ] Switch to BRUTALIST → renders correctly
- [ ] Switch back to VOID → renders correctly
- [ ] Theme persists after refresh

## Mobile (Chrome DevTools → iPhone)
- [ ] Bottom nav shows 5 tabs
- [ ] More menu opens with full grid
- [ ] Modals fit screen
- [ ] No horizontal scroll
- [ ] Buttons are tappable (44px min)
- [ ] Topbar compresses correctly

## Keyboard Shortcuts
- [ ] `n` opens new trade modal
- [ ] `j` navigates to Journal
- [ ] `d` navigates to Daily
- [ ] `w` navigates to Weekly
- [ ] `a` navigates to Analytics
- [ ] `h` navigates to Heatmap
- [ ] `Esc` closes modal

## Performance
- [ ] Dashboard loads in under 2 seconds
- [ ] No console errors in DevTools
- [ ] No console warnings (other than expected)

## Production Deploy Verification (after push)
- [ ] Vercel deploy succeeds
- [ ] Live site loads
- [ ] Login works on live
- [ ] One trade can be logged on live

---

## If any box fails
1. **Don't deploy.**
2. Open issue or fix immediately.
3. Re-run the entire checklist after fix.

## Common breakages
- Encoding mojibake reappears
- Theme tokens missing for new components
- Supabase RLS blocks valid queries
- Image upload fails silently
- New API route doesn't have proper headers
```

## Step 2: Add to AGENTS.md

In the workflow section of `AGENTS.md`, add:

```markdown
### Before deploy
Run `SMOKE_TEST.md` checklist. Don't deploy if anything fails.
```

## Step 3: Add to package.json scripts (optional)

```json
{
  "scripts": {
    "smoke": "echo '📋 Open SMOKE_TEST.md and run through it manually before deploying'"
  }
}
```

## Verification
- File exists in repo root
- It's referenced from AGENTS.md
- You actually run through it once to validate the steps work

## Commit message
```
docs: add SMOKE_TEST.md - manual checklist before deploy
```
