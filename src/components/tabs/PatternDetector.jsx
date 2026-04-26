"use client"
import { useMemo } from "react"

const MIN_SAMPLE = 5

// ── Stats helpers ─────────────────────────────────────────────────────────
function wr(trades) {
  if (!trades.length) return 0
  return trades.filter(t => t.result === "WIN").length / trades.length
}
function avgR(trades) {
  if (!trades.length) return 0
  return trades.reduce((s, t) => s + (t.rr || 0), 0) / trades.length
}
function pct(n) { return Math.round(n * 100) }
function confidence(n) {
  if (n >= 25) return { label:"High", color:null }
  if (n >= 12) return { label:"Medium", color:null }
  return { label:"Low", color:null }
}

// ── Pattern engine ────────────────────────────────────────────────────────
function detect(trades) {
  if (trades.length < MIN_SAMPLE * 2) return []
  const overall = wr(trades)
  const patterns = []

  const add = (p) => { if (p) patterns.push(p) }

  // ── 1. By session ─────────────────────────────────────────────────────
  const bySess = {}
  trades.forEach(t => { if (t.session) (bySess[t.session] ??= []).push(t) })
  Object.entries(bySess).forEach(([sess, ts]) => {
    if (ts.length < MIN_SAMPLE) return
    const w = wr(ts); const delta = w - overall
    if (Math.abs(delta) < 0.1) return
    add({
      type:       delta > 0 ? "edge" : "leak",
      category:   "Session",
      title:      `${sess} Session`,
      stat:       `${pct(w)}% win rate`,
      delta,
      detail:     `${ts.length} trades · ${delta > 0 ? "+" : ""}${pct(delta)}% vs your average`,
      insight:    delta > 0
        ? `Your clearest edge is in the ${sess} session. Prioritise it.`
        : `You underperform in the ${sess} session. Consider skipping it.`,
      n: ts.length,
      conf: confidence(ts.length),
    })
  })

  // ── 2. Day of week ────────────────────────────────────────────────────
  const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
  const byDay = {}
  trades.forEach(t => {
    if (!t.date) return
    const d = DAY_NAMES[new Date(t.date + "T12:00:00").getDay()]
    if (d !== "Sun" && d !== "Sat") (byDay[d] ??= []).push(t)
  })
  let bestDay = null, worstDay = null
  Object.entries(byDay).forEach(([d, ts]) => {
    if (ts.length < MIN_SAMPLE) return
    const w = wr(ts); const delta = w - overall
    if (!bestDay  || delta > bestDay.delta)  bestDay  = { d, w, delta, n: ts.length }
    if (!worstDay || delta < worstDay.delta) worstDay = { d, w, delta, n: ts.length }
  })
  if (bestDay && bestDay.delta > 0.1)
    add({ type:"edge", category:"Day of Week", title:`${bestDay.d}s are your best day`,
      stat:`${pct(bestDay.w)}% win rate`, delta:bestDay.delta, n:bestDay.n, conf:confidence(bestDay.n),
      detail:`${bestDay.n} trades · +${pct(bestDay.delta)}% vs average`,
      insight:`${bestDay.d}s consistently deliver. Look for what's different — session overlap, mindset, preparation.`
    })
  if (worstDay && worstDay.delta < -0.1)
    add({ type:"leak", category:"Day of Week", title:`${worstDay.d}s are your worst day`,
      stat:`${pct(worstDay.w)}% win rate`, delta:worstDay.delta, n:worstDay.n, conf:confidence(worstDay.n),
      detail:`${worstDay.n} trades · ${pct(worstDay.delta)}% vs average`,
      insight:`${worstDay.d}s are hurting your P&L. Consider going flat or sizing down on this day.`
    })

  // ── 3. By setup ───────────────────────────────────────────────────────
  const bySetup = {}
  trades.forEach(t => { if (t.setup) (bySetup[t.setup] ??= []).push(t) })
  Object.entries(bySetup).forEach(([setup, ts]) => {
    if (ts.length < MIN_SAMPLE) return
    const w = wr(ts); const delta = w - overall; const ar = avgR(ts)
    if (Math.abs(delta) < 0.12) return
    add({
      type: delta > 0 ? "edge" : "leak",
      category: "Setup",
      title: setup,
      stat: `${pct(w)}% win rate`,
      delta, n: ts.length, conf: confidence(ts.length),
      detail: `${ts.length} trades · avg ${ar.toFixed(1)}R · ${delta > 0 ? "+" : ""}${pct(delta)}% vs average`,
      insight: delta > 0
        ? `This is your best setup — high win rate and repeatable. Scale into it.`
        : `This setup drags down your stats. Consider tightening the rules or dropping it.`,
    })
  })

  // ── 4. By pair ────────────────────────────────────────────────────────
  const byPair = {}
  trades.forEach(t => { if (t.pair) (byPair[t.pair] ??= []).push(t) })
  Object.entries(byPair).forEach(([pair, ts]) => {
    if (ts.length < MIN_SAMPLE) return
    const w = wr(ts); const delta = w - overall; const ar = avgR(ts)
    if (Math.abs(delta) < 0.15) return
    add({
      type: delta > 0 ? "edge" : "leak",
      category: "Pair",
      title: pair,
      stat: `${pct(w)}% win rate`,
      delta, n: ts.length, conf: confidence(ts.length),
      detail: `${ts.length} trades · avg ${ar.toFixed(1)}R · ${delta > 0 ? "+" : ""}${pct(delta)}% vs average`,
      insight: delta > 0
        ? `${pair} is your strongest pair. You read it well — focus here.`
        : `${pair} is consistently hurting you. Consider removing it from your watchlist.`,
    })
  })

  // ── 5. Direction bias ─────────────────────────────────────────────────
  const longs  = trades.filter(t => t.direction === "LONG")
  const shorts = trades.filter(t => t.direction === "SHORT")
  if (longs.length >= MIN_SAMPLE && shorts.length >= MIN_SAMPLE) {
    const lw = wr(longs); const sw = wr(shorts); const delta = lw - sw
    if (Math.abs(delta) > 0.12) {
      const [better, worse, bw, ww] = delta > 0
        ? ["LONG","SHORT",lw,sw] : ["SHORT","LONG",sw,lw]
      add({
        type: "edge", category: "Direction",
        title: `${better} trades are your edge`,
        stat: `${pct(bw)}% vs ${pct(ww)}%`,
        delta: Math.abs(delta),
        n: Math.min(longs.length, shorts.length),
        conf: confidence(Math.min(longs.length, shorts.length)),
        detail: `${better}: ${pct(bw)}% · ${worse}: ${pct(ww)}%`,
        insight: `You significantly outperform going ${better}. You may be fighting the trend on ${worse} trades.`,
      })
    }
  }

  // ── 6. Overtrading (3rd+ trade of day) ───────────────────────────────
  const byDate = {}
  trades.forEach(t => (byDate[t.date] ??= []).push(t))
  const third = []
  Object.values(byDate).forEach(ts => {
    const sorted = [...ts].sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
    sorted.slice(2).forEach(t => third.push(t))
  })
  if (third.length >= MIN_SAMPLE) {
    const w = wr(third); const delta = w - overall
    if (delta < -0.08)
      add({
        type: "leak", category: "Overtrading",
        title: "3rd+ trade of the day",
        stat: `${pct(w)}% win rate`,
        delta, n: third.length, conf: confidence(third.length),
        detail: `${third.length} trades · ${pct(delta)}% vs average`,
        insight: `Your edge disappears after your 2nd trade. Consider a hard 2-trade daily limit.`,
      })
  }

  // ── 7. After a loss (revenge trading) ────────────────────────────────
  const sortedAll = [...trades].sort((a,b) =>
    (a.date + (a.created_at||"")).localeCompare(b.date + (b.created_at||""))
  )
  const afterLoss = [], afterWin = []
  for (let i = 1; i < sortedAll.length; i++) {
    if (sortedAll[i-1].result === "LOSS") afterLoss.push(sortedAll[i])
    if (sortedAll[i-1].result === "WIN")  afterWin.push(sortedAll[i])
  }
  if (afterLoss.length >= MIN_SAMPLE) {
    const w = wr(afterLoss); const delta = w - overall
    if (delta < -0.08)
      add({
        type: "leak", category: "Psychology",
        title: "Trade immediately after a loss",
        stat: `${pct(w)}% win rate`,
        delta, n: afterLoss.length, conf: confidence(afterLoss.length),
        detail: `${afterLoss.length} trades · ${pct(delta)}% vs average`,
        insight: `You underperform after a loss. Take a break — 15 minutes minimum before re-entering.`,
      })
  }
  if (afterWin.length >= MIN_SAMPLE) {
    const w = wr(afterWin); const delta = w - overall
    if (delta < -0.1)
      add({
        type: "leak", category: "Psychology",
        title: "Trade immediately after a win",
        stat: `${pct(w)}% win rate`,
        delta, n: afterWin.length, conf: confidence(afterWin.length),
        detail: `${afterWin.length} trades · ${pct(delta)}% vs average`,
        insight: `Overconfidence after wins is costing you. Stay disciplined — wins don't change the next setup.`,
      })
  }

  // ── 8. By emotion ─────────────────────────────────────────────────────
  const byEmo = {}
  trades.forEach(t => { if (t.emotion) (byEmo[t.emotion] ??= []).push(t) })
  Object.entries(byEmo).forEach(([emo, ts]) => {
    if (ts.length < MIN_SAMPLE) return
    const w = wr(ts); const delta = w - overall
    if (Math.abs(delta) < 0.12) return
    add({
      type: delta > 0 ? "edge" : "leak",
      category: "Psychology",
      title: `Trading while "${emo}"`,
      stat: `${pct(w)}% win rate`,
      delta, n: ts.length, conf: confidence(ts.length),
      detail: `${ts.length} trades · ${delta > 0 ? "+" : ""}${pct(delta)}% vs average`,
      insight: delta > 0
        ? `You perform best when feeling ${emo}. Protect this state — recognise what creates it.`
        : `Trading while ${emo} is costing you. Log the emotion and step away until it passes.`,
    })
  })

  return patterns.sort((a,b) => Math.abs(b.delta) - Math.abs(a.delta))
}

// ── Pattern card ──────────────────────────────────────────────────────────
function PatternCard({ T, p }) {
  const isEdge = p.type === "edge"
  const col    = isEdge ? T.green : T.red

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${col}33`,
      borderRadius: 18,
      padding: "18px 20px",
      boxShadow: `0 8px 32px ${col}10`,
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      {/* Top row */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase",
              background: `${col}18`, color: col, border: `1px solid ${col}33`,
              padding: "2px 8px", borderRadius: 999,
            }}>{isEdge ? "EDGE" : "LEAK"}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing:"0.1em", textTransform:"uppercase" }}>
              {p.category}
            </span>
          </div>
          <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 800, color: T.text }}>
            {p.title}
          </div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{
            fontFamily:"'Plus Jakarta Sans',sans-serif",
            fontSize: 24, fontWeight: 800, color: col, lineHeight: 1,
            letterSpacing: "-0.03em",
          }}>{p.stat}</div>
          <div style={{
            fontSize: 11, fontWeight: 700, marginTop: 3,
            color: isEdge ? T.green : T.red,
          }}>
            {p.delta > 0 ? "+" : ""}{pct(p.delta)}% vs avg
          </div>
        </div>
      </div>

      {/* Detail */}
      <div style={{ fontSize: 11, color: T.textDim }}>{p.detail}</div>

      {/* Insight */}
      <div style={{
        padding: "10px 14px", borderRadius: 10, fontSize: 12, lineHeight: 1.6,
        background: `${col}08`, border: `1px solid ${col}22`, color: T.textDim,
      }}>
        {isEdge ? "💡 " : "⚠️ "}{p.insight}
      </div>

      {/* Footer */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontSize:10, color:T.muted }}>{p.n} trades analysed</span>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing:"0.08em", textTransform:"uppercase",
          color: p.conf.label === "High" ? T.green : p.conf.label === "Medium" ? T.amber : T.muted,
          background: `${p.conf.label === "High" ? T.green : p.conf.label === "Medium" ? T.amber : T.muted}15`,
          border: `1px solid ${p.conf.label === "High" ? T.green : p.conf.label === "Medium" ? T.amber : T.muted}33`,
          padding: "2px 8px", borderRadius: 999,
        }}>{p.conf.label} confidence</span>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function PatternDetector({ T, trades, viewportWidth }) {
  const isMobile = viewportWidth < 768
  const patterns = useMemo(() => detect(trades), [trades])
  const edges    = patterns.filter(p => p.type === "edge")
  const leaks    = patterns.filter(p => p.type === "leak")

  const overall  = trades.length ? wr(trades) : 0
  const needed   = Math.max(0, MIN_SAMPLE * 2 - trades.length)

  // Not enough data
  if (trades.length < MIN_SAMPLE * 2) {
    return (
      <div style={{ padding: isMobile?16:28, display:"flex", flexDirection:"column", gap:20, alignItems:"center", textAlign:"center", paddingTop:60 }}>
        <div style={{ fontSize:48 }}>🔍</div>
        <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:800, color:T.text }}>
          Not enough data yet
        </div>
        <div style={{ fontSize:14, color:T.textDim, maxWidth:400, lineHeight:1.7 }}>
          The pattern engine needs at least <strong style={{color:T.text}}>10 trades</strong> to surface meaningful patterns.
          Log {needed} more trade{needed!==1?"s":""} and come back.
        </div>
        <div style={{ fontSize:12, color:T.muted, marginTop:8 }}>
          Patterns detected: session, day of week, setup, pair, direction, overtrading, revenge trading, emotion
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding:isMobile?14:24, display:"flex", flexDirection:"column", gap:24 }}>

      {/* ── Header ── */}
      <div>
        <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:800, color:T.text, letterSpacing:"-0.03em" }}>
          Pattern Detector
        </div>
        <div style={{ fontSize:12, color:T.textDim, marginTop:4 }}>
          {trades.length} trades analysed · {patterns.length} pattern{patterns.length!==1?"s":""} found · Overall win rate {pct(overall)}%
        </div>
      </div>

      {/* ── Summary bar ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[
          { label:"Patterns Found", value:patterns.length, color:T.accentBright },
          { label:"Edges Identified", value:edges.length, color:T.green },
          { label:"Leaks Identified", value:leaks.length, color:T.red },
        ].map(s => (
          <div key={s.label} style={{
            background:T.surface, border:`1px solid ${T.border}`,
            borderRadius:14, padding:"14px 16px",
            boxShadow:`0 4px 16px ${T.cardGlow}`,
          }}>
            <div style={{ fontSize:10, fontWeight:700, color:T.muted, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>{s.label}</div>
            <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:28, fontWeight:800, color:s.color, lineHeight:1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── No patterns ── */}
      {patterns.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 0", color:T.textDim, fontSize:14 }}>
          No significant patterns detected yet. Keep trading and logging — patterns emerge over 30–50 trades.
        </div>
      )}

      {/* ── Edges ── */}
      {edges.length > 0 && (
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, fontWeight:800, color:T.green }}>
              🔥 Your Edges
            </div>
            <div style={{ fontSize:11, color:T.muted }}>— patterns where you consistently outperform</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)", gap:12 }}>
            {edges.map((p, i) => <PatternCard key={i} T={T} p={p}/>)}
          </div>
        </div>
      )}

      {/* ── Leaks ── */}
      {leaks.length > 0 && (
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, fontWeight:800, color:T.red }}>
              ⚠️ Your Leaks
            </div>
            <div style={{ fontSize:11, color:T.muted }}>— patterns where you consistently underperform</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)", gap:12 }}>
            {leaks.map((p, i) => <PatternCard key={i} T={T} p={p}/>)}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        fontSize:11, color:T.muted, textAlign:"center",
        paddingTop:8, borderTop:`1px solid ${T.border}`,
        lineHeight:1.7,
      }}>
        Patterns require ≥{MIN_SAMPLE} trades per group to appear · Confidence scales with sample size ·
        Results update as you log more trades
      </div>
    </div>
  )
}
