"use client"
import { useState } from "react";
import { PAIRS } from "@/lib/constants";
import { Card, CardTitle, FL, Inp, Sel } from "@/components/ui";

export default function Calculator({T}) {
  const [acc,setAcc]=useState("10000")
  const [risk,setRisk]=useState("1")
  const [slPips,setSlPips]=useState("")
  const [pair,setPair]=useState("EURUSD")
  const [pipVal,setPipVal]=useState("10")
  const PIP_VALUES={EURUSD:"10",GBPUSD:"10",USDCAD:"7.5",GER30:"1",SPX500:"1",NAS100:"1"}

  const calc=()=>{
    const a=parseFloat(acc)||0,r=parseFloat(risk)||0,s=parseFloat(slPips)||0,pv=parseFloat(pipVal)||10
    if(!a||!r||!s||!pv) return null
    const riskAmt=a*(r/100), lots=riskAmt/(s*pv)
    return{riskAmt:riskAmt.toFixed(2),lots:lots.toFixed(2),units:Math.round(lots*100000)}
  }
  const result=calc()

  return (
    <div style={{maxWidth:580}}>
      <Card T={T} style={{marginBottom:14}} glow>
        <CardTitle T={T}>Position Size Calculator</CardTitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <FL label="Account Size ($)" T={T}><Inp T={T} type="number" placeholder="10000" value={acc} onChange={e=>setAcc(e.target.value)}/></FL>
          <FL label="Pair" T={T}><Sel T={T} val={pair} opts={PAIRS} on={v=>{setPair(v);setPipVal(PIP_VALUES[v]||"10")}}/></FL>
          <FL label="Stop Loss (Pips)" T={T} full>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              {["5","10","15","20","25","30","50"].map(p=><button key={p} onClick={()=>setSlPips(p)} style={{background:slPips===p?`${T.accentBright}25`:"none",border:`1px solid ${slPips===p?T.accentBright:T.border}`,color:slPips===p?T.accentBright:T.textDim,padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>{p}</button>)}
            </div>
            <Inp T={T} type="number" placeholder="Or type manually e.g. 22" value={slPips} onChange={e=>setSlPips(e.target.value)}/>
          </FL>
          <FL label="Pip Value ($ per lot)" T={T}><Inp T={T} type="number" value={pipVal} onChange={e=>setPipVal(e.target.value)}/></FL>
          <FL label="Risk %" T={T}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              {["0.5","1","1.5","2","3"].map(r=><button key={r} onClick={()=>setRisk(r)} style={{background:risk===r?`${T.accentBright}25`:"none",border:`1px solid ${risk===r?T.accentBright:T.border}`,color:risk===r?T.accentBright:T.textDim,padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>{r}%</button>)}
            </div>
            <Inp T={T} type="number" placeholder="1" value={risk} onChange={e=>setRisk(e.target.value)}/>
          </FL>
        </div>
      </Card>
      {result?(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[{l:"Risk Amount",v:`$${result.riskAmt}`,c:T.red,g:`linear-gradient(135deg,${T.red}20,${T.red}08)`},{l:"Lot Size",v:result.lots,c:T.accentBright,g:`linear-gradient(135deg,${T.accent}20,${T.accent}08)`},{l:"Units",v:parseInt(result.units).toLocaleString(),c:T.blue,g:`linear-gradient(135deg,${T.blue}20,${T.blue}08)`}].map(k=>(
            <div key={k.l} style={{background:k.g,border:`1px solid ${T.border}`,borderRadius:14,padding:"20px",textAlign:"center"}}>
              <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>{k.l}</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:26,fontWeight:800,color:k.c}}>{k.v}</div>
            </div>
          ))}
        </div>
      ):(
        <Card T={T} style={{textAlign:"center",padding:32}}><div style={{color:T.muted,fontSize:13}}>Fill in all fields to calculate position size</div></Card>
      )}
    </div>
  )
}
