# Prompt: Finish shadcn/ui Migration (Phased)

Read `AGENTS.md` and `STYLING.md` first.

## Task
Migrate FXEDGE from inline styles to Tailwind + shadcn/ui in a controlled, phased way. **Do not migrate everything at once.**

## Why this is risky
- 14 tabs, 15+ components
- Three themes that all need to keep working
- Real users on the live site
- Migration errors break production

## Strategy: One component per session

For each component:
1. Read the current implementation
2. Identify shadcn equivalents
3. Migrate JSX to Tailwind classes
4. Remove `T` theme prop usage in that file
5. Add shadcn primitives where appropriate
6. Test all 3 themes (VOID, PAPER, BRUTALIST)
7. Test mobile (768px breakpoint)
8. Commit

## Phase 1: Easy wins (do these first)

### Components to migrate first (low risk, high visual impact)
1. `src/components/ui/Btn` (any custom button) → shadcn `Button`
2. `Badge` component → shadcn `Badge`
3. `Card` wrapper → shadcn `Card`
4. `Inp`, `Sel`, `Textarea` → shadcn `Input`, `Select`, `Textarea`
5. `Overlay` modal → shadcn `Dialog`

### Process per component
For each one:
- Locate every usage in the codebase (Find All References)
- Update the primitive to use shadcn
- Update all callsites to use new API
- Test thoroughly

## Phase 2: Tabs (one at a time)

Order of migration:
1. Calculator (simplest)
2. Export (mostly buttons)
3. Gallery (image grid)
4. Playbook
5. Daily
6. Weekly
7. Heatmap (complex — Recharts already works)
8. Analytics (most complex)
9. Dashboard (last — most callsites)

## Phase 3: Modals
1. TradeModal (most complex, largest)
2. MissedTradeModal
3. PlaybookModal

## Phase 4: Cleanup
1. Remove `buildCSS(T)` injected CSS once nothing uses it
2. Remove unused theme tokens
3. Remove `T` prop drilling once all components migrated

## Tailwind theme config

Update `tailwind.config.js` to expose FXEDGE colors as CSS vars that match all 3 themes:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        muted: "hsl(var(--muted))",
        primary: "hsl(var(--primary))",
        // ... map all FXEDGE tokens
      }
    }
  }
}
```

In `globals.css`, define vars per theme:
```css
:root,
[data-theme="paper"] {
  --background: 0 0% 96%;
  --foreground: 240 10% 4%;
  /* ... */
}
[data-theme="void"] {
  --background: 240 6% 8%;
  --foreground: 0 0% 96%;
  /* ... */
}
[data-theme="brutalist"] {
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
  /* ... */
}
```

## Verification per phase

After each phase:
1. `npm run build` — must succeed
2. Test all 3 themes by toggling
3. Test mobile (Chrome DevTools)
4. Test these flows:
   - Login
   - Log a trade with screenshot
   - Edit a trade
   - Save daily plan
   - Save weekly plan
   - Switch all tabs
   - Logout

## What NOT to do
- Don't migrate more than one component per commit
- Don't break the theme system mid-migration
- Don't migrate when in a hurry
- Don't remove `T` prop until all consumers are migrated

## Commit message format
```
refactor: migrate {ComponentName} to shadcn/Tailwind
```
