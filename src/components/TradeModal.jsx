"use client"
import { useEffect, useMemo, useRef, useState } from "react";
import { PAIRS, SESSIONS, SETUPS, EMOTIONS } from "@/lib/constants";
import { readDraft, writeDraft, clearDraft, getAutoSession } from "@/lib/utils";
import { ModalShell, Btn, FL, Section, Inp, Sel, Toggle, Textarea, PasteImageInput } from "@/components/ui";

export default function TradeModal({T, userId, initial, defaults, onSave, onClose, syncing, initialMode}) {
  const blank = {
    pair:"EURUSD", date:new Date().toISOString().split("T")[0],
    direction:"LONG", session:"London", dailyBias:"Bullish",
    setup:"Manipulation + POI", result:"WIN", rr:"", pips:"",
    entry:"", sl:"", tp:"",
    emotion:"Calm & Focused", notes:"",
    preScreenshot:"", postScreenshot:"", tags:"",
    // kept for DB compat but not shown in form
    killzone:"", weeklyBias:"", marketProfile:"",
    manipulation:"", poi:"", mistakes:"None",
  };
  const baseBlank = useMemo(()=>({...blank,...(defaults||{})}),[defaults]);
  const getInitialState = useMemo(
    ()=>initial ? {...initial, tags:(initial.tags||[]).join(",")} : {...baseBlank, ...(readDraft(userId,"trade")||{})},
    [baseBlank, initial, userId]
  );

  const [f, setF]         = useState(() => getInitialState);
  const [quickLog, setQL] = useState(initialMode === "quick");
  const skipDraftRef      = useRef(false);
  const normalizedBaseline = JSON.stringify(initial ? {...initial, tags:(initial.tags||[]).join(",")} : baseBlank);
  const normalizedCurrent = JSON.stringify(f);
  const isDirty = normalizedCurrent !== normalizedBaseline;

  useEffect(()=>{
    setF(getInitialState);
  },[getInitialState]);

  const upd = (k, v) => setF(x => {
    const next = {...x, [k]:v};
    if(!initial && !skipDraftRef.current) writeDraft(userId, "trade", next);
    return next;
  });

  const calcRR = () => {
    const e = parseFloat(f.entry), s = parseFloat(f.sl), t = parseFloat(f.tp);
    if(!e || !s || !t) return;
    const risk = Math.abs(e - s), reward = Math.abs(t - e);
    if(risk > 0) upd("rr", (reward / risk).toFixed(2));
  };

  const submit = () => {
    let rr = parseFloat(f.rr) || (f.result === "WIN" ? 1 : f.result === "LOSS" ? -1 : 0);
    if(f.result === "LOSS") rr = -Math.abs(rr);
    if(f.result === "BREAKEVEN") rr = 0;
    onSave({
      ...f,
      rr, pips: parseFloat(f.pips) || 0,
      entry: parseFloat(f.entry) || 0,
      sl: parseFloat(f.sl) || 0,
      tp: parseFloat(f.tp) || 0,
      tags: f.tags ? f.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    });
  };

  const closeModal = () => {
    skipDraftRef.current = true;
    if(!initial) clearDraft(userId, "trade");
    onClose();
  };

  const requestClose = () => {
    if(syncing) return;
    if(isDirty && !window.confirm("Discard unsaved changes?")) return;
    closeModal();
  };

  useEffect(()=>{
    const handleRequestClose = ()=>requestClose();
    window.addEventListener("fxedge:request-modal-close", handleRequestClose);
    return ()=>window.removeEventListener("fxedge:request-modal-close", handleRequestClose);
  });

  const footer = (
    <>
      <Btn T={T} onClick={submit}>{syncing ? "Saving..." : initial ? "Update Trade" : "Log Trade"}</Btn>
      <Btn T={T} ghost onClick={requestClose}>Cancel</Btn>
    </>
  );

  // ── QUICK LOG ─────────────────────────────────────────────────────────────
  if(quickLog) return (
    <ModalShell T={T} title={initial ? "Edit Trade" : "Log New Trade"}
      subtitle="Quick log - minimal fields, fast entry."
      onClose={requestClose} width={580} footer={footer}>

      <button onClick={() => setQL(false)} style={{
        background:`${T.accent}20`, border:`1px solid ${T.accentBright}`,
        color:T.accentBright, padding:"6px 14px", borderRadius:20,
        fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-geist-sans)",
      }}>Quick Log ON</button>

      <Section T={T} title="Trade">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FL label="Date" T={T}><Inp T={T} type="date" value={f.date} onChange={e=>upd("date",e.target.value)}/></FL>
          <FL label="Pair" T={T}><Sel T={T} val={f.pair} opts={PAIRS} on={v=>upd("pair",v)}/></FL>
          <FL label="Direction" T={T}><Toggle T={T} value={f.direction} opts={["LONG","SHORT"]} onChange={v=>upd("direction",v)}/></FL>
          <FL label="Result" T={T}><Toggle T={T} value={f.result} opts={["WIN","LOSS","BREAKEVEN"]} onChange={v=>upd("result",v)}/></FL>
          <FL label="R:R" T={T}><Inp T={T} type="number" placeholder="e.g. 2.5" value={f.rr} onChange={e=>upd("rr",e.target.value)}/></FL>
        </div>
      </Section>

      <Section T={T} title="Screenshots & Notes">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <FL label="Pre-Trade / Ctrl+V" T={T}><PasteImageInput T={T} label="Pre" value={f.preScreenshot} onChange={v=>upd("preScreenshot",v)}/></FL>
          <FL label="Post-Trade / Ctrl+V" T={T}><PasteImageInput T={T} label="Post" value={f.postScreenshot} onChange={v=>upd("postScreenshot",v)}/></FL>
        </div>
        <FL label="Notes" T={T}><Textarea T={T} rows={2} placeholder="Quick observations..." value={f.notes} onChange={e=>upd("notes",e.target.value)}/></FL>
      </Section>
    </ModalShell>
  );

  // ── FULL LOG ──────────────────────────────────────────────────────────────
  return (
    <ModalShell T={T} title={initial ? "Edit Trade" : "Log New Trade"}
      subtitle="Full log - capture context, execution, psychology, and screenshots."
      onClose={requestClose} width={620} footer={footer}>

      <button onClick={() => { setQL(true); upd("session", getAutoSession()); }} style={{
        background:"none", border:`1px solid ${T.border}`,
        color:T.textDim, padding:"6px 14px", borderRadius:20,
        fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-geist-sans)",
      }}>Switch to Quick Log</button>

      {/* ── Section 1: Core ── */}
      <Section T={T} title="Trade">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FL label="Date" T={T}><Inp T={T} type="date" value={f.date} onChange={e=>upd("date",e.target.value)}/></FL>
          <FL label="Pair" T={T}><Sel T={T} val={f.pair} opts={PAIRS} on={v=>upd("pair",v)}/></FL>
          <FL label="Direction" T={T}><Toggle T={T} value={f.direction} opts={["LONG","SHORT"]} onChange={v=>upd("direction",v)}/></FL>
          <FL label="Session" T={T}><Sel T={T} val={f.session} opts={SESSIONS} on={v=>upd("session",v)}/></FL>
          <FL label="Result" T={T}><Toggle T={T} value={f.result} opts={["WIN","LOSS","BREAKEVEN"]} onChange={v=>upd("result",v)}/></FL>
          <FL label="R:R" T={T}><Inp T={T} type="number" placeholder="auto-calc from levels" value={f.rr} onChange={e=>upd("rr",e.target.value)}/></FL>
          <FL label="Pips" T={T}><Inp T={T} type="number" placeholder="+40" value={f.pips} onChange={e=>upd("pips",e.target.value)}/></FL>
        </div>
      </Section>

      {/* ── Section 2: Levels + Context ── */}
      <Section T={T} title="Levels & Context">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FL label="Entry" T={T}><Inp T={T} type="number" placeholder="1.08420" value={f.entry} onChange={e=>upd("entry",e.target.value)} onBlur={calcRR}/></FL>
          <FL label="Stop Loss" T={T}><Inp T={T} type="number" placeholder="1.08220" value={f.sl} onChange={e=>upd("sl",e.target.value)} onBlur={calcRR}/></FL>
          <FL label="Take Profit" T={T}><Inp T={T} type="number" placeholder="1.08820" value={f.tp} onChange={e=>upd("tp",e.target.value)} onBlur={calcRR}/></FL>
          <FL label="Daily Bias" T={T}><Toggle T={T} value={f.dailyBias} opts={["Bullish","Bearish","Neutral"]} onChange={v=>upd("dailyBias",v)}/></FL>
          <FL label="Setup" T={T} full><Sel T={T} val={f.setup} opts={SETUPS} on={v=>upd("setup",v)}/></FL>
        </div>
      </Section>

      {/* ── Section 3: Notes + Screenshots ── */}
      <Section T={T} title="Screenshots & Notes">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
          <FL label="Pre-Trade / Ctrl+V to paste" T={T}><PasteImageInput T={T} label="Pre" value={f.preScreenshot} onChange={v=>upd("preScreenshot",v)}/></FL>
          <FL label="Post-Trade / Ctrl+V to paste" T={T}><PasteImageInput T={T} label="Post" value={f.postScreenshot} onChange={v=>upd("postScreenshot",v)}/></FL>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FL label="Emotion" T={T}><Sel T={T} val={f.emotion} opts={EMOTIONS} on={v=>upd("emotion",v)}/></FL>
          <FL label="Tags" T={T}><Inp T={T} placeholder="A+ Setup, HTF Aligned" value={f.tags} onChange={e=>upd("tags",e.target.value)}/></FL>
          <FL label="Notes" T={T} full><Textarea T={T} rows={3} placeholder="Setup rationale, lessons, observations..." value={f.notes} onChange={e=>upd("notes",e.target.value)}/></FL>
        </div>
      </Section>
    </ModalShell>
  );
}
