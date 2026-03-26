export async function GET() {
  try {
    const r = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0" }
    })
    if (!r.ok) throw new Error("Feed unavailable")
    const data = await r.json()
    const filtered = data.filter(e =>
      ["USD","EUR","GBP"].includes(e.country) &&
      ["High","Medium"].includes(e.impact)
    )
    return Response.json(filtered)
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}