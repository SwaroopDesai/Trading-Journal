# AGENTS.md

> **Purpose:** Source of truth for any AI agent (Claude, Codex, Cursor, Claude Code) working on this project.
> **Last updated:** 2026-05-01
> **App:** FXEDGE — trading journal for ICT/SMC forex traders
> **Live:** fxedge.online
> **Repo:** SwaroopDesai/Trading-Journal

---

## 🎯 What is FXEDGE

A premium trading journal web app built specifically for ICT/SMC forex traders. Logging trades, planning daily/weekly bias, tracking psychology, and getting AI coaching. Production app, real users, deployed on Vercel.

**Audience:** Forex traders using ICT (Inner Circle Trader) or SMC (Smart Money Concepts) methodology. They need fields like Kill Zone, manipulation type, POI, daily bias — things generic journals (Tradezella, Edgewonk) don't have.

**Owner:** Solo founder. Non-developer. Builds with AI agents (Claude Code, Codex). Trader first, builder second.

---

## ⚙️ Tech Stack

### Runtime
- **Next.js 16.2.1** (App Router)
- **React 19.2.4**
- **JavaScript only** (no TypeScript yet)
- **Vercel** for hosting + cron + analytics

### Backend
- **Supabase** — auth (magic link), Postgres, Storage, user metadata
- **Project ref:** `mrdtmaihghmkbilhqjgo`
- **Region:** `ap-south-1`
- **Storage bucket:** `journal-images` (public read, authenticated write)

### UI Stack
- **Tailwind CSS v4** + **shadcn/ui** (primary going forward)
- **FXEDGE custom primitives** in `src/components/ui.jsx` (legacy, being migrated)
- **Recharts** for all charts
- **Framer Motion** for animations
- **TanStack Table v8** for the Journal table
- **Sonner** for toasts
- **Lucide React** for icons
- **Geist** + **Geist Mono** fonts

### AI / Email
- **Gemini** (`gemini-2.5-flash-lite`) — primary AI
- **Groq** (Llama 4 Scout) — fallback for screenshot autofill
- **Brevo** — transactional email (weekly debrief)

---

## 🏗️ Architecture

### Folder structure
```
src/
├── app/
│   ├── layout.js              # Root layout, fonts, Toaster, Analytics
│   ├── globals.css             # Tailwind + base CSS + responsive helpers
│   ├── page.jsx                # Main app shell, auth, routing, state
│   ├── auth/callback/route.js  # PKCE auth callback
│   ├── dashboard/page.js       # Redirect to root
│   ├── login/page.js           # Redirect to root
│   └── api/
│       ├── analysis/route.js          # Manual AI analysis
│       ├── screenshot-autofill/...    # ⚠️ likely dead, remove if unused
│       ├── news/route.js              # Forex calendar with cache
│       └── weekly-debrief/route.js    # Sunday cron + Brevo email
├── components/
│   ├── tabs/                   # One file per tab (14 tabs)
│   ├── ui/                     # shadcn primitives
│   ├── ui.jsx                  # FXEDGE custom primitives (legacy)
│   ├── TradeModal.jsx
│   ├── MissedTradeModal.jsx
│   ├── EquityCurve.jsx
│   ├── DashboardCharts.jsx
│   ├── MonthlyReturns.jsx
│   ├── InsightCards.jsx
│   ├── DateRangeBar.jsx
│   ├── CommandPalette.jsx      # ⚠️ likely dead, remove if unused
│   ├── MoreMenu.jsx
│   ├── OnboardingFlow.jsx
│   └── LoginScreen.jsx
└── lib/
    ├── constants.js            # Theme tokens, PAIRS, SESSIONS, select strings
    ├── utils.js                # Formatting, image helpers, draft helpers
    └── supabase.js             # Browser Supabase client
```

### Tabs
Dashboard, Journal, Daily, Weekly, Heatmap, Analytics, Mind (Psychology), Playbook, Calculator, Gallery, Review, AI Analysis, Missed Trades, Pattern Detector, Economic Calendar, Export.

---

## 🗄️ Database Schema

### Tables

**`trades`** — Main trade log
```
id (uuid, PK)
user_id (uuid, FK)
created_at (timestamptz)
pair, date, direction, session, killzone (legacy)
dailyBias, weeklyBias (legacy), marketProfile
manipulation, poi, setup
entry, sl, tp (numeric, hidden in Journal cards)
result (WIN/LOSS/BREAKEVEN), rr, pips
emotion, mistakes, notes
tags (jsonb/text[])
preScreenshot, postScreenshot (text — public URLs)
```

**`daily_plans`** — Daily bias plans
```
id, user_id, created_at
date, pairs (jsonb), biases (jsonb)
weeklyTheme (used as day focus)
manipulation (session expectation)
watchlist (text — embeds pair notes via __FXEDGE_PAIR_NOTES__::)
chartImage (text — serialized list of screenshots)
```

**`weekly_plans`** — Weekly plans + reviews
```
id, user_id, created_at
weekStart, weekEnd
pairs (jsonb)
keyEvents, notes, review
premiumDiscount (jsonb — embeds screenshots & pair notes)
```

**`missed_trades`** — Missed opportunity log
```
id, user_id, created_at
date, pair, direction, setup, reason
rr (manual), outcome
notes (json-backed with screenshot metadata)
```

**`calendar_cache`** — Forex calendar cache
```
week_key (text PK), events (jsonb), fetched_at
```

**`waitlist`** — Landing page request access
```
id, email, created_at, status
```

### RLS Policies
All user-owned tables: `user_id = auth.uid()` for SELECT/INSERT/UPDATE/DELETE.
`waitlist`: anonymous insert allowed.
`calendar_cache`: server-side access via REST.
`storage.objects`: authenticated write to `journal-images`, public read.

### Storage paths
```
{userId}/trades/pre/...
{userId}/trades/post/...
{userId}/daily-plans/...
{userId}/weekly-plans/...
{userId}/missed-trades/...
```

---

## 🎨 Design System

### Themes (3)
- **VOID** (dark, default) — primary professional terminal feel
- **PAPER** (light) — clean light mode
- **BRUTALIST** — high-contrast, harder edges

Stored as `T` object passed through props. Persisted to localStorage `fx-theme` and Supabase user metadata.

### Theme tokens
```
T.bg, T.surface, T.surface2, T.border
T.text, T.textDim, T.muted
T.accent, T.accentBright
T.green, T.red, T.amber, T.pink
T.isDark (boolean)
```

### Fonts
- **Geist** — UI font (loaded in layout.js)
- **Geist Mono** — numbers, prices, monospace

### Animation patterns
- Modal slide/fade entrance (Framer Motion)
- Tab content fade transitions
- KPI counters animate on value change
- Card hover lift (subtle, y: -2)
- Reduced motion respected

### Mobile breakpoint
- Primary: `max-width: 768px`
- Bottom nav with 5 primary tabs + More menu
- Tabs stay mounted to preserve scroll position

---

## ⚠️ Critical Rules for AI Agents

### Styling direction (PICK ONE)
The codebase has inline styles + Tailwind + shadcn mixed. Going forward:
- **NEW components:** use Tailwind + shadcn
- **EXISTING inline-styled components:** leave alone unless explicitly migrating
- **NEVER** mix inline `style={{}}` with Tailwind classes in the same component
- Use `T` theme tokens for legacy components, Tailwind classes for new ones
- See `STYLING.md` for the full styling guide and migration rules.

### Database
- **Always** filter by `user_id = auth.uid()` in queries
- **Always** clean payloads with `clean()` helper before insert/update
- **Never** store base64 images in tables — use Supabase Storage
- **Never** add columns without checking RLS policies

### Component patterns
- Pass `T` (theme) through props, not context
- Use `_dbid` for internal row tracking (not `id`)
- Use `Overlay` component for all modals
- Use `Btn` component for primary actions

### File rules
- **Never** put more than 500 lines in `page.jsx` — split into components
- Tab components live in `src/components/tabs/`
- Shared primitives in `src/components/ui.jsx` or `src/components/ui/`
- Constants in `src/lib/constants.js` only
- Helpers in `src/lib/utils.js` only

### Encoding
- Files saved as **UTF-8 only**
- If you see mojibake sequences or random replacement characters, fix them immediately
- Em dashes: `—` (use the actual character, not `&mdash;`)

---

## 🚫 Known Issues / Tech Debt

### Documentation drift (this file fixes that)
Old `AGENTS.md` said "no Tailwind." Current code has Tailwind. This file is the new truth.

### Mojibake in some files
Encoding issues in: `constants.js`, `utils.js`, `Heatmap.jsx`, `AIAnalysis.jsx`, `WeeklyReview.jsx`, `ExportTab.jsx`, `PRODUCT.md`.

### Likely dead code
- `CommandPalette.jsx` — topbar entry was removed
- `src/app/api/screenshot-autofill/route.js` — feature was removed from TradeModal
- `CHECKLIST_RULES` constant — pre-trade checklist was simplified out
- `page4-debug.jsx` — old debug artifact in root

### Mixed styling
Tailwind v4 + shadcn + inline styles + injected CSS all coexist. Pick a direction per-component. See `STYLING.md`.

### No TypeScript
JavaScript only. No generated Supabase types. Schema drift is possible.

### No tests
No test suite. Manual smoke testing only.

---

## 🛠️ Workflow

### Development
```bash
npm run dev       # local dev
npm run build     # production build
npm run lint      # ESLint
```

### Deployment
Push to `main` → Vercel auto-deploys to fxedge.online.

### Env vars (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
GROQ_API_KEY
BREVO_API_KEY
BREVO_FROM_EMAIL
BREVO_FROM_NAME
CRON_SECRET
```

### Cron jobs (vercel.json)
```
30 15 * * 0  →  /api/weekly-debrief  (Sunday 21:00 IST)
```

---

## 🎯 Product Philosophy

### What FXEDGE is
- **Fast** — log a trade in under 30 seconds
- **Specific** — every field maps to ICT/SMC methodology
- **Honest** — shows you the data, not generic motivation
- **Premium** — looks like a Linear/Stripe-quality app

### What FXEDGE is not
- Not for stock/crypto traders (FX/CFD only)
- Not a generic spreadsheet replacement
- Not gamified
- Not feature-bloated — every feature must earn its place

### Design principles
1. **Density over whitespace** — traders want data fast
2. **Numbers always tabular** — use Geist Mono for prices/RR
3. **Color = signal** — green/red mean P&L, never decoration
4. **Click-to-drill** — every stat clicks into detail
5. **Mobile must work** — half of users will visit on phones

---

## 🚦 What's Built

### Working features
- Magic link auth + onboarding flow + waitlist
- Trade logging (full + quick mode) with screenshots
- Daily + weekly planning with embedded screenshots
- Analytics (session, kill zone, setup, manipulation, day×session)
- Equity curve + drawdown chart + monthly heatmap
- Pre-trade journey + Pattern Detector
- AI Analysis (Gemini)
- Weekly debrief email (Sunday cron + Brevo)
- Screenshot Gallery
- Missed Trades log
- Economic Calendar (cached)
- CSV exports + printable PDF report
- 3 themes + dark/light toggle
- Mobile bottom nav + safe area handling
- Keyboard shortcuts (n, j, d, w, a, h, Esc)
- PWA install
- Sonner toasts with deduplication
- Framer Motion animations everywhere
- TanStack Table for Journal
- shadcn primitives initialized

---

## 🗺️ Roadmap

### Cleanup (do first)
- [ ] Remove dead code (`CommandPalette.jsx`, `screenshot-autofill/`, `CHECKLIST_RULES`, `page4-debug.jsx`)
- [x] Fix mojibake encoding across all files
- [ ] Verify Supabase RLS policies live
- [x] Decide & document: Tailwind/shadcn vs inline styles direction
- [ ] Update README.md (currently default Next.js)

### High-priority features
- [ ] **Confluence Tracking** — checkboxes per trade, analytics on which confluences predict wins (biggest competitive gap)
- [ ] **Day × Hour heatmap** — upgrade existing heatmap with hour breakdown
- [ ] **Optional pre-trade checklist widget** — non-blocking compact version
- [ ] **Breakeven win rate** — minimum WR needed at current RR
- [ ] **Smoke test checklist** — 8-point manual test before each deploy

### Future
- [ ] TypeScript migration with generated Supabase types
- [ ] Stripe integration for paid tier
- [ ] CSV import (MT4/MT5)
- [ ] Mobile swipe gestures on trade cards
- [ ] Real test suite (Vitest + Playwright)

---

## 📞 How to ask AI agents for help

Always include:
1. **Context** — "This is FXEDGE, a Next.js + Supabase trading journal. See AGENTS.md."
2. **Scope** — exactly what file/feature to change
3. **Style direction** — "Use Tailwind + shadcn for new code"
4. **Constraints** — "Don't break existing inline-styled components"

Example good prompt:
```
Read AGENTS.md first.
Add confluence tracking to FXEDGE.
- New table column: trades.confluences (jsonb)
- Update TradeModal.jsx to add a Confluences section with checkboxes
- Add new tab Confluences to analytics
- Use Tailwind + shadcn for new UI
- Follow existing T theme token patterns for colors
```

---

**End of AGENTS.md**
