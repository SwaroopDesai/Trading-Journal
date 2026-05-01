# FXEDGE Supabase RLS Security Audit

**Audit date:** 2026-05-01  
**Project:** FXEDGE trading journal  
**Supabase project ref:** `mrdtmaihghmkbilhqjgo`  
**Auditor:** Codex  

## Scope

This audit reviewed the Supabase access model described in `AGENTS.md` and performed live, non-destructive smoke tests using the public Supabase anon key from `.env.local`.

The audit covered:

- `trades`
- `daily_plans`
- `weekly_plans`
- `missed_trades`
- `waitlist`
- `calendar_cache`
- Supabase Storage bucket `journal-images`

## Access Available During Audit

Available:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_KEY`
- Application source code
- Live anon-key Supabase REST/client access

Not available:

- Supabase Dashboard session
- Supabase CLI
- Supabase MCP SQL tools
- `SUPABASE_SERVICE_ROLE_KEY` locally
- Direct database connection string

Because of that, this audit could verify external behavior from the anon role, but could not directly inspect the exact `pg_policies` rows, `USING` expressions, or `WITH CHECK` expressions in production.

## Live Smoke Test Results

The following non-destructive checks were run with an unauthenticated Supabase client using the anon key.

| Target | Operation | Result | Interpretation |
| --- | --- | --- | --- |
| `trades` | anon `SELECT id LIMIT 5` | `0` rows, no error | No anonymous trade rows visible. Good smoke result. |
| `daily_plans` | anon `SELECT id LIMIT 5` | `0` rows, no error | No anonymous daily plans visible. Good smoke result. |
| `weekly_plans` | anon `SELECT id LIMIT 5` | `0` rows, no error | No anonymous weekly plans visible. Good smoke result. |
| `missed_trades` | anon `SELECT id LIMIT 5` | `0` rows, no error | No anonymous missed trades visible. Good smoke result. |
| `waitlist` | anon `SELECT * LIMIT 5` | `0` rows, no error | No waitlist rows visible anonymously. Good smoke result, but exact SELECT policy still needs dashboard verification. |
| `calendar_cache` | anon `SELECT * LIMIT 5` | `2` rows visible | Calendar cache is publicly readable via anon key. Low sensitivity, but this does not match "server-side only" if that is the intended policy. |
| `journal-images` | anon bucket root list | `0` rows, no error | Root listing did not expose files in this test. Exact storage policies still need dashboard verification. |

## Code-Level Checks

Application queries for user-owned tables include explicit user filters:

- `trades`: app boot, update, and delete queries filter by `user_id`.
- `daily_plans`: app boot, update, and delete queries filter by `user_id`.
- `weekly_plans`: app boot, update, and delete queries filter by `user_id`.
- `missed_trades`: app boot, update, and delete queries filter by `user_id`.

This is good defense-in-depth, but it does not replace RLS. Supabase policies must still enforce ownership at the database layer.

## Table-by-Table Status

### `trades`

Expected:

- `SELECT`: `auth.uid() = user_id`
- `INSERT`: `auth.uid() = user_id`
- `UPDATE`: `auth.uid() = user_id`
- `DELETE`: `auth.uid() = user_id`

Verified:

- Anonymous read returned zero rows.
- Source code uses `.eq("user_id", user.id)` for reads/updates/deletes and sets `user_id` on insert.

Not directly verified:

- Exact production policy SQL.
- Authenticated cross-user access with a second test account.

Status: **Partially verified. Needs dashboard/MCP confirmation of exact policies.**

### `daily_plans`

Expected:

- Same user-owned policies as `trades`.

Verified:

- Anonymous read returned zero rows.
- Source code filters by `user_id` and sets `user_id` on insert.

Not directly verified:

- Exact production policy SQL.
- Authenticated cross-user access with a second test account.

Status: **Partially verified. Needs dashboard/MCP confirmation of exact policies.**

### `weekly_plans`

Expected:

- Same user-owned policies as `trades`.

Verified:

- Anonymous read returned zero rows.
- Source code filters by `user_id` and sets `user_id` on insert.
- Weekly debrief server route uses `SUPABASE_SERVICE_ROLE_KEY` server-side, which is appropriate for cross-user scheduled processing.

Not directly verified:

- Exact production policy SQL.
- Authenticated cross-user access with a second test account.

Status: **Partially verified. Needs dashboard/MCP confirmation of exact policies.**

### `missed_trades`

Expected:

- Same user-owned policies as `trades`.

Verified:

- Anonymous read returned zero rows.
- Source code filters by `user_id` and sets `user_id` on insert.

Not directly verified:

- Exact production policy SQL.
- Authenticated cross-user access with a second test account.

Status: **Partially verified. Needs dashboard/MCP confirmation of exact policies.**

### `waitlist`

Expected:

- Anonymous `INSERT` allowed.
- Public `SELECT` not allowed.
- `UPDATE`/`DELETE` service-role only.

Verified:

- Anonymous read returned zero rows.
- Source code inserts into `waitlist` from `LoginScreen.jsx`.

Not tested:

- Anonymous insert was not performed to avoid writing test data into production.
- Exact production policy SQL.

Status: **Partially verified. Confirm insert-only public policy in dashboard.**

### `calendar_cache`

Expected from prompt:

- Server-side only `SELECT`/`INSERT`/`UPDATE`.

Observed:

- Anonymous read returned `2` rows.
- `src/app/api/news/route.js` uses `NEXT_PUBLIC_SUPABASE_KEY` for `calendar_cache` reads and upserts.

Risk:

- Calendar data is not user-private, so this is low sensitivity.
- However, if `calendar_cache` has anon insert/update policies, any holder of the public anon key may be able to mutate cache rows unless policies are more restrictive.
- This does not fully match the stated "server-side only" requirement.

Recommended fix:

- Add `SUPABASE_SERVICE_ROLE_KEY` to the `news/route.js` server route.
- Use a server-only Supabase admin client for `calendar_cache`.
- Remove public anon `SELECT`/`INSERT`/`UPDATE` policies from `calendar_cache`, or restrict them to service-role-only access.

Status: **Needs policy review/fix if server-only access is required.**

### `storage.objects` / `journal-images`

Expected:

- Public read for image URLs.
- Authenticated insert/update/delete only within the user's own top-level folder: `(storage.foldername(name))[1] = auth.uid()::text`.

Verified:

- Anonymous root bucket list returned zero rows.
- Source code uses Supabase Storage bucket `journal-images` for screenshots.

Not directly verified:

- Exact storage policy SQL.
- Authenticated upload/update/delete ownership checks.
- Cross-user object overwrite/delete prevention.

Status: **Partially verified. Needs dashboard/MCP confirmation of exact storage policies.**

## Policies Added or Fixed

No Supabase policies were added or changed during this audit.

Reason: the current environment did not have dashboard, Supabase CLI, MCP SQL tools, service-role key, or direct database access. Making production policy changes without first inspecting existing policies would be unsafe.

## Required Follow-Up Verification

To complete the audit fully, verify these in Supabase Dashboard or MCP SQL:

1. RLS is enabled on:
   - `trades`
   - `daily_plans`
   - `weekly_plans`
   - `missed_trades`
   - `waitlist`
   - `calendar_cache`

2. User-owned tables have ownership policies:
   - `USING (auth.uid() = user_id)`
   - `WITH CHECK (auth.uid() = user_id)`

3. `waitlist` only allows anonymous insert and does not allow public select/update/delete.

4. `calendar_cache` policy choice is intentional:
   - Either allow public anon read/write because data is non-sensitive, or
   - Preferably move cache access to service-role-only server route.

5. `journal-images` storage policies enforce own-folder writes/deletes:
   - `bucket_id = 'journal-images'`
   - `(storage.foldername(name))[1] = auth.uid()::text`

6. Test with two authenticated accounts:
   - User A creates a trade.
   - User B cannot read it.
   - User B cannot update it by ID.
   - User B cannot delete it by ID.
   - User B cannot overwrite/delete User A's storage object.

## Recommended SQL Inspection Query

Run this in Supabase SQL editor or an authenticated MCP SQL tool:

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
from pg_policies
where schemaname in ('public', 'storage')
  and tablename in (
    'trades',
    'daily_plans',
    'weekly_plans',
    'missed_trades',
    'waitlist',
    'calendar_cache',
    'objects'
  )
order by schemaname, tablename, policyname;
```

## Overall Assessment

The anonymous smoke tests did not expose private user-owned trading data. That is a good sign.

The main issue found is `calendar_cache`: it is currently readable with the anon key, and the `news` route uses the anon key for cache access. This may be acceptable because calendar data is public/non-sensitive, but it does not satisfy a strict "server-side only" policy model.

This audit should be treated as **partial but useful** until exact RLS policies are inspected directly in Supabase.
