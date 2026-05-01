# Prompt: Clean Up Dead Code

Read `AGENTS.md` first.

## Task
Remove dead/unused code from FXEDGE without breaking anything.

## Files to investigate and remove if unused

### 1. CommandPalette
- `src/components/CommandPalette.jsx`
- Search the entire codebase for imports of `CommandPalette`
- If no active imports → delete the file
- If imports exist but the component is never rendered → check if there's a hidden trigger (like Cmd+K). If not, remove imports and file.

### 2. Screenshot autofill API route
- `src/app/api/screenshot-autofill/route.js`
- Search codebase for any `fetch("/api/screenshot-autofill")` or references
- If unused → delete the entire `src/app/api/screenshot-autofill/` folder

### 3. Pre-trade checklist constants
- `CHECKLIST_RULES` in `src/lib/constants.js`
- Search for any usage of `CHECKLIST_RULES`
- If unused → remove the constant (do NOT remove other constants in the file)

### 4. Debug artifact
- `page4-debug.jsx` in repo root or anywhere
- This is an old debug file from the early build days
- Verify it's not imported anywhere → delete

### 5. Deprecated dependency
- Check `package.json` for `@supabase/auth-helpers-nextjs`
- Search codebase for imports of `@supabase/auth-helpers-nextjs`
- If unused → run `npm uninstall @supabase/auth-helpers-nextjs`

## Verification steps before committing

1. Run `npm run build` — must succeed
2. Run `npm run lint` — no new errors
3. Test these flows manually:
   - Login with magic link
   - Log a trade with screenshot
   - Open and save daily plan
   - Open and save weekly plan
   - Switch tabs

## Commit message
```
chore: remove dead code (CommandPalette, screenshot-autofill, CHECKLIST_RULES, page4-debug)
```

## What NOT to do
- Don't refactor anything else while doing this
- Don't change file structure
- Don't update versions
- Just remove and verify
