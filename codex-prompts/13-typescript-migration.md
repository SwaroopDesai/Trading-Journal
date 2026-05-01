# Prompt: TypeScript Migration (Long-term)

Read `AGENTS.md` first.

## Task
Migrate FXEDGE from JavaScript to TypeScript. This is a multi-week project — do it in phases.

## Why bother
- Catches schema drift bugs before runtime
- Auto-complete for Supabase queries
- Refactoring becomes safer
- Onboarding contributors easier

## Why hold off
- Working app, no current bugs from missing types
- Lots of files to migrate
- Risk of breaking working code

## When to do it
Only after:
- ✅ All cleanup tasks done (01-07)
- ✅ shadcn migration mostly complete
- ✅ Codebase is stable
- ✅ You have a free week to focus

## Phase 1: Setup (1 day)

### Install TypeScript
```bash
npm install -D typescript @types/react @types/node @types/react-dom
```

### Generate Supabase types
```bash
npx supabase gen types typescript --project-id mrdtmaihghmkbilhqjgo > src/lib/database.types.ts
```

### Create tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Create types.ts in src/lib
```ts
// src/lib/types.ts
import type { Database } from "./database.types";

export type Trade = Database["public"]["Tables"]["trades"]["Row"];
export type DailyPlan = Database["public"]["Tables"]["daily_plans"]["Row"];
export type WeeklyPlan = Database["public"]["Tables"]["weekly_plans"]["Row"];
export type MissedTrade = Database["public"]["Tables"]["missed_trades"]["Row"];

export interface Theme {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textDim: string;
  muted: string;
  accent: string;
  accentBright: string;
  green: string;
  red: string;
  amber: string;
  pink: string;
  isDark: boolean;
}
```

## Phase 2: Migration order (1 file per session)

### Easy first
1. `src/lib/utils.ts` — pure functions, easy types
2. `src/lib/constants.ts` — types for theme tokens
3. `src/lib/supabase.ts` — Supabase client

### Then components (small to large)
4. `src/components/ui.tsx`
5. `src/components/MoreMenu.tsx`
6. `src/components/InsightCards.tsx`
7. `src/components/DateRangeBar.tsx`
8. `src/components/MonthlyReturns.tsx`
9. `src/components/EquityCurve.tsx`
10. `src/components/DashboardCharts.tsx`
11. `src/components/LoginScreen.tsx`
12. `src/components/OnboardingFlow.tsx`
13. `src/components/TradeModal.tsx`
14. `src/components/MissedTradeModal.tsx`

### Then tabs
15. Calculator.tsx
16. Export.tsx
17. Gallery.tsx
18. (etc — least complex first)

### Then API routes
19. `src/app/api/analysis/route.ts`
20. `src/app/api/news/route.ts`
21. `src/app/api/weekly-debrief/route.ts`

### Then app shell (last)
22. `src/app/page.tsx` — biggest file, do last

## Per-file process

For each file:
1. Rename `.jsx` → `.tsx` (or `.js` → `.ts`)
2. Add types to props
3. Add types to state
4. Add types to function parameters and returns
5. Fix all TypeScript errors
6. Verify the page still works in browser
7. Commit

## Patterns

### Component props
```ts
interface DashboardProps {
  T: Theme;
  stats: any; // tighten later
  trades: Trade[];
}

export default function Dashboard({ T, stats, trades }: DashboardProps) {
  // ...
}
```

### useState with types
```ts
const [trades, setTrades] = useState<Trade[]>([]);
```

### Supabase queries are auto-typed
```ts
const { data, error } = await supabase
  .from("trades")
  .select("*")
  .eq("user_id", user.id);
// data is now Trade[] | null automatically
```

## Strict mode (later)

Once everything is migrated, enable strict mode in tsconfig.json:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

This will reveal more issues. Fix them gradually.

## What NOT to do
- Don't migrate everything in one PR
- Don't enable strict mode until everything compiles
- Don't add types you'll throw away later
- Don't migrate unstable areas (still being changed)

## Verification per file
- TypeScript compiles: `npx tsc --noEmit`
- Build succeeds: `npm run build`
- Page works in browser

## Commit message format
```
refactor(ts): migrate {filename} to TypeScript
```
