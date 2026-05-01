# FXEDGE Project Status

Generated: 2026-05-01  
Repository: `C:\Users\swaro\trading-journal`  
Production domain: `fxedge.online`  
Primary app: retail trading journal for FX/CFD traders, focused on fast execution review, planning, screenshots, analytics, and AI coaching.

## Stack

### Runtime and framework

| Technology | Version | Usage |
|---|---:|---|
| Next.js | 16.2.1 | App Router application, API routes, Vercel deployment |
| React | 19.2.4 | Client UI and stateful app shell |
| React DOM | 19.2.4 | Browser rendering |
| Node/npm | Project default | Package management and Vercel build runtime |

### Data, auth, and backend

| Dependency | Version | Usage |
|---|---:|---|
| `@supabase/supabase-js` | ^2.100.0 | Browser Supabase client, database CRUD, storage upload/delete |
| `@supabase/ssr` | ^0.9.0 | Auth callback cookie/session handling |
| `@supabase/auth-helpers-nextjs` | ^0.15.0 | Legacy/deprecated dependency still installed |
| Vercel Functions | Platform | API routes: AI analysis, news, screenshot autofill, weekly debrief |
| Vercel Cron | Platform | Weekly debrief schedule |

### UI, charts, animation, and utilities

| Dependency | Version | Usage |
|---|---:|---|
| `framer-motion` | ^12.38.0 | Modal/tab/card/KPI animations |
| `recharts` | ^3.8.0 | Dashboard equity curve and analytics charts |
| `@tanstack/react-table` | ^8.21.3 | Journal sorting/filter model |
| `lucide-react` | ^1.14.0 | Icons |
| `sonner` | ^2.0.7 | Toast notifications |
| `next-themes` | ^0.4.6 | Installed, but theme persistence is mainly custom localStorage/user metadata |
| `@vercel/analytics` | ^2.0.1 | Vercel Analytics in root layout |
| `class-variance-authority` | ^0.7.1 | shadcn component variants |
| `clsx` | ^2.1.1 | Conditional class helper |
| `tailwind-merge` | ^3.5.0 | Tailwind class merge helper through `cn()` |
| `tailwindcss` | ^4 | Tailwind v4 CSS pipeline |
| `@tailwindcss/postcss` | ^4 | PostCSS plugin for Tailwind v4 |
| `radix-ui` | ^1.4.3 | Radix/shadcn base package |
| `shadcn` | ^4.6.0 | shadcn CLI/package |
| `tw-animate-css` | ^1.4.0 | Animation CSS used by shadcn/Tailwind setup |

### Tooling

| Dependency | Version | Usage |
|---|---:|---|
| ESLint | ^9 | Linting |
| `eslint-config-next` | 16.2.1 | Next.js ESLint config |

### Important architecture note

The project originally followed an inline-style-only rule, but current code has moved into a mixed styling system:

- Existing FXEDGE components still use theme tokens, inline style objects, and injected CSS from `buildCSS(T)`.
- shadcn/Tailwind has been initialized through `globals.css`, `components.json`, and `src/components/ui/*`.
- This means the current codebase is in a transition phase between the older inline-token system and a newer Tailwind/shadcn component layer.

## Architecture

### Root files

| File | Responsibility |
|---|---|
| `package.json` | Dependencies and scripts: `dev`, `build`, `start`, `lint` |
| `next.config.mjs` | Empty Next.js config placeholder |
| `postcss.config.mjs` | Tailwind v4 PostCSS setup |
| `components.json` | shadcn configuration, aliases, icon library, Tailwind CSS entry |
| `jsconfig.json` | `@/*` path alias to `src/*` |
| `vercel.json` | Vercel cron schedule for weekly debrief |
| `AGENTS.md` | Agent/project rules, design principles, architecture notes; partially stale after Tailwind/shadcn migration |
| `CLAUDE.md` | Older project handoff doc; useful historical context but contains stale stack and schema notes |
| `PRODUCT.md` | Product positioning and design philosophy |
| `README.md` | Default Next.js README, currently stale |

### App routes

| File | Responsibility |
|---|---|
| `src/app/layout.js` | Root HTML layout, Geist fonts, Vercel Analytics, shadcn Toaster and TooltipProvider |
| `src/app/globals.css` | Tailwind/shadcn CSS, base variables, layout classes, responsive helpers, focus styles |
| `src/app/page.jsx` | Main client app shell: auth, routing, global state, theme, modals, save/delete handlers, tab rendering |
| `src/app/auth/callback/route.js` | Supabase OAuth/magic-link callback using PKCE exchange |
| `src/app/dashboard/page.js` | Redirect shim to root app |
| `src/app/login/page.js` | Redirect shim to root app |

### API routes

| File | Responsibility |
|---|---|
| `src/app/api/analysis/route.js` | Gemini-powered AI journal analysis endpoint |
| `src/app/api/screenshot-autofill/route.js` | AI screenshot extraction endpoint using Gemini primary and Groq fallback; likely unused after TradeModal autofill removal |
| `src/app/api/news/route.js` | Forex Factory economic calendar proxy/cache with Supabase fallback |
| `src/app/api/weekly-debrief/route.js` | Vercel cron endpoint: generates Gemini weekly debriefs and sends emails through Brevo |

### Core components

| File | Responsibility |
|---|---|
| `src/components/LoginScreen.jsx` | Full landing/auth screen, waitlist request, magic-link sign-in |
| `src/components/TradeModal.jsx` | Log/edit trade modal with quick/full modes, screenshots, drafts, RR calculation |
| `src/components/MissedTradeModal.jsx` | Log/edit missed trade modal with manual RR and screenshots |
| `src/components/EquityCurve.jsx` | Recharts equity curve, drawdown pane, filters, tooltip, multiple chart modes |
| `src/components/DashboardCharts.jsx` | Recharts dashboard cards: session edge, setup edge, R distribution |
| `src/components/MonthlyReturns.jsx` | Monthly R heatmap |
| `src/components/InsightCards.jsx` | Pattern/AI insight strip |
| `src/components/DateRangeBar.jsx` | Global date filter controls |
| `src/components/CommandPalette.jsx` | Command palette component; currently likely unused after topbar command removal |
| `src/components/MoreMenu.jsx` | Mobile More tab navigation |
| `src/components/OnboardingFlow.jsx` | First-use onboarding when user has no trades |
| `src/components/ui.jsx` | FXEDGE shared primitives: buttons, badges, cards, inputs, empty states, image inputs, session pill |
| `src/components/ui/*` | shadcn component primitives: button, card, dialog, input, select, skeleton, tabs, table, tooltip, etc. |

### Tabs

| File | Responsibility |
|---|---|
| `src/components/tabs/Dashboard.jsx` | Main dashboard: KPI strip, equity curve, heatmap rail, today trades, daily bias, weekly theme, pair performance, analytics cards |
| `src/components/tabs/Journal.jsx` | Trade archive using TanStack Table model, filters, grouped trade cards |
| `src/components/tabs/DailyTab.jsx` | Daily planning records and modal |
| `src/components/tabs/WeeklyTab.jsx` | Weekly planning records and modal |
| `src/components/tabs/Heatmap.jsx` | Calendar heatmap, weekday/session/streak/drawdown views, day drilldown with screenshots |
| `src/components/tabs/Analytics.jsx` | Analytics tab and performance breakdowns |
| `src/components/tabs/WeeklyReview.jsx` | Weekly review workflow and saved review content |
| `src/components/tabs/AIAnalysis.jsx` | Manual AI coaching and journal analysis |
| `src/components/tabs/MissedTrades.jsx` | Missed trade log and opportunity-cost tracking |
| `src/components/tabs/PatternDetector.jsx` | Pattern detection from logged trades |
| `src/components/tabs/Playbook.jsx` | Playbook/rules workflow |
| `src/components/tabs/ScreenshotGallery.jsx` | Screenshot gallery for pre/post charts and plan screenshots |
| `src/components/tabs/EconomicCalendar.jsx` | Economic calendar/news tab |
| `src/components/tabs/ExportTab.jsx` | CSV exports and printable performance report |

### Shared library files

| File | Responsibility |
|---|---|
| `src/lib/constants.js` | Trading constants, Supabase select strings, storage bucket, theme tokens, session windows, checklist constants |
| `src/lib/utils.js` | Formatting, image serialization/upload/delete helpers, draft helpers, daily/weekly embedded notes parsing, session helpers |
| `src/lib/supabase.js` | Browser Supabase client factory |

## Database Schema

Live Supabase schema/RLS introspection was attempted but blocked by Supabase MCP reauthentication. The schema below is inferred from application code, API routes, select strings, insert/update payloads, and historical docs. Exact database types and policies should be verified in Supabase before making schema migrations.

### Supabase project

| Property | Value |
|---|---|
| Project name | Trading Journal |
| Project ref | `mrdtmaihghmkbilhqjgo` |
| Region | `ap-south-1` |
| Database engine | Postgres 17 |
| Database version observed | `17.6.1.084` |
| Status observed | Active/healthy |

### Table: `trades`

Main trade journal table.

| Column | Inferred type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Owner, references Supabase auth user |
| `created_at` | `timestamptz` | Created timestamp |
| `pair` | `text` | Trading pair/instrument |
| `date` | `date` | Client sends `YYYY-MM-DD` string |
| `direction` | `text` | `LONG` or `SHORT` |
| `session` | `text` | London, New York, Asian, overlap, etc. |
| `killzone` | `text` | Legacy/older field; UI simplified away in places |
| `dailyBias` | `text` | Daily bias at trade time |
| `weeklyBias` | `text` | Legacy/older field; currently less emphasized |
| `marketProfile` | `text` | Trending/ranging/volatile |
| `manipulation` | `text` | Manipulation context |
| `poi` | `text` | Point-of-interest type |
| `setup` | `text` | Setup name |
| `entry` | `numeric` | Entry price; currently hidden in Journal cards |
| `sl` | `numeric` | Stop loss; currently hidden in Journal cards |
| `tp` | `numeric` | Take profit; currently hidden in Journal cards |
| `result` | `text` | `WIN`, `LOSS`, `BREAKEVEN` |
| `rr` | `numeric` | R multiple |
| `pips` | `numeric` | Pips result |
| `emotion` | `text` | Trading emotion |
| `mistakes` | `text` | Mistake category |
| `notes` | `text` | Main trade notes/lesson |
| `tags` | `jsonb` or `text[]` | Code expects an array |
| `preScreenshot` | `text` | Public URL or serialized image value |
| `postScreenshot` | `text` | Public URL or serialized image value |

### Table: `daily_plans`

Daily bias and preparation plans.

| Column | Inferred type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Owner |
| `created_at` | `timestamptz` | Created timestamp |
| `date` | `date` | Plan date |
| `pairs` | `jsonb` or `text[]` | Pairs in focus |
| `biases` | `jsonb` | Per-pair bias map |
| `weeklyTheme` | `text` | Currently used as main day focus |
| `keyLevels` | `text` | Legacy field; UI removed/minimized |
| `manipulation` | `text` | Session expectation / expected manipulation |
| `watchlist` | `text` | Stores embedded pair notes with marker `__FXEDGE_PAIR_NOTES__::` |
| `notes` | `text` | Legacy field; UI removed/minimized |
| `chartImage` | `text` | Serialized list of daily screenshots |

### Table: `weekly_plans`

Weekly preparation and review table.

| Column | Inferred type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Owner |
| `created_at` | `timestamptz` | Created timestamp |
| `weekStart` | `date` | Start of review/planning week |
| `weekEnd` | `date` | End of review/planning week |
| `pairs` | `jsonb` | Per-pair bias map |
| `overallBias` | `text` | Legacy/AI context field |
| `marketStructure` | `text` | Legacy field |
| `keyEvents` | `text` | Key economic events |
| `targets` | `text` | Legacy field; UI removed/minimized |
| `notes` | `text` | Weekly notes |
| `review` | `text` | Manual or AI weekly review/debrief |
| `premiumDiscount` | `jsonb` | Stores embedded screenshots and pair notes |

### Table: `missed_trades`

Missed opportunity journal.

| Column | Inferred type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | Owner |
| `created_at` | `timestamptz` | Created timestamp |
| `date` | `date` | Missed trade date |
| `pair` | `text` | Pair/instrument |
| `direction` | `text` | LONG/SHORT |
| `setup` | `text` | Setup missed |
| `reason` | `text` | Why it was missed |
| `rr` | `numeric` | Manual potential R |
| `outcome` | `text` | Whether it played out |
| `notes` | `text` | JSON-backed notes plus screenshot metadata |
| `entry` | `numeric` | Possible old column, no longer saved by app |
| `sl` | `numeric` | Possible old column, no longer saved by app |
| `tp` | `numeric` | Possible old column, no longer saved by app |

### Table: `calendar_cache`

Economic calendar cache used by the news API route.

| Column | Inferred type | Notes |
|---|---|---|
| `week_key` | `text` | Week identifier, likely primary/unique key |
| `events` | `jsonb` | Cached economic events |
| `fetched_at` | `timestamptz` | Cache timestamp |

### Table: `waitlist`

Landing-page request-access table.

| Column | Inferred type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `email` | `text` | Submitted email |
| `created_at` | `timestamptz` | Created timestamp |
| `status` | `text` | Waitlist status |

### RLS policies in place

Could not live-verify policies because Supabase schema access required reauthentication. Expected policies from the app design:

- `trades`: authenticated users can select/insert/update/delete only rows where `user_id = auth.uid()`.
- `daily_plans`: authenticated users can select/insert/update/delete only their own rows.
- `weekly_plans`: authenticated users can select/insert/update/delete only their own rows.
- `missed_trades`: authenticated users can select/insert/update/delete only their own rows.
- `waitlist`: anonymous insert is likely allowed; reads should be restricted.
- `calendar_cache`: server/news route needs read/upsert access. Current route uses public Supabase REST credentials, so RLS should be reviewed carefully.
- `storage.objects`: authenticated users need insert/update/delete/select for `journal-images`; public read is expected because the app stores and displays public URLs.

### Storage buckets

| Bucket | Purpose | Access expectation |
|---|---|---|
| `journal-images` | Trade screenshots, daily screenshots, weekly screenshots, missed trade screenshots | Public read, authenticated write/delete |

Storage paths are generated by code and grouped by user:

- `{userId}/trades/pre/...`
- `{userId}/trades/post/...`
- `{userId}/daily-plans/...`
- `{userId}/weekly-plans/...`
- `{userId}/missed-trades/...`

## Features Built (Detailed)

### Authentication & User Management

- Magic-link authentication is built with Supabase.
- Auth callback lives in `src/app/auth/callback/route.js`.
- Root session handling lives in `src/app/page.jsx`.
- Login and landing experience lives in `src/components/LoginScreen.jsx`.
- The app uses `supabase.auth.getSession()`, listens to auth state changes, and redirects after callback.
- Theme preference is persisted locally and also synced to Supabase user metadata.
- Waitlist/request-access flow exists on the landing screen and inserts into `waitlist`.
- Onboarding flow exists for brand-new users with no trades.

### Trade Logging

- Main trade logging lives in `src/components/TradeModal.jsx`.
- Trade persistence lives in `saveTrade()` inside `src/app/page.jsx`.
- Users can log pair, direction, session, market profile, bias, manipulation, POI, setup, result, RR, pips, emotion, mistakes, notes, tags, and screenshots.
- Trade modal supports quick and full modes.
- RR can auto-calculate from entry, stop loss, and take profit.
- Draft saving exists for partially completed trade forms.
- Unsaved changes guard prevents accidental modal close with dirty fields.
- Trade screenshots are uploaded to Supabase Storage, not stored directly as large base64 in database rows.
- Journal display intentionally hides entry/stop/target/pips for a cleaner archive view.

### Daily Planning

- Daily planning tab lives in `src/components/tabs/DailyTab.jsx`.
- Save/update logic lives in `saveDaily()` in `src/app/page.jsx`.
- Users can create daily plans with date, pairs in focus, day focus, per-pair views, session expectation, and daily screenshots.
- Per-pair notes are embedded in the `watchlist` field using `__FXEDGE_PAIR_NOTES__::`.
- Screenshots are serialized into `chartImage`.
- Draft and unsaved-change behavior is implemented.
- The UI was simplified by removing noisy key levels/notes sections from the modal.

### Weekly Planning

- Weekly planning tab lives in `src/components/tabs/WeeklyTab.jsx`.
- Save/update logic lives in `saveWeekly()` in `src/app/page.jsx`.
- Users can define week start/end, key economic events, per-pair weekly views, notes, and weekly screenshots.
- Pair notes and screenshots are embedded into `premiumDiscount`.
- Older weekly bias/targets/market structure fields still exist in the database payload for compatibility but are not central in the UI.
- Weekly review/debrief content is stored in `weekly_plans.review`.

### Analytics & Reports

- Dashboard stats are computed in `src/app/page.jsx` from filtered trades.
- Dashboard layout lives in `src/components/tabs/Dashboard.jsx`.
- Advanced analytics live in `src/components/tabs/Analytics.jsx` and `src/components/AdvancedStats.jsx`.
- Pair/session/setup distributions are visualized in `src/components/DashboardCharts.jsx`.
- Pair performance card ranks instruments by R and win rate.
- Today trade summary shows current-day executions.
- Export tab can export CSV data and generate a printable performance report.
- Pattern Detector builds rule-like insights from logged trades.

### Heatmap & Visualizations

- Calendar heatmap tab lives in `src/components/tabs/Heatmap.jsx`.
- Dashboard monthly heatmap lives in `src/components/MonthlyReturns.jsx`.
- Equity curve lives in `src/components/EquityCurve.jsx`.
- Recharts is now used for dashboard visualizations.
- Equity curve supports curve/trade/daily/drawdown-style analysis controls.
- Drawdown pane is shown below the main equity curve.
- Calendar heatmap supports clicking active green/red days to inspect trades and screenshots.
- Monthly returns heatmap shows month-by-month R totals and year totals.

### Psychology Tracking

- Psychology/Mind tab lives in `src/components/Psychology.jsx`.
- Trade logging includes `emotion` and `mistakes`.
- Dashboard/analytics can summarize mistake cost, best emotional state, and discipline patterns.
- AI analysis includes emotional patterns and coaching feedback.

### Playbook System

- Playbook tab lives in `src/components/tabs/Playbook.jsx`.
- It supports playbook/rule creation and weekly adherence-style review workflows.
- Trade setups, tags, notes, and outcomes are used to reason about playbook quality.
- This area is feature-rich but should be reviewed for persistence and duplication against Pattern Detector.

### AI Features

- AI Analysis tab lives in `src/components/tabs/AIAnalysis.jsx`.
- AI analysis API route lives in `src/app/api/analysis/route.js`.
- Gemini model used: `gemini-2.5-flash-lite`.
- Weekly debrief API route lives in `src/app/api/weekly-debrief/route.js`.
- Vercel cron automatically triggers Sunday weekly debrief generation.
- Debrief uses Gemini to summarize weekly trades, plans, psychology, mistakes, and next actions.
- Brevo sends the weekly debrief email.
- Screenshot autofill API route exists with Gemini/Groq fallback but appears likely unused after autofill was removed from the TradeModal.
- AI Coach card on Dashboard can generate a short coaching note from actual data.

### Pre-Trade Checklist

- Checklist constants still exist in `src/lib/constants.js` as `CHECKLIST_RULES`.
- Earlier pre-trade gate/checklist UX was intentionally simplified because it felt annoying.
- Current product direction is lighter friction: log faster, review later.
- If brought back, it should be optional and compact rather than a blocking modal.

### Screenshot Management

- Shared image input components live in `src/components/ui.jsx`.
- Image helpers live in `src/lib/utils.js`.
- Supported screenshot contexts:
  - Trade pre-chart
  - Trade post-chart
  - Daily plan screenshots
  - Weekly plan screenshots
  - Missed trade screenshots
- Screenshots upload to Supabase Storage bucket `journal-images`.
- Database rows store public URLs or serialized lists.
- Delete logic attempts to remove storage objects when deleting corresponding trades/plans/missed trades.
- Screenshot gallery lives in `src/components/tabs/ScreenshotGallery.jsx`.
- Image viewer state is managed in `src/app/page.jsx`.

### Export & Import

- Export tab lives in `src/components/tabs/ExportTab.jsx`.
- CSV exports exist for:
  - All trades
  - Daily plans
  - Performance summary
- Printable/PDF-style performance report generation exists using a new window and print flow.
- Screenshots are intentionally excluded from CSV exports due to file size.
- No full import flow was found.

### UI/UX Polish

- Three themes are defined in `src/lib/constants.js`: `VOID`, `PAPER`, and `BRUTALIST`.
- Theme swatches are shown in the lower-left sidebar.
- Theme preference persists to localStorage key `fx-theme` and syncs to user metadata.
- Topbar is compact and sticky.
- Date range filter exists globally, hidden on tabs where it is not useful.
- Framer Motion is installed and used for:
  - Tab/content transitions
  - Modal presence/entry
  - KPI number animation
  - Hover lift on cards
- shadcn components have been initialized in `src/components/ui/*`.
- Sonner toasts are available globally.
- Toast deduplication exists in `page.jsx` to avoid stacking identical messages within 2 seconds.
- Skeleton/loading states exist in shared UI and loading logic.
- Keyboard shortcuts exist:
  - `n`: open new trade
  - `d`: Daily
  - `j`: Journal
  - `w`: Weekly
  - `a`: Analytics
  - `h`: Heatmap
  - `Escape`: close modal
- Command palette component exists but the visible topbar command entry was removed.

### Mobile Optimizations

- `globals.css` and injected CSS in `buildCSS(T)` include mobile breakpoints around `768px`.
- Mobile bottom navigation uses compact labels/icons through primary tabs and More menu.
- Tabs are kept mounted to reduce reset/reload feeling when switching.
- Scroll positions are preserved per tab.
- Modals adapt to smaller screens.
- KPI strip uses responsive layout.
- Session pill, date display, and topbar compress on mobile.
- Mobile polish has been an ongoing focus, especially for dashboard visibility and modal density.

## Design System

### Theme tokens

Every active theme exposes these tokens:

| Token | Purpose |
|---|---|
| `T.bg` | Page background |
| `T.surface` | Main card/panel surface |
| `T.surface2` | Secondary/inset surface |
| `T.border` | Borders and dividers |
| `T.text` | Primary text |
| `T.textDim` | Secondary readable text |
| `T.muted` | Disabled/faint text |
| `T.accent` | Primary accent |
| `T.accentBright` | Bright accent |
| `T.green` | Win/profit |
| `T.red` | Loss |
| `T.amber` | Caution/neutral |
| `T.pink` | Secondary accent |
| `T.isDark` | Boolean dark mode flag |

### Themes

| Theme | Key | Personality |
|---|---|---|
| VOID | `dark` | Primary dark professional terminal/trader interface |
| PAPER | `light` | Clean light mode |
| BRUTALIST | `brutalist` | High-contrast, harder-edged variant |

### Fonts

- UI font: Geist, loaded in `src/app/layout.js`.
- Mono/numeric font: Geist Mono from layout and JetBrains Mono imported in injected CSS.
- Some older components/docs still reference removed font ideas, so font usage should be audited.

### Component library

- FXEDGE custom primitives in `src/components/ui.jsx`.
- shadcn primitives in `src/components/ui/*`.
- Recharts for charts.
- Framer Motion for animation.
- TanStack Table for Journal data model.

### Animation patterns

- Modal slide/fade entrance with Framer Motion.
- Tab content fade/slide transitions.
- KPI counters animate when value changes.
- Clickable cards use subtle hover lift.
- Reduced motion is respected in global CSS.

### Mobile breakpoints

- Main breakpoint used: `max-width: 768px`.
- Mobile adjustments include app layout, sidebar/mobile nav, topbar, modals, grid collapse, and KPI layout.
- Dashboard also contains ultra-wide layout logic in `Dashboard.jsx`.

## Integrations

### Supabase

Supabase provides:

- Authentication through magic links.
- Postgres database for trades, daily plans, weekly plans, missed trades, calendar cache, and waitlist.
- Storage bucket `journal-images` for screenshots.
- User metadata for theme persistence.

Client setup:

- Browser client: `src/lib/supabase.js`.
- Server auth callback: `src/app/auth/callback/route.js`.
- Service role usage: `src/app/api/weekly-debrief/route.js`.

### Gemini AI

Gemini is used for:

- Manual AI Analysis tab.
- Dashboard AI Coach short note.
- Weekly debrief generation.
- Screenshot autofill route, if re-enabled.

Environment variables:

- `GEMINI_API_KEY`

Models observed:

- `gemini-2.5-flash-lite`
- `gemini-2.0-flash` in screenshot autofill route

### Groq

Groq is used as fallback in screenshot autofill.

Environment variables:

- `GROQ_API_KEY`

Model observed:

- `meta-llama/llama-4-scout-17b-16e-instruct`

### Brevo SMTP/API

Brevo is used for weekly debrief transactional email.

Environment variables:

- `BREVO_API_KEY`
- `BREVO_FROM_EMAIL`
- `BREVO_FROM_NAME`

Supabase magic-link email may also use Brevo SMTP from Supabase dashboard settings, but that is external to the codebase.

### Vercel deployment

- Production deployment target: Vercel.
- Domain: `fxedge.online`.
- `vercel.json` contains cron schedule.
- Vercel Analytics is enabled through `@vercel/analytics/next`.

### Cron jobs

| Cron | Path | Purpose |
|---|---|---|
| `30 15 * * 0` | `/api/weekly-debrief` | Generate and email weekly trading debriefs every Sunday |

15:30 UTC is 21:00 IST on Sunday.

### Webhooks

No external webhook receiver was found. The weekly debrief is cron-triggered, not webhook-triggered.

## Recent Changes (Last 30 Days)

This summary is based on git history in the repository.

### 2026-05-01: Dashboard and chart system work

- Added and refined Recharts dashboard visualizations.
- Added trade ladder/equity chart modes.
- Fixed dashboard layout repeatedly for wide/ultra-wide screens.
- Added monthly heatmap rail to dashboard.
- Improved dashboard analytics card spacing.
- Initialized shadcn design system migration.
- Refined date range toolbar.
- Added Framer Motion animations.
- Added command palette, bento dashboard work, and TanStack Journal data model.

Representative commits:

- `d116383 Fix dashboard analytics card spacing`
- `5ff3f2a Improve ultra wide dashboard layout`
- `bc81661 Fill dashboard heatmap and align cards`
- `85d8ada Fix dashboard grid alignment`
- `5a1ab63 Organize dashboard layout`
- `40a48f3 Initialize shadcn design system migration`
- `f9374a4 Expand dashboard Recharts analytics`
- `fbf8e2a Upgrade equity curve with Recharts`
- `cda5935 Add command palette bento dashboard and TanStack journal`
- `5213914 Add premium Framer Motion animations`

### 2026-04-30: UI polish and design rules

- Simplified missed trade logging.
- Polished navigation labels.
- Added full UI polish passes to remove decorative gradients, normalize fonts, and clean surfaces.
- Added project context to `AGENTS.md`.
- Redesigned key dashboard pieces around compact serious-trader UI.
- Added premium theme and typography work.

Representative commits:

- `e66663f Simplify missed trade logging`
- `e662454 Polish navigation labels`
- `e782b65 Codex: full UI polish pass - remove decorative gradients, normalize fonts, clean surfaces`
- `c481f70 Update AGENTS.md with full project context for Codex`
- `9c8be27 Premium redesign: Geist font, Y-axis equity curve, drawdown chart, monthly returns heatmap`
- `797ef02 feat: premium design pass, 3-theme system, landing page overhaul, equity curve polish`

### 2026-04-29: Journal simplification

- Cleaned journal filters and tags.
- Simplified trade cards.
- Removed noisy entry/stop/target/pips display from Journal cards.
- Added cleaner pair dropdown/filter approach.

Representative commits:

- `bf25152 Clean journal filters and tags`
- `6e01ece Simplify journal trade cards`

### 2026-04-26 to 2026-04-27: Landing page, calendar, PWA, missed trades, patterns

- Added waitlist request-access flow.
- Built Phantom-style landing page and mobile responsiveness.
- Added Supabase PKCE auth callback.
- Added Pattern Detector and PDF report export.
- Added Economic Calendar with Supabase cache fallback.
- Added Missed Trades section.
- Added multi-theme picker with Supabase persistence.
- Added global date range filter.
- Added proactive AI insights.
- Added image compression.

Representative commits:

- `632a9f8 docs: add CLAUDE.md with comprehensive project context`
- `c0ab929 feat: waitlist request access`
- `dd913a0 feat: full mobile responsive layout for landing page`
- `4cd3916 feat: Phantom landing page`
- `0570389 fix: add Supabase PKCE auth callback route`
- `b640dd6 feat: Pattern Detector + PDF report export`
- `b34d77a feat: Economic Calendar with Supabase cache fallback`
- `17b9ded feat: Missed Trades section`
- `667f94e feat: multi-theme picker with per-user Supabase persistence`
- `6b69d2a feat: add global date range filter across all trade tabs`

### 2026-04-15 to 2026-04-17: Refactor and UX foundation

- Split large monolithic `page.jsx` into components.
- Added keyboard shortcuts, skeleton loaders, smart defaults.
- Fixed missing imports from earlier component extraction.
- Added PWA install, toast notifications, tab fades.
- Added clickable equity dots, journal date grouping, simplified playbook.
- Extracted `lib`, shared `ui`, and `TradeModal`.
- Added screenshot autofill with Gemini primary and Groq fallback.

Representative commits:

- `4f471fd refactor: split 3200-line page.jsx monolith into dedicated component files`
- `e051059 feat: complete Tier 2 UX polish - keyboard shortcuts, skeleton loader, smart defaults`
- `f2c1875 fix: add missing serializeImageList and fmtRR imports`
- `f2cb309 feat: PWA install, keyboard shortcuts, toast notifications, tab fade`
- `1c8c626 feat: clickable equity curve dots, journal date grouping, simplified playbook`
- `161a1aa feat: extract lib/, components/ui, TradeModal + add Quick Log & Screenshot Autofill`
- `4c31df1 feat: Gemini-primary + Groq-fallback for screenshot autofill`

### 2026-04-07 to 2026-04-08: Storage and weekly debrief

- Added Sunday Gemini weekly debrief emails.
- Polished weekly debrief email layout.
- Cleaned weekly debrief AI output.
- Moved screenshots to Supabase Storage.
- Added screenshot cleanup.
- Reduced startup payload for faster journal load.

Representative commits:

- `9d80f11 Add Sunday Gemini weekly debrief emails`
- `d0e482b Polish weekly debrief email layout`
- `e92bc0e Clean weekly debrief AI output`
- `59eadc8 Move screenshots to Supabase Storage`
- `a49341a Fix storage screenshot cleanup`
- `913b0f1 Reduce startup payload for journal load`

## Known Issues / Tech Debt

### Documentation drift

- `AGENTS.md` still says "No Tailwind" and "inline styles only", but current code now includes Tailwind v4, shadcn config, and `src/components/ui/*`.
- `CLAUDE.md` contains older notes about fonts, styling, and table names that no longer fully match the app.
- `README.md` is still the default Next.js starter README.
- `PRODUCT.md`, `AGENTS.md`, and some source files contain mojibake characters from encoding issues.

### Encoding/mojibake

Several files include corrupted text in comments or older UI strings. Examples include mojibake sequences, broken box-drawing characters, or double-encoded UTF-8.

Files with visible examples include:

- `src/lib/constants.js`
- `src/lib/utils.js`
- `src/components/tabs/Heatmap.jsx`
- `src/components/tabs/AIAnalysis.jsx`
- `src/components/tabs/WeeklyReview.jsx`
- `src/components/tabs/ExportTab.jsx`
- `PRODUCT.md`
- `AGENTS.md`

Most important user-facing strings appear to have been cleaned, but a full encoding sweep is still needed.

### Mixed styling architecture

The app currently uses:

- Inline styles and theme tokens.
- Injected CSS from `buildCSS(T)`.
- Global CSS layout classes.
- Tailwind v4.
- shadcn components.

This is workable, but future design work should choose a clear direction to avoid duplicated patterns.

### Supabase verification needed

Live schema and RLS verification could not be completed because Supabase schema access required reauthentication. Before schema-sensitive work, verify:

- Exact column types.
- RLS policies on all user-owned tables.
- `calendar_cache` policy safety.
- Storage bucket public/authenticated policies.
- Whether old `entry/sl/tp` columns still exist on `missed_trades`.

### Legacy/dead code candidates

- `@supabase/auth-helpers-nextjs` is deprecated and may be removable after confirming no active imports.
- `CommandPalette.jsx` appears likely unused after the command button was removed.
- `src/app/api/screenshot-autofill/route.js` may be unused after screenshot autofill was removed from TradeModal.
- `CHECKLIST_RULES` exists but the pre-trade checklist is no longer active as a core flow.
- Root debug artifact `page4-debug.jsx` appears to be an old large debug file and should be reviewed before deletion.

### Export tab polish

- `ExportTab.jsx` has older font references and mojibake text/icons.
- It should be aligned with Geist, theme tokens, and the current serious-trader UI style.

### Type safety

- The app is JavaScript-only.
- No generated Supabase types exist.
- A future TypeScript migration would reduce breakage from missing imports, wrong field names, and schema drift.

### Testing and reliability

- No dedicated test suite was found.
- Build catches syntax/runtime import issues, but not all client-only runtime paths.
- A minimal smoke-test checklist would help: login, log trade, upload screenshots, daily save, weekly save, delete with storage cleanup, weekly debrief test, export.

## Roadmap (if AGENTS.md exists)

`AGENTS.md` exists, but it does not contain a dedicated upcoming-features roadmap section. It mainly defines stack, architecture, styling rules, design principles, deploy workflow, and recent changes.

Current roadmap implied by the project state:

- Verify Supabase schema, RLS, and storage policies live.
- Clean documentation drift between `AGENTS.md`, `CLAUDE.md`, and current code.
- Decide whether to continue the Tailwind/shadcn migration or keep custom inline-token primitives as the primary system.
- Clean mojibake/encoding issues across docs and source comments.
- Remove or re-enable dead code paths like Command Palette and screenshot autofill.
- Continue dashboard layout hardening for mobile, desktop, and ultra-wide screens.
- Consider TypeScript plus generated Supabase types once UI direction stabilizes.
- Keep trade logging fast and low-friction, with optional rather than blocking checklist behavior.

