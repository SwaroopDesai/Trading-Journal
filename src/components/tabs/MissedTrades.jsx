"use client"
import { useMemo } from "react"
import { MISSED_REASONS } from "@/lib/constants"
import { fmtDate } from "@/lib/utils"
import { EmptyState, Btn, Badge, Card, CardTitle } from "@/components/ui"

function outcomeColor(outcome, T) {
  if (outcome === "WIN")  return T.green
  if (outcome === "LOSS") return T.red
  if (outcome === "BE")   return T.amber
  return T.muted
}

function StatCard({ T, label, value, sub, color, note }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 16, padding: "16px 18px",
      boxShadow: `0 6px 20px ${T.cardGlow}`,
    }}>
      <div style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:24, fontWeight:800, color, lineHeight:1, letterSpacing:"-0.03em" }}>{value}</div>
      <div style={{ fontSize:11, color:T.textDim, marginTop:4 }}>{sub}</div>
      {note && <div style={{ fontSize:10, color, marginTop:4, fontWeight:700 }}>{note}</div>}
    </div>
  )
}

export default function MissedTrades({ T, trades, missedTrades, onNew, onEdit, onDelete, viewportWidth }) {
  const isMobile = viewportWidth < 768

  const sorted = useMemo(() =>
    [...missedTrades].sort((a, b) => new Date(b.date) - new Date(a.date))
  , [missedTrades])

  // ── Analytics ────────────────────────────────────────────────────────────
  const known   = useMemo(() => missedTrades.filter(m => m.outcome !== "Unknown"), [missedTrades])
  const wins    = useMemo(() => known.filter(m => m.outcome === "WIN"), [known])
  const hitRate = known.length ? Math.round(wins.length / known.length * 100) : null

  // R left on table = confirmed WIN setups × their potential RR
  const rLeftBehind = useMemo(() =>
    wins.reduce((s, m) => s + (parseFloat(m.rr) || 0), 0)
  , [wins])

  // Reason frequency map
  const reasonCounts = useMemo(() => {
    const map = {}
    MISSED_REASONS.forEach(r => { map[r] = 0 })
    missedTrades.forEach(m => { if (map[m.reason] !== undefined) map[m.reason]++ })
    return map
  }, [missedTrades])

  const topReason = useMemo(() =>
    Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).find(([, n]) => n > 0)
  , [reasonCounts])

  const maxReasonCount = Math.max(...Object.values(reasonCounts), 1)

  // Taken win rate for comparison
  const takenWinRate = trades.length
    ? Math.round(trades.filter(t => t.result === "WIN").length / trades.length * 100)
    : null

  // Insight message
  const insight = hitRate !== null && takenWinRate !== null
    ? hitRate > takenWinRate
      ? { good: false, msg: `Your missed setups hit ${hitRate}% — higher than your taken trade win rate (${takenWinRate}%). You may be over-filtering or hesitating on good setups.` }
      : { good: true,  msg: `Your missed setups only hit ${hitRate}% vs your ${takenWinRate}% taken win rate. Your hesitation is filtering out weaker setups — solid instinct.` }
    : null

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!missedTrades.length) {
    return (
      <div style={{ padding:isMobile?16:28 }}>
        <EmptyState T={T}
          icon="👁"
          title="No missed trades logged yet"
          copy="Start tracking setups you saw but didn't take. After a few weeks the data will tell you whether you're skipping good trades out of fear — or saving yourself from bad ones."
          action={<Btn T={T} onClick={onNew}>+ Log Missed Trade</Btn>}
        />
      </div>
    )
  }

  return (
    <div style={{ padding:isMobile?14:24, display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── Stat row ─────────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)", gap:12 }}>
        <StatCard T={T} label="Missed Setups" value={missedTrades.length}
          sub="not taken" color={T.textDim}/>
        <StatCard T={T}
          label="Hit Rate"
          value={hitRate !== null ? `${hitRate}%` : "—"}
          sub={known.length ? `${known.length} with outcome` : "fill in outcomes"}
          color={hitRate === null ? T.muted : hitRate > (takenWinRate || 50) ? T.red : T.green}
          note={hitRate !== null ? (hitRate > (takenWinRate || 50) ? "Over-filtering ⚠" : "Good discipline ✓") : null}
        />
        <StatCard T={T} label="R Left Behind"
          value={rLeftBehind > 0 ? `+${rLeftBehind.toFixed(1)}R` : "—"}
          sub="from confirmed winners" color={rLeftBehind > 0 ? T.red : T.muted}/>
        <StatCard T={T} label="Top Reason"
          value={topReason ? topReason[0] : "—"}
          sub={topReason ? `${topReason[1]}× logged` : "no data yet"}
          color={T.amber}/>
      </div>

      {/* ── Insight banner ───────────────────────────────────────────────── */}
      {insight && (
        <div style={{
          padding:"14px 18px", borderRadius:14, fontSize:13, lineHeight:1.6,
          background: insight.good ? `${T.green}10` : `${T.red}10`,
          border:`1px solid ${insight.good ? T.green : T.red}40`,
          color: insight.good ? T.green : T.red,
        }}>
          {insight.good ? "✅" : "⚠️"} {insight.msg}
        </div>
      )}

      {/* ── Analytics row ────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:16 }}>

        {/* Reason breakdown */}
        <Card T={T} style={{ borderRadius:18, padding:"18px 20px" }}>
          <CardTitle T={T}>Why You Miss Trades</CardTitle>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {MISSED_REASONS
              .filter(r => reasonCounts[r] > 0)
              .sort((a, b) => reasonCounts[b] - reasonCounts[a])
              .map(r => (
                <div key={r}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                    <span style={{ color:T.text, fontWeight:600 }}>{r}</span>
                    <span style={{ color:T.muted, fontWeight:700 }}>{reasonCounts[r]}</span>
                  </div>
                  <div style={{ height:6, background:T.surface2, borderRadius:999, overflow:"hidden" }}>
                    <div style={{
                      width:`${(reasonCounts[r] / maxReasonCount) * 100}%`,
                      height:"100%",
                      background:`linear-gradient(90deg,${T.accentBright},${T.pink})`,
                      borderRadius:999,
                      transition:"width .7s cubic-bezier(.16,1,.3,1)",
                    }}/>
                  </div>
                </div>
              ))
            }
            {MISSED_REASONS.every(r => !reasonCounts[r]) && (
              <div style={{ color:T.muted, fontSize:12, textAlign:"center", padding:"12px 0" }}>No reason data yet</div>
            )}
          </div>
        </Card>

        {/* Missed vs Taken */}
        <Card T={T} style={{ borderRadius:18, padding:"18px 20px" }}>
          <CardTitle T={T}>Missed vs Taken</CardTitle>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
            {[
              { label:"Taken Trades",  wr:takenWinRate, n:trades.length,       color:T.accentBright },
              { label:"Missed Setups", wr:hitRate,      n:known.length,        color:T.amber },
            ].map(g => (
              <div key={g.label} style={{
                background:T.surface2, borderRadius:12, padding:"14px 16px",
                border:`1px solid ${T.border}`,
              }}>
                <div style={{ fontSize:10, color:T.muted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>{g.label}</div>
                <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:28, fontWeight:800, color:g.wr !== null ? g.color : T.muted, lineHeight:1 }}>
                  {g.wr !== null ? `${g.wr}%` : "—"}
                </div>
                <div style={{ fontSize:11, color:T.textDim, marginTop:5 }}>Win rate · {g.n} trade{g.n !== 1 ? "s" : ""}</div>
              </div>
            ))}
          </div>

          {/* Win / Loss / BE outcome breakdown */}
          {known.length > 0 && (
            <div>
              <div style={{ fontSize:10, color:T.muted, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>Outcome Breakdown</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[
                  { label:"WIN",  n:wins.length,                                   color:T.green },
                  { label:"LOSS", n:known.filter(m=>m.outcome==="LOSS").length,    color:T.red },
                  { label:"BE",   n:known.filter(m=>m.outcome==="BE").length,      color:T.amber },
                ].filter(x => x.n > 0).map(x => (
                  <div key={x.label} style={{
                    padding:"6px 14px", borderRadius:10, fontSize:12, fontWeight:700,
                    background:`${x.color}15`, color:x.color, border:`1px solid ${x.color}40`,
                  }}>
                    {x.n} {x.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── Trade list ───────────────────────────────────────────────────── */}
      <Card T={T} style={{ borderRadius:18, padding:"18px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <CardTitle T={T}>All Missed Trades</CardTitle>
          <Btn T={T} onClick={onNew}>+ Log Missed Trade</Btn>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {sorted.map(m => {
            const rrNum = parseFloat(m.rr) || 0
            return (
              <div key={m._dbid} style={{
                display:"flex", alignItems:"center", gap:12,
                padding:"12px 14px",
                background:T.surface2, borderRadius:12, border:`1px solid ${T.border}`,
              }}>
                {/* Left: info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5, flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, color:T.accentBright, fontSize:14 }}>{m.pair}</span>
                    <Badge color={m.direction === "LONG" ? T.green : T.red}>{m.direction}</Badge>
                    {m.outcome !== "Unknown" && <Badge color={outcomeColor(m.outcome, T)}>{m.outcome}</Badge>}
                    <span style={{ fontSize:11, color:T.muted }}>{fmtDate(m.date)}</span>
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                    <span style={{
                      fontSize:11, fontWeight:700, color:T.amber,
                      background:`${T.amber}15`, border:`1px solid ${T.amber}30`,
                      padding:"2px 8px", borderRadius:6,
                    }}>{m.reason}</span>
                    {m.setup && <span style={{ fontSize:11, color:T.textDim }}>{m.setup}</span>}
                    {m.notes && (
                      <span style={{ fontSize:11, color:T.muted, fontStyle:"italic" }}>
                        {m.notes.slice(0, 55)}{m.notes.length > 55 ? "…" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: RR + actions */}
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  {m.rr && (
                    <div style={{
                      fontSize:16, fontWeight:800, lineHeight:1.1,
                      fontFamily:"'JetBrains Mono','Fira Code',monospace",
                      color: m.outcome === "WIN" ? T.red : m.outcome === "LOSS" ? T.green : T.accentBright,
                    }}>
                      {rrNum >= 0 ? "+" : ""}{rrNum.toFixed(1)}R
                    </div>
                  )}
                  {m.outcome === "WIN" && m.rr && (
                    <div style={{ fontSize:9, color:T.red, fontWeight:700, marginTop:2 }}>MISSED</div>
                  )}
                  <div style={{ display:"flex", gap:5, marginTop:6, justifyContent:"flex-end" }}>
                    <button
                      onClick={() => onEdit(m)}
                      style={{ background:"none", border:`1px solid ${T.border}`, color:T.textDim, borderRadius:7, padding:"3px 10px", cursor:"pointer", fontSize:11, fontFamily:"Inter,sans-serif" }}
                    >Edit</button>
                    <button
                      onClick={() => onDelete(m)}
                      style={{ background:"none", border:`1px solid ${T.red}44`, color:T.red, borderRadius:7, padding:"3px 10px", cursor:"pointer", fontSize:11, fontFamily:"Inter,sans-serif" }}
                    >Delete</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
