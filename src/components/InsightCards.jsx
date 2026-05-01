"use client"
import { useState, useEffect, useMemo } from "react";

// ─── Compute rule-based insights from trade data ───────────────────────────
function computeInsights(trades) {
  if (trades.length < 8) return []
  const insights = []
  const DAY = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

  // 1. Day-of-week pattern
  const dayStats = {}
  trades.forEach(t => {
    const d = new Date(t.date+"T12:00:00").getDay()
    if (!dayStats[d]) dayStats[d] = { wins:0, total:0, r:0 }
    dayStats[d].total++
    dayStats[d].r += (t.rr||0)
    if (t.result==="WIN") dayStats[d].wins++
  })
  const qualDays = Object.entries(dayStats).filter(([,s]) => s.total >= 4)
  if (qualDays.length >= 2) {
    const best  = qualDays.sort((a,b) => (b[1].wins/b[1].total)-(a[1].wins/a[1].total))[0]
    const worst = qualDays.sort((a,b) => (a[1].wins/a[1].total)-(b[1].wins/b[1].total))[0]
    const bestWR  = (best[1].wins/best[1].total*100).toFixed(0)
    const worstWR = (worst[1].wins/worst[1].total*100).toFixed(0)
    if (Number(worstWR) < 38)
      insights.push({ id:`bad-day-${worst[0]}`, type:"warning", icon:"DAY",
        title:`${DAY[worst[0]]}s are costing you`,
        copy:`${worst[1].wins}/${worst[1].total} wins on ${DAY[worst[0]]}s (${worstWR}% win rate). Consider sitting out or halving size on this day.` })
    if (Number(bestWR) > 62)
      insights.push({ id:`best-day-${best[0]}`, type:"positive", icon:"EDGE",
        title:`${DAY[best[0]]}s are your sharpest day`,
        copy:`${bestWR}% win rate on ${DAY[best[0]]}s across ${best[1].total} trades. This is where your edge is clearest, lean into it.` })
  }

  // 2. Session pattern
  const sesStats = {}
  trades.forEach(t => {
    if (!t.session) return
    if (!sesStats[t.session]) sesStats[t.session] = { wins:0, total:0, r:0 }
    sesStats[t.session].total++
    sesStats[t.session].r += (t.rr||0)
    if (t.result==="WIN") sesStats[t.session].wins++
  })
  const qualSes = Object.entries(sesStats).filter(([,s]) => s.total >= 4)
  if (qualSes.length >= 2) {
    const bestS  = [...qualSes].sort((a,b) => (b[1].wins/b[1].total)-(a[1].wins/a[1].total))[0]
    const worstS = [...qualSes].sort((a,b) => (a[1].wins/a[1].total)-(b[1].wins/b[1].total))[0]
    const bWR = (bestS[1].wins/bestS[1].total*100).toFixed(0)
    const wWR = (worstS[1].wins/worstS[1].total*100).toFixed(0)
    if (bestS[0] !== worstS[0] && Number(bWR)-Number(wWR) > 22)
      insights.push({ id:`session-edge`, type:"info", icon:"SES",
        title:`${bestS[0]} session is where your edge lives`,
        copy:`${bWR}% win rate in ${bestS[0]} vs ${wWR}% in ${worstS[0]}. Concentrating on your best session window will compound returns.` })
  }

  // 3. After-loss revenge pattern
  const sorted = [...trades].sort((a,b) => new Date(a.date)-new Date(b.date))
  let alWins = 0, alTotal = 0
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i-1].result==="LOSS") {
      alTotal++
      if (sorted[i].result==="WIN") alWins++
    }
  }
  if (alTotal >= 6) {
    const alWR = (alWins/alTotal*100).toFixed(0)
    if (Number(alWR) < 40)
      insights.push({ id:`revenge-pattern`, type:"warning", icon:"RISK",
        title:`After a loss you win only ${alWR}% of the time`,
        copy:`${alWins}/${alTotal} trades win after a loss. A mandatory cooling-off rule could protect serious R every week.` })
  }

  // 4. Best setup edge
  const setupStats = {}
  trades.forEach(t => {
    if (!t.setup) return
    if (!setupStats[t.setup]) setupStats[t.setup] = { wins:0, total:0, r:0 }
    setupStats[t.setup].total++
    setupStats[t.setup].r += (t.rr||0)
    if (t.result==="WIN") setupStats[t.setup].wins++
  })
  const qualSetups = Object.entries(setupStats).filter(([,s]) => s.total >= 4)
  if (qualSetups.length >= 1) {
    const bestSetup  = [...qualSetups].sort((a,b) => b[1].r-a[1].r)[0]
    const worstSetup = [...qualSetups].sort((a,b) => a[1].r-b[1].r)[0]
    const bExp = (bestSetup[1].r/bestSetup[1].total).toFixed(2)
    const wExp = (worstSetup[1].r/worstSetup[1].total).toFixed(2)
    if (Number(bExp) > 0.5)
      insights.push({ id:`best-setup-${bestSetup[0]}`, type:"positive", icon:"SET",
        title:`${bestSetup[0]} is your most profitable setup`,
        copy:`${bExp}R expectancy per trade across ${bestSetup[1].total} executions. This deserves your full focus and max position size.` })
    if (bestSetup[0] !== worstSetup[0] && Number(wExp) < -0.3)
      insights.push({ id:`worst-setup-${worstSetup[0]}`, type:"warning", icon:"CUT",
        title:`${worstSetup[0]} is bleeding your account`,
        copy:`${wExp}R expectancy per trade across ${worstSetup[1].total} attempts. Consider removing this setup from your playbook entirely.` })
  }

  // 5. Current loss streak
  const recent = [...trades].sort((a,b) => new Date(b.date)-new Date(a.date))
  let lossStreak = 0
  for (const t of recent) {
    if (t.result==="LOSS") lossStreak++
    else break
  }
  if (lossStreak >= 3)
    insights.push({ id:`loss-streak-${lossStreak}`, type:"alert", icon:"STOP",
      title:`You're on a ${lossStreak}-trade loss streak right now`,
      copy:`Historical data shows your win rate drops further after a streak. Consider sitting flat until conditions reset.` })

  // 6. Overtrading detection
  const byDate = {}
  trades.forEach(t => { if (!byDate[t.date]) byDate[t.date]=[]; byDate[t.date].push(t) })
  const heavyDays = Object.values(byDate).filter(ts => ts.length >= 4)
  if (heavyDays.length >= 3) {
    const hdWR = heavyDays.flat().filter(t=>t.result==="WIN").length / heavyDays.flat().length * 100
    const allWR = trades.filter(t=>t.result==="WIN").length / trades.length * 100
    if (hdWR < allWR - 15)
      insights.push({ id:`overtrading`, type:"warning", icon:"VOL",
        title:`More trades per day = worse results`,
        copy:`On 4+ trade days your win rate drops to ${hdWR.toFixed(0)}% vs your overall ${allWR.toFixed(0)}%. Quality beats quantity every time.` })
  }

  return insights
}

// ─── Insight card component ─────────────────────────────────────────────────
const COLORS = {
  positive: { bg:"T.green", border:"T.green", label:"Edge Found" },
  warning:  { bg:"T.amber", border:"T.amber", label:"Watch Out" },
  info:     { bg:"T.blue",  border:"T.blue",  label:"Pattern" },
  alert:    { bg:"T.red",   border:"T.red",   label:"Alert" },
}

function getColor(T, type, key) {
  const map = { positive: T.green, warning: T.amber, info: T.blue, alert: T.red }
  return map[type] || T.accentBright
}

const DISMISS_KEY = "fx_dismissed_insights"

export default function InsightCards({ T, trades, collapseEmpty = false }) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return []
    try {
      return JSON.parse(localStorage.getItem(DISMISS_KEY)||"[]")
    } catch {
      return []
    }
  })
  const [aiInsight, setAiInsight] = useState(() => {
    if (typeof window === "undefined") return null
    try {
      const cached = JSON.parse(localStorage.getItem("fx_ai_insight")||"null")
      return cached && Date.now() - cached.ts < 7 * 24 * 60 * 60 * 1000 ? cached.text : null
    } catch {
      return null
    }
  })
  const [aiLoading, setAiLoading] = useState(false)

  const insights = useMemo(() => computeInsights(trades), [trades])
  const visible = insights.filter(i => !dismissed.includes(i.id))

  if (collapseEmpty && visible.length === 0 && !aiInsight) return null

  const dismiss = (id) => {
    const next = [...dismissed, id]
    setDismissed(next)
    try { localStorage.setItem(DISMISS_KEY, JSON.stringify(next)) } catch {}
  }

  const fetchAiInsight = async () => {
    if (aiLoading || trades.length < 8) return
    setAiLoading(true)
    try {
      const wins = trades.filter(t=>t.result==="WIN").length
      const totalR = trades.reduce((s,t)=>s+(t.rr||0),0)
      const winRate = (wins/trades.length*100).toFixed(1)

      // Build a compact stats summary to send, no raw trade data.
      const bySession = {}
      const bySetup = {}
      const byDay = {}
      const DAY = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
      trades.forEach(t => {
        const d = DAY[new Date(t.date+"T12:00:00").getDay()]
        if (t.session) { if(!bySession[t.session]) bySession[t.session]={w:0,n:0}; bySession[t.session].n++; if(t.result==="WIN") bySession[t.session].w++ }
        if (t.setup)   { if(!bySetup[t.setup])     bySetup[t.setup]    ={w:0,n:0,r:0}; bySetup[t.setup].n++;   if(t.result==="WIN") bySetup[t.setup].w++;   bySetup[t.setup].r+=(t.rr||0) }
        if (!byDay[d]) byDay[d]={w:0,n:0}; byDay[d].n++; if(t.result==="WIN") byDay[d].w++
      })

      const prompt = `You are a brutally honest trading coach. Analyze this trader's stats and give ONE sharp, specific, actionable insight in 2 sentences. No fluff, no generic advice. Speak directly like a mentor.

Stats: ${trades.length} trades, ${winRate}% win rate, ${totalR.toFixed(1)}R total
Sessions: ${Object.entries(bySession).map(([s,v])=>`${s}: ${v.w}/${v.n} wins`).join(", ")}
Setups: ${Object.entries(bySetup).map(([s,v])=>`${s}: ${(v.r/v.n).toFixed(1)}R avg`).join(", ")}
Days: ${Object.entries(byDay).map(([d,v])=>`${d}: ${v.w}/${v.n} wins`).join(", ")}

Give the single most important thing this trader should do differently this week.`

      const res = await fetch("/api/analysis", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ prompt })
      })
      const data = await res.json()
      if (data.text) {
        setAiInsight(data.text)
        try { localStorage.setItem("fx_ai_insight", JSON.stringify({ text: data.text, ts: Date.now() })) } catch {}
      }
    } catch {}
    setAiLoading(false)
  }

  if (trades.length < 8) return null

  return (
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.14em",textTransform:"uppercase"}}>
          Weekly Insights
        </div>
        <div style={{fontSize:11,color:T.textDim}}>
          {visible.length} active · computed from your data
        </div>
      </div>

      {visible.length === 0 && !aiInsight && (
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 16px",fontSize:13,color:T.textDim}}>
          No patterns detected yet, keep logging trades.
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {visible.map(insight => {
          const color = getColor(T, insight.type)
          return (
            <div key={insight.id} style={{background:T.surface,border:`1px solid ${color}35`,borderRadius:14,padding:"12px 14px",display:"flex",gap:12,alignItems:"flex-start",position:"relative"}}>
              <span style={{fontFamily:"'JetBrains Mono','Fira Code',monospace",fontSize:10,fontWeight:800,lineHeight:1,flexShrink:0,marginTop:2,color,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 7px",letterSpacing:"0.04em"}}>{insight.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontFamily:"var(--font-geist-sans)",fontSize:13,fontWeight:800,color:T.text}}>{insight.title}</span>
                  <span style={{fontSize:9,fontWeight:700,color,letterSpacing:"0.12em",textTransform:"uppercase",background:`${color}18`,border:`1px solid ${color}40`,padding:"1px 6px",borderRadius:999}}>
                    {insight.type==="positive"?"Edge":insight.type==="warning"?"Watch":insight.type==="alert"?"Alert":"Pattern"}
                  </span>
                </div>
                <div style={{fontSize:12,color:T.textDim,lineHeight:1.65}}>{insight.copy}</div>
              </div>
              <button
                onClick={() => dismiss(insight.id)}
                aria-label="Dismiss insight"
                style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:16,lineHeight:1,padding:2,flexShrink:0,opacity:0.6}}
              >x</button>
            </div>
          )
        })}

        {/* AI Insight card */}
        <div style={{background:T.surface,border:`1px solid ${T.accent}30`,borderRadius:14,padding:"12px 14px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:aiInsight?8:0,gap:8,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"'JetBrains Mono','Fira Code',monospace",fontSize:10,fontWeight:800,color:T.accentBright,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 7px",letterSpacing:"0.04em"}}>AI</span>
              <span style={{fontFamily:"var(--font-geist-sans)",fontSize:13,fontWeight:800,color:T.text}}>AI Coach</span>
              <span style={{fontSize:9,fontWeight:700,color:T.accentBright,letterSpacing:"0.12em",textTransform:"uppercase",background:`${T.accent}18`,border:`1px solid ${T.accent}40`,padding:"1px 6px",borderRadius:999}}>Weekly</span>
            </div>
            <button
              onClick={fetchAiInsight}
              disabled={aiLoading}
              style={{background:`${T.accent}20`,border:`1px solid ${T.accent}40`,color:T.accentBright,borderRadius:8,padding:"4px 12px",fontSize:11,fontWeight:700,cursor:aiLoading?"wait":"pointer",fontFamily:"var(--font-geist-sans)",opacity:aiLoading?0.6:1}}
            >
              {aiLoading ? "Analyzing..." : aiInsight ? "Refresh" : "Generate"}
            </button>
          </div>
          {aiInsight && (
            <div style={{fontSize:12,color:T.textDim,lineHeight:1.7}}>{aiInsight}</div>
          )}
          {!aiInsight && !aiLoading && (
            <div style={{fontSize:12,color:T.textDim}}>Get a one-sentence coaching note from your actual data, cached for the week.</div>
          )}
        </div>
      </div>
    </div>
  )
}
