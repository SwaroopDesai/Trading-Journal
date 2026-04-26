"use client"
import { useState } from "react"
import { PAIRS } from "@/lib/constants"

/* ── helpers ─────────────────────────────────────────────────── */
const DOT_PAIRS = [
  "EURUSD","GBPUSD","XAUUSD","NAS100","US30","USDJPY",
  "GBPJPY","AUDUSD","USDCAD","USDCHF","SP500","BTCUSD",
]

const STEPS = [
  { id:"welcome",  label:"Welcome"  },
  { id:"pairs",    label:"Pairs"    },
  { id:"ready",    label:"Ready"    },
]

function Progress({ step, T }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"center", marginBottom:36 }}>
      {STEPS.map((s, i) => {
        const active  = i === step
        const done    = i < step
        return (
          <div key={s.id} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{
              width:  active ? 28 : 8,
              height: 8,
              borderRadius: 999,
              background: done
                ? T.green
                : active
                  ? `linear-gradient(90deg,${T.accentBright},${T.pink})`
                  : T.surface2,
              border: `1px solid ${done ? T.green : active ? "transparent" : T.border}`,
              transition: "all .35s cubic-bezier(.16,1,.3,1)",
            }}/>
            {i < STEPS.length - 1 && (
              <div style={{ width:16, height:1, background:done ? T.green : T.border, opacity:.5, transition:"background .35s" }}/>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Step 1 — Welcome ─────────────────────────────────────────── */
function StepWelcome({ T, onNext }) {
  const perks = [
    { icon:"📊", text:"Pattern Detector — surfaces your edges & leaks automatically" },
    { icon:"📅", text:"Session Planner — set bias, key levels, and notes before the open" },
    { icon:"✨", text:"AI Trade Coach — personalised advice from your own journal data" },
    { icon:"👁", text:"Missed Trade Tracker — find out if fear is costing you R" },
    { icon:"🔥", text:"Heatmap & Analytics — see performance by pair, session, day of week" },
  ]
  return (
    <div style={{ animation:"obFade .5s cubic-bezier(.16,1,.3,1) both" }}>
      {/* Logo */}
      <div style={{
        fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:30, fontWeight:800,
        background:`linear-gradient(135deg,${T.accentBright},${T.pink})`,
        WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        marginBottom:4, letterSpacing:"-0.03em", textAlign:"center",
      }}>FXEDGE</div>
      <div style={{ fontSize:11, color:T.muted, letterSpacing:"0.18em", textAlign:"center", marginBottom:28 }}>ICT / SMC TRADING JOURNAL</div>

      <h2 style={{
        fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:24, fontWeight:800,
        color:T.text, textAlign:"center", marginBottom:8, letterSpacing:"-0.02em",
      }}>Welcome — let&apos;s get you set up 🎯</h2>
      <p style={{ fontSize:13, color:T.textDim, textAlign:"center", lineHeight:1.7, marginBottom:28, maxWidth:400, margin:"0 auto 28px" }}>
        FXEDGE is built for ICT and SMC traders who want more than just a spreadsheet. Here&apos;s what you&apos;ve unlocked:
      </p>

      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:32 }}>
        {perks.map(p => (
          <div key={p.text} style={{
            display:"flex", alignItems:"center", gap:12,
            padding:"10px 14px",
            background:T.surface2, border:`1px solid ${T.border}`,
            borderRadius:12, fontSize:13, color:T.textDim, lineHeight:1.4,
          }}>
            <span style={{ fontSize:18, flexShrink:0 }}>{p.icon}</span>
            <span>{p.text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        style={{
          width:"100%", padding:"14px 0",
          background:`linear-gradient(135deg,${T.accentBright},${T.pink})`,
          border:"none", borderRadius:14, cursor:"pointer",
          fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:15, fontWeight:800,
          color:"#fff", letterSpacing:"0.01em",
          boxShadow:`0 8px 28px ${T.accentBright}50`,
          transition:"opacity .15s, transform .15s",
        }}
        onMouseEnter={e=>{ e.currentTarget.style.opacity=".9"; e.currentTarget.style.transform="scale(1.01)" }}
        onMouseLeave={e=>{ e.currentTarget.style.opacity="1";  e.currentTarget.style.transform="scale(1)" }}
      >
        Let&apos;s set up your workspace →
      </button>
    </div>
  )
}

/* ── Step 2 — Pairs ───────────────────────────────────────────── */
function StepPairs({ T, selected, setSelected, onNext, onBack }) {
  const toggle = (p) =>
    setSelected(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])

  return (
    <div style={{ animation:"obFade .5s cubic-bezier(.16,1,.3,1) both" }}>
      <h2 style={{
        fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:800,
        color:T.text, textAlign:"center", marginBottom:8, letterSpacing:"-0.02em",
      }}>Which pairs do you trade? 📈</h2>
      <p style={{ fontSize:13, color:T.textDim, textAlign:"center", lineHeight:1.6, marginBottom:24 }}>
        Select your instruments — you can change this any time in the app.
      </p>

      <div style={{
        display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:28,
      }}>
        {DOT_PAIRS.map(p => {
          const on = selected.includes(p)
          return (
            <button
              key={p}
              onClick={() => toggle(p)}
              style={{
                padding:"11px 8px",
                background: on ? `${T.accent}20` : T.surface2,
                border:`1px solid ${on ? T.accentBright : T.border}`,
                borderRadius:12, cursor:"pointer",
                fontFamily:"'Plus Jakarta Sans',sans-serif",
                fontSize:12, fontWeight:800,
                color: on ? T.accentBright : T.textDim,
                transition:"all .15s", position:"relative",
              }}
            >
              {on && (
                <span style={{
                  position:"absolute", top:4, right:6,
                  fontSize:9, color:T.accentBright,
                }}>✓</span>
              )}
              {p}
            </button>
          )
        })}
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <button
          onClick={onBack}
          style={{
            flex:"0 0 auto", padding:"13px 18px",
            background:"none", border:`1px solid ${T.border}`,
            color:T.textDim, borderRadius:12, cursor:"pointer",
            fontSize:13, fontFamily:"Inter,sans-serif",
          }}
        >← Back</button>
        <button
          onClick={onNext}
          style={{
            flex:1, padding:"13px 0",
            background:`linear-gradient(135deg,${T.accentBright},${T.pink})`,
            border:"none", borderRadius:12, cursor:"pointer",
            fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, fontWeight:800,
            color:"#fff", boxShadow:`0 6px 20px ${T.accentBright}40`,
            transition:"opacity .15s, transform .15s",
          }}
          onMouseEnter={e=>{ e.currentTarget.style.opacity=".9"; e.currentTarget.style.transform="scale(1.01)" }}
          onMouseLeave={e=>{ e.currentTarget.style.opacity="1";  e.currentTarget.style.transform="scale(1)" }}
        >
          {selected.length === 0 ? "Skip →" : `Confirm ${selected.length} pair${selected.length !== 1 ? "s" : ""} →`}
        </button>
      </div>
    </div>
  )
}

/* ── Step 3 — Ready ───────────────────────────────────────────── */
function StepReady({ T, selectedPairs, onLogTrade, onComplete }) {
  const tips = [
    "Log every trade — even the bad ones. The pattern engine needs at least 10 trades to surface edges.",
    "Fill in your Daily Bias each morning before the session opens. It sharpens your decision-making.",
    "Use Missed Trades to track setups you saw but skipped. After a month, the data speaks for itself.",
    "The AI Coach reads your actual journal — the more you log, the better the coaching.",
  ]
  const [tip] = useState(() => tips[Math.floor(Math.random() * tips.length)])

  return (
    <div style={{ animation:"obFade .5s cubic-bezier(.16,1,.3,1) both", textAlign:"center" }}>
      {/* Celebration */}
      <div style={{
        fontSize:60, marginBottom:16,
        animation:"obBounce 1s cubic-bezier(.16,1,.3,1) both",
        display:"inline-block",
      }}>🚀</div>
      <h2 style={{
        fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:24, fontWeight:800,
        color:T.text, marginBottom:8, letterSpacing:"-0.02em",
      }}>You&apos;re all set!</h2>
      <p style={{ fontSize:13, color:T.textDim, lineHeight:1.7, marginBottom:24, maxWidth:360, margin:"0 auto 24px" }}>
        Your journal is ready. Start by logging your first trade — even a quick one.
      </p>

      {selectedPairs.length > 0 && (
        <div style={{ display:"flex", justifyContent:"center", gap:6, flexWrap:"wrap", marginBottom:24 }}>
          {selectedPairs.map(p => (
            <span key={p} style={{
              fontSize:11, fontWeight:800, color:T.accentBright,
              background:`${T.accent}18`, border:`1px solid ${T.accent}40`,
              padding:"4px 10px", borderRadius:999,
            }}>{p}</span>
          ))}
        </div>
      )}

      {/* Pro tip */}
      <div style={{
        background:`${T.accent}10`, border:`1px solid ${T.accent}30`,
        borderRadius:14, padding:"14px 18px", marginBottom:28,
        fontSize:12, color:T.textDim, lineHeight:1.65, textAlign:"left",
      }}>
        <span style={{ fontWeight:700, color:T.accentBright }}>💡 Pro tip: </span>
        {tip}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <button
          onClick={onLogTrade}
          style={{
            width:"100%", padding:"14px 0",
            background:`linear-gradient(135deg,${T.accentBright},${T.pink})`,
            border:"none", borderRadius:14, cursor:"pointer",
            fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:15, fontWeight:800,
            color:"#fff", boxShadow:`0 8px 28px ${T.accentBright}50`,
            transition:"opacity .15s, transform .15s",
          }}
          onMouseEnter={e=>{ e.currentTarget.style.opacity=".9"; e.currentTarget.style.transform="scale(1.01)" }}
          onMouseLeave={e=>{ e.currentTarget.style.opacity="1";  e.currentTarget.style.transform="scale(1)" }}
        >
          + Log My First Trade
        </button>
        <button
          onClick={onComplete}
          style={{
            width:"100%", padding:"11px 0",
            background:"none", border:`1px solid ${T.border}`,
            color:T.textDim, borderRadius:12, cursor:"pointer",
            fontSize:13, fontFamily:"Inter,sans-serif",
          }}
        >
          Explore the app first
        </button>
      </div>
    </div>
  )
}

/* ── Main export ──────────────────────────────────────────────── */
export default function OnboardingFlow({ T, user, onComplete, onLogTrade }) {
  const [step, setStep] = useState(0)
  const [selectedPairs, setSelectedPairs] = useState([])

  const handleComplete = (openTrade = false) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`fxedge_onboarded_${user.id}`, "1")
    }
    onComplete()
    if (openTrade) onLogTrade()
  }

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9000,
      background:"rgba(0,0,0,0.7)",
      backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:16,
    }}>
      <style>{`
        @keyframes obFade {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes obBounce {
          0%   { opacity:0; transform:scale(.4) translateY(20px); }
          60%  { transform:scale(1.15); }
          80%  { transform:scale(.95); }
          100% { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes obSlideIn {
          from { opacity:0; transform:scale(.94) translateY(24px); }
          to   { opacity:1; transform:scale(1)   translateY(0); }
        }
      `}</style>

      <div style={{
        background:T.surface,
        border:`1px solid ${T.border}`,
        borderRadius:24,
        padding:"32px 32px 28px",
        maxWidth:480, width:"100%",
        boxShadow:`0 40px 100px rgba(0,0,0,.6), 0 0 0 1px ${T.accent}20`,
        animation:"obSlideIn .4s cubic-bezier(.16,1,.3,1) both",
        maxHeight:"90vh", overflowY:"auto",
      }}>
        <Progress step={step} T={T} />

        {step === 0 && (
          <StepWelcome T={T} onNext={() => setStep(1)} />
        )}
        {step === 1 && (
          <StepPairs
            T={T}
            selected={selectedPairs}
            setSelected={setSelectedPairs}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <StepReady
            T={T}
            selectedPairs={selectedPairs}
            onLogTrade={() => handleComplete(true)}
            onComplete={() => handleComplete(false)}
          />
        )}
      </div>
    </div>
  )
}
