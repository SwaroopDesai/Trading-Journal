# Prompt: Fix Encoding Mojibake

Read `AGENTS.md` first.

## Task

Fix obvious UTF-8 mojibake in source and documentation files.

This is a focused cleanup pass for visible garbage characters such as broken em dashes, smart quotes, bullets, accented letters, and box-drawing characters.

## Files to check first

- `src/lib/constants.js`
- `src/lib/utils.js`
- `src/components/tabs/Heatmap.jsx`
- `src/components/tabs/AIAnalysis.jsx`
- `src/components/tabs/WeeklyReview.jsx`
- `src/components/tabs/ExportTab.jsx`
- `PRODUCT.md`
- `AGENTS.md`

## Common symptoms

Look for sequences like:

- Broken em dashes
- Broken apostrophes or smart quotes
- Broken bullets or ellipses
- Broken accented characters
- Broken box-drawing characters
- Random replacement characters

## Rules

- Do not change application logic.
- Do not change UI styling.
- Keep the fix text-only.
- Prefer clear ASCII wording if the original intended symbol is uncertain.
- Save files as UTF-8.

## Verification

Run:

```bash
npm run build
```

Then scan the changed files again and confirm no obvious mojibake remains.

## Commit Message

```text
fix: clean UTF-8 encoding across all source files
```
