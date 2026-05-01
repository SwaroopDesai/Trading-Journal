# FXEDGE Codex Prompts

This folder contains ready-to-paste prompts for Codex / Claude Code.

**How to use:**
1. Open Codex in your VS Code
2. Open the prompt file you want
3. Copy entire content
4. Paste into Codex
5. Let it work

**Always start every Codex session with:**
```
Read AGENTS.md first. Then proceed with the task below.
```

---

## Available Prompts

### 🧹 Cleanup (do these first)
- `01-cleanup-dead-code.md` — remove unused files
- `02-fix-encoding-mojibake.md` — fix garbage characters
- `03-update-readme.md` — replace default Next.js README
- `04-verify-supabase-rls.md` — check database security

### 🎨 Polish
- `05-styling-direction.md` — pick Tailwind or inline, commit
- `06-finish-shadcn-migration.md` — full migration plan
- `07-encoding-utf8-sweep.md` — full UTF-8 sweep

### 🚀 New Features (high priority)
- `08-confluence-tracking.md` — biggest competitive gap
- `09-hour-heatmap.md` — upgrade heatmap with hour grid
- `10-breakeven-win-rate.md` — quick win
- `11-pre-trade-checklist-widget.md` — compact non-blocking version

### 🛡️ Quality
- `12-smoke-test-checklist.md` — manual test plan
- `13-typescript-migration.md` — long-term migration

### 💰 Monetization (when ready)
- `14-stripe-integration.md` — paid tier
- `15-csv-import.md` — MT4/MT5 import

---

## Recommended Order

**Week 1 (cleanup):**
1. 01-cleanup-dead-code.md
2. 02-fix-encoding-mojibake.md
3. 04-verify-supabase-rls.md
4. 03-update-readme.md
5. 05-styling-direction.md

**Week 2 (features):**
6. 08-confluence-tracking.md
7. 09-hour-heatmap.md
8. 10-breakeven-win-rate.md
9. 11-pre-trade-checklist-widget.md

**Week 3 (quality):**
10. 12-smoke-test-checklist.md
11. 06-finish-shadcn-migration.md

**When ready to monetize:**
12. 14-stripe-integration.md
