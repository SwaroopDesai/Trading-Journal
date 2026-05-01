# Prompt: Full UTF-8 Encoding Sweep

Read `AGENTS.md` first.

## Task

Run a full encoding sweep across the entire codebase. This is the comprehensive version of the targeted mojibake cleanup.

## Process

### 1. Set editor defaults

If using VS Code, set:

- `files.encoding`: `utf8`
- `files.autoGuessEncoding`: `false`

### 2. Find files with mojibake

Scan tracked source and documentation files for common suspicious characters and replacement markers.

PowerShell example:

```powershell
Get-ChildItem -Recurse -Include *.js,*.jsx,*.ts,*.tsx,*.md,*.json,*.css |
  Select-String -Pattern "\u00C3|\u00C2|\u00E2|\u00F0|\uFFFD" |
  Select-Object -ExpandProperty Path -Unique
```

Git Bash example:

```bash
grep -rlP "\x{00C3}|\x{00C2}|\x{00E2}|\x{00F0}|\x{FFFD}" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.md" \
  --include="*.json" \
  --include="*.css" .
```

Exclude generated folders such as `node_modules`, `.next`, `.claude`, and `.agents`.

### 3. Fix each file found

For each file:

1. Reopen/save as UTF-8.
2. Replace mojibake with the intended character or plain ASCII text.
3. If the original intent is unclear, prefer readable ASCII over decorative symbols.
4. Keep the change text-only.

Common replacements:

| Broken text type | Replace with |
| --- | --- |
| Broken em dash | `-` |
| Broken apostrophe | `'` |
| Broken smart quotes | `"` |
| Broken bullet | `-` |
| Broken ellipsis | `...` |
| Broken accented letters | the correct accented letter, or plain ASCII |
| Broken box-drawing characters | plain ASCII tree/list formatting |

### 4. Verify visually

Open the app locally and click through every tab. Look for:

- Headings
- Empty state messages
- Error messages
- Modal titles
- Button labels
- Tooltips

### 5. Known files to check

- `src/lib/constants.js`
- `src/lib/utils.js`
- `src/components/tabs/Heatmap.jsx`
- `src/components/tabs/AIAnalysis.jsx`
- `src/components/tabs/WeeklyReview.jsx`
- `src/components/tabs/ExportTab.jsx`
- `src/components/TradeModal.jsx`
- `src/components/MissedTradeModal.jsx`
- `src/components/EquityCurve.jsx`
- `src/components/DashboardCharts.jsx`
- Root `*.md` files

### 6. Add `.editorconfig`

Create `.editorconfig` in the repo root:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2
```

### 7. Add `.gitattributes`

Create or update `.gitattributes`:

```gitattributes
* text=auto eol=lf
*.{js,jsx,ts,tsx,md,json,css} text working-tree-encoding=UTF-8
```

## Verification

1. `npm run build` succeeds.
2. No obvious mojibake remains in tracked source/docs.
3. Visual scan of every tab is complete.

## Commit Message

```text
fix: full UTF-8 encoding sweep + add .editorconfig + .gitattributes
```
