# Prompt: Full UTF-8 Encoding Sweep

Read `AGENTS.md` first.

## Task
Run a full encoding sweep across the entire codebase. Different from `02-fix-encoding-mojibake.md` — this is the comprehensive deep clean.

## Process

### 1. Set VS Code defaults
File → Preferences → Settings:
- `files.encoding`: `utf8`
- `files.autoGuessEncoding`: `false`

### 2. Find all files with mojibake

Run this in terminal to scan:
```bash
# Windows PowerShell
Get-ChildItem -Recurse -Include *.js,*.jsx,*.ts,*.tsx,*.md,*.json,*.css | Select-String -Pattern "â€|Ã©|Ã¨|â”|Â\s|Â—" | Select-Object -ExpandProperty Path -Unique
```

Or in Git Bash:
```bash
grep -rl "â€\|Ã©\|Ã¨\|â”" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.md" .
```

### 3. For each file found
1. Open in VS Code
2. Click encoding indicator at bottom right
3. Choose "Reopen with encoding" → UTF-8
4. Use Find & Replace (Ctrl+H, click `.*` for regex):

| Find (regex) | Replace |
|---|---|
| `â€"` | `—` |
| `â€™` | `'` |
| `â€œ` | `"` |
| `â€\u009d` | `"` |
| `â€¢` | `•` |
| `â€¦` | `…` |
| `Ã©` | `é` |
| `Ã¨` | `è` |
| `Ã¡` | `á` |
| `Ã ` | `à` |
| `Â\s` | ` ` (single space) |
| `Â—` | `—` |
| `â”€` | `—` |
| `â”` | `—` |

5. Save with: File → Save with encoding → UTF-8 without BOM

### 4. Verify each tab visually
After fixing, open the app locally and click through every tab. Look for:
- Headings (no garbage chars)
- Empty state messages
- Error messages
- Modal titles
- Button labels
- Tooltips

### 5. Files known to need attention
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
- All `*.md` files in root

### 6. Add `.editorconfig` to enforce UTF-8

Create `.editorconfig` in repo root:
```
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2
```

### 7. Add to `.gitattributes`

Create or update `.gitattributes`:
```
* text=auto eol=lf
*.{js,jsx,ts,tsx,md,json,css} text working-tree-encoding=UTF-8
```

## Verification
1. `npm run build` succeeds
2. Visual scan of every tab
3. Em dashes look like `—` everywhere
4. Apostrophes look like `'` everywhere
5. No random `Â` or garbage chars

## Commit message
```
fix: full UTF-8 encoding sweep + add .editorconfig + .gitattributes
```
