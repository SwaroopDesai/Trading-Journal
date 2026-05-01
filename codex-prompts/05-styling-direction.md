# Prompt: Commit to Styling Direction

Read `AGENTS.md` first.

## Task
Document the styling direction so future code is consistent. Right now the codebase has inline styles + Tailwind + shadcn mixed which causes confusion.

## Decision
Going forward:
- **NEW components:** Tailwind CSS v4 + shadcn/ui
- **EXISTING inline-styled components:** leave alone unless explicitly migrating
- **NEVER mix** inline `style={{}}` with Tailwind classes in the same component
- Theme tokens (`T.bg`, `T.surface` etc) still work for legacy components

## What to do

### 1. Add styling rules to `AGENTS.md`
Find the "Critical Rules for AI Agents" section. Confirm it has:

```markdown
### Styling direction (PICK ONE)
The codebase has inline styles + Tailwind + shadcn mixed. Going forward:
- NEW components: use Tailwind + shadcn
- EXISTING inline-styled components: leave alone unless explicitly migrating
- NEVER mix inline `style={{}}` with Tailwind classes in the same component
- Use `T` theme tokens for legacy components, Tailwind classes for new ones
```

### 2. Create a styling guide
Create `STYLING.md` in repo root with:

```markdown
# FXEDGE Styling Guide

## Two systems coexist

### Legacy: Inline styles + theme tokens
Used in: `src/components/ui.jsx`, all `src/components/tabs/*` (most), TradeModal, EquityCurve

\`\`\`jsx
<div style={{ background: T.surface, padding: 14 }}>
  ...
</div>
\`\`\`

### Modern: Tailwind + shadcn
Used in: `src/components/ui/*`, new components going forward

\`\`\`jsx
<div className="bg-card p-4 rounded-lg">
  ...
</div>
\`\`\`

## Rules

1. **Don't mix in same component.** Pick one and stick with it within a single file.
2. **For new code:** prefer Tailwind + shadcn.
3. **For bug fixes in legacy code:** keep inline styles consistent with the rest of the file.
4. **For theme colors in Tailwind:** use shadcn CSS vars or extend theme to use FXEDGE tokens.

## Theme tokens reference

When using inline styles, all themes expose:

\`\`\`
T.bg, T.surface, T.surface2, T.border
T.text, T.textDim, T.muted
T.accent, T.accentBright
T.green, T.red, T.amber, T.pink
T.isDark
\`\`\`

## Tailwind equivalents

When using Tailwind, configure in `tailwind.config` to map FXEDGE tokens:

\`\`\`js
// roughly
T.surface       → bg-card
T.surface2      → bg-muted
T.border        → border
T.text          → text-foreground
T.textDim       → text-muted-foreground
T.green         → text-green-500 / bg-green-500
T.red           → text-red-500 / bg-red-500
T.accent        → text-primary / bg-primary
\`\`\`

## When to migrate a legacy component

Migrate ONLY when:
- Significantly redesigning that component
- Bug is hard to fix with inline styles
- Adding shadcn primitive (e.g. shadcn Dialog instead of custom modal)

Don't migrate just for consistency. Stability > purity.
```

### 3. Update README and AGENTS.md to reference STYLING.md

## What NOT to do
- Don't actually migrate any components in this task
- Don't change any existing UI
- Documentation only

## Commit message
```
docs: commit to styling direction (Tailwind+shadcn for new, inline for legacy)
```
