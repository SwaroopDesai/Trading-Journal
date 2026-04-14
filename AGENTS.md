# Trading Journal — Agent Handoff

> Read this entire file before touching any code.
> It covers architecture, all recent changes, and rules for safe edits.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 App Router (`src/app/`) |
| Auth + DB | Supabase (client in `src/lib/supabase.js`) |
| Styling | **Inline JS objects only** — no Tailwind classes used anywhere |
| Charting | Hand-rolled SVG — no chart libraries |
| AI | Gemini 1.5 Flash via `/api/screenshot-autofill` |
| Deploy | Vercel (auto-deploys on push to `main`) |

---

## File Map — start here

```
src/
  app/
    page.jsx              ← Main app shell (tabs, auth, state, data fetching)
                            ~3000 lines — be surgical, don't rewrite wholesale
    layout.js             ← Root layout / fonts
    globals.css           ← Minimal global resets only
    api/
      screenshot-autofill/
        route.js          ← POST handler: image → Gemini Vision → trade fields
  components/
    EquityCurve.jsx       ← Smooth equity curve chart (ResizeObserver + monotone spline)
    TradeModal.jsx        ← Log/edit trade modal (Quick Log + Screenshot Autofill)
    ui.jsx                ← ALL shared UI primitives (Btn, Card, Toggle, Inp, Sel, etc.)
  lib/
    constants.js          ← All option arrays (PAIRS, SESSIONS, BIASES, etc.) + theme objects
    utils.js              ← All pure helpers (fmtDate, fmtRR, calcStats, getAutoSession, etc.)
    supabase.js           ← Supabase client (browser-safe singleton)
```

---

## Theme system

All colors come from `T` (theme object) passed as a prop. Never hardcode colors.

```js
// T object shape (from src/lib/constants.js — DARK and LIGHT themes)
T.bg          // page background
T.surface     // card background
T.surface2    // secondary surface
T.border      // border color
T.text        // primary text
T.textDim     // secondary text
T.muted       // muted/label text
T.accent      // accent (purple)
T.accentBright// brighter accent
T.green       // profit / win
T.red         // loss
T.amber       // warning / breakeven
```

Every component receives `T` as a prop and uses it for all style values.

---

## UI primitives (src/components/ui.jsx)

**Always import from here — never re-implement these.**

```js
import { ModalShell, Btn, FL, Section, Inp, Sel, Toggle,
         Textarea, PasteImageInput, Card, CardTitle,
         EmptyState, Chip, Badge, SessionPill } from "@/components/ui";
```

Key components:
- `<ModalShell T footer title subtitle onClose width>` — wraps modals
- `<Btn T ghost onClick>` — standard button
- `<Toggle T value opts onChange>` — pill group switcher
- `<Sel T val opts on>` — styled select
- `<Inp T type value onChange ...>` — styled input
- `<FL label T full>` — form field wrapper with label
- `<Section T title>` — form section with divider
- `<PasteImageInput T label value onChange>` — screenshot paste/upload input
- `<EmptyState T title copy icon compact>` — empty state card

---

## Data shape

### Trade object (as stored in Supabase)
```js
{
  id, user_id, created_at,
  date,        // "YYYY-MM-DD"
  pair,        // "EURUSD"
  direction,   // "LONG" | "SHORT"
  session,     // "London" | "New York" | "Asian" | "London/NY Overlap"
  dailyBias,   // "Bullish" | "Bearish" | "Neutral"
  manipulation,// string from MANI_TYPES
  poi,         // string from POI_TYPES
  setup,       // string from SETUPS
  entry, sl, tp, // numbers
  result,      // "WIN" | "LOSS" | "BREAKEVEN"
  rr,          // number (negative for losses, 0 for BE)
  pips,        // number
  emotion,     // string from EMOTIONS
  mistakes,    // string from MISTAKES
  notes,       // string
  preScreenshot,  // base64 data URL or ""
  postScreenshot, // base64 data URL or ""
  tags,        // string[] (stored as text[], rendered as comma-separated in form)
}
```

### equityCurve array (computed in page.jsx → calcStats)
```js
// Each element:
{ r: number,      // cumulative R at this point
  rr: number,     // this trade's R
  result: string, // "WIN" | "LOSS" | "BREAKEVEN"
  date: string,   // "YYYY-MM-DD"
  pair: string }
```

---

## Key patterns in page.jsx

### State hierarchy
```
trades[]          ← raw Supabase rows
stats             ← derived from calcStats(trades) — never mutate directly
activeTab         ← "home" | "journal" | "analytics" | "playbook" | "settings"
showTradeModal    ← boolean
editingTrade      ← trade object | null
```

### Adding a new tab
1. Add tab id to the `TABS` array near the top of page.jsx
2. Add a render block inside the tab switch in the return JSX
3. Keep the component extracted into its own function (pattern: `function MyTab({T, ...})`)

### Saving a trade
```js
// onSave handler in page.jsx calls:
await supabase.from("trades").upsert({ ...trade, user_id })
// then refreshes: setTrades(await fetchTrades())
```

---

## EquityCurve (src/components/EquityCurve.jsx)

The chart is SVG-based with no external libraries.

**How it works:**
1. `ResizeObserver` measures the container's actual pixel width → sets `size.w` and `size.h`
2. SVG is drawn at those exact pixel dimensions (no `preserveAspectRatio` distortion)
3. Curve uses **monotone cubic Hermite spline** (`smoothPath()` function) — smooth without overshoot
4. Time range filter recomputes cumulative R fresh from filtered trades

**Props:**
```jsx
<EquityCurve T={T} data={stats.equityCurve} />
```

**Do not:**
- Add `preserveAspectRatio="none"` — it warps bezier curves into staircases
- Use viewBox scaling for responsiveness — use ResizeObserver instead

---

## TradeModal (src/components/TradeModal.jsx)

**Features:**
- **Quick Log mode** (`⚡` toggle) — shows only Pair, Direction, Result, P&L; auto-fills Session from current time via `getAutoSession()`
- **Screenshot Autofill** (`📷` button) — uploads chart screenshot → POST `/api/screenshot-autofill` → Gemini Vision extracts trade data → pre-fills form fields
- Draft persistence via `readDraft/writeDraft/clearDraft` (localStorage, keyed by userId)

**Props:**
```jsx
<TradeModal
  T={T}
  userId={user.id}
  initial={editingTrade}   // null for new, trade object for edit
  onSave={handleSave}
  onClose={() => setShowTradeModal(false)}
  syncing={syncing}
/>
```

---

## Screenshot Autofill API (src/app/api/screenshot-autofill/route.js)

- **Method:** POST
- **Body:** `{ image: "data:image/png;base64,..." }`
- **Returns:** `{ data: { pair, direction, entry, sl, tp, result, rr, pips, setup, notes } }`
- **Env var required:** `GEMINI_API_KEY`
- Uses `gemini-1.5-flash` model

---

## Environment variables

Set these in Vercel dashboard (Settings → Environment Variables):

| Key | Used for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `GEMINI_API_KEY` | Screenshot autofill via Gemini Vision |

---

## Rules for safe edits

1. **Never touch the styling approach** — all styles are inline JS objects using `T.*` colors
2. **Don't add npm packages for UI** — all primitives are in `ui.jsx`
3. **Don't add charting libraries** — SVG only
4. **page.jsx is large (~3000 lines)** — use surgical edits, not rewrites. Read the specific section you need with line offsets before editing
5. **After any page.jsx edit** — verify with `grep -n "function " src/app/page.jsx` to confirm component boundaries are intact
6. **Supabase schema lives in the dashboard** — don't assume columns exist; check the trade object shape above
7. **Mobile breakpoint** — `isMobile` state in page.jsx (set via `window.innerWidth < 768`), passed to components that need it
