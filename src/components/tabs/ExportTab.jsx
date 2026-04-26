"use client"
import { useState } from "react";
import { fmtDate } from "@/lib/utils";
import { Card, CardTitle, Btn, SectionLead, HeaderMeta } from "@/components/ui";

function buildPDFHTML(trades, dailyPlans, weeklyPlans) {
  const wins   = trades.filter(t => t.result === "WIN")
  const losses = trades.filter(t => t.result === "LOSS")
  const totalR = trades.reduce((s,t) => s+(t.rr||0), 0)
  const winRate = trades.length ? (wins.length/trades.length*100).toFixed(1) : "0"
  const avgRR   = wins.length ? (wins.reduce((s,t)=>s+t.rr,0)/wins.length).toFixed(2) : "0"

  // By pair
  const byPair = {}
  trades.forEach(t => {
    if (!t.pair) return
    byPair[t.pair] ??= { count:0, wins:0, r:0 }
    byPair[t.pair].count++
    if (t.result==="WIN") byPair[t.pair].wins++
    byPair[t.pair].r += (t.rr||0)
  })
  const pairRows = Object.entries(byPair)
    .sort((a,b) => b[1].r - a[1].r)
    .map(([p,d]) => `<tr><td>${p}</td><td>${d.count}</td><td>${d.count?(d.wins/d.count*100).toFixed(0):0}%</td><td style="color:${d.r>=0?"#22c55e":"#ef4444"}">${d.r>=0?"+":""}${d.r.toFixed(2)}R</td></tr>`)
    .join("")

  // By session
  const bySess = {}
  trades.forEach(t => {
    if (!t.session) return
    bySess[t.session] ??= { count:0, wins:0, r:0 }
    bySess[t.session].count++
    if (t.result==="WIN") bySess[t.session].wins++
    bySess[t.session].r += (t.rr||0)
  })
  const sessRows = Object.entries(bySess)
    .sort((a,b) => b[1].r - a[1].r)
    .map(([s,d]) => `<tr><td>${s}</td><td>${d.count}</td><td>${d.count?(d.wins/d.count*100).toFixed(0):0}%</td><td style="color:${d.r>=0?"#22c55e":"#ef4444"}">${d.r>=0?"+":""}${d.r.toFixed(2)}R</td></tr>`)
    .join("")

  // Top 5 wins/losses
  const topWins = [...wins].sort((a,b)=>(b.rr||0)-(a.rr||0)).slice(0,5)
  const topLoss = [...losses].sort((a,b)=>(a.rr||0)-(b.rr||0)).slice(0,5)
  const tradeRow = (t,col) => `<tr><td>${t.date}</td><td>${t.pair}</td><td>${t.direction}</td><td>${t.setup||"—"}</td><td style="color:${col};font-weight:700">${t.rr>=0?"+":""}${(t.rr||0).toFixed(2)}R</td></tr>`

  const now = new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"})

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>FXEDGE Trading Report</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#fff;color:#0f172a;padding:40px;font-size:13px}
    h1{font-size:28px;font-weight:800;letter-spacing:-0.03em;margin-bottom:4px}
    .sub{color:#64748b;font-size:12px;margin-bottom:32px}
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:32px}
    .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px}
    .kpi-label{font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px}
    .kpi-val{font-size:26px;font-weight:800;letter-spacing:-0.03em;line-height:1}
    .section{margin-bottom:28px}
    .section-title{font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e2e8f0}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{text-align:left;font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;padding:6px 8px;border-bottom:1px solid #e2e8f0}
    td{padding:8px 8px;border-bottom:1px solid #f1f5f9;color:#334155}
    tr:last-child td{border-bottom:none}
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between}
    @media print{body{padding:24px}.kpi-grid{page-break-inside:avoid}}
  </style></head><body>
  <h1>FXEDGE Trading Report</h1>
  <div class="sub">Generated ${now} · ${trades.length} trades</div>

  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-label">Total Trades</div><div class="kpi-val">${trades.length}</div></div>
    <div class="kpi"><div class="kpi-label">Win Rate</div><div class="kpi-val" style="color:${parseFloat(winRate)>=50?"#22c55e":"#ef4444"}">${winRate}%</div></div>
    <div class="kpi"><div class="kpi-label">Total R</div><div class="kpi-val" style="color:${totalR>=0?"#22c55e":"#ef4444"}">${totalR>=0?"+":""}${totalR.toFixed(2)}R</div></div>
    <div class="kpi"><div class="kpi-label">Avg RR (Wins)</div><div class="kpi-val">${avgRR}R</div></div>
  </div>

  <div class="section"><div class="section-title">Performance by Pair</div>
    <table><thead><tr><th>Pair</th><th>Trades</th><th>Win Rate</th><th>Total R</th></tr></thead>
    <tbody>${pairRows||"<tr><td colspan=4 style='color:#94a3b8'>No data</td></tr>"}</tbody></table>
  </div>

  <div class="section"><div class="section-title">Performance by Session</div>
    <table><thead><tr><th>Session</th><th>Trades</th><th>Win Rate</th><th>Total R</th></tr></thead>
    <tbody>${sessRows||"<tr><td colspan=4 style='color:#94a3b8'>No data</td></tr>"}</tbody></table>
  </div>

  <div class="section"><div class="section-title">Top 5 Wins</div>
    <table><thead><tr><th>Date</th><th>Pair</th><th>Dir</th><th>Setup</th><th>R</th></tr></thead>
    <tbody>${topWins.map(t=>tradeRow(t,"#22c55e")).join("")||"<tr><td colspan=5 style='color:#94a3b8'>No wins yet</td></tr>"}</tbody></table>
  </div>

  <div class="section"><div class="section-title">Top 5 Losses</div>
    <table><thead><tr><th>Date</th><th>Pair</th><th>Dir</th><th>Setup</th><th>R</th></tr></thead>
    <tbody>${topLoss.map(t=>tradeRow(t,"#ef4444")).join("")||"<tr><td colspan=5 style='color:#94a3b8'>No losses</td></tr>"}</tbody></table>
  </div>

  <div class="footer"><span>FXEDGE · fxedge.vercel.app</span><span>${now}</span></div>
  <script>window.onload=()=>window.print()</script>
  </body></html>`
}

function ExportTab({T, trades, dailyPlans, weeklyPlans}) {
  const [exporting, setExporting] = useState(null)

  const downloadCSV = (data, filename) => {
    if(!data.length) return
    const headers = Object.keys(data[0])
    const csv = [
      headers.join(","),
      ...data.map(row=>headers.map(h=>{
        const val = row[h]
        if(val===null||val===undefined) return ""
        if(typeof val==="object") return `"${JSON.stringify(val).replace(/"/g,'""')}"`
        return `"${String(val).replace(/"/g,'""')}"`
      }).join(","))
    ].join("\n")
    const blob = new Blob([csv], {type:"text/csv"})
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href=url; a.download=filename; a.click()
    URL.revokeObjectURL(url)
  }

  const exportTrades = () => {
    setExporting("trades")
    const data = trades.map(t=>({
      date:t.date, pair:t.pair, direction:t.direction, result:t.result,
      rr:t.rr, pips:t.pips, entry:t.entry, sl:t.sl, tp:t.tp,
      session:t.session, dailyBias:t.dailyBias,
      manipulation:t.manipulation, poi:t.poi,
      setup:t.setup, emotion:t.emotion, mistakes:t.mistakes,
      notes:t.notes, tags:(t.tags||[]).join(";")
    }))
    downloadCSV(data, `fxedge_trades_${new Date().toISOString().split("T")[0]}.csv`)
    setTimeout(()=>setExporting(null), 1000)
  }

  const exportDaily = () => {
    setExporting("daily")
    const data = dailyPlans.map(p=>({
      date:p.date, pairs:(p.pairs||[]).join(";"),
      weeklyTheme:p.weeklyTheme, keyLevels:p.keyLevels,
      manipulation:p.manipulation, watchlist:p.watchlist, notes:p.notes
    }))
    downloadCSV(data, `fxedge_daily_${new Date().toISOString().split("T")[0]}.csv`)
    setTimeout(()=>setExporting(null), 1000)
  }

  const exportSummary = () => {
    setExporting("summary")
    const wins=trades.filter(t=>t.result==="WIN")
    const losses=trades.filter(t=>t.result==="LOSS")
    const totalR=trades.reduce((s,t)=>s+(t.rr||0),0)
    const byPair={}; trades.forEach(t=>{ if(!byPair[t.pair]) byPair[t.pair]={count:0,wins:0,r:0}; byPair[t.pair].count++; if(t.result==="WIN") byPair[t.pair].wins++; byPair[t.pair].r+=(t.rr||0) })
    const data=[
      {metric:"Total Trades",value:trades.length},
      {metric:"Wins",value:wins.length},
      {metric:"Best Pair",value:Object.entries(byPair).sort((a,b)=>b[1].r-a[1].r)[0]?.[0]||"-"},
      {metric:"Win Rate",value:`${trades.length?(wins.length/trades.length*100).toFixed(1):0}%`},
      {metric:"Total R",value:totalR.toFixed(2)},
      {metric:"Avg RR on Wins",value:wins.length?(wins.reduce((s,t)=>s+t.rr,0)/wins.length).toFixed(2):"0"},
      ...Object.entries(byPair).map(([p,d])=>({metric:`${p} Total R`,value:d.r.toFixed(2)})),
    ]
    downloadCSV(data, `fxedge_summary_${new Date().toISOString().split("T")[0]}.csv`)
    setTimeout(()=>setExporting(null), 1000)
  }

  const exportPDF = () => {
    if (!trades.length) return
    setExporting("pdf")
    const html = buildPDFHTML(trades, dailyPlans, weeklyPlans)
    const win = window.open("", "_blank")
    win.document.write(html)
    win.document.close()
    setTimeout(() => setExporting(null), 1000)
  }

  const EXPORTS = [
    {id:"pdf",icon:"📄",title:"PDF Performance Report",desc:`Clean printable report — summary stats, pair breakdown, session breakdown, top wins & losses.`,action:exportPDF,count:trades.length,eyebrow:"Print / PDF",btnLabel:"Open PDF"},
    {id:"trades",icon:"TR",title:"Export All Trades",desc:`${trades.length} trades with pair, execution, result, RR, bias, setup, emotion, and notes.`,action:exportTrades,count:trades.length,eyebrow:"Full ledger",btnLabel:"Download CSV"},
    {id:"daily",icon:"DY",title:"Export Daily Plans",desc:`${dailyPlans.length} daily plans with pairs, bias, key levels, manipulation, and notes.`,action:exportDaily,count:dailyPlans.length,eyebrow:"Planning log",btnLabel:"Download CSV"},
    {id:"summary",icon:"SM",title:"Export Performance Summary",desc:"Key performance stats including win rate, total R, and pair-level breakdowns.",action:exportSummary,count:1,eyebrow:"Snapshot",btnLabel:"Download CSV"},
  ]

  return (
    <div style={{maxWidth:720,display:"flex",flexDirection:"column",gap:18}}>
      <HeaderMeta
        T={T}
        eyebrow="Exports"
        title="Export Your Data"
        subtitle="Download clean CSV snapshots for backup, mentor reviews, or spreadsheet analysis."
      />
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {EXPORTS.map(ex=>(
          <div key={ex.id} style={{background:`linear-gradient(180deg,${T.surface},${T.surface2})`,border:`1px solid ${T.border}`,borderRadius:18,padding:"18px 20px",display:"flex",alignItems:"center",gap:16,boxShadow:`0 16px 40px ${T.cardGlow}`}}>
            <div style={{width:52,height:52,borderRadius:16,background:`linear-gradient(135deg,${T.accent}22,${T.pink}22)`,border:`1px solid ${T.border}`,display:"grid",placeItems:"center",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:T.text,flexShrink:0}}>{ex.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:10,fontWeight:700,color:T.accentBright,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>{ex.eyebrow}</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:T.text,marginBottom:4}}>{ex.title}</div>
              <div style={{fontSize:12,color:T.textDim,lineHeight:1.6}}>{ex.desc}</div>
            </div>
            <button onClick={ex.action} disabled={ex.count===0||exporting===ex.id} style={{
              background:ex.count===0?T.surface2:`linear-gradient(135deg,${T.accentBright},${T.pink})`,
              color:ex.count===0?T.muted:"#fff",border:"none",padding:"10px 18px",
              borderRadius:10,cursor:ex.count===0?"not-allowed":"pointer",
              fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13,
              whiteSpace:"nowrap",flexShrink:0,
            }}>{exporting===ex.id?"Done ✓":ex.count===0?"No Data":ex.btnLabel||"Download CSV"}</button>
          </div>
        ))}
      </div>
      <div style={{padding:"14px 16px",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:14,fontSize:12,color:T.muted,lineHeight:1.6}}>
        Note: <b style={{color:T.textDim}}>Important:</b> Screenshots are not included in CSV exports due to file size. All other data including notes, tags, bias, and psychology fields are included.
      </div>
    </div>
  )
}


export default ExportTab;
