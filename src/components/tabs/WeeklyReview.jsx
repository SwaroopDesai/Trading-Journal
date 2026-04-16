"use client"
import { useState, useCallback } from "react";
import { CHECKLIST_RULES } from "@/lib/constants";
import { fmtDate, getWeeklyPairNotes } from "@/lib/utils";
import { Card, CardTitle, Btn, SectionLead, EmptyState, Textarea, Badge, Overlay } from "@/components/ui";

function WeeklyReview({T,weeklyPlans,trades,saveWeekly,onNewWeekly,viewportWidth}) {
  const [selected,setSelected]=useState(null)
  const [reviewText,setReviewText]=useState("")
  const [saving,setSaving]=useState(false)
  const isMobile = viewportWidth < 768
  const sorted=[...weeklyPlans].sort((a,b)=>new Date(b.weekStart)-new Date(a.weekStart))
  const getWeekTrades=p=>trades.filter(t=>t.date>=p.weekStart&&t.date<=p.weekEnd)
  const open=p=>{setSelected(p);setReviewText(p.review||"")}
  const save=async()=>{setSaving(true);await saveWeekly({...selected,review:reviewText});setSaving(false);setSelected(null)}
  const PROMPTS=["Did I follow my daily bias?","Did I wait for manipulation before entry?","Did I manage risk properly?","What was my biggest mistake?","What did I do well?","What will I improve next week?"]
  const buildInsights=(weekTrades)=>{
    const wins=weekTrades.filter(t=>t.result==="WIN")
    const totalR=weekTrades.reduce((s,t)=>s+(t.rr||0),0)
    const winRate=weekTrades.length?(wins.length/weekTrades.length)*100:0
    const bestTrade=[...weekTrades].sort((a,b)=>(b.rr||0)-(a.rr||0))[0]||null
    const worstTrade=[...weekTrades].sort((a,b)=>(a.rr||0)-(b.rr||0))[0]||null
    const byPair={}
    const bySetup={}
    const byMistake={}
    const byEmotion={}
    weekTrades.forEach(t=>{
      if(!byPair[t.pair]) byPair[t.pair]={count:0,r:0,wins:0}
      byPair[t.pair].count++
      byPair[t.pair].r+=(t.rr||0)
      if(t.result==="WIN") byPair[t.pair].wins++
      if(t.setup){
        if(!bySetup[t.setup]) bySetup[t.setup]={count:0,r:0,wins:0}
        bySetup[t.setup].count++
        bySetup[t.setup].r+=(t.rr||0)
        if(t.result==="WIN") bySetup[t.setup].wins++
      }
      if(t.mistakes&&t.mistakes!=="None") byMistake[t.mistakes]=(byMistake[t.mistakes]||0)+1
      if(t.emotion) byEmotion[t.emotion]=(byEmotion[t.emotion]||0)+1
    })
    const bestPair=Object.entries(byPair).sort((a,b)=>b[1].r-a[1].r)[0]
    const bestSetup=Object.entries(bySetup).sort((a,b)=>b[1].r-a[1].r)[0]
    const topMistake=Object.entries(byMistake).sort((a,b)=>b[1]-a[1])[0]
    const topEmotion=Object.entries(byEmotion).sort((a,b)=>b[1]-a[1])[0]
    const nextFocus=topMistake
      ? `Reduce ${topMistake[0].toLowerCase()} and stay tighter around your best setup.`
      : bestSetup
        ? `Keep pressing ${bestSetup[0].toLowerCase()} only when the full context is aligned.`
        : "Protect capital and wait for your cleanest confirmations next week."
    return {wins,totalR,winRate,bestTrade,worstTrade,bestPair,bestSetup,topMistake,topEmotion,nextFocus}
  }

  return (
    <div>
      <SectionLead T={T} compact={isMobile} eyebrow="Performance Review" title="Weekly Debrief" copy="Every review should end with one clear lesson, one clear leak, and one clear focus for the next week." />
      {sorted.length===0&&<EmptyState T={T} title="No weekly reviews yet" copy="Start with one weekly plan and your end-of-week debriefs will build themselves from there." action={<Btn T={T} onClick={onNewWeekly}>+ Weekly Plan</Btn>} />}
      <div style={{display:"grid",gridTemplateColumns:`repeat(auto-fill,minmax(${isMobile?280:320}px,1fr))`,gap:14}}>
        {sorted.map(plan=>{
          const wt=getWeekTrades(plan)
          const insights=buildInsights(wt)
          const wins=insights.wins.length
          const totalR=insights.totalR
          const hasReview=plan.review&&plan.review.trim().length>0
          return (
            <div key={plan._dbid} style={{background:`linear-gradient(180deg,${T.surface} 0%,${T.surface2} 100%)`,border:`1px solid ${hasReview?T.accentBright:T.border}`,borderRadius:18,padding:"20px 20px 18px",boxShadow:`0 14px 32px ${T.cardGlow}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:T.text}}>{plan.weekStart} to {plan.weekEnd}</div>
                  {plan.overallBias&&<div style={{fontSize:12,color:T.accentBright,marginTop:3}}>{plan.overallBias}</div>}
                </div>
                {hasReview&&<Badge color={T.green}>Reviewed</Badge>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,minmax(0,1fr))":"repeat(4,minmax(0,1fr))",gap:8,marginBottom:12}}>
                {[{l:"Trades",v:wt.length,c:T.text},{l:"Wins",v:wins,c:T.green},{l:"Losses",v:wt.length-wins,c:T.red},{l:"Total R",v:`${totalR>=0?"+":""}${totalR.toFixed(1)}R`,c:totalR>=0?T.green:T.red}].map(s=>(
                  <div key={s.l} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px",textAlign:"center"}}>
                    <div style={{fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",marginBottom:3}}>{s.l}</div>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:800,color:s.c}}>{s.v}</div>
                  </div>
                ))}
              </div>
              {wt.length>0&&(
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8,marginBottom:12}}>
                  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 12px"}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Best Pair</div>
                    <div style={{fontSize:13,fontWeight:800,color:T.text}}>{insights.bestPair?.[0]||"-"}</div>
                    <div style={{fontSize:11,color:T.textDim,marginTop:3}}>{insights.bestPair?`${insights.bestPair[1].r>=0?"+":""}${insights.bestPair[1].r.toFixed(1)}R across ${insights.bestPair[1].count} trades`:"No pair edge yet"}</div>
                  </div>
                  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 12px"}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Best Setup</div>
                    <div style={{fontSize:13,fontWeight:800,color:T.text}}>{insights.bestSetup?.[0]||"-"}</div>
                    <div style={{fontSize:11,color:T.textDim,marginTop:3}}>{insights.bestSetup?`${insights.bestSetup[1].wins}/${insights.bestSetup[1].count} wins with ${insights.bestSetup[1].r>=0?"+":""}${insights.bestSetup[1].r.toFixed(1)}R`:"Need more setup data"}</div>
                  </div>
                  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 12px"}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Recurring Mistake</div>
                    <div style={{fontSize:13,fontWeight:800,color:insights.topMistake?T.red:T.text}}>{insights.topMistake?.[0]||"None logged"}</div>
                    <div style={{fontSize:11,color:T.textDim,marginTop:3}}>{insights.topMistake?`${insights.topMistake[1]} time${insights.topMistake[1]!==1?"s":""} this week`:"Execution stayed clean"}</div>
                  </div>
                  <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 12px"}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Dominant State</div>
                    <div style={{fontSize:13,fontWeight:800,color:T.text}}>{insights.topEmotion?.[0]||"-"}</div>
                    <div style={{fontSize:11,color:T.textDim,marginTop:3}}>{wt.length?`${insights.winRate.toFixed(0)}% win rate this week`:"No trades logged"}</div>
                  </div>
                </div>
              )}
              {wt.length>0&&(
                <div style={{background:`linear-gradient(135deg,${T.accent}18,${T.blue}10)`,border:`1px solid ${T.accent}28`,borderRadius:14,padding:"12px 14px",marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Next Week Focus</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.7}}>{insights.nextFocus}</div>
                </div>
              )}
              {wt.length>0&&(
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8,marginBottom:12}}>
                  <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 12px"}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Best Trade</div>
                    <div style={{fontSize:12,fontWeight:800,color:T.text}}>{insights.bestTrade?`${insights.bestTrade.pair} ${insights.bestTrade.direction}`:"-"}</div>
                    <div style={{fontSize:11,color:insights.bestTrade?.rr>=0?T.green:T.textDim,marginTop:3}}>{insights.bestTrade?fmtRR(insights.bestTrade.rr||0):"No trades logged"}</div>
                  </div>
                  <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 12px"}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Worst Trade</div>
                    <div style={{fontSize:12,fontWeight:800,color:T.text}}>{insights.worstTrade?`${insights.worstTrade.pair} ${insights.worstTrade.direction}`:"-"}</div>
                    <div style={{fontSize:11,color:insights.worstTrade?.rr>=0?T.green:T.red,marginTop:3}}>{insights.worstTrade?fmtRR(insights.worstTrade.rr||0):"No trades logged"}</div>
                  </div>
                </div>
              )}
              {hasReview&&<div style={{fontSize:12,color:T.textDim,lineHeight:1.6,marginBottom:12,padding:"10px 12px",background:T.surface,borderRadius:10,borderLeft:`3px solid ${T.accentBright}`}}>{plan.review.slice(0,180)}{plan.review.length>180?"...":""}</div>}
              <button onClick={()=>open(plan)} style={{width:"100%",background:`linear-gradient(135deg,${T.accentBright},${T.pink})`,color:"#fff",border:"none",padding:"10px",borderRadius:10,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13}}>
                {hasReview?"Update Review":"Write Review"}
              </button>
            </div>
          )
        })}
      </div>

      {selected&&(
        <Overlay onClose={()=>setSelected(null)}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,width:"min(720px,95vw)",maxHeight:"90vh",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"18px 22px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:17,fontWeight:800,color:T.text}}>Week Review - {selected.weekStart}</div>
              <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:20}}>x</button>
            </div>
            <div style={{padding:"20px 22px",overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:14}}>
              {getWeekTrades(selected).length>0&&(
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Trades This Week</div>
                  {getWeekTrades(selected).map(t=>(
                    <div key={t._dbid} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:T.surface2,borderRadius:8,marginBottom:5,fontSize:12}}>
                      <span style={{fontWeight:800,color:T.accentBright,minWidth:65}}>{t.pair}</span>
                      <Badge color={t.direction==="LONG"?T.green:T.red}>{t.direction}</Badge>
                      <Badge color={t.result==="WIN"?T.green:t.result==="LOSS"?T.red:T.amber}>{t.result}</Badge>
                      <span style={{marginLeft:"auto",fontWeight:800,color:t.rr>=0?T.green:T.red}}>{fmtRR(t.rr||0)}</span>
                    </div>
                  ))}
                </div>
              )}
              {(()=>{ const insights=buildInsights(getWeekTrades(selected)); return getWeekTrades(selected).length>0&&(
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:10}}>
                  <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 14px"}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Weekly Snapshot</div>
                    <div style={{fontSize:12,color:T.textDim,lineHeight:1.7}}>
                      <div>{getWeekTrades(selected).length} trades with {insights.winRate.toFixed(0)}% win rate</div>
                      <div>{insights.totalR>=0?"+":""}{insights.totalR.toFixed(1)}R total for the week</div>
                      <div>Best pair: {insights.bestPair?.[0]||"-"}</div>
                    </div>
                  </div>
                  <div style={{background:`linear-gradient(135deg,${T.accent}18,${T.blue}10)`,border:`1px solid ${T.accent}28`,borderRadius:12,padding:"12px 14px"}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Coaching Focus</div>
                    <div style={{fontSize:12,color:T.text,lineHeight:1.7}}>{insights.nextFocus}</div>
                  </div>
                </div>
              )})()}
              <div>
                <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Review Prompts</div>
                {PROMPTS.map((p,i)=><div key={i} style={{fontSize:12,color:T.textDim,padding:"6px 10px",background:T.surface2,borderRadius:6,marginBottom:4,borderLeft:`2px solid ${T.border}`}}>{i+1}. {p}</div>)}
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Your Review</div>
                <Textarea T={T} rows={8} placeholder="Write your review here..." value={reviewText} onChange={e=>setReviewText(e.target.value)}/>
              </div>
            </div>
            <div style={{padding:"14px 22px",borderTop:`1px solid ${T.border}`,display:"flex",gap:10}}>
              <Btn T={T} onClick={save}>{saving?"Saving...":"Save Review"}</Btn>
              <Btn T={T} ghost onClick={()=>setSelected(null)}>Cancel</Btn>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  )
}

function ChecklistGate({T, onPass, onClose}) {
  const [checked, setChecked] = useState({})
  const [attempted, setAttempted] = useState(false)
  const toggle = id => setChecked(c => ({...c, [id]: !c[id]}))
  const allChecked = CHECKLIST_RULES.every(r => checked[r.id])
  const score = CHECKLIST_RULES.filter(r => checked[r.id]).length

  const handleProceed = () => {
    setAttempted(true)
    if(allChecked) onPass()
  }

  const pct = Math.round((score / CHECKLIST_RULES.length) * 100)
  const progressColor = pct === 100 ? T.green : pct >= 70 ? T.amber : T.red

  return (
    <Overlay onClose={onClose}>
      <div style={{background:T.surface, border:`1px solid ${T.border}`, borderRadius:20, width:"min(520px,96vw)", maxHeight:"92vh", display:"flex", flexDirection:"column", overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"22px 24px 18px", background:`linear-gradient(135deg,${T.accent}20,${T.pink}10)`, borderBottom:`1px solid ${T.border}`}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:20, fontWeight:800, color:T.text}}>Pre-Trade Checklist</div>
            <button onClick={onClose} style={{background:"none", border:"none", color:T.textDim, cursor:"pointer", fontSize:20}}>x</button>
          </div>
          <div style={{fontSize:13, color:T.textDim}}>Tick every rule before logging your trade</div>
          {/* Progress bar */}
          <div style={{marginTop:14}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6}}>
              <span style={{fontSize:12, fontWeight:700, color:progressColor}}>{score}/{CHECKLIST_RULES.length} rules checked</span>
              <span style={{fontSize:12, fontWeight:800, color:progressColor}}>{pct}%</span>
            </div>
            <div style={{height:6, background:T.surface2, borderRadius:3, overflow:"hidden"}}>
              <div style={{height:"100%", borderRadius:3, background:`linear-gradient(90deg,${progressColor},${T.pink})`, width:`${pct}%`, transition:"width .4s ease"}}/>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div style={{padding:"16px 24px", overflowY:"auto", flex:1, display:"flex", flexDirection:"column", gap:8}}>
          {CHECKLIST_RULES.map(rule => {
            const isChecked = !!checked[rule.id]
            const isError = attempted && !isChecked
            return (
              <div key={rule.id}
                onClick={() => toggle(rule.id)}
                style={{
                  display:"flex", alignItems:"center", gap:14, padding:"14px 16px",
                  background: isChecked ? `${T.green}12` : isError ? `${T.red}08` : T.surface2,
                  border:`1.5px solid ${isChecked ? T.green : isError ? T.red : T.border}`,
                  borderRadius:12, cursor:"pointer", transition:"all .15s",
                  transform: isChecked ? "none" : "none",
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width:24, height:24, borderRadius:8, flexShrink:0,
                  background: isChecked ? T.green : "none",
                  border:`2px solid ${isChecked ? T.green : isError ? T.red : T.border}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"all .2s",
                }}>
                  {isChecked && <span style={{color:"#fff", fontSize:12, fontWeight:700}}>OK</span>}
                </div>
                {/* Icon + text */}
                <span style={{fontSize:20, flexShrink:0}}>{rule.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13, fontWeight:700, color: isChecked ? T.green : T.text, marginBottom:2}}>{rule.label}</div>
                  <div style={{fontSize:11, color:T.muted}}>{rule.detail}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{padding:"16px 24px", borderTop:`1px solid ${T.border}`}}>
          {attempted && !allChecked && (
            <div style={{fontSize:12, color:T.red, marginBottom:10, textAlign:"center", fontWeight:600}}>
              Tick all {CHECKLIST_RULES.length} rules before logging a trade
            </div>
          )}
          <button
            onClick={handleProceed}
            style={{
              width:"100%", padding:"13px",
              background: allChecked ? `linear-gradient(135deg,${T.accentBright},${T.pink})` : T.surface2,
              color: allChecked ? "#fff" : T.muted,
              border:`1px solid ${allChecked ? "transparent" : T.border}`,
              borderRadius:12, cursor: allChecked ? "pointer" : "default",
              fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:15,
              transition:"all .3s",
            }}
          >
            {allChecked ? "All rules checked - Log Trade" : `${CHECKLIST_RULES.length - score} rule${CHECKLIST_RULES.length - score !== 1 ? "s" : ""} remaining`}
          </button>
          <div style={{textAlign:"center", marginTop:8}}>
            <button onClick={onPass} style={{background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:11, textDecoration:"underline"}}>Skip checklist (not recommended)</button>
          </div>
        </div>
      </div>
    </Overlay>
  )
}

// ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Advanced Analytics Heatmap ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬

export default WeeklyReview;
