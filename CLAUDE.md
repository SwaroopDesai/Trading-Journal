# FXEDGE — AI-Powered Trading Journal

## What This Project Is
FXEDGE is a personal forex/index trading journal built for serious traders. It lets users log trades, track patterns, run pre-trade checklists, review their week with AI, and stay on top of economic news. The landing page is at **fxedge.online**.

---

## Tech Stack
| Layer | Tool |
|---|---|
| Framework | Next.js 16.2.1 (App Router) |
| Styling | Inline styles + CSS-in-JSX (no Tailwind) |
| Database + Auth | Supabase (magic link OTP via `@supabase/ssr`) |
| Email delivery | Brevo (SMTP for magic link emails) |
| Hosting | Vercel (production at fxedge.online) |
| Domain | GoDaddy → fxedge.online |
| Fonts | Cabinet Grotesk + Satoshi via Fontshare CDN |

---

## Project Structure
```
src/
  app/
    page.jsx              # Main journal app (dashboard, all tabs)
    layout.jsx            # Root layout
    auth/callback/route.js # Supabase PKCE code exchange (server-side)
    api/
      analysis/           # AI trade analysis endpoint
      news/               # Economic news/calendar endpoint
      weekly-debrief/     # AI weekly performance summary
      screenshot-autofill/ # Auto-fill trade form from chart screenshot
  components/
    LoginScreen.jsx       # Landing page + waitlist + login modal (Phantom design)
    GlowBtn.jsx           # Cursor-tracked radial glow CTA button
    ui.jsx                # Shared UI components (Card, Btn, etc.)
  lib/
    constants.js          # All theme tokens, trading option arrays, session windows
```

---

## Authentication Flow
- Uses **Supabase magic link OTP** (no passwords)
- Email sent via **Brevo** SMTP
- Uses **PKCE flow** via `@supabase/ssr` — requires server-side code exchange
- `/auth/callback/route.js` handles the code → session exchange
- Redirect URLs whitelisted in Supabase:
  - `https://trading-journal-ecru-ten.vercel.app/`
  - `https://fxedge.online/auth/callback`
  - `https://www.fxedge.online/auth/callback`
- **New signups are currently DISABLED** in Supabase (waitlist mode)
- Existing users can still log in via the "Log In" nav button

---

## Landing Page (LoginScreen.jsx) — "Phantom" Design
Dark immersive design with:
- **Ghost cursor** — 20-point canvas trail with purple glow (#B19EEF), FBM jitter, bloom dot
- **Cabinet Grotesk** display font, **Satoshi** body font
- Purple accent: `#B19EEF`, background: `#050505`
- Fixed nav with logo + "Log In" button (opens login modal)
- Hero with animated glow blob + **waitlist form** (email → request access)
- "Why traders fail" section (pain points in red cards)
- Features section (3 cards: Log Every Trade, See Your Patterns, Trade With Discipline)
- AI Features section (AI Trade Review, Weekly Debrief, Smart News Filter)
- Economic Calendar section (mock UI showing NFP, CPI, FOMC events)
- "Available Everywhere" mobile section
- CTA section: "KNOW YOUR EDGE."
- Fully mobile responsive (breakpoints at 768px and 390px using clamp() for hero title)

---

## Waitlist System
- Supabase table: `waitlist` (columns: id, email, created_at, status)
- RLS policy: anyone can INSERT
- Hero form → submits email to waitlist table
- Duplicate emails show "You're already on the list!"
- Nav "Log In" → separate modal → magic link for existing users
- To approve someone: Supabase → Authentication → Users → Invite user

---

## Theme System (constants.js)
Five themes: `dark-green`, `dark-blue`, `dark-amber`, `light`, `brutalist`

Each theme has tokens:
```js
{ bg, surface, surface2, border, text, textDim, muted,
  accent, accentBright, green, red, amber, blue, pink,
  cardGlow, isDark, glowRgb }
```
Brutalist theme also has: `hardShadow`, `sidebarBg`, `accentFill`

Theme is stored in localStorage. `buildCSS(T)` in `page.jsx` generates all app CSS and detects brutalist via `!!T.hardShadow`.

---

## GlowBtn Component (GlowBtn.jsx)
Interactive CTA button with:
- Cursor-tracked radial glow via `useRef` + direct DOM manipulation
- Magnetic drift effect on hover
- Right-arrow SVG (optional)
- Props: `glowColor` (RGB string), `showArrow`, `style`, `onClick`, `disabled`
- Used in `ui.jsx` `Btn` component for non-ghost, non-danger buttons (theme-aware glow colour via `T.glowRgb`)

---

## Key Trading Constants (constants.js)
```js
PAIRS = ["EURUSD","GBPUSD","USDCAD","GER30","SPX500","NAS100"]
SESSIONS = ["London","New York","Asian","London/NY Overlap"]
SETUPS = ["Manipulation + POI","Liquidity Sweep","Breaker Block","Order Block","Fair Value Gap","CHoCH + BOS","Kill Zone Entry","Other"]
MISTAKES = ["Moved SL","FOMO Entry","Ignored Bias","Wrong Session","Over-leveraged","No Confirmation","Revenge Trade","None"]
EMOTIONS = ["Calm & Focused","Confident","Anxious","Impatient","Revenge Mode","Bored","Overconfident","Fearful"]
HIGH_IMPACT = ["NFP","Non-Farm","CPI","GDP","FOMC","Interest Rate","Fed","Inflation","Unemployment","Retail Sales","PPI","ECB","BOE"]
```

Pre-trade checklist rules in `CHECKLIST_RULES` (bias, manipulation, kill zone, POI, risk, higher TF, no revenge).

---

## Supabase Tables
- `trades` — trade logs (pair, date, direction, session, setup, entry, sl, tp, result, rr, pips, emotion, mistakes, notes, tags)
- `daily_notes` — daily planning journal
- `weekly_notes` — weekly review
- `missed_trades` — trades the user saw but didn't take
- `waitlist` — request access emails (id, email, created_at, status)

Field select strings for each table are in `constants.js` as `TRADE_BOOT_FIELDS`, `DAILY_BOOT_FIELDS`, etc.

---

## Claude Code Skills & Plugins Used
These were used during development in Claude Code (the AI coding assistant):

| Skill / Plugin | What it was used for |
|---|---|
| `vercel:deploy` | Deploying to Vercel production (`vercel --prod`) |
| `vercel:status` | Checking deployment status and domain config |
| `anthropic-skills:chart-analysis-ict` | Analysing trading chart screenshots |
| `superdesign` (CLI tool) | Fetching AI-generated design drafts for the landing page |
| `GlowBtn` (custom component) | Built as part of the "GlowBtn everywhere" skill session |

### Superdesign
- CLI tool: `superdesign get-design --draft-id <id>`
- Used to fetch the "Phantom" landing page design spec
- Draft used: `303002f8-dfdc-4a67-9419-4fb6f53c4474`
- Project: `a0113514-3df4-4776-9e32-8b613af0566c` (FXEDGE - Master Your Edge)

---

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_KEY=
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=journal-images
```
Set in Vercel dashboard and `.env.local` locally.

---

## Deployment
- **Production URL**: https://fxedge.online (also https://trading-journal-ecru-ten.vercel.app)
- Deploy command: `vercel --prod` (Vercel CLI must be installed: `npm i -g vercel`)
- Build command: `npx next build`
- Always run build locally before deploying to catch errors

---

## Important Notes
- PowerShell is used (not bash) — `&&` is NOT supported, use `;` instead
- Git commit messages with apostrophes can break PowerShell heredocs — keep them simple
- The `GradientHeading` component must have `className` forwarded — it was a bug that caused mobile styles not to apply
- `cursor: none` is applied globally on the landing page (Phantom design) but auto-disabled on mobile via media query
- The Vercel CLI is installed globally: `npm i -g vercel`
