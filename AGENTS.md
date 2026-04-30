# FXEDGE — Agent Context

Read this before touching anything. This is the source of truth for how the project is built and what decisions have already been made.

---

## Stack

- **Next.js 16.2.1** App Router, React 19
- **Supabase** — auth + database (Postgres)
- **Vercel** — deployment target, domain: `fxedge.online`
- No Tailwind. No CSS modules. **All styling is inline styles** passed as JS objects.
- One global CSS file: `src/app/globals.css` — minimal, only layout classes and animations.

---

## File Structure

Do not create new folders or restructure. The layout is fixed:

```
src/
  app/
    page.jsx          <- root app shell (auth, state, routing, theme, buildCSS)
    layout.js         <- Geist font loaded here via next/font/google
    globals.css       <- layout classes only (.app-main, .topbar, .tab-content, etc.)
    api/              <- server routes (analysis, news, screenshot-autofill, weekly-debrief)
    auth/callback/    <- Supabase auth callback
    dashboard/        <- redirect shim
    login/            <- redirect shim
  components/
    ui.jsx            <- shared primitives (Spinner, Btn, Badge, Card, EmptyState, HeaderMeta, SessionPill, etc.)
    EquityCurve.jsx   <- SVG equity curve with Y-axis + drawdown pane
    MonthlyReturns.jsx <- monthly R heatmap (year x month grid)
    InsightCards.jsx  <- AI pattern insight strip
    TradeModal.jsx    <- log/edit trade modal
    LoginScreen.jsx   <- full-page landing/auth screen
    DateRangeBar.jsx  <- global date filter bar
    tabs/
      Dashboard.jsx   <- main dashboard tab
      Journal.jsx     <- trade log table
      Analytics.jsx   <- performance analytics
      DailyTab.jsx    <- daily bias planning
      WeeklyTab.jsx   <- weekly planning
      Heatmap.jsx     <- calendar heatmap
      AIAnalysis.jsx  <- AI coaching tab
      WeeklyReview.jsx
      PatternDetector.jsx
      Playbook.jsx
      ScreenshotGallery.jsx
      ExportTab.jsx
      MissedTrades.jsx
      EconomicCalendar.jsx
  lib/
    constants.js      <- themes (VOID, PAPER, BRUTALIST), PAIRS, SESSIONS, field strings
    utils.js          <- fmtDate, fmtRR, getWeeklyPairNotes, etc.
    supabase.js       <- createClient helper
```

---

## Theme System

Three themes defined in `src/lib/constants.js`: `VOID` (dark), `PAPER` (light), `BRUTALIST`.

Every component receives the active theme as a `T` prop. Use token names only — never hardcode colors.

```js
// Available tokens on every T object:
T.bg           // page background
T.surface      // card / panel background
T.surface2     // inset / secondary surface
T.border       // divider and border color
T.text         // primary text
T.textDim      // secondary text (use this for visible secondary info)
T.muted        // placeholder / disabled text (very faint, use sparingly)
T.accent       // primary accent (indigo on VOID, emerald on PAPER)
T.accentBright // brighter variant of accent
T.green        // profit / win
T.red          // loss
T.amber        // caution / neutral
T.pink         // secondary accent
T.isDark       // boolean
```

Default theme: `"dark"` (VOID). Theme choice persists to `localStorage` key `"fx-theme"` and also syncs to Supabase user metadata.

---

## Fonts

- **UI font**: Geist — loaded in `src/app/layout.js` via `next/font/google`, available as CSS variable `--font-geist-sans` on `<html>`. Reference it as `fontFamily: "var(--font-geist-sans)"` in inline styles.
- **Numbers**: JetBrains Mono — loaded via Google Fonts `@import` inside `buildCSS()` in `page.jsx`. Reference as `fontFamily: "'JetBrains Mono','Fira Code',monospace"`.
- **Do not** load any other font families. Fontshare (Cabinet Grotesk, Satoshi) was removed intentionally from every file.

---

## Styling Rules

1. **Inline styles only** in components. No class-based styling except for the layout helper classes defined in `globals.css` and `buildCSS()`.
2. `buildCSS(T)` in `page.jsx` returns a CSS string injected via `<style>` — it handles layout classes, responsive overrides, theme-specific rules, and the BRUTALIST variant.
3. No `border-left` or `border-right` > 1px as a colored accent (side-stripe anti-pattern). Use full borders, background tints, or top borders instead.
4. No gradient text (`background-clip: text`). Colors convey meaning, never decoration.
5. No glassmorphism as a default pattern.
6. Cards are used sparingly. Nested cards are never correct.

---

## Key Component Patterns

### Passing theme
```jsx
// Every component that renders UI receives T:
<MyComponent T={T} ... />
```

### KPI strip (Dashboard.jsx)
- One unified surface (`T.surface`, `1px solid T.border`, `borderRadius: 14`)
- Four cells separated by `1px solid T.border` hairlines (border-right on desktop, border-right + border-bottom on mobile 2x2)
- Each cell: 3px solid top bar in KPI color (position absolute, full width), label (9px muted uppercase), value (21px JetBrains Mono, KPI color), sub (10px T.textDim), 8px scale bar flush to bottom breaking out of padding with negative margin

### Equity curve (EquityCurve.jsx)
- Pure SVG, monotone cubic Hermite spline
- Y-axis: 42px left column (`YAX = 42`) with labeled round ticks computed via `niceTicks()`, using JetBrains Mono 9px
- Segments colored by drawdown state: green (new high), amber (moderate DD <45%), red (deep DD)
- Drawdown pane below main chart: red gradient fill area + polyline, only renders when `maxDD < 0`
- Main chart height: `w * 0.13`, min 96px. Drawdown pane: `w * 0.045`, min 36px.
- Hover crosshair with tooltip showing trade R + cumulative R

### Monthly returns (MonthlyReturns.jsx)
- Year x month table (Jan-Dec columns, years as rows, newest year first)
- Cell background intensity scales with absolute R value relative to max across all data
- Green = profit, red = loss, T.surface2 = zero/no data
- Year totals in right column, color legend at bottom

### Topbar (page.jsx)
- Single compact row: tab name (15px, weight 700, T.text) + date (11px, T.textDim) baseline-aligned on left; theme swatches + SessionPill on right
- Padding: `10px 24px` desktop, `12px 16px` mobile
- Sticky, backdrop-blur, T.surface background at f4 opacity
- Date is hidden on mobile (className="hide-mobile")

---

## Deploy Workflow

After every change:
```bash
git add <changed files>
git commit -m "description

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
vercel --prod --yes
```

The project is already linked to Vercel. Alias: `fxedge.online`. Always deploy to production.

---

## What Was Recently Changed (latest first)

| Change | Files |
|--------|-------|
| Topbar date color T.muted -> T.textDim for visibility | `page.jsx` |
| Theme persists to localStorage, default dark | `page.jsx` |
| Topbar collapsed: stacked H1/eyebrow/date -> single compact row | `page.jsx` |
| KPI strip: unified surface, hairline dividers, 3px top bar, 8px gauge bar | `Dashboard.jsx` |
| Equity curve height compacted (w*0.13 / w*0.045) | `EquityCurve.jsx` |
| Equity curve: Y-axis labels + drawdown depth pane added | `EquityCurve.jsx` |
| MonthlyReturns heatmap component created + added to Dashboard | `MonthlyReturns.jsx`, `Dashboard.jsx` |
| Font sweep: removed Fontshare CDN, all files use Geist + JetBrains Mono | All components |

---

## Design Principles (non-negotiable)

1. **Scan before read.** Most important number lands in under 2 seconds without reading a word.
2. **Density earns trust.** Generous padding signals inexperience. Compact, well-spaced data signals craft.
3. **Color = meaning only.** Green is profit. Red is loss. Amber is caution. Never use color decoratively.
4. **Chrome recedes.** Cards, borders, and labels are background infrastructure. Data is the foreground.
5. **No redundancy.** If a label repeats information visible elsewhere, remove it.

Anti-references (never do these): neon crypto dashboards, glassmorphism, gradient text (`background-clip:text`), hero-metric SaaS card templates, side-stripe borders (`border-left/right > 1px` as accent), identical card grids.

---

## Users

Retail forex/CFD traders. They open the dashboard at 8am before the London open, scan performance in under 10 seconds, then go back to their charts. They are not reading — they are scanning. Power users log 5-20 trades per week.

The app is called **FXEDGE**. Brand personality: precise, fast, trusted. Like a tool a serious trader would build for themselves if they could code.
