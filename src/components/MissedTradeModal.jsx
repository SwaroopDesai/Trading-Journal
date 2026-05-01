"use client"
import { useState } from "react"
import { ModalShell, FL, Inp, Sel, Toggle, Textarea, Btn, MultiImageInput } from "@/components/ui"
import { PAIRS, SETUPS, MISSED_REASONS } from "@/lib/constants"
import { getMissedTradeImages, getMissedTradeNote } from "@/lib/utils"

const OUTCOMES   = ["Unknown","WIN","LOSS","BE"]
const DIRECTIONS = ["LONG","SHORT"]

export default function MissedTradeModal({ T, initial, onSave, onClose, syncing }) {
  const today = new Date().toISOString().split("T")[0]
  const source = initial && initial !== "new" ? initial : null

  const [f, setF] = useState({
    date:      today,
    pair:      PAIRS[0],
    direction: "LONG",
    setup:     SETUPS[0],
    reason:    MISSED_REASONS[0],
    rr:        "",
    outcome:   "Unknown",
    notes:     "",
    screenshots: [],
    ...(source || {}),
    notes: source ? getMissedTradeNote(source) : "",
    screenshots: source ? getMissedTradeImages(source) : [],
  })

  const up = (k, v) => setF(p => ({ ...p, [k]: v }))

  const canSave = f.date && f.pair && f.direction && f.reason

  return (
    <ModalShell
      T={T}
      title={initial?._dbid ? "Edit Missed Trade" : "Log Missed Trade"}
      subtitle="Record a setup you saw but did not take. Add the chart, your reason, and the R you missed."
      onClose={onClose}
      footer={<>
        <Btn onClick={() => onSave(f)} disabled={!canSave || syncing}>
          {syncing ? "Saving..." : "Save"}
        </Btn>
        <Btn ghost onClick={onClose}>Cancel</Btn>
      </>}
    >
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <FL label="Date" T={T}>
          <Inp T={T} type="date" value={f.date} onChange={e => up("date", e.target.value)} label="Date"/>
        </FL>
        <FL label="Pair" T={T}>
          <Sel T={T} val={f.pair} opts={PAIRS} on={v => up("pair", v)} label="Pair"/>
        </FL>
      </div>

      <FL label="Direction" T={T}>
        <Toggle T={T} value={f.direction} opts={DIRECTIONS.map(v => ({ v, l: v }))} onChange={v => up("direction", v)}/>
      </FL>

      <FL label="Setup" T={T}>
        <Sel T={T} val={f.setup} opts={SETUPS} on={v => up("setup", v)} label="Setup"/>
      </FL>

      <FL label="Why Did You Miss It?" T={T}>
        <Sel T={T} val={f.reason} opts={MISSED_REASONS} on={v => up("reason", v)} label="Reason missed"/>
      </FL>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <FL label="Potential RR" T={T}>
          <Inp T={T} type="number" step="0.01" value={f.rr} onChange={e => up("rr", e.target.value)} label="Potential RR" placeholder="2.00"/>
        </FL>
        <FL label="Did It Play Out?" T={T}>
          <Sel T={T} val={f.outcome} opts={OUTCOMES} on={v => up("outcome", v)} label="Outcome"/>
        </FL>
      </div>

      {f.outcome !== "Unknown" && (
        <div style={{
          padding:"10px 14px", borderRadius:10,
          background: f.outcome === "WIN" ? `${T.green}12` : f.outcome === "LOSS" ? `${T.red}12` : `${T.amber}12`,
          border: `1px solid ${f.outcome === "WIN" ? T.green : f.outcome === "LOSS" ? T.red : T.amber}33`,
          fontSize:12, color:T.textDim, lineHeight:1.5,
        }}>
          {f.outcome === "WIN"  && `This setup worked. You left ${f.rr ? `+${f.rr}R` : "potential R"} on the table.`}
          {f.outcome === "LOSS" && "This one did not work out. The skip protected capital."}
          {f.outcome === "BE"   && "Breakeven. Missing it had no meaningful R impact."}
        </div>
      )}

      <FL label="Missed Trade Screenshots" T={T} full>
        <MultiImageInput
          T={T}
          values={f.screenshots}
          onChange={v => up("screenshots", v)}
          label="Missed trade screenshots"
          max={6}
        />
      </FL>

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
