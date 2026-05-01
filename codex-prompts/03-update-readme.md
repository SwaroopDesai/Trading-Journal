# Prompt: Update README.md

Read `AGENTS.md` first.

## Task
Replace the default Next.js README with a proper FXEDGE README.

## File to update
`README.md` in repo root.

## Use this content

```markdown
# FXEDGE

> Premium trading journal for ICT/SMC forex traders.

**Live:** [fxedge.online](https://fxedge.online)

## What it does

A trading journal built specifically for forex traders using ICT (Inner Circle Trader) or SMC (Smart Money Concepts) methodology. Track every trade with the fields that matter: Kill Zones, manipulation type, POI, daily bias, weekly bias.

### Features
- 📊 Full analytics dashboard with equity curve and drawdown
- 📅 Daily and weekly bias planning
- 🎯 Pre-trade checklist
- 🧠 Psychology and mistake tracking
- 📈 Monthly P&L heatmap with calendar drilldown
- 🤖 AI coaching (Gemini) on your actual trade data
- 📷 Screenshot gallery
- 📤 CSV exports + printable reports
- 🌙 Dark / light / brutalist themes
- ⌨️ Full keyboard shortcuts
- 📱 Mobile-first responsive

## Tech stack

- Next.js 16 (App Router)
- React 19
- Supabase (auth + Postgres + Storage)
- Tailwind CSS v4 + shadcn/ui
- Framer Motion
- Recharts
- TanStack Table
- Gemini AI
- Brevo email
- Vercel hosting + cron

## Getting started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

### Required env vars

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
BREVO_API_KEY=
BREVO_FROM_EMAIL=
BREVO_FROM_NAME=
CRON_SECRET=
\`\`\`

## Project structure

See `AGENTS.md` for the full architecture overview.

## Built with AI

This project was built primarily with AI tools — Claude, Codex, and Claude Code. Every component was written through conversation. The repo is a working example of what's possible when a domain expert pairs with AI agents.

## License

MIT
```

## Verification
1. Open README on GitHub after pushing
2. Confirm it renders properly with formatting
3. Confirm no leftover Next.js boilerplate

## Commit message
```
docs: replace Next.js boilerplate README with FXEDGE README
```
