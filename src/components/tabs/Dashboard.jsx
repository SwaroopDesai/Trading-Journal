"use client"
import { useState, useEffect, useRef } from "react";
import { Card, CardTitle, EmptyState, Btn, Badge } from "@/components/ui";
import EquityCurve from "@/components/EquityCurve";
import InsightCards from "@/components/InsightCards";
import { fmtDate, fmtRR, getWeeklyPairNotes } from "@/lib/utils";

function useCountUp(target, trigger=0, duration=850) {
  const reduced = typeof window!=="undefined" && window.matchMedia("(prefers-reduced-motion:reduce)").matches
  const [val, setVal] = useState(reduced ? target : 0)
  const rafRef = useRef(null)
  useEffect(()=>{
    if(reduced){ setVal(target); return }
    if(rafRef.current) cancelAnimationFrame(rafRef.current)
    setVal(0)
    const start = performance.now()
    const tick = (now)=>{
      const p = Math.min((now-start)/duration, 1)
      const e = 1 - Math.pow(1-p, 3)
      setVal(target*e)
      if(p<1) rafRef.current = requestAnimationFrame(tick)
      else setVal(target)
    }
    rafRef.current = requestAnimationFrame(tick)
    return ()=>{ if(rafRef.current) cancelAnimationFrame(rafRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[target, trigger])
  return val
}

function Dashboard({T,stats,trades,dailyPlans,weeklyPlans,onNewTrade,onNewDaily,onNewWeekly,viewportWidth,active}) {
  const today = new Date().toISOString().split("T")[0]
  const todayTrades = trades.filter(t=>t.date===today)
  const latestDaily = [...dailyPlans].sort((a,b)=>new Date(b.date)-new Date(a.date))[0]
  const latestWeekly = [...weeklyPlans].sort((a,b)=>new Date(b.weekStart)-new Date(a.weekStart))[0]
  const bestPair = [...stats.byPair].sort((a,b)=>b.totalR-a.totalR)[0]
  const isMobile = viewportWidth < 768

  // Increment trigger each time the tab becomes active → restarts count-up
  const [animTrigger, setAnimTrigger] = useState(0)
  useEffect(()=>{ if(active) setAnimTrigger(n=>n+1) },[active])

  const animTotalR   = useCountUp(stats.totalR,       animTrigger)
  const animWinRate  = useCountUp(stats.winRate,       animTrigger)
  const animAvgRR    = useCountUp(stats.avgRR,         animTrigger)
  const animBestR    = useCountUp(bestPair?.totalR||0, animTrigger)

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
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,minmax(0,1fr))":"repeat(4,minmax(0,1fr))",gap:isMobile?10:14,marginBottom:20}}>
        {kpis.map(k=>(
          <div key={k.label} style={{background:k.gradient||T.surface,border:`1px solid ${T.border}`,borderRadius:isMobile?16:18,padding:isMobile?"14px 14px 13px":"18px 18px 16px",boxShadow:`0 10px 28px ${T.cardGlow}`,position:"relative",overflow:"hidden",minWidth:0}}>
            <div style={{position:"absolute",inset:"0 auto auto 0",width:54,height:54,background:`radial-gradient(circle, ${k.color}18 0%, transparent 70%)`}} />
            <div style={{position:"relative"}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:isMobile?"4px 8px":"5px 10px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:999,fontSize:isMobile?9:10,fontWeight:700,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:isMobile?10:12,maxWidth:"100%"}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:k.color,display:"inline-block"}} />
                {k.eyebrow}
              </div>
              <div style={{fontSize:isMobile?10:11,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>{k.label}</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:isMobile?22:28,fontWeight:800,color:k.color,lineHeight:1.02,letterSpacing:"-0.03em",wordBreak:"break-word"}}>{k.value}</div>
              <div style={{fontSize:isMobile?10:11,color:T.textDim,marginTop:8,lineHeight:1.5}}>{k.sub}</div>
              <div style={{height:4,borderRadius:999,background:T.surface,marginTop:isMobile?12:14,overflow:"hidden"}}>
                <div style={{width:k.barWidth,height:"100%",background:`linear-gradient(90deg,${k.color},${T.pink})`,borderRadius:999,transition:"width 0.9s cubic-bezier(0.16,1,0.3,1)"}} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,minmax(0,1fr))",gap:14}}>
        <Card T={T} style={{gridColumn:"1/-1",borderRadius:18,padding:"20px 22px"}} glow>
          <CardTitle T={T}>Equity Curve (R)</CardTitle>
          <EquityCurve T={T} data={stats.equityCurve}/>
        </Card>

        <Card T={T} style={{borderRadius:18,padding:"20px 22px"}}>
          <CardTitle T={T}>Today&apos;s Trades</CardTitle>
          {todayTrades.length===0
            ?<EmptyState T={T} compact title="No trades logged today" copy="Capture the first execution, keep the notes sharp, and the day starts to tell a story." action={<Btn T={T} onClick={onNewTrade}>+ Log Trade</Btn>}/>
            :todayTrades.map(t=>(
              <div key={t._dbid} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,color:T.accentBright,minWidth:65}}>{t.pair}</span>
                <Badge color={t.direction==="LONG"?T.green:T.red}>{t.direction}</Badge>
                <Badge color={t.result==="WIN"?T.green:t.result==="LOSS"?T.red:T.amber}>{t.result}</Badge>
                <span style={{marginLeft:"auto",fontWeight:700,color:t.rr>=0?T.green:T.red}}>{fmtRR(t.rr||0)}</span>
              </div>
            ))
          }
        </Card>

        <Card T={T} style={{borderRadius:18,padding:"20px 22px"}}>
          <CardTitle T={T}>Daily Bias {latestDaily&&<span style={{color:T.accent,fontWeight:400}}>{fmtDate(latestDaily.date)}</span>}</CardTitle>
          {latestDaily
            ?<div>{latestDaily.pairs?.map(p=>(
                <div key={p} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
                  <span style={{fontWeight:600,color:T.text,fontSize:13}}>{p}</span>
                  <Badge color={latestDaily.biases?.[p]==="Bullish"?T.green:latestDaily.biases?.[p]==="Bearish"?T.red:T.amber}>{latestDaily.biases?.[p]}</Badge>
                </div>
              ))}<div style={{fontSize:12,color:T.textDim,marginTop:10,lineHeight:1.5}}>{latestDaily.notes}</div>
            </div>
            :<EmptyState T={T} compact title="No daily plan yet" copy="Set the bias, levels, and expected manipulation before the session opens." action={<Btn T={T} onClick={onNewDaily}>+ Add Plan</Btn>}/>
          }
        </Card>

        <Card T={T} style={{borderRadius:18,padding:"20px 22px"}}>
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
            :<EmptyState T={T} compact title="No weekly plan yet" copy="Map the week before the sessions open so your daily plans have real context behind them." action={<Btn T={T} onClick={onNewWeekly}>+ Weekly Plan</Btn>} />
          }
        </Card>

        <Card T={T} style={{gridColumn:"1/-1",borderRadius:18,padding:"20px 22px"}}>
          <CardTitle T={T}>Performance by Pair</CardTitle>
          {stats.byPair.filter(p=>p.count>0).length===0
            ?<div style={{color:T.muted,fontSize:13,textAlign:"center",padding:20}}>Log trades to see pair performance</div>
            :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
              {stats.byPair.filter(p=>p.count>0).map(p=>(
                <div key={p.pair} style={{background:`linear-gradient(180deg,${T.surface2},${T.surface})`,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 14px",boxShadow:`0 6px 18px ${T.cardGlow}`}}>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:800,color:T.accentBright,marginBottom:4}}>{p.pair}</div>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:p.totalR>=0?T.green:T.red}}>{p.totalR>=0?"+":""}{p.totalR.toFixed(1)}R</div>
                  <div style={{fontSize:11,color:T.muted,marginTop:4}}>{p.wins}/{p.count} win ratio / {p.count>0?(p.wins/p.count*100).toFixed(0):0}%</div>
                </div>
              ))}
            </div>
          }
        </Card>
      </div>
    </div>
  )
}

export default Dashboard;
