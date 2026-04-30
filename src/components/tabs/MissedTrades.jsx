"use client"
import { useMemo } from "react"
import { MISSED_REASONS } from "@/lib/constants"
import { fmtDate, getMissedTradeImages, getMissedTradeNote } from "@/lib/utils"
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
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 14,
      padding: "14px 16px",
    }}>
      <div style={{ fontSize:9, fontWeight:800, color:T.muted, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:7 }}>{label}</div>
      <div style={{ fontFamily:"'JetBrains Mono','Fira Code',monospace", fontSize:22, fontWeight:800, color, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, color:T.textDim, marginTop:5 }}>{sub}</div>
      {note && <div style={{ fontSize:10, color, marginTop:5, fontWeight:800 }}>{note}</div>}
    </div>
  )
}

export default function MissedTrades({ T, trades, missedTrades, onNew, onEdit, onDelete, onViewImg, viewportWidth }) {
  const isMobile = viewportWidth < 768

  const sorted = useMemo(() =>
    [...missedTrades].sort((a, b) => new Date(b.date) - new Date(a.date))
  , [missedTrades])

  const known   = useMemo(() => missedTrades.filter(m => m.outcome !== "Unknown"), [missedTrades])
  const wins    = useMemo(() => known.filter(m => m.outcome === "WIN"), [known])
  const hitRate = known.length ? Math.round(wins.length / known.length * 100) : null

  const rLeftBehind = useMemo(() =>
    wins.reduce((s, m) => s + (parseFloat(m.rr) || 0), 0)
  , [wins])

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

  const takenWinRate = trades.length
    ? Math.round(trades.filter(t => t.result === "WIN").length / trades.length * 100)
    : null

  const insight = hitRate !== null && takenWinRate !== null
    ? hitRate > takenWinRate
      ? { good: false, msg: `Missed setups hit ${hitRate}% vs taken trades at ${takenWinRate}%. You may be filtering too hard.` }
      : { good: true, msg: `Missed setups hit ${hitRate}% vs taken trades at ${takenWinRate}%. Your skip filter is helping.` }
    : null

  if (!missedTrades.length) {
    return (
      <div style={{ padding:isMobile?16:28 }}>
        <EmptyState T={T}
          icon="MT"
          title="No missed trades logged yet"
          copy="Track setups you saw but skipped. Add the chart, the reason, and whether it worked out later."
          action={<Btn T={T} onClick={onNew}>+ Log Missed Trade</Btn>}
        />
      </div>
    )
  }

  return (
    <div style={{ padding:isMobile?14:24, display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)", gap:10 }}>
        <StatCard T={T} label="Missed Setups" value={missedTrades.length} sub="not taken" color={T.textDim}/>
        <StatCard
          T={T}
          label="Hit Rate"
          value={hitRate !== null ? `${hitRate}%` : "-"}
          sub={known.length ? `${known.length} with outcome` : "add outcomes"}
          color={hitRate === null ? T.muted : hitRate > (takenWinRate || 50) ? T.red : T.green}
          note={hitRate !== null ? (hitRate > (takenWinRate || 50) ? "Watch hesitation" : "Good filter") : null}
        />
        <StatCard T={T} label="R Left Behind" value={rLeftBehind > 0 ? `+${rLeftBehind.toFixed(1)}R` : "-"} sub="confirmed winners" color={rLeftBehind > 0 ? T.red : T.muted}/>
        <StatCard T={T} label="Top Reason" value={topReason ? topReason[0] : "-"} sub={topReason ? `${topReason[1]} logged` : "no data yet"} color={T.amber}/>
      </div>

      {insight && (
        <div style={{
          padding:"12px 14px",
          borderRadius:12,
          fontSize:12,
          lineHeight:1.55,
          background: insight.good ? `${T.green}10` : `${T.red}10`,
          border:`1px solid ${insight.good ? T.green : T.red}33`,
          color: insight.good ? T.green : T.red,
          fontWeight:700,
        }}>
          {insight.msg}
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:14 }}>
        <Card T={T} style={{ borderRadius:16, padding:"16px 18px" }}>
          <CardTitle T={T}>Why You Miss Trades</CardTitle>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {MISSED_REASONS.filter(r => reasonCounts[r] > 0).sort((a, b) => reasonCounts[b] - reasonCounts[a]).map(r => (
              <div key={r}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:5 }}>
                  <span style={{ color:T.text, fontWeight:700 }}>{r}</span>
                  <span style={{ color:T.muted, fontWeight:800 }}>{reasonCounts[r]}</span>
                </div>
                <div style={{ height:6, background:T.surface2, borderRadius:999, overflow:"hidden" }}>
                  <div style={{
                    width:`${(reasonCounts[r] / maxReasonCount) * 100}%`,
                    height:"100%",
                    background:T.accentBright,
                    borderRadius:999,
                  }}/>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card T={T} style={{ borderRadius:16, padding:"16px 18px" }}>
          <CardTitle T={T}>Missed vs Taken</CardTitle>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { label:"Taken", wr:takenWinRate, n:trades.length, color:T.accentBright },
              { label:"Missed", wr:hitRate, n:known.length, color:T.amber },
            ].map(g => (
              <div key={g.label} style={{ background:T.surface2, borderRadius:12, padding:"12px 14px", border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:9, color:T.muted, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:8 }}>{g.label}</div>
                <div style={{ fontFamily:"'JetBrains Mono','Fira Code',monospace", fontSize:24, fontWeight:800, color:g.wr !== null ? g.color : T.muted, lineHeight:1 }}>
                  {g.wr !== null ? `${g.wr}%` : "-"}
                </div>
                <div style={{ fontSize:11, color:T.textDim, marginTop:5 }}>{g.n} logged</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card T={T} style={{ borderRadius:16, padding:"16px 18px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:14 }}>
          <CardTitle T={T}>All Missed Trades</CardTitle>
          <Btn T={T} onClick={onNew}>+ Log Missed Trade</Btn>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {sorted.map(m => {
            const rrNum = parseFloat(m.rr) || 0
            const note = getMissedTradeNote(m)
            const screenshots = getMissedTradeImages(m)
            return (
              <div key={m._dbid} style={{
                display:"flex",
                alignItems:"flex-start",
                gap:12,
                padding:"12px 14px",
                background:T.surface2,
                borderRadius:12,
                border:`1px solid ${T.border}`,
              }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6, flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"var(--font-geist-sans)", fontWeight:800, color:T.accentBright, fontSize:14 }}>{m.pair}</span>
                    <Badge color={m.direction === "LONG" ? T.green : T.red}>{m.direction}</Badge>
                    {m.outcome !== "Unknown" && <Badge color={outcomeColor(m.outcome, T)}>{m.outcome}</Badge>}
                    <span style={{ fontSize:11, color:T.muted }}>{fmtDate(m.date)}</span>
                  </div>

                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                    <span style={{
                      fontSize:11,
                      fontWeight:800,
                      color:T.amber,
                      background:`${T.amber}12`,
                      border:`1px solid ${T.amber}30`,
                      padding:"2px 8px",
                      borderRadius:6,
                    }}>{m.reason}</span>
                    {m.setup && <span style={{ fontSize:11, color:T.textDim }}>{m.setup}</span>}
                    {note && (
                      <span style={{ fontSize:11, color:T.muted, fontStyle:"italic" }}>
                        {note.slice(0, 58)}{note.length > 58 ? "..." : ""}
                      </span>
                    )}
                  </div>

                  {screenshots.length > 0 && (
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
                      {screenshots.slice(0, 3).map((src, index) => (
                        <button
                          key={`${m._dbid}-shot-${index}`}
                          onClick={() => onViewImg?.(src)}
                          style={{
                            background:T.surface,
                            border:`1px solid ${T.border}`,
                            color:T.textDim,
                            borderRadius:8,
                            padding:"5px 9px",
                            cursor:"pointer",
                            fontSize:11,
                            fontWeight:800,
                            fontFamily:"var(--font-geist-sans)",
                          }}
                        >
                          {index === 0 ? "Chart" : `Chart ${index + 1}`}
                        </button>
                      ))}
                      {screenshots.length > 3 && <span style={{ color:T.muted, fontSize:11, fontWeight:800, alignSelf:"center" }}>+{screenshots.length - 3}</span>}
                    </div>
                  )}
                </div>

                <div style={{ textAlign:"right", flexShrink:0 }}>
                  {m.rr && (
                    <div style={{
                      fontSize:16,
                      fontWeight:800,
                      lineHeight:1.1,
                      fontFamily:"'JetBrains Mono','Fira Code',monospace",
                      color: m.outcome === "WIN" ? T.red : m.outcome === "LOSS" ? T.green : T.accentBright,
                    }}>
                      {rrNum >= 0 ? "+" : ""}{rrNum.toFixed(1)}R
                    </div>
                  )}
                  {m.outcome === "WIN" && m.rr && <div style={{ fontSize:9, color:T.red, fontWeight:800, marginTop:3 }}>MISSED</div>}
                  <div style={{ display:"flex", gap:5, marginTop:7, justifyContent:"flex-end" }}>
                    <button
                      onClick={() => onEdit(m)}
                      style={{ background:"none", border:`1px solid ${T.border}`, color:T.textDim, borderRadius:7, padding:"4px 10px", cursor:"pointer", fontSize:11, fontFamily:"var(--font-geist-sans)", fontWeight:700 }}
                    >Edit</button>
                    <button
                      onClick={() => onDelete(m)}
                      style={{ background:"none", border:`1px solid ${T.red}44`, color:T.red, borderRadius:7, padding:"4px 10px", cursor:"pointer", fontSize:11, fontFamily:"var(--font-geist-sans)", fontWeight:700 }}
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
