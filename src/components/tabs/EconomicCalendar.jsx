"use client"
import { useState, useEffect, useCallback, useRef } from "react"

// ── Constants ──────────────────────────────────────────────────────────────
const FLAGS = {
  USD:"🇺🇸", EUR:"🇪🇺", GBP:"🇬🇧", CAD:"🇨🇦",
  JPY:"🇯🇵", AUD:"🇦🇺", NZD:"🇳🇿", CHF:"🇨🇭",
}
const ALL_CURRENCIES = ["USD","EUR","GBP","CAD","JPY","AUD","NZD","CHF"]

// ── Bank holidays that close / thin out forex markets ─────────────────────
// Format: { date:"YYYY-MM-DD", title, currencies:[] }
const BANK_HOLIDAYS = [
  // 2025
  { date:"2025-01-01", title:"New Year's Day",       currencies:["USD","EUR","GBP","CAD","JPY","AUD","NZD","CHF"] },
  { date:"2025-01-20", title:"MLK Day",               currencies:["USD"] },
  { date:"2025-02-17", title:"Presidents' Day",       currencies:["USD"] },
  { date:"2025-04-18", title:"Good Friday",           currencies:["GBP","EUR","CAD","AUD","NZD","CHF"] },
  { date:"2025-04-21", title:"Easter Monday",         currencies:["GBP","EUR","CAD","AUD","NZD","CHF"] },
  { date:"2025-05-05", title:"Early May Bank Holiday",currencies:["GBP"] },
  { date:"2025-05-26", title:"Memorial Day",          currencies:["USD","CAD"] },
  { date:"2025-05-26", title:"Spring Bank Holiday",   currencies:["GBP"] },
  { date:"2025-07-04", title:"Independence Day",      currencies:["USD"] },
  { date:"2025-08-25", title:"Summer Bank Holiday",   currencies:["GBP"] },
  { date:"2025-09-01", title:"Labor Day",             currencies:["USD","CAD"] },
  { date:"2025-11-11", title:"Remembrance Day",       currencies:["CAD"] },
  { date:"2025-11-27", title:"Thanksgiving",          currencies:["USD"] },
  { date:"2025-12-25", title:"Christmas Day",         currencies:["USD","EUR","GBP","CAD","AUD","NZD","CHF"] },
  { date:"2025-12-26", title:"Boxing Day",            currencies:["GBP","CAD","AUD","NZD"] },
  // 2026
  { date:"2026-01-01", title:"New Year's Day",        currencies:["USD","EUR","GBP","CAD","JPY","AUD","NZD","CHF"] },
  { date:"2026-01-19", title:"MLK Day",               currencies:["USD"] },
  { date:"2026-02-16", title:"Presidents' Day",       currencies:["USD"] },
  { date:"2026-04-03", title:"Good Friday",           currencies:["GBP","EUR","CAD","AUD","NZD","CHF"] },
  { date:"2026-04-06", title:"Easter Monday",         currencies:["GBP","EUR","CAD","AUD","NZD","CHF"] },
  { date:"2026-05-04", title:"Early May Bank Holiday",currencies:["GBP"] },
  { date:"2026-05-25", title:"Memorial Day",          currencies:["USD","CAD"] },
  { date:"2026-05-25", title:"Spring Bank Holiday",   currencies:["GBP"] },
  { date:"2026-07-04", title:"Independence Day",      currencies:["USD"] },
  { date:"2026-07-03", title:"Independence Day (obs)",currencies:["USD"] },
  { date:"2026-08-31", title:"Summer Bank Holiday",   currencies:["GBP"] },
  { date:"2026-09-07", title:"Labor Day",             currencies:["USD","CAD"] },
  { date:"2026-11-11", title:"Remembrance Day",       currencies:["CAD"] },
  { date:"2026-11-26", title:"Thanksgiving",          currencies:["USD"] },
  { date:"2026-12-25", title:"Christmas Day",         currencies:["USD","EUR","GBP","CAD","AUD","NZD","CHF"] },
  { date:"2026-12-26", title:"Boxing Day",            currencies:["GBP","CAD","AUD","NZD"] },
  { date:"2026-12-28", title:"Boxing Day (obs)",      currencies:["GBP"] },
]

// ── Date helpers (local timezone) ─────────────────────────────────────────
// Use the browser's own timezone so times show correctly for any user
const LOCAL_ZONE = typeof window !== "undefined"
  ? Intl.DateTimeFormat().resolvedOptions().timeZone
  : "America/New_York"

// Short label, e.g. "BST", "EST", "IST"
function tzAbbr() {
  return new Intl.DateTimeFormat("en-US", { timeZoneName:"short", timeZone:LOCAL_ZONE })
    .formatToParts(new Date())
    .find(p => p.type === "timeZoneName")?.value ?? LOCAL_ZONE
}

// Parse ISO timestamp from feed: "2026-04-19T18:45:00-04:00"
function parseDate(event) {
  if (!event?.date) return null
  const d = new Date(event.date)
  return isNaN(d.getTime()) ? null : d
}

// YYYY-MM-DD in local timezone
function toLocalDateKey(d) {
  if (!d) return "unknown"
  return d.toLocaleDateString("en-CA", { timeZone: LOCAL_ZONE }) // en-CA → YYYY-MM-DD
}

// "8:30 AM" in local timezone
function toLocalTime(d) {
  if (!d) return null
  return d.toLocaleTimeString("en-US", { timeZone: LOCAL_ZONE, hour:"numeric", minute:"2-digit", hour12:true })
}

function todayLocalKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: LOCAL_ZONE })
}
function tomorrowLocalKey() {
  const t = new Date(); t.setDate(t.getDate() + 1)
  return t.toLocaleDateString("en-CA", { timeZone: LOCAL_ZONE })
}

function dayLabel(isoKey) {
  if (isoKey === todayLocalKey())    return "Today"
  if (isoKey === tomorrowLocalKey()) return "Tomorrow"
  const d = new Date(`${isoKey}T12:00:00`)
  return d.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })
}

function timeSince(isoStr) {
  if (!isoStr) return null
  const diff = Date.now() - new Date(isoStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

function impactColor(impact, T) {
  if (impact === "High")   return T.red
  if (impact === "Medium") return T.amber
  return T.muted
}

// ── Get holidays that fall within the displayed days ──────────────────────
function getHolidaysForDays(days, filterCurrencies) {
  const set = new Set(days)
  return BANK_HOLIDAYS.filter(h =>
    set.has(h.date) &&
    h.currencies.some(c => filterCurrencies.includes(c))
  )
}

// ── Countdown to next High-impact event ───────────────────────────────────
function useCountdown(events) {
  const [state, setState] = useState(null)
  const ref = useRef(events)
  ref.current = events

  useEffect(() => {
    const tick = () => {
      const now = Date.now()
      const next = ref.current
        .filter(e => e.impact === "High" && e._date && e._date.getTime() > now)
        .sort((a, b) => a._date - b._date)[0]
      if (!next) { setState(null); return }
      const diff = next._date.getTime() - now
      setState({
        event: next,
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        diff,
        warning: diff < 30 * 60 * 1000,
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return state
}

// ── Holiday row ───────────────────────────────────────────────────────────
function HolidayRow({ T, holiday, filterCurrencies }) {
  const affectedInFilter = holiday.currencies.filter(c => filterCurrencies.includes(c))
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12,
      padding:"10px 14px", borderRadius:12,
      background:`${T.blue}08`,
      border:`1px solid ${T.blue}33`,
    }}>
      <span style={{ fontSize:16 }}>🏦</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{holiday.title}</div>
        <div style={{ fontSize:10, color:T.textDim, marginTop:3 }}>
          Bank Holiday ·{" "}
          {affectedInFilter.map(c => `${FLAGS[c] ?? ""} ${c}`).join("  ")}
          <span style={{ color:T.amber, marginLeft:6, fontWeight:600 }}>⚠ Expect thin liquidity</span>
        </div>
      </div>
      <span style={{
        fontSize:9, fontWeight:800, letterSpacing:"0.1em",
        background:`${T.blue}18`, color:T.blue, border:`1px solid ${T.blue}33`,
        padding:"3px 8px", borderRadius:999, textTransform:"uppercase",
      }}>HOLIDAY</span>
    </div>
  )
}

// ── Event row ─────────────────────────────────────────────────────────────
function EventRow({ T, event, warn }) {
  const iColor  = impactColor(event.impact, T)
  const timeStr = toLocalTime(event._date)

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12,
      padding:"10px 14px", borderRadius:12,
      background: warn ? `${T.red}08` : T.surface2,
      border:`1px solid ${warn ? T.red+"33" : T.border}`,
    }}>
      {/* Impact dot */}
      <div style={{
        width:8, height:8, borderRadius:"50%", flexShrink:0,
        background:iColor, boxShadow:`0 0 6px ${iColor}99`,
      }}/>

      {/* Flag · currency · time */}
      <div style={{ flexShrink:0, width:52, textAlign:"center" }}>
        <div style={{ fontSize:18, lineHeight:1 }}>{FLAGS[event.country] ?? "🌐"}</div>
        <div style={{ fontSize:9, fontWeight:700, color:T.muted, letterSpacing:"0.08em", marginTop:2 }}>{event.country}</div>
        {timeStr && (
          <div style={{ fontSize:9, color:T.textDim, marginTop:2, fontFamily:"'JetBrains Mono',monospace" }}>
            {timeStr}
          </div>
        )}
      </div>

      {/* Title + impact */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.text, lineHeight:1.35 }}>{event.title}</div>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
          <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:iColor }}>
            {event.impact}
          </span>
          {warn && (
            <span style={{
              fontSize:9, fontWeight:700, color:T.red,
              background:`${T.red}15`, border:`1px solid ${T.red}33`,
              padding:"1px 6px", borderRadius:999,
            }}>⚠ NO-TRADE ZONE</span>
          )}
        </div>
      </div>

      {/* Prev · Forecast (no Actual — not in feed) */}
      <div style={{ display:"flex", gap:14, flexShrink:0 }}>
        {[
          { label:"PREV",  value:event.previous },
          { label:"FCST",  value:event.forecast },
        ].map(col => (
          <div key={col.label} style={{ minWidth:40, textAlign:"center" }}>
            <div style={{ fontSize:8, fontWeight:700, color:T.muted, letterSpacing:"0.1em", marginBottom:3 }}>{col.label}</div>
            <div style={{
              fontSize:12, fontWeight:700,
              color: col.value?.trim() ? T.text : T.border,
              fontFamily:"'JetBrains Mono','Fira Code',monospace",
            }}>
              {col.value?.trim() || "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Countdown banner ──────────────────────────────────────────────────────
function CountdownBanner({ T, cd }) {
  if (!cd) return null
  const col = cd.warning ? T.red : T.accentBright
  return (
    <div style={{
      borderRadius:16, padding:"16px 20px",
      background: cd.warning ? `${T.red}12` : `${T.accent}10`,
      border:`1px solid ${col}44`,
      display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap",
    }}>
      <div>
        <div style={{ fontSize:10, fontWeight:800, color:col, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:5 }}>
          {cd.warning ? "⚠ High Impact Imminent — Avoid New Entries" : "⏱ Next High Impact Event"}
        </div>
        <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:15, fontWeight:700, color:T.text }}>
          {FLAGS[cd.event.country] ?? ""} {cd.event.title}
        </div>
        {(cd.event.forecast || cd.event.previous) && (
          <div style={{ fontSize:11, color:T.textDim, marginTop:4 }}>
            {cd.event.forecast && <>Forecast: <span style={{ color:T.text, fontWeight:700, fontFamily:"monospace" }}>{cd.event.forecast}</span></>}
            {cd.event.previous && <> · Prev: <span style={{ fontFamily:"monospace" }}>{cd.event.previous}</span></>}
          </div>
        )}
      </div>
      <div style={{ display:"flex", gap:6, alignItems:"flex-end" }}>
        {[
          { v:String(cd.h).padStart(2,"0"), l:"HRS" },
          { v:String(cd.m).padStart(2,"0"), l:"MIN" },
          { v:String(cd.s).padStart(2,"0"), l:"SEC" },
        ].map((x, i) => (
          <div key={x.l} style={{ display:"flex", alignItems:"flex-start", gap:0 }}>
            {i > 0 && (
              <div style={{ fontSize:22, fontWeight:800, color:col, lineHeight:1, paddingTop:8, margin:"0 2px" }}>:</div>
            )}
            <div style={{ textAlign:"center" }}>
              <div style={{
                background:`${col}20`, border:`1px solid ${col}44`,
                borderRadius:10, padding:"8px 12px",
                fontFamily:"'JetBrains Mono','Fira Code',monospace",
                fontSize:26, fontWeight:800, color:col, lineHeight:1, minWidth:54,
              }}>{x.v}</div>
              <div style={{ fontSize:8, color:T.muted, letterSpacing:"0.12em", marginTop:4 }}>{x.l}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function EconomicCalendar({ T, viewportWidth }) {
  const isMobile = viewportWidth < 768
  const [raw, setRaw]               = useState(null)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currencies, setCurrencies] = useState(["USD","EUR","GBP","CAD"])
  const [impacts, setImpacts]       = useState(["High","Medium"])
  const [showHolidays, setShowHolidays] = useState(true)

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true)
    try {
      // Pass ?fresh=1 on manual refresh to bypass Vercel edge cache
      const url = refresh ? "/api/news?fresh=1" : "/api/news"
      const r = await fetch(url, { cache:"no-store" })
      if (!r.ok) throw new Error(`API ${r.status}`)
      const json = await r.json()
      const events = (json.events || []).map(e => ({
        ...e,
        _date:   parseDate(e),
        _dayKey: toLocalDateKey(parseDate(e)),
      }))
      setRaw({ ...json, events })
    } catch (err) {
      setRaw(r => r ?? { events:[], error:err.message, cached:false, fetchedAt:null })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const allEvents = raw?.events ?? []
  const countdown = useCountdown(allEvents)

  // Filtered events
  const filtered = allEvents.filter(e =>
    currencies.includes(e.country) && impacts.includes(e.impact)
  )

  const todayKey = todayLocalKey()

  // Group by local day
  const grouped = {}
  filtered.forEach(e => {
    if (!e._dayKey || e._dayKey === "unknown") return
    ;(grouped[e._dayKey] ??= []).push(e)
  })

  // Include days that only have holidays (no events)
  const allDays = new Set(Object.keys(grouped))
  if (showHolidays) {
    BANK_HOLIDAYS.forEach(h => {
      if (h.currencies.some(c => currencies.includes(c))) allDays.add(h.date)
    })
  }
  // Only show today and future — no past days/holidays
  const days = [...allDays].sort().filter(d => d >= todayKey)

  const toggleCurrency = c => setCurrencies(p =>
    p.includes(c) ? (p.length > 1 ? p.filter(x => x !== c) : p) : [...p, c]
  )
  const toggleImpact = i => setImpacts(p =>
    p.includes(i) ? (p.length > 1 ? p.filter(x => x !== i) : p) : [...p, i]
  )

  return (
    <div style={{ padding:isMobile?14:24, display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:800, color:T.text, letterSpacing:"-0.03em" }}>
            Economic Calendar
          </div>
          <div style={{ fontSize:12, color:T.textDim, marginTop:4, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <span>High-impact events · This week · Times in {tzAbbr()}</span>
            {raw?.cached && raw?.fetchedAt && (
              <span style={{ background:`${T.amber}15`, border:`1px solid ${T.amber}40`, color:T.amber, padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:700 }}>
                ⚡ Cached · {timeSince(raw.fetchedAt)}
              </span>
            )}
            {raw && !raw.cached && (
              <span style={{ background:`${T.green}15`, border:`1px solid ${T.green}40`, color:T.green, padding:"2px 8px", borderRadius:999, fontSize:10, fontWeight:700 }}>
                ✓ Live
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => load(true)} disabled={refreshing}
          style={{
            display:"flex", alignItems:"center", gap:6,
            background:T.surface2, border:`1px solid ${T.border}`,
            color:refreshing?T.muted:T.text,
            padding:"8px 16px", borderRadius:10,
            cursor:refreshing?"wait":"pointer",
            fontSize:12, fontWeight:600, fontFamily:"Inter,sans-serif",
          }}
        >
          <span style={{ fontSize:14 }}>↻</span>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:"0.1em", textTransform:"uppercase" }}>Currency</span>
        {ALL_CURRENCIES.map(c => {
          const on = currencies.includes(c)
          return (
            <button key={c} onClick={() => toggleCurrency(c)} style={{
              padding:"4px 10px", borderRadius:999, fontSize:11, fontWeight:700,
              cursor:"pointer", transition:"all .15s",
              background:on?`${T.accentBright}18`:"none",
              border:`1px solid ${on?T.accentBright:T.border}`,
              color:on?T.accentBright:T.muted, fontFamily:"Inter,sans-serif",
            }}>
              {FLAGS[c] ?? ""} {c}
            </button>
          )
        })}
        <div style={{ width:1, height:18, background:T.border, margin:"0 4px" }}/>
        {["High","Medium"].map(i => {
          const on = impacts.includes(i)
          const col = impactColor(i, T)
          return (
            <button key={i} onClick={() => toggleImpact(i)} style={{
              padding:"4px 12px", borderRadius:999, fontSize:11, fontWeight:700,
              cursor:"pointer", transition:"all .15s",
              background:on?`${col}18`:"none",
              border:`1px solid ${on?col:T.border}`,
              color:on?col:T.muted,
              display:"flex", alignItems:"center", gap:5, fontFamily:"Inter,sans-serif",
            }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:on?col:T.border, display:"inline-block" }}/>
              {i}
            </button>
          )
        })}
        <div style={{ width:1, height:18, background:T.border, margin:"0 4px" }}/>
        <button onClick={() => setShowHolidays(p => !p)} style={{
          padding:"4px 12px", borderRadius:999, fontSize:11, fontWeight:700,
          cursor:"pointer", transition:"all .15s",
          background:showHolidays?`${T.blue}18`:"none",
          border:`1px solid ${showHolidays?T.blue:T.border}`,
          color:showHolidays?T.blue:T.muted,
          display:"flex", alignItems:"center", gap:5, fontFamily:"Inter,sans-serif",
        }}>
          🏦 Holidays
        </button>
      </div>

      {/* ── Countdown ── */}
      {!loading && <CountdownBanner T={T} cd={countdown}/>}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign:"center", padding:"60px 0" }}>
          <div style={{ fontSize:36, marginBottom:14 }}>📡</div>
          <div style={{ color:T.textDim, fontSize:13 }}>Loading calendar…</div>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && raw?.error && !allEvents.length && (
        <div style={{ textAlign:"center", padding:"50px 0" }}>
          <div style={{ fontSize:36, marginBottom:14 }}>📡</div>
          <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:18, fontWeight:700, color:T.text, marginBottom:8 }}>
            Calendar unavailable
          </div>
          <div style={{ fontSize:13, color:T.textDim, marginBottom:20 }}>
            {raw.error}
          </div>
          <button onClick={() => load(true)} style={{
            background:`linear-gradient(135deg,${T.accentBright},${T.pink})`,
            color:"#fff", border:"none", padding:"10px 24px",
            borderRadius:10, cursor:"pointer", fontSize:13,
            fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700,
          }}>Try Again</button>
        </div>
      )}

      {/* ── Week view ── */}
      {!loading && days.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {days.map(dayKey => {
            const dayEvents = grouped[dayKey] ?? []
            const holidays  = showHolidays ? getHolidaysForDays([dayKey], currencies) : []
            if (!dayEvents.length && !holidays.length) return null
            const isThisToday = dayKey === todayKey
            const label = dayLabel(dayKey)
            return (
              <div key={dayKey}>
                {/* Day header */}
                <div style={{
                  display:"flex", alignItems:"center", gap:10,
                  marginBottom:10, paddingBottom:8,
                  borderBottom:`1px solid ${isThisToday ? T.accentBright+"55" : T.border}`,
                }}>
                  <div style={{
                    fontFamily:"'Plus Jakarta Sans',sans-serif",
                    fontSize:14, fontWeight:800,
                    color:isThisToday?T.accentBright:T.text,
                  }}>{label}</div>
                  {isThisToday && (
                    <span style={{ fontSize:9, fontWeight:800, letterSpacing:"0.12em", background:T.accentBright, color:T.bg, padding:"2px 8px", borderRadius:999 }}>TODAY</span>
                  )}
                  <span style={{ fontSize:11, color:T.muted, marginLeft:"auto" }}>
                    {dayEvents.length} event{dayEvents.length!==1?"s":""}
                    {holidays.length > 0 && ` · ${holidays.length} holiday${holidays.length>1?"s":""}`}
                  </span>
                </div>

                {/* Holidays first */}
                {holidays.map((h, i) => (
                  <div key={`h-${i}`} style={{ marginBottom:6 }}>
                    <HolidayRow T={T} holiday={h} filterCurrencies={currencies}/>
                  </div>
                ))}

                {/* Events */}
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {dayEvents.map((e, i) => (
                    <EventRow key={i} T={T} event={e}
                      warn={!!(countdown?.warning && isThisToday && e.impact==="High")}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && days.length === 0 && allEvents.length > 0 && (
        <div style={{ textAlign:"center", padding:"40px 0", color:T.muted, fontSize:13 }}>
          No events match your filters this week.
        </div>
      )}

      {/* ── Footer note ── */}
      {!loading && allEvents.length > 0 && (
        <div style={{
          fontSize:10, color:T.muted, textAlign:"center",
          paddingTop:8, borderTop:`1px solid ${T.border}`,
          display:"flex", justifyContent:"center", gap:14, flexWrap:"wrap",
        }}>
          <span>🕐 Times in your local timezone ({tzAbbr()})</span>
          <span>·</span>
          <span>Source: ForexFactory</span>
          <span>·</span>
          <span>ℹ️ Actual values not available in this feed</span>
          {raw?.fetchedAt && <><span>·</span><span>Fetched {timeSince(raw.fetchedAt)}</span></>}
        </div>
      )}
    </div>
  )
}
