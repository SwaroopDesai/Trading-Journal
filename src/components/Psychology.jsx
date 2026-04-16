"use client"
import { Card, CardTitle } from "@/components/ui";
import { EMOTIONS, MISTAKES } from "@/lib/constants";

export default function Psychology({T, stats, trades}) {
  const byEmotion=EMOTIONS.map(e=>{const t=trades.filter(x=>x.emotion===e);return{emotion:e,count:t.length,wins:t.filter(x=>x.result==="WIN").length,totalR:t.reduce((s,x)=>s+(x.rr||0),0)}}).filter(x=>x.count>0).sort((a,b)=>b.count-a.count)
  const mistakes=MISTAKES.filter(m=>m!=="None").map(m=>{const t=trades.filter(x=>x.mistakes===m);return{mistake:m,count:t.length,totalR:t.reduce((s,x)=>s+(x.rr||0),0)}}).filter(x=>x.count>0).sort((a,b)=>b.count-a.count)
  const perfect=trades.filter(t=>t.mistakes==="None"&&["Calm & Focused","Confident"].includes(t.emotion))
  const mistakeTrades=trades.filter(t=>t.mistakes!=="None")

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
      <Card T={T} style={{gridColumn:"1/-1"}}>
        <CardTitle T={T}>Psychology Overview</CardTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[{l:"Perfect Execution",v:perfect.length,s:`${trades.length>0?(perfect.length/trades.length*100).toFixed(0):0}% of trades`,c:T.green},{l:"With Mistakes",v:mistakeTrades.length,s:`${trades.length>0?(mistakeTrades.length/trades.length*100).toFixed(0):0}% of trades`,c:T.red},{l:"R Lost to Mistakes",v:`${mistakeTrades.reduce((s,t)=>s+Math.min(0,t.rr||0),0).toFixed(1)}R`,s:"estimated cost",c:T.amber},{l:"Best State",v:[...byEmotion].sort((a,b)=>b.totalR-a.totalR)[0]?.emotion||"No data",s:"highest R",c:T.accentBright}].map(k=>(
            <div key={k.l} style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.08em",marginBottom:8}}>{k.l}</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div>
              <div style={{fontSize:11,color:T.muted,marginTop:4}}>{k.s}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card T={T}>
        <CardTitle T={T}>By Emotion</CardTitle>
        {byEmotion.length===0?<div style={{color:T.muted,fontSize:13,textAlign:"center",padding:16}}>Log trades with emotions</div>:byEmotion.map(e=>(
          <div key={e.emotion} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontSize:12,color:T.textDim,minWidth:110}}>{e.emotion}</span>
            <div style={{flex:1,height:6,background:T.surface2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",background:e.totalR>=0?T.green:T.red,width:`${Math.min(100,e.count>0?e.wins/e.count*100:0)}%`}}/></div>
            <span style={{fontSize:11,color:T.textDim,minWidth:35,textAlign:"right"}}>{e.wins}/{e.count}</span>
            <span style={{fontSize:11,fontWeight:700,color:e.totalR>=0?T.green:T.red,minWidth:44,textAlign:"right"}}>{e.totalR>=0?"+":""}{e.totalR.toFixed(1)}R</span>
          </div>
        ))}
      </Card>
      <Card T={T}>
        <CardTitle T={T}>Mistake Tracker</CardTitle>
        {mistakes.length===0?<div style={{color:T.green,fontSize:13,textAlign:"center",padding:16}}>No mistakes logged yet</div>:mistakes.map(m=>(
          <div key={m.mistake} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontSize:12,color:T.red,minWidth:130}}>{m.mistake}</span>
            <div style={{flex:1,height:6,background:T.surface2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",background:T.red,width:`${Math.min(100,m.count*20)}%`}}/></div>
            <span style={{fontSize:11,color:T.textDim,minWidth:25,textAlign:"right"}}>{m.count}x</span>
            <span style={{fontSize:11,fontWeight:700,color:m.totalR>=0?T.green:T.red,minWidth:44,textAlign:"right"}}>{m.totalR>=0?"+":""}{m.totalR.toFixed(1)}R</span>
          </div>
        ))}
      </Card>
    </div>
  )
}
