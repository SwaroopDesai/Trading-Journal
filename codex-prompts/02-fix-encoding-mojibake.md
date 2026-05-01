# Prompt: Fix Encoding / Mojibake

Read `AGENTS.md` first.

## Task
Fix UTF-8 encoding issues across the codebase. Some files contain mojibake (garbage characters) from old encoding mistakes.

## Symptoms to look for
- `â€"` (should be `—` em dash)
- `â€™` (should be `'` apostrophe)
- `â€œ` and `â€` (should be `"` and `"` quotes)
- `Ã©` (should be `é`)
- `Ã¨` (should be `è`)
- `â”€` (box drawing characters)
- `Â` (random Â appearing before symbols)

## Files to check (known affected)
- `src/lib/constants.js`
- `src/lib/utils.js`
- `src/components/tabs/Heatmap.jsx`
- `src/components/tabs/AIAnalysis.jsx`
- `src/components/tabs/WeeklyReview.jsx`
- `src/components/tabs/ExportTab.jsx`
- `PRODUCT.md`
- `AGENTS.md` (if old version still exists)

## Process

1. Open each file in VS Code
2. Check encoding indicator at bottom right — should be "UTF-8"
3. If encoding is wrong, use `Reopen with Encoding → UTF-8`
4. Use Find & Replace (Ctrl+H) with these mappings:
   ```
   â€"     →  —
   â€™     →  '
   â€œ     →  "
   â€      →  "
   Ã©      →  é
   Ã¨      →  è
   â”€     →  —
   Â       →  (delete — empty replacement)
   ```
5. Save with **UTF-8 without BOM**
6. After fixing each file, do a quick visual scan for any remaining garbage characters

## Verification

1. Run `npm run build` — must succeed
2. Open the app in browser, navigate every tab
3. Check that:
   - All headings render properly
   - Em dashes look like `—` not `â€"`
   - Apostrophes look like `'` not `â€™`
   - No random characters in any UI text

## Commit message
```
fix: clean UTF-8 encoding across all source files
```

## What NOT to do
- Don't change any logic or styling
- Don't add or remove features
- Pure encoding cleanup only
