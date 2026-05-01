# Prompt: Verify Supabase RLS Policies

Read `AGENTS.md` first.

## Task
Audit and verify Row Level Security policies on all Supabase tables. This is a security task — get it right.

## Why this matters
RLS protects user data. Without proper policies, one user could read or modify another user's trades. This must be airtight.

## Tables to verify

### `trades`
Required policies:
- SELECT: `user_id = auth.uid()`
- INSERT: `user_id = auth.uid()`
- UPDATE: `user_id = auth.uid()`
- DELETE: `user_id = auth.uid()`

### `daily_plans`
Same as trades.

### `weekly_plans`
Same as trades.

### `missed_trades`
Same as trades.

### `waitlist`
- INSERT: anonymous allowed (public landing page)
- SELECT: should NOT be public (only service role)
- UPDATE/DELETE: only service role

### `calendar_cache`
- SELECT/INSERT/UPDATE: server-side only
- Currently used via `news/route.js` — confirm this works with current RLS

### `storage.objects` (bucket: `journal-images`)
- INSERT: authenticated users
- UPDATE: authenticated users (own paths only — `{user_id}/...`)
- DELETE: authenticated users (own paths only)
- SELECT: public read (URLs are shared in app)

## Process

1. Open Supabase dashboard → Authentication → Policies
2. For each table, click and view all policies
3. For each policy, verify the `USING` and `WITH CHECK` expressions match the requirements above
4. If a table has RLS DISABLED — enable it immediately
5. Test with a second test account:
   - Create test user A, log a trade
   - Sign in as test user B
   - Try to query `trades` — should return zero rows
   - Try to update user A's trade by ID — should fail

## SQL to run if policies are missing

```sql
-- Enable RLS on all user tables
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE missed_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_cache ENABLE ROW LEVEL SECURITY;

-- Standard user-owned table policy template
DROP POLICY IF EXISTS "users own rows" ON trades;
CREATE POLICY "users own rows" ON trades
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Repeat for daily_plans, weekly_plans, missed_trades

-- Waitlist: anonymous insert only
DROP POLICY IF EXISTS "anon insert waitlist" ON waitlist;
CREATE POLICY "anon insert waitlist" ON waitlist
  FOR INSERT
  WITH CHECK (true);

-- Storage: own folder only
-- Run via Supabase dashboard → Storage → Policies on journal-images bucket
```

## Storage bucket policy SQL

```sql
-- Insert own folder
CREATE POLICY "users upload own folder" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'journal-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update own folder
CREATE POLICY "users update own folder" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'journal-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete own folder
CREATE POLICY "users delete own folder" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'journal-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read on bucket
CREATE POLICY "public read images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'journal-images');
```

## Output
After verification, create a file `SECURITY_AUDIT.md` in the repo root documenting:
- Which policies were already in place
- Which were added/fixed
- Date of audit
- Test results

## What NOT to do
- Don't run any DROP commands without a backup
- Don't disable RLS even temporarily on production
- Don't share the service role key
