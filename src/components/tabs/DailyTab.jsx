"use client"
import { useEffect, useRef, useState } from "react";
import { PAIRS } from "@/lib/constants";
import { fmtDate, getDailyPlanImages, getDailyPairNotes, serializeDailyPairNotes, serializeImageList, readDraft, writeDraft, clearDraft } from "@/lib/utils";
import { Card, Btn, SectionLead, EmptyState, FL, Inp, Toggle, Textarea, ModalShell, MultiImageInput, Section, Chip } from "@/components/ui";

const BIAS_OPTIONS = ["Bullish","Bearish","Neutral"];

function DailyTab({T,plans,onEdit,onDelete,onViewImg,onNew}) {
  const sorted = [...plans].sort((a,b)=>new Date(b.date)-new Date(a.date));

  return (
    <div>
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:12,marginBottom:16,flexWrap:"wrap",padding:"0 2px"}}>
        <SectionLead
          T={T}
          eyebrow="Trading Rhythm"
          title="Daily Plans"
          copy="One day, one focus. Bias, pair notes, screenshots, then execute."
        />
        <Btn T={T} onClick={onNew}>+ Daily Plan</Btn>
      </div>

      {sorted.length===0&&(
        <div style={{marginBottom:16}}>
          <EmptyState T={T} icon="DY" title="Build the day before the market does" copy="Keep the plan short, clear, and visible before you start executing." action={<Btn T={T} onClick={onNew}>Create Daily Plan</Btn>}/>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {sorted.map(p=>{
          const pairNotes = getDailyPairNotes(p);
          const images = getDailyPlanImages(p);
          const pairViews = (p.pairs || [])
            .map(pair=>({ pair, bias: p.biases?.[pair] || "Neutral", note: pairNotes?.[pair] || "" }))
            .filter(item=>item.bias !== "Neutral" || String(item.note).trim());
          return (
            <Card key={p._dbid} T={T} style={{padding:16,borderRadius:16,background:T.surface,boxShadow:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:14,marginBottom:14}}>
                <div>
                  <div style={{fontSize:18,fontWeight:850,color:T.text,letterSpacing:"-0.03em"}}>{fmtDate(p.date)}</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
                    <MetaPill T={T} label="Pairs" value={pairViews.length || (p.pairs || []).length || 0}/>
                    <MetaPill T={T} label="Charts" value={images.length}/>
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <SmallAction T={T} onClick={()=>onEdit(p)}>Edit</SmallAction>
                  <SmallAction T={T} danger onClick={()=>onDelete(p)}>Delete</SmallAction>
                </div>
              </div>

              {p.weeklyTheme&&(
                <PlanBlock T={T} label="Day Focus" value={p.weeklyTheme}/>
              )}

              {pairViews.length>0&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:10,marginTop:10}}>
                  {pairViews.map(({pair,bias,note})=>(
                    <PairPlan key={pair} T={T} pair={pair} bias={bias} note={note}/>
                  ))}
                </div>
              )}

              {p.manipulation&&(
                <div style={{marginTop:10}}>
                  <PlanBlock T={T} label="Session Expectation" value={p.manipulation} color={T.amber}/>
                </div>
              )}

              {images.length>0&&(
                <ImageStrip T={T} images={images} prefix="Daily chart" onViewImg={onViewImg}/>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function DailyModal({T,userId,initial,onSave,onClose,syncing}) {
  const blank={date:new Date().toISOString().split("T")[0],pairs:["EURUSD","GBPUSD"],biases:{},weeklyTheme:"",keyLevels:"",manipulation:"",watchlist:"",notes:"",chartImage:"",pairNotes:{}};
  const [f,setF]=useState(()=>{
    if(initial) return {...initial,pairNotes:getDailyPairNotes(initial),chartImages:getDailyPlanImages(initial)};
    const draft = readDraft(userId, "daily") || {};
    return {...blank,chartImages:[],...draft};
  });
  const skipDraftWriteRef = useRef(false);
  const normalizedBaseline = JSON.stringify(initial ? {...initial,pairNotes:getDailyPairNotes(initial),chartImages:getDailyPlanImages(initial)} : {...blank,chartImages:[]});
  const normalizedCurrent = JSON.stringify(f);
  const isDirty = normalizedCurrent !== normalizedBaseline;
  const upd=(k,v)=>setF(x=>({...x,[k]:v}));

  useEffect(()=>{
    if(initial) return;
    if(skipDraftWriteRef.current) return;
    writeDraft(userId, "daily", f);
  },[f,initial,userId]);

  const togglePair=p=>setF(x=>({...x,pairs:x.pairs.includes(p)?x.pairs.filter(pp=>pp!==p):[...x.pairs,p]}));
  const setBias=(pair,bias)=>setF(x=>({...x,biases:{...x.biases,[pair]:bias}}));
  const setPairNote=(pair,note)=>setF(x=>({...x,pairNotes:{...(x.pairNotes||{}),[pair]:note}}));
  const submit=()=>{
    const {chartImages,pairNotes,...rest}=f;
    onSave({...rest,keyLevels:"",notes:"",watchlist:serializeDailyPairNotes(pairNotes),chartImage:serializeImageList(chartImages)});
  };
  const closeModal = ()=>{
    skipDraftWriteRef.current = true;
    if(!initial) clearDraft(userId, "daily");
    onClose();
  };
  const requestClose = ()=>{
    if(isDirty && !window.confirm("Discard this daily plan?")) return;
    closeModal();
  };

  useEffect(()=>{
    const handleRequestClose = ()=>requestClose();
    window.addEventListener("fxedge:request-modal-close", handleRequestClose);
    return ()=>window.removeEventListener("fxedge:request-modal-close", handleRequestClose);
  });

  return (
    <ModalShell T={T} title={initial?"Edit Daily Plan":"New Daily Plan"} subtitle="Fast prep: focus, pair views, session expectation, screenshots." onClose={requestClose} width={720} footer={<><Btn T={T} onClick={submit}>{syncing?"Saving...":initial?"Update":"Save Plan"}</Btn><Btn T={T} ghost onClick={requestClose}>Cancel</Btn></>}>
      <FL label="Date" T={T}><Inp T={T} type="date" value={f.date} onChange={e=>upd("date",e.target.value)}/></FL>

      <Section T={T} title="Pairs in Focus">
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{PAIRS.map(p=><Chip key={p} T={T} active={f.pairs?.includes(p)} onClick={()=>togglePair(p)}>{p}</Chip>)}</div>
      </Section>

      <FL label="Day Focus" T={T}>
        <Textarea T={T} rows={5} placeholder="Main theme, session focus, what you are waiting for, and what you will avoid..." value={f.weeklyTheme} onChange={e=>upd("weeklyTheme",e.target.value)}/>
      </FL>

      <Section T={T} title="Pair Views">
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12}}>
          {f.pairs?.map(p=>(
            <div key={p} style={{padding:"13px",border:`1px solid ${T.border}`,borderRadius:14,background:T.surface2,display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:13,fontWeight:850,color:T.text}}>{p}</span>
                <Toggle T={T} value={f.biases?.[p]||""} opts={BIAS_OPTIONS} onChange={v=>setBias(p,v)}/>
              </div>
              <Textarea T={T} rows={2} placeholder={`Plan for ${p} today`} value={f.pairNotes?.[p]||""} onChange={e=>setPairNote(p,e.target.value)}/>
            </div>
          ))}
        </div>
      </Section>

      <FL label="Session Expectation" T={T}>
        <Textarea T={T} rows={2} placeholder="What are you expecting today, or why are you staying out?" value={f.manipulation} onChange={e=>upd("manipulation",e.target.value)}/>
      </FL>

      <FL label="Daily Screenshots" T={T}>
        <MultiImageInput T={T} label="Daily screenshot" values={f.chartImages} onChange={v=>upd("chartImages",v)}/>
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

export { DailyModal };
export default DailyTab;
