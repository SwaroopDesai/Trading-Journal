"use client"
import { useState, useEffect } from "react"
import { ModalShell, FL, Inp, Sel, Toggle, Textarea, Btn } from "@/components/ui"
import { PAIRS, SETUPS, MISSED_REASONS } from "@/lib/constants"

const OUTCOMES   = ["Unknown","WIN","LOSS","BE"]
const DIRECTIONS = ["LONG","SHORT"]

function calcRR(direction, entry, sl, tp) {
  const e = parseFloat(entry), s = parseFloat(sl), t = parseFloat(tp)
  if (!e || !s || !t || e === s) return ""
  const reward = direction === "LONG" ? t - e : e - t
  const risk   = direction === "LONG" ? e - s : s - e
  if (risk <= 0 || reward <= 0) return ""
  return (reward / risk).toFixed(2)
}

export default function MissedTradeModal({ T, initial, onSave, onClose, syncing }) {
  const today = new Date().toISOString().split("T")[0]

  const [f, setF] = useState({
    date:      today,
    pair:      PAIRS[0],
    direction: "LONG",
    setup:     SETUPS[0],
    reason:    MISSED_REASONS[0],
    entry:     "",
    sl:        "",
    tp:        "",
    rr:        "",
    outcome:   "Unknown",
    notes:     "",
    ...(initial && initial !== "new" ? initial : {}),
  })

  const up = (k, v) => setF(p => ({ ...p, [k]: v }))

  // Auto-calculate RR from prices
  useEffect(() => {
    const auto = calcRR(f.direction, f.entry, f.sl, f.tp)
    if (auto) up("rr", auto)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.direction, f.entry, f.sl, f.tp])

  const canSave = f.date && f.pair && f.direction && f.reason

  const rrNum = parseFloat(f.rr) || 0

  return (
    <ModalShell
      T={T}
      title={initial?._dbid ? "Edit Missed Trade" : "Log Missed Trade"}
      subtitle="Record a setup you saw but didn't take — track your opportunity cost and hesitation patterns."
      onClose={onClose}
      footer={<>
        <Btn T={T} onClick={() => onSave(f)} disabled={!canSave || syncing}>
          {syncing ? "Saving…" : "Save"}
        </Btn>
        <Btn T={T} ghost onClick={onClose}>Cancel</Btn>
      </>}
    >
      {/* Row 1: Date + Pair */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <FL label="Date" T={T}>
          <Inp T={T} type="date" value={f.date} onChange={e => up("date", e.target.value)} label="Date"/>
        </FL>
        <FL label="Pair" T={T}>
          <Sel T={T} val={f.pair} opts={PAIRS} on={v => up("pair", v)} label="Pair"/>
        </FL>
      </div>

      {/* Direction */}
      <FL label="Direction" T={T}>
        <Toggle T={T} value={f.direction} opts={DIRECTIONS.map(v => ({ v, l: v }))} onChange={v => up("direction", v)}/>
      </FL>

      {/* Setup */}
      <FL label="Setup" T={T}>
        <Sel T={T} val={f.setup} opts={SETUPS} on={v => up("setup", v)} label="Setup"/>
      </FL>

      {/* Reason */}
      <FL label="Why Did You Miss It?" T={T}>
        <Sel T={T} val={f.reason} opts={MISSED_REASONS} on={v => up("reason", v)} label="Reason missed"/>
      </FL>

      {/* Prices row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
        <FL label="Entry Price" T={T}>
          <Inp T={T} type="number" value={f.entry} onChange={e => up("entry", e.target.value)} label="Entry" placeholder="0.00000"/>
        </FL>
        <FL label="Stop Loss" T={T}>
          <Inp T={T} type="number" value={f.sl} onChange={e => up("sl", e.target.value)} label="Stop Loss" placeholder="0.00000"/>
        </FL>
        <FL label="Take Profit" T={T}>
          <Inp T={T} type="number" value={f.tp} onChange={e => up("tp", e.target.value)} label="Take Profit" placeholder="0.00000"/>
        </FL>
      </div>

      {/* RR + Outcome */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <FL label="Potential RR (auto-calculated)" T={T}>
          <div style={{
            background: T.surface2, border: `1px solid ${T.border}`,
            borderRadius: 10, padding: "10px 14px",
            fontSize: 18, fontWeight: 800, lineHeight: 1.1,
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            color: f.rr ? (rrNum >= 2 ? T.green : rrNum >= 1 ? T.amber : T.textDim) : T.muted,
          }}>
            {f.rr ? `${f.rr}R` : "—"}
            {f.rr && <span style={{ fontSize:11, fontWeight:400, color:T.muted, marginLeft:8 }}>potential</span>}
          </div>
        </FL>
        <FL label="Did It Play Out?" T={T}>
          <Sel T={T} val={f.outcome} opts={OUTCOMES} on={v => up("outcome", v)} label="Outcome"/>
        </FL>
      </div>

      {/* Outcome note */}
      {f.outcome !== "Unknown" && (
        <div style={{
          padding:"10px 14px", borderRadius:10,
          background: f.outcome === "WIN" ? `${T.green}12` : f.outcome === "LOSS" ? `${T.red}12` : `${T.amber}12`,
          border: `1px solid ${f.outcome === "WIN" ? T.green : f.outcome === "LOSS" ? T.red : T.amber}33`,
          fontSize:12, color:T.textDim, lineHeight:1.5,
        }}>
          {f.outcome === "WIN"  && `✅ This setup worked. You left ${f.rr ? `+${f.rr}R` : "potential R"} on the table.`}
          {f.outcome === "LOSS" && "✓ This one didn't work out — your hesitation saved you this time."}
          {f.outcome === "BE"   && "→ Breakeven — neither gained nor lost by missing it."}
        </div>
      )}

      {/* Notes */}
      <FL label="Notes" T={T} full>
        <Textarea
          T={T}
          value={f.notes}
          onChange={e => up("notes", e.target.value)}
          rows={3}
          placeholder="What stopped you? What would you do differently next time?"
        />
      </FL>
    </ModalShell>
  )
}
