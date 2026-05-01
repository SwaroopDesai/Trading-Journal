# FXEDGE

> Premium trading journal for ICT/SMC forex traders.

**Live:** [fxedge.online](https://fxedge.online)

## What It Does

FXEDGE is a trading journal built specifically for forex traders using ICT (Inner Circle Trader) and SMC (Smart Money Concepts) methodology. It tracks every trade with the fields that matter: kill zones, manipulation type, POI, daily bias, weekly context, psychology, screenshots, and R-based performance.

## Features

- Full analytics dashboard with equity curve and drawdown
- Daily and weekly bias planning
- Pre-trade checklist and pattern tracking
- Psychology and mistake tracking
- Monthly P&L heatmap with calendar drilldown
- AI coaching with Gemini on real trade data
- Weekly AI debrief emails via Brevo
- Screenshot gallery for pre/post trade review
- Missed trade logging with opportunity-cost tracking
- Economic calendar with cached red-folder news
- CSV exports and printable reports
- Dark, light, and brutalist themes
- Keyboard shortcuts
- Mobile-first responsive experience

## Tech Stack

- Next.js 16 App Router
- React 19
- Supabase Auth, Postgres, and Storage
- Tailwind CSS v4 and shadcn/ui
- Framer Motion
- Recharts
- TanStack Table
- Gemini AI
- Groq fallback AI
- Brevo email
- Vercel hosting and cron

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
BREVO_API_KEY=
BREVO_FROM_EMAIL=
BREVO_FROM_NAME=
CRON_SECRET=
```

`NEXT_PUBLIC_SUPABASE_KEY` is the Supabase anon/public key used by the current app code.

## Project Structure

See [AGENTS.md](./AGENTS.md) for the full architecture overview, database schema, design system rules, and agent workflow.

## Styling Direction

See [STYLING.md](./STYLING.md) for the styling rules. New components use Tailwind CSS v4 + shadcn/ui. Existing inline-styled components should stay inline unless they are being intentionally migrated.

## Built With AI

This project was built primarily with AI tools: Claude, Codex, and Claude Code. Every major component was shaped through conversation, iteration, and hands-on testing. The repo is a working example of what is possible when a domain expert pairs with AI agents.

## License

MIT
