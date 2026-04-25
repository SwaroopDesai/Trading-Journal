// Economic Calendar API
// Strategy: fetch live → cache in Supabase → serve cache on failure
// Result: calendar always works, at worst slightly stale

const FEED_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"
const CURRENCIES = ["USD","EUR","GBP","CAD","JPY","AUD","NZD","CHF"]
const TIMEOUT_MS = 8000

// ISO week key e.g. "2026-W17"
function getWeekKey() {
  const d = new Date()
  const thu = new Date(d)
  thu.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3)
  const year = thu.getFullYear()
  const jan4 = new Date(year, 0, 4)
  const week = 1 + Math.round(((thu - jan4) / 86400000 - 3 + (jan4.getDay() + 6) % 7) / 7)
  return `${year}-W${String(week).padStart(2, "0")}`
}

async function supabaseGet(weekKey) {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (!url || !key) return null
  try {
    const r = await fetch(
      `${url}/rest/v1/calendar_cache?week_key=eq.${encodeURIComponent(weekKey)}&select=*&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" }
    )
    if (!r.ok) return null
    const rows = await r.json()
    return rows[0] ?? null
  } catch { return null }
}

async function supabaseUpsert(weekKey, events) {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (!url || !key) return
  try {
    await fetch(`${url}/rest/v1/calendar_cache`, {
      method:  "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body:  JSON.stringify({ week_key: weekKey, events, fetched_at: new Date().toISOString() }),
      cache: "no-store",
    })
  } catch { /* non-blocking — ignore */ }
}

export async function GET() {
  const weekKey = getWeekKey()
  let events    = null
  let cached    = false
  let fetchedAt = null
  let source    = null

  // ── 1. Try live feed ─────────────────────────────────────────────────────
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const r = await fetch(FEED_URL, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    })
    clearTimeout(timer)
    if (!r.ok) throw new Error(`Feed returned ${r.status}`)
    const raw = await r.json()
    if (!Array.isArray(raw)) throw new Error("Unexpected response format")

    events    = raw.filter(e => CURRENCIES.includes(e.country))
    fetchedAt = new Date().toISOString()
    cached    = false
    source    = "live"

    // Cache in background — don't await
    supabaseUpsert(weekKey, events)

  } catch {
    clearTimeout(timer)

    // ── 2. Fall back to Supabase cache ───────────────────────────────────
    const row = await supabaseGet(weekKey)
    if (row?.events) {
      events    = row.events
      fetchedAt = row.fetched_at
      cached    = true
      source    = "cache"
    }
  }

  return new Response(
    JSON.stringify({
      events:    events ?? [],
      cached,
      fetchedAt,
      source,
      count:     events?.length ?? 0,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Vercel edge: fresh 15 min, serve stale up to 1 hr while revalidating
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
      },
    }
  )
}
