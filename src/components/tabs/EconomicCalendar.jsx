"use client"
import { useState, useEffect, useCallback, useRef } from "react"

// ── Constants ─────────────────────────────────────────────────────────────
const FLAGS = {
  USD:"🇺🇸", EUR:"🇪🇺", GBP:"🇬🇧", CAD:"🇨🇦",
  JPY:"🇯🇵", AUD:"🇦🇺", NZD:"🇳🇿", CHF:"🇨🇭",
}
const ALL_CURRENCIES = ["USD","EUR","GBP","CAD","JPY","AUD","NZD","CHF"]
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const SHORT_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

// ── Helpers ───────────────────────────────────────────────────────────────
function impactColor(impact, T) {
  if (impact === "High")   return T.red
  if (impact === "Medium") return T.amber
  return T.muted
}

// Parse the various date formats ForexFactory uses
function parseEventDate(event) {
  try {
    const raw = event.date || ""
    const timeStr = event.time || ""
    if (!raw) return null

    // Try direct JS parse first
    let d = new Date(raw)
    if (isNaN(d)) return null

    // Apply time if present and specific
    if (timeStr && timeStr !== "Tentative" && timeStr !== "All Day" && timeStr !== "") {
      const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i)
      if (m) {
        let h = parseInt(m[1])
        const min = parseInt(m[2])
        const period = (m[3] || "").toLowerCase()
        if (period === "pm" && h !== 12) h += 12
        if (period === "am" && h === 12) h = 0
        d.setHours(h, min, 0, 0)
      }
    } else {
      d.setHours(0, 0, 0, 0)
    }
    return d
  } catch { return null }
}

function normaliseDateKey(event) {
  // Return a stable YYYY-MM-DD key for grouping
  const d = parseEventDate(event)
  if (!d) return event.date || "unknown"
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}

function formatDisplayTime(event) {
  if (!event.time || event.time === "") return null
  if (event.time === "Tentative") return "Tentative"
  if (event.time === "All Day")   return "All Day"
  return event.time
}

function dayLabel(isoKey) {
  const d = new Date(isoKey + "T00:00:00")
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString())    return "Today"
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow"
  return `${SHORT_DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

function isToday(isoKey) {
  const d = new Date(isoKey + "T00:00:00")
  return d.toDateString() === new Date().toDateString()
}

function timeSince(isoStr) {
  if (!isoStr) return null
  const diff = Date.now() - new Date(isoStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ${m % 60}m ago`
  return `${Math.floor(h/24)}d ago`
}

// ── Countdown to next high-impact event ───────────────────────────────────
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

// ── Event row ─────────────────────────────────────────────────────────────
function EventRow({ T, event, warn }) {
  const impact     = event.impact || ""
  const iColor     = impactColor(impact, T)
  const displayTime = formatDisplayTime(event)
  const hasActual  = event.actual && event.actual.trim() !== ""

  // Color actual vs forecast
  let actualColor = T.text
  if (hasActual && event.forecast) {
    const a = parseFloat(event.actual), f = parseFloat(event.forecast)
    if (!isNaN(a) && !isNaN(f)) {
      actualColor = a > f ? T.green : a < f ? T.red : T.text
    }
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px", borderRadius: 12,
      background: warn ? `${T.red}08` : T.surface2,
      border: `1px solid ${warn ? T.red + "33" : T.border}`,
      transition: "border-color .15s",
    }}>
      {/* Impact dot */}
      <div style={{
        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
        background: iColor, boxShadow: `0 0 7px ${iColor}99`,
      }}/>

      {/* Flag + currency + time */}
      <div style={{ flexShrink: 0, width: 48, textAlign: "center" }}>
        <div style={{ fontSize: 18, lineHeight: 1 }}>{FLAGS[event.country] ?? "🌐"}</div>
        <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: "0.08em", marginTop: 2 }}>{event.country}</div>
        {displayTime && (
          <div style={{ fontSize: 9, color: T.textDim, marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>
            {displayTime}
          </div>
        )}
      </div>

      {/* Event name + impact label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, lineHeight: 1.35 }}>{event.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
            textTransform: "uppercase", color: iColor,
          }}>{impact}</span>
          {warn && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: T.red,
              background: `${T.red}15`, border: `1px solid ${T.red}33`,
              padding: "1px 6px", borderRadius: 999,
            }}>⚠ NO-TRADE ZONE</span>
          )}
        </div>
      </div>

      {/* Prev / Forecast / Actual */}
      <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
        {[
          { label: "Prev",  value: event.previous, color: T.textDim },
          { label: "Fcst",  value: event.forecast, color: T.textDim },
          { label: "Act",   value: event.actual,   color: hasActual ? actualColor : T.muted },
        ].map(col => (
          <div key={col.label} style={{ minWidth: 38, textAlign: "center" }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>
              {col.label}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700,
              color: col.value && col.value.trim() ? col.color : T.border,
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
            }}>
              {col.value && col.value.trim() ? col.value : "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Countdown display ─────────────────────────────────────────────────────
function CountdownBanner({ T, cd }) {
  if (!cd) return null
  const col = cd.warning ? T.red : T.accentBright
  return (
    <div style={{
      borderRadius: 16, padding: "16px 20px",
      background: cd.warning ? `${T.red}12` : `${T.accent}10`,
      border: `1px solid ${col}44`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 16, flexWrap: "wrap",
    }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, color: col, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 5 }}>
          {cd.warning ? "⚠ High Impact Imminent — Avoid New Entries" : "⏱ Next High Impact Event"}
        </div>
        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 700, color: T.text }}>
          {FLAGS[cd.event.country] ?? ""} {cd.event.title}
        </div>
        {cd.event.forecast && (
          <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>
            Forecast: <span style={{ color: T.text, fontWeight: 700, fontFamily: "monospace" }}>{cd.event.forecast}</span>
            {cd.event.previous && <> · Prev: <span style={{ fontFamily: "monospace" }}>{cd.event.previous}</span></>}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
        {[
          { v: String(cd.h).padStart(2, "0"), l: "HRS" },
          { v: String(cd.m).padStart(2, "0"), l: "MIN" },
          { v: String(cd.s).padStart(2, "0"), l: "SEC" },
        ].map((x, i) => (
          <div key={x.l} style={{ textAlign: "center" }}>
            {i > 0 && <span style={{ fontSize: 20, fontWeight: 800, color: col, lineHeight: 1, display: "block", marginBottom: 14, marginLeft: -12, marginRight: -4 }}>:</span>}
            <div style={{
              background: `${col}20`, border: `1px solid ${col}44`,
              borderRadius: 10, padding: "8px 12px",
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: 26, fontWeight: 800, color: col, lineHeight: 1,
              minWidth: 56, textAlign: "center",
            }}>{x.v}</div>
            <div style={{ fontSize: 8, color: T.muted, letterSpacing: "0.12em", marginTop: 4 }}>{x.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────
export default function EconomicCalendar({ T, viewportWidth }) {
  const isMobile = viewportWidth < 768
  const [raw, setRaw]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currencies, setCurrencies] = useState(["USD","EUR","GBP","CAD"])
  const [impacts, setImpacts]   = useState(["High","Medium"])
  const spinRef = useRef(null)

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true)
    try {
      const r = await fetch("/api/news", { cache: "no-store" })
      if (!r.ok) throw new Error(`API error ${r.status}`)
      const json = await r.json()
      // Attach parsed date objects + normalised day key
      const events = (json.events || []).map(e => ({
        ...e,
        _date:   parseEventDate(e),
        _dayKey: normaliseDateKey(e),
      }))
      setRaw({ ...json, events })
    } catch (err) {
      setRaw(r => r ?? { events: [], error: err.message, cached: false, fetchedAt: null })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const allEvents = raw?.events ?? []
  const countdown = useCountdown(allEvents)

  // Filter
  const filtered = allEvents.filter(e =>
    currencies.includes(e.country) && impacts.includes(e.impact)
  )

  // Group by normalised day key, sorted
  const grouped = {}
  filtered.forEach(e => {
    if (!e._dayKey || e._dayKey === "unknown") return
    ;(grouped[e._dayKey] ??= []).push(e)
  })
  const days = Object.keys(grouped).sort()

  const toggleCurrency = c => setCurrencies(p =>
    p.includes(c) ? (p.length > 1 ? p.filter(x => x !== c) : p) : [...p, c]
  )
  const toggleImpact = i => setImpacts(p =>
    p.includes(i) ? (p.length > 1 ? p.filter(x => x !== i) : p) : [...p, i]
  )

  return (
    <div style={{ padding: isMobile ? 14 : 24, display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>
            Economic Calendar
          </div>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 4, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span>High-impact events · This week</span>
            {raw?.cached && raw?.fetchedAt && (
              <span style={{ background: `${T.amber}15`, border: `1px solid ${T.amber}40`, color: T.amber, padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700 }}>
                ⚡ Cached · {timeSince(raw.fetchedAt)}
              </span>
            )}
            {raw && !raw.cached && (
              <span style={{ background: `${T.green}15`, border: `1px solid ${T.green}40`, color: T.green, padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700 }}>
                ✓ Live
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => load(true)}
          disabled={refreshing}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: T.surface2, border: `1px solid ${T.border}`,
            color: refreshing ? T.muted : T.text,
            padding: "8px 16px", borderRadius: 10,
            cursor: refreshing ? "wait" : "pointer",
            fontSize: 12, fontWeight: 600, fontFamily: "Inter,sans-serif",
          }}
        >
          <span style={{ fontSize: 14, display: "inline-block", transform: refreshing ? "rotate(180deg)" : "none", transition: "transform .6s" }}>↻</span>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginRight: 2 }}>Currency</span>
        {ALL_CURRENCIES.map(c => {
          const on = currencies.includes(c)
          return (
            <button key={c} onClick={() => toggleCurrency(c)} style={{
              padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
              cursor: "pointer", transition: "all .15s",
              background: on ? `${T.accentBright}18` : "none",
              border: `1px solid ${on ? T.accentBright : T.border}`,
              color: on ? T.accentBright : T.muted,
              fontFamily: "Inter,sans-serif",
            }}>
              {FLAGS[c] ?? ""} {c}
            </button>
          )
        })}
        <div style={{ width: 1, height: 18, background: T.border, margin: "0 4px" }}/>
        {["High","Medium"].map(i => {
          const on = impacts.includes(i)
          const col = impactColor(i, T)
          return (
            <button key={i} onClick={() => toggleImpact(i)} style={{
              padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700,
              cursor: "pointer", transition: "all .15s",
              background: on ? `${col}18` : "none",
              border: `1px solid ${on ? col : T.border}`,
              color: on ? col : T.muted,
              display: "flex", alignItems: "center", gap: 5,
              fontFamily: "Inter,sans-serif",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: on ? col : T.border, display: "inline-block" }}/>
              {i}
            </button>
          )
        })}
      </div>

      {/* ── Countdown banner ── */}
      {!loading && <CountdownBanner T={T} cd={countdown}/>}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>📡</div>
          <div style={{ color: T.textDim, fontSize: 13 }}>Loading calendar…</div>
        </div>
      )}

      {/* ── Error with no data ── */}
      {!loading && raw?.error && !raw?.events?.length && (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>📡</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 8 }}>
            Calendar unavailable
          </div>
          <div style={{ fontSize: 13, color: T.textDim, marginBottom: 20, maxWidth: 360, margin: "0 auto 20px" }}>
            {raw.error} — the live feed is down and no cache was found.
            <br/>Set up the Supabase cache table so next time it works offline.
          </div>
          <button onClick={() => load(true)} style={{
            background: `linear-gradient(135deg,${T.accentBright},${T.pink})`,
            color: "#fff", border: "none", padding: "10px 24px",
            borderRadius: 10, cursor: "pointer", fontSize: 13,
            fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700,
          }}>Try Again</button>
        </div>
      )}

      {/* ── Week view ── */}
      {!loading && days.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {days.map(dayKey => {
            const dayEvents = grouped[dayKey]
            const today = isToday(dayKey)
            const label = dayLabel(dayKey)
            return (
              <div key={dayKey}>
                {/* Day header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  marginBottom: 10,
                  paddingBottom: 8,
                  borderBottom: `1px solid ${today ? T.accentBright + "44" : T.border}`,
                }}>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    fontSize: 14, fontWeight: 800,
                    color: today ? T.accentBright : T.text,
                  }}>{label}</div>
                  {today && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: "0.12em",
                      background: T.accentBright, color: T.bg,
                      padding: "2px 8px", borderRadius: 999,
                    }}>TODAY</span>
                  )}
                  <span style={{ fontSize: 11, color: T.muted, marginLeft: "auto" }}>
                    {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Events */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {dayEvents.map((e, i) => {
                    const warn = countdown?.warning && today && e.impact === "High"
                    return <EventRow key={i} T={T} event={e} warn={warn}/>
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── No events after filter ── */}
      {!loading && days.length === 0 && (raw?.events?.length ?? 0) > 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: T.muted, fontSize: 13 }}>
          No events match your currency / impact filters this week.
        </div>
      )}

      {/* ── Footer ── */}
      {!loading && (raw?.events?.length ?? 0) > 0 && (
        <div style={{
          fontSize: 10, color: T.muted, textAlign: "center",
          paddingTop: 8, borderTop: `1px solid ${T.border}`,
          display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap",
        }}>
          <span>📅 Times in ET (Eastern Time)</span>
          <span>·</span>
          <span>Source: ForexFactory</span>
          {raw?.fetchedAt && <><span>·</span><span>Fetched {timeSince(raw.fetchedAt)}</span></>}
          {raw?.cached && <><span>·</span><span style={{ color: T.amber }}>⚡ Serving cached data</span></>}
        </div>
      )}
    </div>
  )
}
