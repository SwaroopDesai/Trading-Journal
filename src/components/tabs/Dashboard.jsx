"use client"
import { useState, useEffect } from "react";
import { Card, CardTitle, EmptyState, Btn, Badge } from "@/components/ui";
import EquityCurve from "@/components/EquityCurve";
import InsightCards from "@/components/InsightCards";
import { fmtDate, fmtRR, getWeeklyPairNotes } from "@/lib/utils";

function useCountUp(target, active, duration=1100) {
  const [val, setVal] = useState(0)
  useEffect(()=>{
    if(!active) return
    setVal(0)
    if(target === 0) return
    let step = 0
    const steps = 55
    const id = setInterval(()=>{
      step++
      const e = 1 - Math.pow(1 - step/steps, 3)
      setVal(target * e)
      if(step >= steps){ clearInterval(id); setVal(target) }
    }, duration / steps)
    return ()=>clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[active, target])
  return val
}

function HudCorners({color}) {
  const path = "M 0 10 L 0 0 L 10 0"
  const corners = [
    {top:6,left:6,transform:"none"},
    {top:6,right:6,transform:"rotate(90deg)"},
    {bottom:6,right:6,transform:"rotate(180deg)"},
    {bottom:6,left:6,transform:"rotate(270deg)"},
  ]
  return corners.map((s,i)=>(
    <svg key={i} width="10" height="10" viewBox="0 0 10 10"
      style={{position:"absolute",...s,pointerEvents:"none"}} aria-hidden="true">
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="square" opacity="0.55"/>
    </svg>
  ))
}

function Dashboard({T,stats,trades,dailyPlans,weeklyPlans,onNewTrade,onNewDaily,onNewWeekly,viewportWidth,active}) {
  const today = new Date().toISOString().split("T")[0]
  const todayTrades = trades.filter(t=>t.date===today)
  const latestDaily = [...dailyPlans].sort((a,b)=>new Date(b.date)-new Date(a.date))[0]
  const latestWeekly = [...weeklyPlans].sort((a,b)=>new Date(b.weekStart)-new Date(a.weekStart))[0]
  const bestPair = [...stats.byPair].sort((a,b)=>b.totalR-a.totalR)[0]
  const isMobile = viewportWidth < 768

  const animTotalR   = useCountUp(stats.totalR,       active)
  const animWinRate  = useCountUp(stats.winRate,       active)
  const animAvgRR    = useCountUp(stats.avgRR,         active)
  const animBestR    = useCountUp(bestPair?.totalR||0, active)

  const kpis = [
    {
      label:"Total R",
      value:`${animTotalR>=0?"+":""}${animTotalR.toFixed(2)}R`,
      color:stats.totalR>=0?T.green:T.red,
      sub:`${stats.total} trades logged`,
      gradient:stats.totalR>=0?`linear-gradient(135deg,${T.green}18,${T.green}05)`:`linear-gradient(135deg,${T.red}18,${T.red}05)`,
      eyebrow:"Performance",
      barWidth:`${Math.min(Math.abs(stats.totalR)/20*100,100)}%`,
    },
    {
      label:"Win Rate",
      value:`${animWinRate.toFixed(1)}%`,
      color:stats.winRate>=55?T.green:stats.winRate>=45?T.amber:T.red,
      sub:`${stats.wins}W / ${stats.losses}L / ${stats.be}BE`,
      gradient:`linear-gradient(135deg,${T.blue}18,${T.blue}05)`,
      eyebrow:"Consistency",
      barWidth:`${Math.min(stats.winRate,100)}%`,
    },
    {
      label:"Avg RR",
      value:`${animAvgRR.toFixed(2)}R`,
      color:stats.avgRR>=2?T.green:stats.avgRR>=1?T.amber:T.red,
      sub:"Average on winning trades",
      gradient:`linear-gradient(135deg,${T.accent}18,${T.accent}05)`,
      eyebrow:"Execution",
      barWidth:`${Math.min(stats.avgRR/3*100,100)}%`,
    },
    {
      label:"Best Pair",
      value:bestPair?.pair||"-",
      color:T.accentBright,
      sub:`${animBestR>=0?"+":""}${animBestR.toFixed(1)}R total`,
      gradient:`linear-gradient(135deg,${T.pink}18,${T.pink}05)`,
      eyebrow:"Edge",
      barWidth:`${Math.min(Math.abs(bestPair?.totalR||0)/20*100,100)}%`,
    },
  ]

  return (
    <div>
      <InsightCards T={T} trades={trades} />
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,minmax(0,1fr))":"repeat(4,minmax(0,1fr))",gap:isMobile?8:10,marginBottom:12}}>
        {kpis.map(k=>(
          <div key={k.label} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:isMobile?12:14,padding:isMobile?"12px 12px 10px":"14px 16px 12px",boxShadow:`0 6px 18px ${T.cardGlow}`,position:"relative",overflow:"hidden",minWidth:0}}>
            <HudCorners color={k.color}/>
            <div style={{position:"absolute",top:0,left:0,width:60,height:60,background:`radial-gradient(circle, ${k.color}12 0%, transparent 70%)`,pointerEvents:"none"}} />
            <div style={{position:"relative"}}>
              {/* Eyebrow */}
              <div style={{fontSize:9,fontWeight:700,color:k.color,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:6,display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:4,height:4,background:k.color,display:"inline-block",flexShrink:0,boxShadow:`0 0 5px ${k.color}`}} />
                {k.eyebrow}
              </div>
              {/* Label */}
              <div style={{fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:4}}>{k.label}</div>
              {/* Value */}
              <div style={{fontFamily:"'JetBrains Mono','Fira Code',monospace",fontSize:isMobile?18:22,fontWeight:700,color:k.color,lineHeight:1.0,letterSpacing:"-0.01em",wordBreak:"break-word"}}>{k.value}</div>
              {/* Sub */}
              <div style={{fontSize:10,color:T.textDim,marginTop:5,lineHeight:1.4}}>{k.sub}</div>
              {/* Progress bar */}
              <div style={{height:2,background:T.surface2,marginTop:10,overflow:"hidden"}}>
                <div style={{width:k.barWidth,height:"100%",background:`linear-gradient(90deg,${k.color},${T.pink})`,boxShadow:`0 0 6px ${k.color}80`,transition:"width 0.9s cubic-bezier(0.16,1,0.3,1)"}} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,minmax(0,1fr))",gap:10}}>
        <Card T={T} style={{gridColumn:"1/-1",borderRadius:14,padding:"14px 16px"}} glow>
          <CardTitle T={T}>Equity Curve (R)</CardTitle>
          <EquityCurve T={T} data={stats.equityCurve}/>
        </Card>

        <Card T={T} style={{borderRadius:14,padding:"14px 16px"}}>
          <CardTitle T={T}>Today&apos;s Trades</CardTitle>
          {todayTrades.length===0
            ?<EmptyState T={T} icon="🎯" compact title="No trades logged today" copy="Capture the first execution, keep the notes sharp, and the day starts to tell a story." action={<Btn T={T} onClick={onNewTrade}>+ Log Trade</Btn>}/>
            :todayTrades.map(t=>(
              <div key={t._dbid} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{width:6,height:6,background:t.result==="WIN"?T.green:t.result==="LOSS"?T.red:T.amber,flexShrink:0,borderRadius:1}}/>
                <span style={{fontFamily:"'JetBrains Mono','Fira Code',monospace",fontWeight:700,color:T.accentBright,minWidth:62,fontSize:13,letterSpacing:"0.04em"}}>{t.pair}</span>
                <Badge color={t.direction==="LONG"?T.green:T.red}>{t.direction}</Badge>
                <Badge color={t.result==="WIN"?T.green:t.result==="LOSS"?T.red:T.amber}>{t.result}</Badge>
                <span style={{marginLeft:"auto",fontFamily:"'JetBrains Mono','Fira Code',monospace",fontWeight:700,fontSize:13,color:t.rr>=0?T.green:T.red}}>{fmtRR(t.rr||0)}</span>
              </div>
            ))
          }
        </Card>

        <Card T={T} style={{borderRadius:14,padding:"14px 16px"}}>
          <CardTitle T={T}>Daily Bias {latestDaily&&<span style={{color:T.accent,fontWeight:400}}>{fmtDate(latestDaily.date)}</span>}</CardTitle>
          {latestDaily
            ?<div>{latestDaily.pairs?.map(p=>(
                <div key={p} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
                  <span style={{fontWeight:600,color:T.text,fontSize:13}}>{p}</span>
                  <Badge color={latestDaily.biases?.[p]==="Bullish"?T.green:latestDaily.biases?.[p]==="Bearish"?T.red:T.amber}>{latestDaily.biases?.[p]}</Badge>
                </div>
              ))}<div style={{fontSize:12,color:T.textDim,marginTop:10,lineHeight:1.5}}>{latestDaily.notes}</div>
            </div>
            :<EmptyState T={T} icon="📅" compact title="No daily plan yet" copy="Set the bias, levels, and expected manipulation before the session opens." action={<Btn T={T} onClick={onNewDaily}>+ Add Plan</Btn>}/>
          }
        </Card>

        <Card T={T} style={{borderRadius:14,padding:"14px 16px"}}>
          <CardTitle T={T}>Weekly Theme {latestWeekly&&<span style={{color:T.accent,fontWeight:400}}>{latestWeekly.weekStart}</span>}</CardTitle>
          {latestWeekly
            ?<div>
                {Object.entries(getWeeklyPairNotes(latestWeekly)).filter(([,note])=>String(note||"").trim()).length>0&&(
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                    {Object.entries(getWeeklyPairNotes(latestWeekly)).filter(([,note])=>String(note||"").trim()).slice(0,3).map(([pair])=>(
                      <span key={pair} style={{fontSize:11,fontWeight:700,color:T.textDim,background:T.surface2,border:`1px solid ${T.border}`,padding:"4px 10px",borderRadius:999}}>{pair}</span>
                    ))}
                  </div>
                )}
                {latestWeekly.keyEvents&&<>
                  <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>Key Events</div>
                  <div style={{fontSize:12,color:T.amber,lineHeight:1.5,marginBottom:8}}>{latestWeekly.keyEvents}</div>
                </>}
                {latestWeekly.notes&&<div style={{fontSize:12,color:T.textDim,lineHeight:1.6}}>{latestWeekly.notes}</div>}
              </div>
            :<EmptyState T={T} icon="🗓" compact title="No weekly plan yet" copy="Map the week before the sessions open so your daily plans have real context behind them." action={<Btn T={T} onClick={onNewWeekly}>+ Weekly Plan</Btn>} />
          }
        </Card>

        <Card T={T} style={{gridColumn:"1/-1",borderRadius:14,padding:"14px 16px"}}>
          <CardTitle T={T}>Asset Efficiency Matrix</CardTitle>
          {stats.byPair.filter(p=>p.count>0).length===0
            ?<div style={{color:T.muted,fontSize:13,textAlign:"center",padding:20}}>Log trades to see pair performance</div>
            :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10}}>
              {stats.byPair.filter(p=>p.count>0).map(p=>{
                const topColor = p.totalR > 0 ? T.green : p.totalR < 0 ? T.red : T.muted
                const winPct = p.count > 0 ? (p.wins/p.count*100).toFixed(0) : 0
                return (
                  <div key={p.pair} style={{
                    background:T.surface2,
                    border:`1px solid ${T.border}`,
                    borderTop:`2px solid ${topColor}`,
                    borderRadius:10,padding:"16px 14px",
                    boxShadow:`0 6px 18px ${T.cardGlow}`,
                  }}>
                    <div style={{fontFamily:"'JetBrains Mono','Fira Code',monospace",fontSize:12,fontWeight:700,color:T.textDim,marginBottom:6,letterSpacing:"0.04em"}}>{p.pair}</div>
                    <div style={{fontFamily:"'JetBrains Mono','Fira Code',monospace",fontSize:20,fontWeight:700,color:topColor,lineHeight:1}}>{p.totalR>=0?"+":""}{p.totalR.toFixed(1)}R</div>
                    <div style={{marginTop:10,height:1,background:T.border}}/>
                    <div style={{fontSize:10,color:T.muted,marginTop:6,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700}}>{winPct}% Win Rate</div>
                  </div>
                )
              })}
            </div>
          }
        </Card>
      </div>
    </div>
  )
}

export default Dashboard;
