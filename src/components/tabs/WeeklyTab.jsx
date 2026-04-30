"use client"
import { useEffect, useRef, useState } from "react";
import { PAIRS } from "@/lib/constants";
import { getWeeklyPlanImages, getWeeklyPairNotes, readDraft, writeDraft, clearDraft, normalizeImageList } from "@/lib/utils";
import { Card, Btn, SectionLead, EmptyState, FL, Inp, Toggle, Textarea, ModalShell, MultiImageInput, Section } from "@/components/ui";

const BIAS_OPTIONS = ["Bullish","Bearish","Neutral"];

function WeeklyTab({T,plans,onEdit,onDelete,onViewImg,onNew}) {
  const sorted=[...plans].sort((a,b)=>new Date(b.weekStart)-new Date(a.weekStart));

  return (
    <div>
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:12,marginBottom:16,flexWrap:"wrap",padding:"0 2px"}}>
        <SectionLead
          T={T}
          eyebrow="Weekly Framing"
          title="Weekly Plans"
          copy="Pair-by-pair prep, major events, and one clean weekly note."
        />
        <Btn T={T} onClick={onNew}>+ Weekly Plan</Btn>
      </div>

      {sorted.length===0&&(
        <div style={{marginBottom:16}}>
          <EmptyState T={T} icon="WK" title="Frame the week before the sessions get noisy" copy="Set the key events and pair notes once so the week stays focused." action={<Btn T={T} onClick={onNew}>Create Weekly Plan</Btn>}/>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {sorted.map(p=>{
          const pairNotes = getWeeklyPairNotes(p);
          const images = getWeeklyPlanImages(p);
          const pairViews = PAIRS
            .map(pair=>({ pair, bias: p.pairs?.[pair] || "Neutral", note: pairNotes?.[pair] || "" }))
            .filter(item=>item.bias !== "Neutral" || String(item.note).trim());
          return (
            <Card key={p._dbid} T={T} style={{padding:16,borderRadius:16,background:T.surface,boxShadow:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:14,marginBottom:14}}>
                <div>
                  <div style={{fontSize:18,fontWeight:850,color:T.text,letterSpacing:"-0.03em"}}>{p.weekStart} to {p.weekEnd}</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
                    <MetaPill T={T} label="Pairs" value={pairViews.length}/>
                    <MetaPill T={T} label="Charts" value={images.length}/>
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <SmallAction T={T} onClick={()=>onEdit(p)}>Edit</SmallAction>
                  <SmallAction T={T} danger onClick={()=>onDelete(p)}>Delete</SmallAction>
                </div>
              </div>

              {pairViews.length>0&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:10,marginBottom:10}}>
                  {pairViews.map(({pair,bias,note})=>(
                    <PairPlan key={pair} T={T} pair={pair} bias={bias} note={note}/>
                  ))}
                </div>
              )}

              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10}}>
                {[{l:"Key Events",v:p.keyEvents,c:T.amber},{l:"Notes",v:p.notes}].filter(x=>x.v).map(x=>(
                  <PlanBlock key={x.l} T={T} label={x.l} value={x.v} color={x.c}/>
                ))}
              </div>

              {images.length>0&&(
                <ImageStrip T={T} images={images} prefix="Weekly chart" onViewImg={onViewImg}/>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function WeeklyModal({T,userId,initial,onSave,onClose,syncing}) {
  const mon=()=>{const d=new Date();d.setDate(d.getDate()-d.getDay()+1);return d.toISOString().split("T")[0];};
  const fri=()=>{const d=new Date();d.setDate(d.getDate()-d.getDay()+5);return d.toISOString().split("T")[0];};
  const blank={weekStart:mon(),weekEnd:fri(),pairs:{},keyEvents:"",notes:"",review:"",pairNotes:{}};
  const [f,setF]=useState(()=>{
    if(initial) return {...initial,pairNotes:getWeeklyPairNotes(initial),chartImages:getWeeklyPlanImages(initial)};
    const draft = readDraft(userId, "weekly") || {};
    return {...blank,premiumDiscount:{},chartImages:[],...draft};
  });
  const skipDraftWriteRef = useRef(false);
  const normalizedBaseline = JSON.stringify(initial ? {...initial,pairNotes:getWeeklyPairNotes(initial),chartImages:getWeeklyPlanImages(initial)} : {...blank,premiumDiscount:{},chartImages:[]});
  const normalizedCurrent = JSON.stringify(f);
  const isDirty = normalizedCurrent !== normalizedBaseline;
  const upd=(k,v)=>setF(x=>({...x,[k]:v}));

  useEffect(()=>{
    if(initial) return;
    if(skipDraftWriteRef.current) return;
    writeDraft(userId, "weekly", f);
  },[f,initial,userId]);

  const setPair=(p,v)=>setF(x=>({...x,pairs:{...x.pairs,[p]:v}}));
  const setPairNote=(p,v)=>setF(x=>({...x,pairNotes:{...(x.pairNotes||{}),[p]:v}}));
  const submit=()=>{
    const {chartImages,pairNotes,...rest}=f;
    const premiumDiscount = {...(rest.premiumDiscount||{})};
    const images = normalizeImageList(chartImages);
    if(images.length>0) premiumDiscount.__screenshots = images;
    else delete premiumDiscount.__screenshots;
    const cleanedPairNotes = Object.fromEntries(Object.entries(pairNotes||{}).filter(([,value])=>String(value||"").trim()));
    if(Object.keys(cleanedPairNotes).length>0) premiumDiscount.__pairNotes = cleanedPairNotes;
    else delete premiumDiscount.__pairNotes;
    onSave({...rest,overallBias:"",marketStructure:"",targets:"",premiumDiscount});
  };
  const closeModal = ()=>{
    skipDraftWriteRef.current = true;
    if(!initial) clearDraft(userId, "weekly");
    onClose();
  };
  const requestClose = ()=>{
    if(isDirty && !window.confirm("Discard this weekly plan?")) return;
    closeModal();
  };

  useEffect(()=>{
    const handleRequestClose = ()=>requestClose();
    window.addEventListener("fxedge:request-modal-close", handleRequestClose);
    return ()=>window.removeEventListener("fxedge:request-modal-close", handleRequestClose);
  });

  return (
    <ModalShell T={T} title={initial?"Edit Weekly Plan":"New Weekly Plan"} subtitle="Fast weekly prep: key events, pair views, notes, screenshots." onClose={requestClose} width={720} footer={<><Btn T={T} onClick={submit}>{syncing?"Saving...":initial?"Update":"Save Plan"}</Btn><Btn T={T} ghost onClick={requestClose}>Cancel</Btn></>}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <FL label="Week Start" T={T}><Inp T={T} type="date" value={f.weekStart} onChange={e=>upd("weekStart",e.target.value)}/></FL>
        <FL label="Week End" T={T}><Inp T={T} type="date" value={f.weekEnd} onChange={e=>upd("weekEnd",e.target.value)}/></FL>
      </div>

      <FL label="Key Economic Events" T={T}>
        <Textarea T={T} rows={2} placeholder="NFP Fri, FOMC Wed, CPI Tue..." value={f.keyEvents} onChange={e=>upd("keyEvents",e.target.value)}/>
      </FL>

      <Section T={T} title="Pair Views">
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12}}>
          {PAIRS.map(p=>(
            <div key={p} style={{padding:"13px",border:`1px solid ${T.border}`,borderRadius:14,background:T.surface2,display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:13,fontWeight:850,color:T.text}}>{p}</span>
                <Toggle T={T} value={f.pairs?.[p]||""} opts={BIAS_OPTIONS} onChange={v=>setPair(p,v)}/>
              </div>
              <Textarea T={T} rows={2} placeholder={`Plan for ${p} this week`} value={f.pairNotes?.[p]||""} onChange={e=>setPairNote(p,e.target.value)}/>
            </div>
          ))}
        </div>
      </Section>

      <FL label="Notes" T={T}>
        <Textarea T={T} rows={3} placeholder="Anything that applies to the full week..." value={f.notes} onChange={e=>upd("notes",e.target.value)}/>
      </FL>

      <FL label="Weekly Screenshots" T={T}>
        <MultiImageInput T={T} label="Weekly screenshot" values={f.chartImages} onChange={v=>upd("chartImages",v)}/>
      </FL>
    </ModalShell>
  );
}

function MetaPill({ T, label, value }) {
  return <span style={{display:"inline-flex",gap:6,alignItems:"baseline",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:999,padding:"4px 8px",fontSize:10,fontWeight:800,color:T.textDim}}><span style={{color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase"}}>{label}</span>{value}</span>;
}

function SmallAction({ T, danger, onClick, children }) {
  return <button onClick={onClick} style={{background:danger?"transparent":T.surface2,border:`1px solid ${danger?`${T.red}44`:T.border}`,color:danger?T.red:T.textDim,minHeight:40,padding:"8px 12px",borderRadius:10,cursor:"pointer",fontFamily:"var(--font-geist-sans)",fontSize:12,fontWeight:800}}>{children}</button>;
}

function PlanBlock({ T, label, value, color }) {
  return <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:13,padding:"12px 13px"}}><div style={{fontSize:9,fontWeight:850,color:T.muted,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:7}}>{label}</div><div style={{fontSize:13,color:color||T.textDim,lineHeight:1.65}}>{value}</div></div>;
}

function PairPlan({ T, pair, bias, note }) {
  const color = bias==="Bullish"?T.green:bias==="Bearish"?T.red:T.textDim;
  return <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:13,padding:"12px 13px"}}><div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:note?8:0}}><span style={{fontSize:10,fontWeight:850,color:T.muted,letterSpacing:"0.13em",textTransform:"uppercase"}}>{pair}</span><span style={{fontSize:12,fontWeight:850,color}}>{bias}</span></div>{note&&<div style={{fontSize:12,color:T.textDim,lineHeight:1.6}}>{note}</div>}</div>;
}

function ImageStrip({ T, images, prefix, onViewImg }) {
  return <div style={{marginTop:10,display:"flex",gap:8,overflowX:"auto",paddingBottom:2}}>{images.map((src,index)=><button key={src} onClick={()=>onViewImg?.(src)} style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:12,padding:0,overflow:"hidden",cursor:"pointer",minWidth:128}}><img src={src} alt={`${prefix} ${index+1}`} loading="lazy" style={{width:128,height:82,objectFit:"cover",display:"block"}}/></button>)}</div>;
}

export { WeeklyModal };
export default WeeklyTab;
