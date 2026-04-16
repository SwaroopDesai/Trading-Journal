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

### Tier 1 — Foundations (DONE)
- Split `page.jsx` monolith into separate component files
- Remove duplicate inline component definitions
- Fix mobile layout overflow

### Tier 2 — UX Polish (START HERE)
- [ ] **Keyboard shortcuts**: `N` = new trade, `J` = journal tab, `D` = daily tab, `Esc` = close modal
- [ ] **Skeleton loaders**: replace the full-page `<Spinner>` with per-section skeleton cards
- [x] **Unsaved changes guard**: confirm dialog when closing a modal with dirty fields
- [x] **Smarter empty states**: actionable CTAs ("Log your first trade →") instead of plain text
- [x] **Toast deduplication**: don't stack identical toasts within 2 seconds

### Tier 3 — Analytics Depth (ALREADY BUILT)
- [x] Running equity curve with max drawdown overlay — `EquityCurve.jsx`
- [x] Monthly P&L calendar heatmap — `Heatmap.jsx` (calendar + monthly bar views)
- [x] Session / day-of-week heatmap grid — `Heatmap.jsx` + `AdvancedStats.jsx`
- [x] Streak tracking (win/loss streaks) — `AdvancedStats.jsx`
- [x] Best / worst trade of the week — `WeeklyReview.jsx` (auto-surfaced per week)

### Tier 4 — Intelligence
- [ ] AI pattern detection: surface repeated mistakes from trade notes
- [ ] Rule-break tagging: "Did you follow your plan?" checkbox on each trade
- [ ] Session-aware suggestions: warn if trading outside your best session window

### Tier 5 — Scale & Polish
- [ ] PWA manifest + service worker for offline access
- [ ] Dark/light preference persisted to Supabase user profile
- [ ] Trade import from CSV / MT4 export format

---

## Dev Commands

```bash
npm run dev      # local dev server at localhost:3000
npm run build    # production build (must pass before any commit)
npm run lint     # ESLint check
```

Environment variables are in `.env.local` (not committed).
Required keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`
