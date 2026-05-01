"use client"
import { useState } from "react";
import { SESSIONS, SETUPS, MANI_TYPES } from "@/lib/constants";
import { Card, CardTitle, EmptyState, Chip, Btn } from "@/components/ui";
import AdvancedStats from "@/components/AdvancedStats";
import EquityCurve from "@/components/EquityCurve";
import WeeklyCalendar from "@/components/WeeklyCalendar";

function filterTradesByRange(trades, range) {
  if (range === "all" || !trades.length) return trades;
  const now = new Date();
  const cutoff = new Date(now);
  if (range === "7d")  cutoff.setDate(now.getDate() - 7);
  if (range === "30d") cutoff.setDate(now.getDate() - 30);
  if (range === "90d") cutoff.setDate(now.getDate() - 90);
  return trades.filter(t => t.date && new Date(t.date) >= cutoff);
}

function Analytics({T,stats,trades,onNewTrade,viewportWidth}) {
  const [range, setRange] = useState("all");
  const ft = filterTradesByRange(trades, range);
  const byManip=MANI_TYPES.filter(m=>m!=="None").map(m=>{const t=ft.filter(x=>x.manipulation===m);return{m,count:t.length,wins:t.filter(x=>x.result==="WIN").length}}).filter(x=>x.count>0)
  const bySetup=SETUPS.map(s=>{const t=ft.filter(x=>x.setup===s);return{s,count:t.length,wins:t.filter(x=>x.result==="WIN").length,totalR:t.reduce((a,x)=>a+(x.rr||0),0)}}).filter(x=>x.count>0)
  const isMobile = viewportWidth < 768
  // Compute bySession from filtered trades
  const bySession = SESSIONS.map(s=>{const t=ft.filter(x=>x.session===s);return{session:s,count:t.length,wins:t.filter(x=>x.result==="WIN").length,totalR:t.reduce((a,x)=>a+(x.rr||0),0)}}).filter(x=>x.count>0)
  const bestSession = [...bySession].sort((a,b)=>b.totalR-a.totalR)[0]
  const bestSetup = [...bySetup].sort((a,b)=>b.totalR-a.totalR)[0]
  const cleanestManip = [...byManip].sort((a,b)=>(b.wins/b.count)-(a.wins/a.count))[0]
  const E=<EmptyState T={T} icon="AN" compact title="Analytics wakes up after a few trades" copy="A few clean logs are enough to surface where your edge is strongest and where your leaks keep showing up." action={<Btn T={T} onClick={onNewTrade}>+ Log Trade</Btn>} />

  const BarRow=({label,wins,count,totalR,color})=>(
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
      <span style={{fontSize:12,color:T.textDim,minWidth:110,flexShrink:0}}>{label}</span>
      <div style={{flex:1,height:6,background:T.surface2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:color,width:`${Math.min(100,count>0?wins/count*100:0)}%`,transition:"width .5s"}}/></div>
      <span style={{fontSize:11,color:T.textDim,minWidth:40,textAlign:"right"}}>{wins}/{count}</span>
      {totalR!==null&&<span style={{fontSize:11,fontWeight:700,color:totalR>=0?T.green:T.red,minWidth:44,textAlign:"right"}}>{totalR>=0?"+":""}{totalR.toFixed(1)}R</span>}
    </div>
  )

  const RANGE_OPTS = [{id:"7d",label:"7D"},{id:"30d",label:"30D"},{id:"90d",label:"90D"},{id:"all",label:"All"}];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* Date range filter */}
      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <span style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase"}}>Period</span>
        <div style={{display:"flex",gap:4,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:3}}>
          {RANGE_OPTS.map(r=>(
            <button key={r.id} onClick={()=>setRange(r.id)} style={{
              background:range===r.id?T.accentBright:"transparent",
              color:range===r.id?T.accentBright:T.textDim,
              border:"none",borderRadius:7,padding:"4px 14px",
              fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"var(--font-geist-sans)",transition:"background .15s, border-color .15s, color .15s",
            }}>{r.label}</button>
          ))}
        </div>
        {range!=="all"&&<span style={{fontSize:11,color:T.muted}}>{ft.length} of {trades.length} trades</span>}
      </div>

      <EquityCurve T={T} data={stats.equityCurve}/>
      <WeeklyCalendar T={T} trades={ft}/>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,minmax(0,1fr))",gap:12,marginBottom:14}}>
        {[{eyebrow:"Best Session",value:bestSession?.session||"Building",detail:bestSession?`${bestSession.totalR>=0?"+":""}${bestSession.totalR.toFixed(1)}R with ${bestSession.wins}/${bestSession.count} wins`:"Log trades to reveal it",color:T.green},{eyebrow:"Best Setup",value:bestSetup?.s||"Building",detail:bestSetup?`${bestSetup.totalR>=0?"+":""}${bestSetup.totalR.toFixed(1)}R across ${bestSetup.count} trades`:"Setup leaderboard fills as you trade",color:T.accentBright},{eyebrow:"Cleanest Manip",value:cleanestManip?.m||"Building",detail:cleanestManip?`${cleanestManip.wins}/${cleanestManip.count} wins in this pattern`:"Execution patterns will surface here",color:T.amber}].map(card=>(
          <div key={card.eyebrow} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"15px 16px",boxShadow:"none"}}>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>{card.eyebrow}</div>
            <div style={{fontFamily:"var(--font-geist-sans)",fontSize:22,fontWeight:800,color:card.color,letterSpacing:"-0.04em"}}>{card.value}</div>
            <div style={{fontSize:12,color:T.textDim,marginTop:8,lineHeight:1.6}}>{card.detail}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,minmax(0,1fr))",gap:14}}>
        <Card T={T}><CardTitle T={T} meta={bySession.length?`${bySession.length} active buckets`:"Waiting on trades"}>By Session</CardTitle>{bySession.length===0?E:bySession.map(s=><BarRow key={s.session} label={s.session.split("/")[0]} wins={s.wins} count={s.count} totalR={s.totalR} color={T.green}/>)}</Card>
        <Card T={T}><CardTitle T={T} meta={bySetup.length?`${bySetup.length} setups tracked`:"Waiting on setups"}>By Setup</CardTitle>{bySetup.length===0?E:bySetup.map(s=><BarRow key={s.s} label={s.s} wins={s.wins} count={s.count} totalR={s.totalR} color={T.blue}/>)}</Card>
        <Card T={T}><CardTitle T={T} meta={byManip.length?`${byManip.length} patterns tracked`:"Waiting on trades"}>By Manipulation</CardTitle>{byManip.length===0?E:byManip.map(m=><BarRow key={m.m} label={m.m} wins={m.wins} count={m.count} totalR={null} color={T.pink}/>)}</Card>
      </div>
      <AdvancedStats T={T} trades={ft}/>
    </div>
  )
}

// Psychology

export default Analytics;
