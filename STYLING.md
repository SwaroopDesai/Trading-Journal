# FXEDGE Styling Guide

## Two Systems Coexist

FXEDGE currently has legacy inline-styled components and newer Tailwind/shadcn components. Both are allowed, but they should not be mixed inside the same component.

## Legacy: Inline Styles + Theme Tokens

Used in:

- `src/components/ui.jsx`
- Most files in `src/components/tabs/`
- `src/components/TradeModal.jsx`
- `src/components/EquityCurve.jsx`

Example:

```jsx
<div style={{ background: T.surface, padding: 14 }}>
  ...
</div>
```

Legacy components receive the active theme as a `T` prop. Keep using `T` tokens when editing these files.

## Modern: Tailwind + shadcn

Used in:

- `src/components/ui/*`
- New components going forward

Example:

```jsx
<div className="bg-card p-4 rounded-lg">
  ...
</div>
```

New components should prefer Tailwind CSS v4 and shadcn/ui primitives unless there is a strong reason to stay inline.

## Rules

1. Do not mix inline `style={{}}` and Tailwind classes in the same component.
2. For new code, prefer Tailwind + shadcn.
3. For bug fixes in legacy code, keep inline styles consistent with the rest of the file.
4. For theme colors in Tailwind, use shadcn CSS variables or extend the theme to map FXEDGE tokens.
5. Do not migrate a component just for purity. Stability matters more than a perfect styling stack.

## Theme Tokens Reference

When using inline styles, all themes expose:

```js
T.bg
T.surface
T.surface2
T.border
T.text
T.textDim
T.muted
T.accent
T.accentBright
T.green
T.red
T.amber
T.pink
T.isDark
```

## Tailwind Equivalents

When using Tailwind, map FXEDGE meaning to shadcn-style tokens:

```js
T.surface  -> bg-card
T.surface2 -> bg-muted
T.border   -> border
T.text     -> text-foreground
T.textDim  -> text-muted-foreground
T.green    -> text-green-500 / bg-green-500
T.red      -> text-red-500 / bg-red-500
T.accent   -> text-primary / bg-primary
```

## When To Migrate A Legacy Component

Migrate only when:

- Significantly redesigning that component.
- A bug is hard to fix cleanly with inline styles.
- Adding a shadcn primitive, such as Dialog, Dropdown, Sheet, Tabs, or Table.

Do not migrate just for consistency. Stability > purity.
