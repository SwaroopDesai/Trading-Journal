# Trading Journal — Agent Context

> Read this before touching any code. It will save you from repeating work or breaking things.

---

## Stack

- **Framework**: Next.js 16 (App Router, `"use client"` pages)
- **Database**: Supabase (auth + Postgres)
- **Styling**: Inline styles only — no Tailwind classes in components, design tokens via `T = dark ? DARK : LIGHT`
- **State**: React `useState` / `useMemo` — no Redux or Zustand
- **Language**: JavaScript (`.jsx`) — no TypeScript

---

## Project Structure

```
src/
├── app/
│   ├── page.jsx              ← App shell only (~491 lines). Contains: state, data fetching,
│   │                           save handlers, layout, modal wiring, buildCSS(). DO NOT bloat this.
│   ├── globals.css           ← Mobile layout rules (sidebar hide, bottom-nav show, padding)
│   ├── dashboard/page.jsx    ← /dashboard route
│   ├── login/page.jsx        ← /login route
│   └── api/
│       ├── analysis/         ← AI trade analysis endpoint
│       ├── news/             ← Market news endpoint
│       ├── screenshot-autofill/  ← Screenshot → trade fields via AI
│       └── weekly-debrief/   ← Weekly AI debrief endpoint
│
├── components/
│   ├── ui.jsx                ← ALL shared primitives (Btn, Card, Inp, Sel, Toggle, Textarea,
│   │                           ModalShell, Chip, Badge, Overlay, TabPanel, BottomNav, etc.)
│   │                           ALWAYS check here before building a new primitive.
│   ├── TradeModal.jsx        ← Trade entry/edit modal
│   ├── EquityCurve.jsx       ← Equity chart (uses ResizeObserver, NOT hardcoded width)
│   ├── AdvancedStats.jsx     ← Stats breakdown table
│   ├── WeeklyCalendar.jsx    ← Calendar grid component
│   ├── Psychology.jsx        ← Psychology tab content
│   ├── Calculator.jsx        ← Risk calculator
│   ├── MoreMenu.jsx          ← "More" tab menu
│   ├── LoginScreen.jsx       ← Login UI
│   └── tabs/                 ← One file per tab (extracted from monolith April 2026)
│       ├── Dashboard.jsx
│       ├── Journal.jsx
│       ├── DailyTab.jsx      ← named export: DailyModal
│       ├── WeeklyTab.jsx     ← named export: WeeklyModal
│       ├── Analytics.jsx
│       ├── ScreenshotGallery.jsx
│       ├── WeeklyReview.jsx
│       ├── Heatmap.jsx
│       ├── Playbook.jsx
│       ├── AIAnalysis.jsx
│       └── ExportTab.jsx
│
└── lib/
    ├── constants.js          ← PAIRS, SESSIONS, SETUPS, BIASES, MISTAKES, EMOTIONS,
    │                           POI_TYPES, MANI_TYPES, HIGH_IMPACT, SESSION_WINDOWS,
    │                           TRADE_BOOT_FIELDS, DAILY_BOOT_FIELDS, WEEKLY_BOOT_FIELDS,
    │                           STORAGE_BUCKET, TAB_STORAGE_KEY, DARK, LIGHT, CHECKLIST_RULES
    ├── utils.js              ← fmtDate, fmtRR, getWeeklyPairNotes, getDailyPairNotes,
    │                           uploadImageValue, uploadImageList, deleteStoredImages,
    │                           getDailyPlanImages, getWeeklyPlanImages, normalizeImageList,
    │                           getCurrentSessionInfo, getAutoSession, readDraft, writeDraft,
    │                           clearDraft, serializeDailyPairNotes
    └── supabase.js           ← createClient()
```

---

## Theme System

Every component receives `T` as a prop — never hardcode colours.

```js
// In page.jsx
const T = dark ? DARK : LIGHT   // DARK and LIGHT imported from @/lib/constants

// In any component
function MyComponent({ T }) {
  return <div style={{ background: T.surface, color: T.text }}>...</div>
}
```

**Available token keys**: `bg`, `surface`, `surface2`, `border`, `text`, `textDim`,
`accent`, `accentBright`, `green`, `red`, `amber`, `blue`

---

## Data Flow

```
Supabase
  └─ page.jsx (fetches on mount, owns all state arrays)
       ├─ trades[]        → Journal, Dashboard, Analytics, Heatmap, ScreenshotGallery, etc.
       ├─ dailyPlans[]    → DailyTab, Dashboard, AIAnalysis, ExportTab
       └─ weeklyPlans[]   → WeeklyTab, WeeklyReview, Dashboard, ExportTab

Save handlers live in page.jsx:
  saveTrade(data)    → upserts to supabase, updates trades[] state
  saveDaily(data)    → upserts to supabase, updates dailyPlans[] state
  saveWeekly(data)   → upserts to supabase, updates weeklyPlans[] state
```

Tab components are **read-only consumers** — they receive data as props and call
`onSave` / `onEdit` / `onDelete` callbacks. They never call Supabase directly.

---

## Rules

1. **Never redefine** anything from `ui.jsx`, `constants.js`, or `utils.js` inline in a component.
2. **Never put** data-fetching or Supabase calls inside tab components — only in `page.jsx`.
3. **Always verify imports match usage** — the build will pass even if a variable is used but not imported (runtime crash, not compile error). After editing any component, scan the JSX for every variable/component used and confirm it appears in the import block.
3. **DailyModal** is a named export from `tabs/DailyTab.jsx`. **WeeklyModal** is a named export from `tabs/WeeklyTab.jsx`. Import them like: `import DailyTab, { DailyModal } from "@/components/tabs/DailyTab"`.
4. **EquityCurve** uses `ResizeObserver` for width — do not pass a fixed `width` prop.
5. All new UI primitives go in `components/ui.jsx`, not scattered across feature files.
6. Run `npm run build` before committing — zero errors required.

---

## What Was Done (April 2026)

| Commit | What |
|--------|------|
| `b566862` | Fix responsive layout — CSS media queries replacing JS viewport detection |
| `0752e96` | Default viewportWidth to 0 (mobile-first) |
| `2c3f23e` | Restore direct window.innerWidth read |
| `b72a6f2` | Move margin-left to globals.css |
| `7b8777c` | Fix EquityCurve hardcoded 900px width causing mobile overflow |
| `4f471fd` | **Tier 1 refactor** — split 3196-line page.jsx monolith into dedicated component files |

---

## Roadmap

> North Star: **every feature should either make logging faster or make learning from your data easier.**

---

### TIER 1 — Foundations

- [x] Split `page.jsx` monolith into `src/components/tabs/` files — `commit 4f471fd`
- [x] Remove duplicate inline component definitions (Spinner, Overlay, ModalShell, etc.)
- [x] Fix mobile layout overflow (EquityCurve hardcoded 900px width) — `commit 7b8777c`
- [ ] Move inline `style={{ background: T.surface, ... }}` to CSS custom properties (`--fx-bg`, `--fx-surface`, `--fx-accent`) toggled by `data-theme` attribute — cuts JSX noise ~40%

---

### TIER 2 — Smart Features (What Makes This an Edge)

- [x] **Toast deduplication** — `toastDedupRef` in `page.jsx`, 2s window
- [x] **Unsaved changes guard** — confirm dialog on modal close with dirty fields
- [x] **Smarter empty states** — actionable CTAs (e.g. WeeklyReview, Dashboard)
- [x] **Keyboard shortcuts** — `N` = new trade, `J` = journal, `D` = daily, `Esc` = close modal
- [x] **Skeleton loaders** — replace full-page `<Spinner>` with per-section skeleton cards
- [x] **Smart defaults & one-tap logging**
  - Auto-detect current session from the session clock (already computed — just pre-fill it)
  - Pre-fill pair from last trade, bias from today's daily plan
  - "Repeat last trade" button — same pair/session, just change result/RR
- [ ] **Trade Rules Engine** — user defines rules ("Only London session", "Max 2 trades/day"), trade entry shows green/red checklist, weekly rule adherence score shown in Playbook
- [ ] **Proactive AI Insights on Dashboard** — surface weekly cards like:
  - "You're 0-3 on Fridays. Consider sitting out."
  - "After a loss, your next trade wins 28% of the time. Add a cooling-off rule."
  - "Your best setup has 3.2R expectancy. Your worst is -0.4R."
- [ ] **Global date range filter** — "This Week / Month / Last 30 / Custom" — applies to all stats, equity curve, analytics. Currently NO time filtering exists anywhere.

---

### TIER 3 — UX Polish (Premium Feel)

- [x] **Equity curve with drawdown overlay** — `EquityCurve.jsx`
- [x] **Monthly P&L calendar heatmap** — `Heatmap.jsx`
- [x] **Session / day-of-week heatmap grid** — `Heatmap.jsx` + `AdvancedStats.jsx`
- [x] **Streak tracking** — `AdvancedStats.jsx`
- [x] **Best / worst trade of the week** — `WeeklyReview.jsx`
- [ ] **Journal search & smart filters** — text search across notes, tag filter, date range filter in Journal tab
- [ ] **Full-screen trade detail view** — pre/post screenshots side by side, "similar trades" section, edit/delete actions
- [ ] **Onboarding wizard** — "What pairs do you trade?", "What's your risk per trade?", "What sessions?" — personalizes the app on first use
- [ ] **Mobile trade cards** — swipe left/right gestures, sticky date headers with day P&L, tap-to-expand inline

---

### TIER 4 — Power Features

- [ ] **Trade import** — CSV with column mapping UI, MT4/MT5 statement parser, duplicate detection
- [ ] **Risk journal ($ P&L)** — optional account size field, running balance, max drawdown in dollars, risk exposure view
- [ ] **Trade correlation & sequence analysis**
  - "After a 2+ loss streak, what happens next?"
  - "How does your first trade of the day compare to your second?"
  - Show as visual mini-reports in Analytics
- [ ] **Offline PWA** — service worker, IndexedDB queue, sync on reconnect (manifest.json already exists)

---

### TIER 5 — Architecture & Performance

- [ ] **Virtualized lists** — Journal + Gallery render all trades in DOM; use `react-window` or intersection observer at 500+ trades
- [ ] **Optimistic updates** — update state immediately on save, sync in background, show error only on failure
- [ ] **Image optimization** — compress to WebP client-side before upload, thumbnails for list views

---

### Sprint Plan

| Sprint | Focus |
|--------|-------|
| **Now** | Finish Tier 2 remaining items (keyboard shortcuts, skeleton loaders, smart defaults) |
| **Next** | Trade Rules Engine + Global date range filter — these unlock usability at scale |
| **After** | Proactive AI insights on Dashboard + Journal search |
| **Later** | Trade import, mobile card redesign, full-screen detail view |

---

## Dev Commands

```bash
npm run dev      # local dev server at localhost:3000
npm run build    # production build (must pass before any commit)
npm run lint     # ESLint check
```

Environment variables are in `.env.local` (not committed).
Required keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`
