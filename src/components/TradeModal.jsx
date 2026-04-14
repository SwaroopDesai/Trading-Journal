"use client"
import { useState, useRef, useCallback } from "react";
import { PAIRS, SESSIONS, BIASES, MANI_TYPES, POI_TYPES, SETUPS, EMOTIONS, MISTAKES } from "@/lib/constants";
import { readDraft, writeDraft, clearDraft, getAutoSession } from "@/lib/utils";
import { ModalShell, Btn, FL, Section, Inp, Sel, Toggle, Textarea, PasteImageInput } from "@/components/ui";

export default function TradeModal({T, userId, initial, onSave, onClose, syncing}) {
  const blank = {
    pair:"EURUSD", date:new Date().toISOString().split("T")[0],
    direction:"LONG", session:"London", killzone:"", dailyBias:"Bullish",
    weeklyBias:"", marketProfile:"", manipulation:"Liquidity Sweep Low",
    poi:"Order Block", setup:"Manipulation + POI",
    entry:"", sl:"", tp:"", result:"WIN", rr:"", pips:"",
    emotion:"Calm & Focused", mistakes:"None", notes:"",
    preScreenshot:"", postScreenshot:"", tags:"",
  };

  const [f, setF]         = useState(() => initial ? {...initial, tags:(initial.tags||[]).join(",")} : {...blank, ...(readDraft(userId,"trade")||{})});
  const [quickLog, setQL] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [autofillError, setAutofillError]   = useState("");
  const skipDraftWriteRef = useRef(false);

  const upd = (k, v) => setF(x => {
    const next = {...x, [k]:v};
    if(!initial && !skipDraftWriteRef.current) writeDraft(userId, "trade", next);
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
      killzone:"", weeklyBias:"", marketProfile:"",
      rr, pips:parseFloat(f.pips)||0,
      entry:parseFloat(f.entry)||0, sl:parseFloat(f.sl)||0, tp:parseFloat(f.tp)||0,
      tags: f.tags ? f.tags.split(",").map(t=>t.trim()).filter(Boolean) : [],
    });
  };

  const cancelDraft = () => {
    skipDraftWriteRef.current = true;
    if(!initial) clearDraft(userId, "trade");
    onClose();
  };

  // ── Quick Log: auto-fill session from current time ─────────────────────
  const enableQuickLog = () => {
    setQL(true);
    upd("session", getAutoSession());
  };

  // ── Screenshot Autofill via Gemini ─────────────────────────────────────
  const handleAutofill = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    setAutofilling(true);
    setAutofillError("");
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise((res, rej) => {
        reader.onload = ev => res(ev.target.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      // Store screenshot in preScreenshot field
      upd("preScreenshot", dataUrl);

      const res = await fetch("/api/screenshot-autofill", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const json = await res.json();
      if(!res.ok) throw new Error(json.error || "Autofill failed");

      const d = json.data || {};
      setF(prev => {
        const next = {
          ...prev,
          ...(d.pair      ? { pair:      d.pair }                          : {}),
          ...(d.direction ? { direction: d.direction.toUpperCase() === "SHORT" ? "SHORT" : "LONG" } : {}),
          ...(d.entry     ? { entry:     String(d.entry) }                  : {}),
          ...(d.sl        ? { sl:        String(d.sl) }                     : {}),
          ...(d.tp        ? { tp:        String(d.tp) }                     : {}),
          ...(d.result    ? { result:    d.result.toUpperCase() }            : {}),
          ...(d.rr        ? { rr:        String(d.rr) }                     : {}),
          ...(d.pips      ? { pips:      String(d.pips) }                   : {}),
          ...(d.setup     ? { setup:     d.setup }                          : {}),
          ...(d.notes     ? { notes:     (prev.notes ? prev.notes + "\n" : "") + d.notes } : {}),
          preScreenshot: dataUrl,
        };
        if(!initial) writeDraft(userId, "trade", next);
        return next;
      });
    } catch(err) {
      setAutofillError(err.message || "Could not read screenshot");
    } finally {
      setAutofilling(false);
      e.target.value = "";
    }
  }, [initial, userId]);

  // ── Render ─────────────────────────────────────────────────────────────
  const footer = (
    <>
      <Btn T={T} onClick={submit}>{syncing ? "Saving..." : initial ? "Update Trade" : "Log Trade"}</Btn>
      <Btn T={T} ghost onClick={cancelDraft}>Cancel</Btn>
    </>
  );

  return (
    <ModalShell
      T={T}
      title={initial ? "Edit Trade" : "Log New Trade"}
      subtitle={quickLog ? "Quick Log — minimal fields, fast entry." : "Capture the setup, execution, psychology, and screenshots."}
      onClose={onClose}
      width={640}
      footer={footer}
    >
      {/* ── Toolbar: Quick Log toggle + Screenshot Autofill ── */}
      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <button
          onClick={() => quickLog ? setQL(false) : enableQuickLog()}
          style={{
            background: quickLog ? `${T.accent}20` : "none",
            border: `1px solid ${quickLog ? T.accentBright : T.border}`,
            color: quickLog ? T.accentBright : T.textDim,
            padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600,
            cursor:"pointer", fontFamily:"Inter,sans-serif",
          }}
        >
          ⚡ Quick Log {quickLog ? "ON" : "OFF"}
        </button>

        <label style={{
          background:`${T.surface2}`, border:`1px solid ${T.border}`,
          color: T.textDim, padding:"6px 14px", borderRadius:20,
          fontSize:12, fontWeight:600, cursor: autofilling ? "wait" : "pointer",
          fontFamily:"Inter,sans-serif", display:"flex", alignItems:"center", gap:6,
          opacity: autofilling ? 0.6 : 1,
        }}>
          <input type="file" accept="image/*" style={{display:"none"}} onChange={handleAutofill} disabled={autofilling}/>
          {autofilling ? "🔄 Reading..." : "📷 Auto-fill from screenshot"}
        </label>

        {autofillError && (
          <span style={{fontSize:11, color:T.red}}>{autofillError}</span>
        )}
      </div>

      {/* ── Core fields (always shown) ── */}
      <Section T={T} title="Instrument & Timing">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FL label="Date" T={T}><Inp T={T} type="date" value={f.date} onChange={e=>upd("date",e.target.value)}/></FL>
          <FL label="Pair" T={T}><Sel T={T} val={f.pair} opts={PAIRS} on={v=>upd("pair",v)}/></FL>
          <FL label="Direction" T={T}><Toggle T={T} value={f.direction} opts={["LONG","SHORT"]} onChange={v=>upd("direction",v)}/></FL>
          <FL label="Session" T={T}><Sel T={T} val={f.session} opts={SESSIONS} on={v=>upd("session",v)}/></FL>
        </div>
      </Section>

      <Section T={T} title="Result">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FL label="Result" T={T}><Toggle T={T} value={f.result} opts={["WIN","LOSS","BREAKEVEN"]} onChange={v=>upd("result",v)}/></FL>
          <FL label="P&L (pips)" T={T}><Inp T={T} type="number" placeholder="+40" value={f.pips} onChange={e=>upd("pips",e.target.value)}/></FL>
          {!quickLog && (
            <FL label="R:R Achieved" T={T}><Inp T={T} type="number" placeholder="auto-calculated" value={f.rr} onChange={e=>upd("rr",e.target.value)}/></FL>
          )}
        </div>
      </Section>

      {/* ── Full mode only fields ── */}
      {!quickLog && (
        <>
          <Section T={T} title="Bias & Context">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <FL label="Daily Bias" T={T}><Toggle T={T} value={f.dailyBias} opts={["Bullish","Bearish","Neutral"]} onChange={v=>upd("dailyBias",v)}/></FL>
              <FL label="Manipulation" T={T}><Sel T={T} val={f.manipulation} opts={MANI_TYPES} on={v=>upd("manipulation",v)}/></FL>
              <FL label="POI Type" T={T}><Sel T={T} val={f.poi} opts={POI_TYPES} on={v=>upd("poi",v)}/></FL>
              <FL label="Setup" T={T} full><Sel T={T} val={f.setup} opts={SETUPS} on={v=>upd("setup",v)}/></FL>
            </div>
          </Section>

          <Section T={T} title="Price Levels">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <FL label="Entry" T={T}><Inp T={T} type="number" placeholder="1.08420" value={f.entry} onChange={e=>upd("entry",e.target.value)} onBlur={calcRR}/></FL>
              <FL label="Stop Loss" T={T}><Inp T={T} type="number" placeholder="1.08220" value={f.sl} onChange={e=>upd("sl",e.target.value)} onBlur={calcRR}/></FL>
              <FL label="Take Profit" T={T}><Inp T={T} type="number" placeholder="1.08820" value={f.tp} onChange={e=>upd("tp",e.target.value)} onBlur={calcRR}/></FL>
            </div>
          </Section>

          <Section T={T} title="Psychology">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <FL label="Emotion" T={T}><Sel T={T} val={f.emotion} opts={EMOTIONS} on={v=>upd("emotion",v)}/></FL>
              <FL label="Mistake" T={T}><Sel T={T} val={f.mistakes} opts={MISTAKES} on={v=>upd("mistakes",v)}/></FL>
              <FL label="Tags (comma separated)" T={T} full><Inp T={T} placeholder="A+ Setup, HTF Aligned" value={f.tags} onChange={e=>upd("tags",e.target.value)}/></FL>
            </div>
          </Section>
        </>
      )}

      {/* ── Notes & Screenshots ── */}
      <Section T={T} title={quickLog ? "Notes (optional)" : "Notes & Screenshots"}>
        <FL label="Trade Notes" T={T}>
          <Textarea T={T} rows={quickLog ? 2 : 3} placeholder="Setup rationale, lessons, observations..." value={f.notes} onChange={e=>upd("notes",e.target.value)}/>
        </FL>
        {!quickLog && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
            <FL label="Pre-Trade Screenshot / Ctrl+V to paste" T={T}>
              <PasteImageInput T={T} label="Pre" value={f.preScreenshot} onChange={v=>upd("preScreenshot",v)}/>
            </FL>
            <FL label="Post-Trade Screenshot / Ctrl+V to paste" T={T}>
              <PasteImageInput T={T} label="Post" value={f.postScreenshot} onChange={v=>upd("postScreenshot",v)}/>
            </FL>
          </div>
        )}
      </Section>
    </ModalShell>
  );
}
