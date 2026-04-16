"use client"
import { fmtDate } from "@/lib/utils";
import { Card, CardTitle, Btn, SectionLead } from "@/components/ui";

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

  const EXPORTS = [
    {id:"trades",icon:"TR",title:"Export All Trades",desc:`${trades.length} trades with pair, execution, result, RR, bias, setup, emotion, and notes.`,action:exportTrades,count:trades.length,eyebrow:"Full ledger"},
    {id:"daily",icon:"DY",title:"Export Daily Plans",desc:`${dailyPlans.length} daily plans with pairs, bias, key levels, manipulation, and notes.`,action:exportDaily,count:dailyPlans.length,eyebrow:"Planning log"},
    {id:"summary",icon:"SM",title:"Export Performance Summary",desc:"Key performance stats including win rate, total R, and pair-level breakdowns.",action:exportSummary,count:1,eyebrow:"Snapshot"},
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
            }}>{exporting===ex.id?"Done":ex.count===0?"No Data":"Download CSV"}</button>
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
