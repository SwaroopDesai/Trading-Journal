export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const r = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      }
    })
    if (!r.ok) throw new Error("Feed returned " + r.status)
    const data = await r.json()
    const filtered = data.filter(e =>
      ["USD","EUR","GBP"].includes(e.country) &&
      ["High","Medium"].includes(e.impact)
    )
    return new Response(JSON.stringify(filtered), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      }
    })
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
    })
  }
}
