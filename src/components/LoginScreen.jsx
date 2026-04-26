"use client"
import { useState } from "react";
import { DARK, LIGHT } from "@/lib/constants";

const FEATURES = [
  { icon:"lucide:search",     title:"Pattern Detection",       desc:"Auto-surfaces your edges and leaks from your trade history. Know exactly where your high-probability setups originate." },
  { icon:"lucide:calendar",   title:"Strategic Planning",      desc:"Set bias, key liquidity levels, and session plans before the open. Architect the day before the market moves." },
  { icon:"lucide:zap",        title:"Economic Radar",          desc:"High-impact events with live countdowns and bank holiday warnings baked directly into your workflow." },
  { icon:"lucide:eye-off",    title:"Missed Trade Tracker",    desc:"Log setups you identified but didn't execute. Quantify the psychological cost of hesitation and over-filtering." },
  { icon:"lucide:bar-chart-3",title:"Advanced Analytics",      desc:"Drawdown charts, session grids, and streak tapes. A comprehensive calendar view of your equity performance." },
  { icon:"lucide:brain-circuit",title:"AI Trade Coach",        desc:"A neural engine that reads your unique journal data to provide personalised coaching based on your real performance." },
]

const STATS = [
  { n:"15+",    label:"Prop Tools" },
  { n:"SMC",    label:"Native Engine" },
  { n:"100%",   label:"Data Sovereignty" },
]

export default function LoginScreen({ supabase }) {
  const [email,   setEmail]   = useState("")
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [dark,    setDark]    = useState(true)

  const send = async () => {
    if (!email) return
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email, options:{ emailRedirectTo: window.location.origin }
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true); setLoading(false)
  }

  const bg      = dark ? "#0a0a0f" : "#f9f8f6"
  const surface = dark ? "#141420" : "#ffffff"
  const border  = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"
  const text     = dark ? "#f9f8f6" : "#1a1a2e"
  const textDim  = dark ? "rgba(249,248,246,0.55)" : "rgba(26,26,46,0.55)"
  const muted    = dark ? "rgba(249,248,246,0.3)" : "rgba(26,26,46,0.3)"
  const accent   = dark ? "#00f5ff" : "#2563eb"
  const pink     = dark ? "#ec4899" : "#db2777"
  const grid     = dark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.04)"

  return (
    <div style={{
      minHeight:"100vh", background:bg, color:text,
      fontFamily:"'Inter',sans-serif",
      backgroundImage:`linear-gradient(to right,${grid} 1px,transparent 1px),linear-gradient(to bottom,${grid} 1px,transparent 1px)`,
      backgroundSize:"80px 80px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}

        @keyframes glow { 0%,100%{opacity:.4;transform:translate(0,0) scale(1)} 50%{opacity:.7;transform:translate(40px,-20px) scale(1.08)} }
        @keyframes glow2 { 0%,100%{opacity:.3;transform:translate(0,0) scale(1)} 50%{opacity:.6;transform:translate(-30px,15px) scale(1.05)} }
        @keyframes heroIn { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { from{left:-100%} to{left:100%} }

        /* Gradient text — must live in a CSS class, NOT inline styles, for -webkit-background-clip to work cross-browser */
        .grad-text {
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent;
          display: inline;
        }

        .feat-item:hover { background:${dark?"rgba(255,255,255,.025)":"rgba(0,0,0,.03)"} !important; }
        .feat-item:hover .feat-icon-box { border-color:${accent} !important; }
        .feat-item { transition:background .25s; }
        .feat-icon-box { transition:border-color .25s; }

        .cta-btn { position:relative; overflow:hidden; transition:opacity .15s, transform .15s; }
        .cta-btn:hover { opacity:.9; transform:scale(1.015); }
        .cta-btn::after { content:''; position:absolute; top:0; left:-100%; width:100%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);
          transition:.55s; }
        .cta-btn:hover::after { left:100%; }

        .stat-pill { border-left:1px solid ${border}; padding-left:22px; }

        .hud-tl,.hud-tr,.hud-bl,.hud-br { position:absolute; width:12px; height:12px; border-color:${accent}; opacity:.45; }
        .hud-tl { top:10px; left:10px; border-top:1.5px solid; border-left:1.5px solid; }
        .hud-tr { top:10px; right:10px; border-top:1.5px solid; border-right:1.5px solid; }
        .hud-bl { bottom:10px; left:10px; border-bottom:1.5px solid; border-left:1.5px solid; }
        .hud-br { bottom:10px; right:10px; border-bottom:1.5px solid; border-right:1.5px solid; }

        .email-input { border-bottom:1px solid ${border}; background:transparent; color:${text};
          font-family:'Inter',sans-serif; font-size:14px; padding:14px 4px; outline:none; width:100%;
          transition:border-color .2s; }
        .email-input:focus { border-color:${accent}; }
        .email-input::placeholder { color:${muted}; font-style:italic; }

        @media(max-width:900px){
          .hero-grid { flex-direction:column !important; }
          .signin-card { max-width:100% !important; }
          .features-grid { grid-template-columns:1fr !important; }
          .hero-h1 { font-size:52px !important; }
        }
        @media(max-width:600px){
          .hero-h1 { font-size:38px !important; }
          .hero-pad { padding:100px 20px 60px !important; }
          .section-pad { padding:60px 20px !important; }
          .stats-row { gap:16px !important; flex-wrap:wrap; }
        }
      `}</style>

      {/* ── Glow orbs ── */}
      <div aria-hidden style={{ position:"fixed", top:"-10%", left:"-5%", width:600, height:600, borderRadius:"50%", background:`radial-gradient(circle,${accent}18 0%,transparent 70%)`, filter:"blur(80px)", animation:"glow 9s ease-in-out infinite", pointerEvents:"none", zIndex:0 }}/>
      <div aria-hidden style={{ position:"fixed", bottom:"-10%", right:"-5%", width:500, height:500, borderRadius:"50%", background:`radial-gradient(circle,${pink}14 0%,transparent 70%)`, filter:"blur(80px)", animation:"glow2 12s ease-in-out infinite", pointerEvents:"none", zIndex:0 }}/>

      {/* ── Nav ── */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:50,
        borderBottom:`1px solid ${border}`,
        background:dark ? "rgba(10,10,15,.85)" : "rgba(249,248,246,.9)",
        backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)",
        padding:"0 48px", height:72,
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div className="grad-text" style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, letterSpacing:"-0.03em", background:`linear-gradient(135deg,${accent},${pink})` }}>
          FXEDGE
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:24 }}>
          <span style={{ fontSize:10, color:muted, letterSpacing:"0.3em", textTransform:"uppercase", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:accent, display:"inline-block", boxShadow:`0 0 8px ${accent}` }}/>
            Live Edge
          </span>
          <button onClick={() => setDark(!dark)} style={{
            background:"none", border:`1px solid ${border}`,
            color:textDim, padding:"5px 14px",
            cursor:"pointer", fontSize:11, fontFamily:"Inter,sans-serif",
          }}>{dark ? "☀ Light" : "🌙 Dark"}</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-pad" style={{ position:"relative", zIndex:1, padding:"120px 64px 80px", maxWidth:1280, margin:"0 auto" }}>
        <div style={{ animation:"heroIn .6s cubic-bezier(.16,1,.3,1) both" }}>

          {/* Badge */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:8,
            border:`1px solid ${accent}40`, background:`${accent}08`,
            padding:"6px 18px", marginBottom:32,
            fontSize:10, fontWeight:700, color:accent, letterSpacing:"0.28em", textTransform:"uppercase",
          }}>
            <span style={{ width:5, height:5, background:accent, display:"inline-block" }}/>
            Institutional Grade Journaling
          </div>

          {/* Main layout: headline left, form right */}
          <div className="hero-grid" style={{ display:"flex", alignItems:"flex-end", gap:80, flexWrap:"nowrap" }}>

            {/* Left column */}
            <div style={{ flex:1, minWidth:0 }}>
              <h1 className="hero-h1" style={{
                fontFamily:"'Playfair Display',serif",
                fontSize:72, fontWeight:900, lineHeight:0.88,
                letterSpacing:"-0.04em", marginBottom:28,
                color:text,
              }}>
                The journal<br/>
                <span className="grad-text" style={{ background:`linear-gradient(135deg,${accent},${pink})` }}>
                  around your edge.
                </span>
              </h1>

              <p style={{ fontSize:16, color:textDim, lineHeight:1.75, maxWidth:480, marginBottom:44, fontStyle:"italic", fontFamily:"'Playfair Display',serif", fontWeight:400 }}>
                Transcending simple trade logging. A surgical environment for ICT and SMC practitioners to dissect, analyse, and refine every execution.
              </p>

              {/* Stats */}
              <div className="stats-row" style={{ display:"flex", gap:32, alignItems:"flex-start" }}>
                {STATS.map(s => (
                  <div key={s.label} className="stat-pill">
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, color:text, marginBottom:4 }}>{s.n}</div>
                    <div style={{ fontSize:9, color:muted, letterSpacing:"0.25em", textTransform:"uppercase", fontWeight:700 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column — sign-in card */}
            <div className="signin-card" style={{ flexShrink:0, width:380, position:"relative" }}>
              <div className="hud-tl"/><div className="hud-tr"/><div className="hud-bl"/><div className="hud-br"/>
              <div style={{
                background:surface,
                border:`1px solid ${border}`,
                padding:"40px 36px",
                animation:"heroIn .7s .15s cubic-bezier(.16,1,.3,1) both",
              }}>
                {!sent ? (<>
                  <div style={{ fontSize:14, fontWeight:700, color:text, marginBottom:4, letterSpacing:"0.01em" }}>Secure Access</div>
                  <div style={{ fontSize:10, color:muted, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:28 }}>Passwordless magic link authentication</div>

                  <input
                    className="email-input"
                    type="email"
                    placeholder="Professional email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && send()}
                  />

                  <button
                    className="cta-btn"
                    onClick={send}
                    disabled={loading}
                    style={{
                      marginTop:20, width:"100%", padding:"16px 0",
                      background: loading ? muted : `linear-gradient(135deg,${accent},${pink})`,
                      border:"none", cursor: loading ? "not-allowed" : "pointer",
                      fontFamily:"Inter,sans-serif", fontSize:11,
                      fontWeight:700, letterSpacing:"0.22em", textTransform:"uppercase",
                      color: dark ? "#0a0a0f" : "#fff",
                    }}
                  >
                    {loading ? "Sending…" : "Request Magic Link"}
                  </button>

                  {error && <div style={{ fontSize:11, color:"#f87171", marginTop:10, letterSpacing:"0.02em" }}>{error}</div>}

                  <div style={{ marginTop:18, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    <span style={{ fontSize:10, color:muted, letterSpacing:"0.18em", textTransform:"uppercase" }}>End-to-end encrypted · Your data stays yours</span>
                  </div>
                </>) : (
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:40, marginBottom:14 }}>📬</div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700, color:text, marginBottom:6 }}>Check your inbox</div>
                    <div style={{ fontSize:12, color:textDim, lineHeight:1.6 }}>
                      Magic link sent to <strong style={{ color:accent }}>{email}</strong>.<br/>Click it to open your journal.
                    </div>
                    <button onClick={() => setSent(false)} style={{ marginTop:18, background:"none", border:`1px solid ${border}`, color:textDim, padding:"8px 20px", cursor:"pointer", fontSize:11, letterSpacing:"0.1em" }}>
                      Use different email
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section-pad" style={{ position:"relative", zIndex:1, padding:"80px 64px", maxWidth:1280, margin:"0 auto" }}>
        {/* Section header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:56, flexWrap:"wrap", gap:16 }}>
          <div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:40, fontWeight:900, color:text, letterSpacing:"-0.03em", marginBottom:8 }}>
              Infrastructure
            </h2>
            <div style={{ fontSize:10, color:muted, letterSpacing:"0.28em", textTransform:"uppercase", fontWeight:700 }}>Optimised for professional tape reading</div>
          </div>
          <p style={{ fontSize:13, color:textDim, fontStyle:"italic", fontFamily:"'Playfair Display',serif", maxWidth:320, lineHeight:1.7 }}>
            Built by traders who understand the necessity of precision and the cost of hesitation.
          </p>
        </div>

        {/* Grid with gap-px separator aesthetic */}
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(3,1fr)",
          background:border, border:`1px solid ${border}`,
          gap:"1px",
        }} className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="feat-item" style={{
              background:surface,
              padding:"40px 36px",
              display:"flex", flexDirection:"column", gap:24,
            }}>
              {/* Icon box */}
              <div className="feat-icon-box" style={{
                width:44, height:44,
                border:`1px solid ${i % 2 === 0 ? accent : pink}30`,
                display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0,
              }}>
                <img
                  src={`https://api.iconify.design/${f.icon.replace(":","/")}.svg?color=${encodeURIComponent(i % 2 === 0 ? accent : pink)}`}
                  width={20} height={20} alt="" aria-hidden
                  onError={e => { e.currentTarget.style.display="none" }}
                />
              </div>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:800, color:text, marginBottom:10, letterSpacing:"-0.01em" }}>{f.title}</div>
                <div style={{ fontSize:12, color:textDim, lineHeight:1.7, fontWeight:300 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ position:"relative", zIndex:1, borderTop:`1px solid ${border}`, padding:"48px 64px 32px" }}>
        <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:20 }}>
          <div>
            <div className="grad-text" style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, background:`linear-gradient(135deg,${accent},${pink})`, marginBottom:6 }}>FXEDGE</div>
            <div style={{ fontSize:10, color:muted, letterSpacing:"0.2em", textTransform:"uppercase" }}>Trading Journal · ICT / SMC · Data sovereignty</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:6, height:6, background:"#22c55e", display:"inline-block" }}/>
            <span style={{ fontSize:10, color:muted, letterSpacing:"0.18em", textTransform:"uppercase" }}>All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
