"use client"
import { useState } from "react";

/* ── Data ─────────────────────────────────────────────────────────── */
const BRANDS = [
  "TRADINGVIEW","MYFXBOOK","FTMO","THE5ERS","APEX","TRADEDAY",
  "IC MARKETS","PEPPERSTONE","FUNDED TRADER","CTRADER","FOREXLIVE","DXTRADE",
]

const FEATURES = [
  { icon:"🔍", title:"Pattern Detection",    desc:"Auto-surfaces your statistical edges and leaks from your trade history after just 10 executions." },
  { icon:"📅", title:"Session Planning",     desc:"Set daily bias, key levels, and expected manipulation zones before the open. Build the day first." },
  { icon:"📰", title:"Economic Calendar",    desc:"High-impact events with live countdown timers, Supabase cache fallback, and bank holiday warnings." },
  { icon:"✨", title:"AI Trade Coach",       desc:"Reads your actual journal entries — not generic advice. Personalised coaching from your own data." },
  { icon:"👁",  title:"Missed Trade Tracker",desc:"Log setups you saw but skipped. Quantify the real cost of hesitation and over-filtering over time." },
  { icon:"🔥", title:"Heatmap & Analytics", desc:"Day-of-week grid, session breakdown, streak tape, drawdown chart — all inside one clean view." },
]

const STEPS = [
  { n:"01", title:"Log Every Trade",       desc:"Capture pair, direction, RR, session, setup type, and screenshots. Under 30 seconds per trade.", dot:"#b7c6c2" },
  { n:"02", title:"Discover Your Edge",    desc:"After 10 trades, the pattern engine fires — surfacing exactly what wins for you and what doesn't.", dot:"#ffe17c" },
  { n:"03", title:"Refine & Compound",     desc:"Let the AI coach act on your patterns. Fix the leaks. Double down on what the data confirms.", dot:"#ffffff" },
]

const PERSONAS = [
  {
    badge:"Part-Time Trader", bg:"#b7c6c2", color:"#000",
    title:"Journal around your day job",
    desc:"Log fast. Review on weekends. The pattern engine keeps working even on 20 trades a month.",
    points:["30-second trade entry","Weekend review digest","Mobile-first layout"],
  },
  {
    badge:"Full-Time Trader", bg:"#ffe17c", color:"#000", featured:true,
    title:"Build a professional edge",
    desc:"Session planning, missed-trade tracking, and AI coaching — every tool a serious trader needs.",
    points:["Daily bias planner","Pattern detector","AI Trade Coach"],
  },
  {
    badge:"Funded Trader", bg:"#272727", color:"#fff",
    title:"Stay funded. Stay consistent.",
    desc:"Drawdown alerts, streak monitoring, and psychology tracking to protect your funded account.",
    points:["Max drawdown tracker","Streak tape & alerts","Psychology journal"],
  },
]

const TESTIMONIALS = [
  { stars:5, quote:"The pattern detector found that I'm profitable on Gold during London but losing during NY. Completely restructured my schedule.", name:"Marcus T.", role:"Full-Time Trader · XAUUSD" },
  { stars:5, quote:"I was over-filtering. Missed Trades showed me I was skipping 60% win-rate setups out of fear. That data hit different.", name:"Priya S.", role:"Funded Trader · NAS100" },
  { stars:5, quote:"Every other journal made me feel like I was filling out a tax form. FXEDGE actually gives me something back from my data.", name:"Jordan K.", role:"Part-Time Trader · GBPUSD" },
]

/* ── Fake browser-mockup dashboard ────────────────────────────────── */
function BrowserMockup() {
  const bars = [40, 65, 30, 80, 55, 90, 45, 70, 85, 60]
  return (
    <div style={{ background:"#fff", border:"2px solid #000", borderRadius:16, boxShadow:"12px 12px 0px 0px #000", overflow:"hidden", width:"100%", maxWidth:520 }}>
      {/* Browser chrome */}
      <div style={{ background:"#000", padding:"10px 16px", display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ width:12,height:12,borderRadius:"50%",background:"#ff5f57",display:"inline-block" }}/>
        <span style={{ width:12,height:12,borderRadius:"50%",background:"#febc2e",display:"inline-block" }}/>
        <span style={{ width:12,height:12,borderRadius:"50%",background:"#28c840",display:"inline-block" }}/>
        <div style={{ flex:1, background:"#1a1a1a", borderRadius:4, height:22, marginLeft:12, display:"flex", alignItems:"center", paddingLeft:10 }}>
          <span style={{ fontSize:11, color:"#555", fontFamily:"monospace" }}>fxedge.app/dashboard</span>
        </div>
      </div>
      {/* Dashboard */}
      <div style={{ padding:16, background:"#f9f9f9" }}>
        {/* KPI row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
          {[
            { label:"Total R", val:"+42.5R", color:"#000" },
            { label:"Win Rate", val:"67%", color:"#000" },
            { label:"Best Pair", val:"XAUUSD", color:"#000" },
          ].map(k => (
            <div key={k.label} style={{ background:"#fff", border:"2px solid #000", padding:"10px 10px 8px", borderRadius:8 }}>
              <div style={{ fontSize:9, fontWeight:700, color:"#666", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>{k.label}</div>
              <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:16, fontWeight:800, color:k.color }}>{k.val}</div>
            </div>
          ))}
        </div>
        {/* Mini equity chart */}
        <div style={{ background:"#fff", border:"2px solid #000", borderRadius:8, padding:"10px 12px", marginBottom:12 }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#000", marginBottom:8, fontFamily:"'Cabinet Grotesk',sans-serif" }}>Equity Curve</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:48 }}>
            {bars.map((h,i) => (
              <div key={i} style={{ flex:1, height:`${h}%`, background: i === bars.length-1 ? "#ffe17c" : "#b7c6c2", border:"1px solid #000", borderRadius:2 }}/>
            ))}
          </div>
        </div>
        {/* Trades list */}
        <div style={{ background:"#fff", border:"2px solid #000", borderRadius:8, overflow:"hidden" }}>
          <div style={{ borderBottom:"2px solid #000", padding:"6px 10px", display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#000" }}>Recent Trades</span>
          </div>
          {[
            { pair:"XAUUSD", dir:"LONG",  rr:"+3.2R", win:true },
            { pair:"NAS100", dir:"SHORT", rr:"+1.8R", win:true },
            { pair:"GBPUSD", dir:"LONG",  rr:"-1.0R", win:false },
          ].map((t,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", borderBottom: i<2 ? "1px solid #e5e5e5":"none" }}>
              <span style={{ fontSize:10, fontWeight:700, color:"#000", minWidth:52, fontFamily:"monospace" }}>{t.pair}</span>
              <span style={{ fontSize:9, fontWeight:700, padding:"2px 6px", border:"1px solid #000", borderRadius:3, background: t.dir==="LONG" ? "#b7c6c2":"#ffe17c", color:"#000" }}>{t.dir}</span>
              <span style={{ marginLeft:"auto", fontSize:11, fontWeight:700, fontFamily:"monospace", color: t.win?"#000":"#cc0000" }}>{t.rr}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Main component ────────────────────────────────────────────────── */
export default function LoginScreen({ supabase }) {
  const [email,   setEmail]   = useState("")
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const send = async () => {
    if (!email) return
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email, options:{ emailRedirectTo: window.location.origin }
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true); setLoading(false)
  }

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior:"smooth" })

  const css = `
    @import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800&f[]=satoshi@400,500,700&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

    body { font-family:'Satoshi',sans-serif; }

    /* ── Dot pattern overlay on yellow sections ── */
    .dot-bg {
      position:relative;
    }
    .dot-bg::before {
      content:'';
      position:absolute; inset:0; pointer-events:none; z-index:0;
      background-image: radial-gradient(circle, rgba(0,0,0,0.12) 1.5px, transparent 1.5px);
      background-size: 32px 32px;
    }
    .dot-bg > * { position:relative; z-index:1; }

    /* ── Push buttons ── */
    .neo-btn-primary {
      display:inline-flex; align-items:center; justify-content:center; gap:8px;
      background:#000; color:#fff; border:2px solid #000; border-radius:8px;
      padding:14px 28px; font-family:'Satoshi',sans-serif; font-size:15px; font-weight:700;
      box-shadow:8px 8px 0px 0px #000;
      transition:transform .15s cubic-bezier(.175,.885,.32,1.275), box-shadow .15s;
      cursor:pointer; text-decoration:none; white-space:nowrap;
    }
    .neo-btn-primary:hover { transform:translate(4px,4px); box-shadow:4px 4px 0px 0px #000; }
    .neo-btn-primary:active { transform:translate(8px,8px); box-shadow:none; }

    .neo-btn-secondary {
      display:inline-flex; align-items:center; justify-content:center; gap:8px;
      background:#fff; color:#000; border:2px solid #000; border-radius:8px;
      padding:14px 28px; font-family:'Satoshi',sans-serif; font-size:15px; font-weight:700;
      box-shadow:4px 4px 0px 0px #000;
      transition:transform .15s cubic-bezier(.175,.885,.32,1.275), box-shadow .15s;
      cursor:pointer; text-decoration:none; white-space:nowrap;
    }
    .neo-btn-secondary:hover { transform:translate(4px,4px); box-shadow:none; }

    .neo-btn-yellow {
      display:inline-flex; align-items:center; justify-content:center; gap:8px;
      background:#ffe17c; color:#000; border:2px solid #ffe17c; border-radius:8px;
      padding:14px 28px; font-family:'Satoshi',sans-serif; font-size:15px; font-weight:700;
      box-shadow:4px 4px 0px 0px #ffe17c;
      transition:transform .15s cubic-bezier(.175,.885,.32,1.275), box-shadow .15s;
      cursor:pointer; text-decoration:none; white-space:nowrap;
    }
    .neo-btn-yellow:hover { transform:translate(4px,4px); box-shadow:none; }

    /* ── Marquee ── */
    @keyframes marquee {
      from { transform:translateX(0); }
      to   { transform:translateX(-50%); }
    }
    .marquee-track { display:flex; animation:marquee 28s linear infinite; width:max-content; }
    .marquee-track:hover { animation-play-state:paused; }

    /* ── Feature cards ── */
    .feat-card {
      background:#fff; border:2px solid #000; padding:28px 24px;
      box-shadow:4px 4px 0px 0px #000;
      transition:transform .15s, box-shadow .15s;
    }
    .feat-card:hover { transform:translate(-2px,-2px); box-shadow:6px 6px 0px 0px #000; }
    .feat-card .feat-icon {
      width:52px; height:52px; background:#b7c6c2; border:2px solid #000;
      display:flex; align-items:center; justify-content:center; font-size:22px;
      transition:background .15s; margin-bottom:18px; border-radius:4px;
    }
    .feat-card:hover .feat-icon { background:#ffe17c; }

    /* ── Persona cards ── */
    .persona-card {
      border:2px solid #000; padding:32px 28px;
      transition:transform .15s, box-shadow .15s;
    }
    .persona-card.featured { box-shadow:8px 8px 0px 0px #000; }
    .persona-card.featured:hover { transform:translate(-4px,-4px); box-shadow:12px 12px 0px 0px #000; }

    /* ── Testimonial cards — asymmetric corners ── */
    .testi-card {
      background:#fff; border:2px solid #000; padding:28px 24px;
      border-radius:2px 48px 2px 48px;
      box-shadow:4px 4px 0px 0px #000;
      transition:transform .15s, box-shadow .15s;
    }
    .testi-card:hover { transform:translate(-2px,-2px); box-shadow:6px 6px 0px 0px #000; }

    /* ── Sign-in input ── */
    .neo-input {
      width:100%; padding:14px 16px; border:2px solid #000; border-radius:8px;
      font-family:'Satoshi',sans-serif; font-size:15px; font-weight:500;
      background:#fff; color:#000; outline:none;
      transition:box-shadow .15s;
    }
    .neo-input:focus { box-shadow:4px 4px 0px 0px #000; }
    .neo-input::placeholder { color:#aaa; }

    /* ── Nav link ── */
    .nav-link {
      font-family:'Satoshi',sans-serif; font-weight:700; font-size:14px;
      color:#000; text-decoration:none; letter-spacing:0.01em;
      padding:6px 2px; border-bottom:2px solid transparent;
      transition:border-color .15s;
    }
    .nav-link:hover { border-bottom-color:#000; }

    /* ── Social icons ── */
    .social-icon {
      width:40px; height:40px; background:#272727; border:1px solid #3a3a3a;
      display:flex; align-items:center; justify-content:center;
      transition:background .15s, border-color .15s; cursor:pointer;
      text-decoration:none;
    }
    .social-icon:hover { background:#ffe17c; border-color:#000; }
    .social-icon:hover svg { stroke:#000; }

    /* ── Responsive ── */
    @media(max-width:1024px){
      .hero-grid { grid-template-columns:1fr !important; }
      .mockup-col { display:none !important; }
      .feat-grid { grid-template-columns:1fr 1fr !important; }
      .persona-grid { grid-template-columns:1fr !important; }
    }
    @media(max-width:640px){
      .hero-h1 { font-size:52px !important; }
      .section-px { padding-left:20px !important; padding-right:20px !important; }
      .feat-grid { grid-template-columns:1fr !important; }
      .testi-grid { grid-template-columns:1fr !important; }
      .footer-grid { grid-template-columns:1fr 1fr !important; }
      .step-line { display:none !important; }
      .steps-row { flex-direction:column !important; gap:32px !important; }
    }
  `

  return (
    <div style={{ fontFamily:"'Satoshi',sans-serif", background:"#fff", color:"#000" }}>
      <style>{css}</style>

      {/* ══════════════════════════════ NAV ══════════════════════════════ */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        background:"#ffe17c", borderBottom:"2px solid #000",
        height:72, padding:"0 40px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{
            width:36, height:36, background:"#000", border:"2px solid #000",
            display:"flex", alignItems:"center", justifyContent:"center", borderRadius:4,
          }}>
            <span style={{ fontSize:18, lineHeight:1 }}>⚡</span>
          </div>
          <span style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:20, letterSpacing:"-0.04em" }}>
            FXEDGE
          </span>
        </div>

        {/* Center links */}
        <div style={{ display:"flex", gap:32 }}>
          {["Features","How It Works","Testimonials"].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g,"-")}`} className="nav-link"
              onClick={e => { e.preventDefault(); scrollTo(l.toLowerCase().replace(/ /g,"-")) }}>{l}</a>
          ))}
        </div>

        {/* CTA */}
        <button className="neo-btn-primary" style={{ padding:"10px 20px", fontSize:13, boxShadow:"4px 4px 0px 0px #000" }}
          onClick={() => scrollTo("signin")}>
          Start Free →
        </button>
      </nav>

      {/* ══════════════════════════════ HERO ══════════════════════════════ */}
      <section className="dot-bg section-px" style={{
        background:"#ffe17c", paddingTop:120, paddingBottom:80,
        paddingLeft:40, paddingRight:40, borderBottom:"2px solid #000",
      }}>
        <div className="hero-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"center", maxWidth:1280, margin:"0 auto" }}>

          {/* Left column */}
          <div>
            {/* Badge */}
            <div style={{
              display:"inline-flex", alignItems:"center", gap:8,
              background:"#fff", border:"2px solid #000", borderRadius:999,
              padding:"6px 16px", marginBottom:32,
              fontSize:12, fontWeight:700, letterSpacing:"0.04em",
            }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#000", display:"inline-block" }}/>
              NEW: Pattern Detector 2.0
            </div>

            {/* Headline */}
            <h1 className="hero-h1" style={{
              fontFamily:"'Cabinet Grotesk',sans-serif",
              fontSize:72, fontWeight:800, lineHeight:0.92,
              letterSpacing:"-0.04em", marginBottom:24, color:"#000",
            }}>
              The journal<br/>
              built around<br/>
              your{" "}
              <span style={{ WebkitTextStroke:"2px #000", color:"transparent" }}>edge.</span>
            </h1>

            <p style={{ fontSize:17, color:"#171e19", lineHeight:1.7, maxWidth:440, marginBottom:36, fontWeight:500 }}>
              Log trades, detect patterns, plan sessions, and get AI coaching — all in one app
              built specifically for ICT and SMC traders.
            </p>

            {/* CTA group */}
            <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
              <button className="neo-btn-primary" onClick={() => scrollTo("signin")}>
                Start Free — No card required
              </button>
              <button className="neo-btn-secondary" onClick={() => scrollTo("features")}>
                See Features ↓
              </button>
            </div>

            {/* Social proof micro */}
            <div style={{ marginTop:28, display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ display:"flex" }}>
                {["🧑","👩","🧑‍💼","👨‍💻"].map((e,i) => (
                  <div key={i} style={{ width:28,height:28,borderRadius:"50%",background:"#171e19",border:"2px solid #ffe17c",marginLeft:i?-8:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13 }}>{e}</div>
                ))}
              </div>
              <span style={{ fontSize:13, fontWeight:500, color:"#171e19" }}>
                Trusted by <strong>2,400+</strong> active traders
              </span>
            </div>
          </div>

          {/* Right column — browser mockup */}
          <div className="mockup-col" style={{ display:"flex", justifyContent:"flex-end" }}>
            <BrowserMockup/>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ MARQUEE ══════════════════════════ */}
      <div style={{ background:"#171e19", borderBottom:"2px solid #000", padding:"18px 0", overflow:"hidden" }}>
        <div className="marquee-track">
          {[...BRANDS, ...BRANDS].map((b, i) => (
            <span key={i} style={{
              fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:700, fontSize:15,
              color:"#b7c6c2", opacity:0.55, letterSpacing:"0.12em", textTransform:"uppercase",
              marginRight:64, whiteSpace:"nowrap",
            }}>
              {b}
              <span style={{ marginLeft:64, color:"#b7c6c2", opacity:.3 }}>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════ PROBLEM / SOLUTION ═══════════════ */}
      <section className="section-px" style={{ background:"#fff", padding:"80px 40px", borderBottom:"2px solid #000" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <p style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:700, fontSize:12, letterSpacing:"0.2em", textTransform:"uppercase", color:"#999", marginBottom:12 }}>The problem</p>
          <h2 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:42, letterSpacing:"-0.04em", marginBottom:48, lineHeight:1.05 }}>
            Most journals take. FXEDGE gives back.
          </h2>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
            {/* Problem card */}
            <div style={{
              background:"#f4f4f5", border:"2px dashed #ccc", padding:"36px 32px",
              opacity:.75, borderRadius:4,
            }}>
              <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:22, marginBottom:24, color:"#000" }}>❌ Before FXEDGE</div>
              {[
                "Spreadsheet of doom — no insight, just data",
                "No idea why you win or lose on specific pairs",
                "Journaling feels like a chore with zero return",
                "You know you over-filter but have no proof",
                "Generic AI advice that ignores your actual trades",
              ].map(t => (
                <div key={t} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:14, fontSize:14, fontWeight:500, color:"#444" }}>
                  <span style={{ flexShrink:0, marginTop:1, color:"#cc0000", fontWeight:700 }}>✕</span>
                  {t}
                </div>
              ))}
            </div>

            {/* Solution card */}
            <div style={{
              background:"#ffe17c", border:"2px solid #000", padding:"36px 32px",
              boxShadow:"8px 8px 0px 0px #000", borderRadius:4,
            }}>
              <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:22, marginBottom:24, color:"#000" }}>✅ With FXEDGE</div>
              {[
                "Pattern engine surfaces your real edge automatically",
                "Know your win rate by pair, session, and day of week",
                "30-second entries that generate actionable data",
                "Missed Trade Tracker proves (or disproves) hesitation",
                "AI coach reads your journal — actual personalised advice",
              ].map(t => (
                <div key={t} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:14, fontSize:14, fontWeight:500, color:"#000" }}>
                  <span style={{ flexShrink:0, marginTop:1, color:"#000", fontWeight:700 }}>✓</span>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ FEATURES ══════════════════════════ */}
      <section id="features" className="dot-bg section-px" style={{ background:"#ffe17c", padding:"80px 40px", borderBottom:"2px solid #000" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <p style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:700, fontSize:12, letterSpacing:"0.2em", textTransform:"uppercase", color:"#000", opacity:.5, marginBottom:12 }}>Everything you need</p>
          <h2 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:42, letterSpacing:"-0.04em", marginBottom:48, lineHeight:1.05 }}>
            Not just a trade logger.
          </h2>
          <div className="feat-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {FEATURES.map(f => (
              <div key={f.title} className="feat-card">
                <div className="feat-icon">{f.icon}</div>
                <h3 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:20, letterSpacing:"-0.03em", marginBottom:10 }}>{f.title}</h3>
                <p style={{ fontSize:14, color:"#444", lineHeight:1.65, fontWeight:500 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ HOW IT WORKS ══════════════════════ */}
      <section id="how-it-works" style={{ background:"#171e19", padding:"80px 40px", borderBottom:"2px solid #000" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <p style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:700, fontSize:12, letterSpacing:"0.2em", textTransform:"uppercase", color:"#b7c6c2", opacity:.6, marginBottom:12 }}>Simple process</p>
          <h2 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:42, letterSpacing:"-0.04em", color:"#fff", marginBottom:64, lineHeight:1.05 }}>
            Your edge in 3 steps.
          </h2>

          <div className="steps-row" style={{ display:"flex", alignItems:"flex-start", gap:0 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} style={{ display:"flex", alignItems:"flex-start", flex:1 }}>
                <div style={{ flex:1 }}>
                  {/* Step circle */}
                  <div style={{
                    width:60, height:60, borderRadius:"50%",
                    border:`4px solid ${s.dot}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:18, color:s.dot,
                    marginBottom:24, background:"#171e19",
                  }}>
                    {s.n}
                  </div>
                  <h3 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:22, color:"#fff", marginBottom:12, letterSpacing:"-0.02em" }}>{s.title}</h3>
                  <p style={{ fontSize:14, color:"#b7c6c2", lineHeight:1.65, fontWeight:500, maxWidth:280 }}>{s.desc}</p>
                </div>
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="step-line" style={{ flex:"0 0 40px", height:4, background:"#272727", marginTop:28, borderRadius:2 }}/>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ PERSONAS ══════════════════════════ */}
      <section style={{ background:"#fff", padding:"80px 40px", borderBottom:"2px solid #000" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <p style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:700, fontSize:12, letterSpacing:"0.2em", textTransform:"uppercase", color:"#999", marginBottom:12 }}>Built for you</p>
          <h2 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:42, letterSpacing:"-0.04em", marginBottom:48, lineHeight:1.05 }}>
            Whatever your setup.
          </h2>
          <div className="persona-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {PERSONAS.map(p => (
              <div key={p.badge} className={`persona-card${p.featured?" featured":""}`} style={{ background:p.bg, color:p.color }}>
                {/* Badge */}
                <div style={{
                  display:"inline-flex", background:"#fff", color:"#000",
                  border:"2px solid #000", borderRadius:999,
                  padding:"4px 14px", fontSize:11, fontWeight:700,
                  letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:24,
                }}>
                  {p.badge}
                </div>
                <h3 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:22, letterSpacing:"-0.03em", marginBottom:14, lineHeight:1.1 }}>{p.title}</h3>
                <p style={{ fontSize:14, opacity:.75, lineHeight:1.65, fontWeight:500, marginBottom:24 }}>{p.desc}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {p.points.map(pt => (
                    <div key={pt} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, fontWeight:700 }}>
                      <span style={{
                        width:22, height:22, borderRadius:"50%",
                        background: p.color==="#fff" ? "rgba(255,255,255,.15)" : "rgba(0,0,0,.08)",
                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, flexShrink:0,
                      }}>✓</span>
                      {pt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ TESTIMONIALS ══════════════════════ */}
      <section id="testimonials" style={{ background:"#b7c6c2", padding:"80px 40px", borderBottom:"2px solid #000" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <p style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:700, fontSize:12, letterSpacing:"0.2em", textTransform:"uppercase", color:"#000", opacity:.5, marginBottom:12 }}>Social proof</p>
          <h2 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:42, letterSpacing:"-0.04em", marginBottom:48, lineHeight:1.05 }}>
            Traders love the data.
          </h2>
          <div className="testi-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="testi-card">
                {/* Stars */}
                <div style={{ display:"flex", gap:3, marginBottom:16 }}>
                  {Array(t.stars).fill(0).map((_,i) => (
                    <span key={i} style={{ color:"#ffbc2e", fontSize:18, lineHeight:1 }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize:14, lineHeight:1.7, fontWeight:500, color:"#000", marginBottom:20, fontStyle:"italic" }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:15, color:"#000" }}>{t.name}</div>
                  <div style={{ fontSize:12, color:"#444", fontWeight:500, marginTop:2 }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ FINAL CTA / SIGN IN ═══════════════ */}
      <section id="signin" className="dot-bg section-px" style={{ background:"#ffe17c", padding:"96px 40px", borderBottom:"2px solid #000" }}>
        <div style={{ maxWidth:640, margin:"0 auto", textAlign:"center" }}>
          <h2 style={{
            fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800,
            fontSize:52, letterSpacing:"-0.04em", lineHeight:0.95, marginBottom:16, color:"#000",
          }}>
            Start tracking your edge today.
          </h2>
          <p style={{ fontSize:16, color:"#171e19", lineHeight:1.7, fontWeight:500, marginBottom:40 }}>
            No credit card. No setup. Just your email — you&apos;ll get a magic link and you&apos;re in.
          </p>

          {!sent ? (
            <div style={{ background:"#fff", border:"2px solid #000", padding:"32px", boxShadow:"8px 8px 0px 0px #000" }}>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <input
                  className="neo-input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                  style={{ flex:1, minWidth:200 }}
                />
                <button
                  className="neo-btn-primary"
                  onClick={send}
                  disabled={loading}
                  style={{ opacity: loading ? .6 : 1 }}
                >
                  {loading ? "Sending…" : "Get Magic Link →"}
                </button>
              </div>
              {error && <p style={{ fontSize:12, color:"#cc0000", marginTop:12, textAlign:"left" }}>{error}</p>}
              <p style={{ fontSize:11, color:"#666", marginTop:16, textAlign:"center", letterSpacing:"0.03em" }}>
                Free forever · Your data stays yours · No password needed
              </p>
            </div>
          ) : (
            <div style={{ background:"#fff", border:"2px solid #000", padding:"40px 32px", boxShadow:"8px 8px 0px 0px #000", textAlign:"center" }}>
              <div style={{ fontSize:48, marginBottom:16 }}>📬</div>
              <h3 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:24, letterSpacing:"-0.03em", marginBottom:8 }}>Check your inbox</h3>
              <p style={{ fontSize:14, color:"#444", lineHeight:1.7 }}>
                Magic link sent to <strong>{email}</strong>. Click it to open your journal.
              </p>
              <button onClick={() => setSent(false)} style={{ marginTop:20, background:"none", border:"2px solid #000", padding:"8px 20px", cursor:"pointer", fontSize:13, fontFamily:"'Satoshi',sans-serif", fontWeight:700, borderRadius:6 }}>
                Use different email
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════ FOOTER ════════════════════════════ */}
      <footer style={{ background:"#171e19", padding:"64px 40px 32px", borderTop:"2px solid #000" }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>
          <div className="footer-grid" style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:48, marginBottom:56 }}>

            {/* Brand col */}
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                <div style={{ width:36,height:36,background:"#ffe17c",border:"2px solid #ffe17c",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:4 }}>
                  <span style={{ fontSize:18 }}>⚡</span>
                </div>
                <span style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:20, letterSpacing:"-0.04em", color:"#fff" }}>FXEDGE</span>
              </div>
              <p style={{ fontSize:13, color:"#b7c6c2", lineHeight:1.75, fontWeight:500, maxWidth:260, marginBottom:28 }}>
                The trading journal built for ICT and SMC traders. Your data stays yours, always.
              </p>
              {/* Social icons */}
              <div style={{ display:"flex", gap:10 }}>
                {[
                  { label:"X", path:"M4 4l16 16M4 20L20 4" },
                  { label:"Discord", path:"M9 12h6M9 16h6M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" },
                  { label:"YouTube", path:"M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58zM10 15.5l5.19-3L10 9.5z" },
                ].map(s => (
                  <a key={s.label} href="#" className="social-icon" aria-label={s.label}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b7c6c2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={s.path}/>
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Link cols */}
            {[
              { heading:"Platform",  links:["Dashboard","Journal","Analytics","AI Coach","Pattern Detector"] },
              { heading:"Features",  links:["Daily Planning","Weekly Review","Missed Trades","Economic Calendar","Heatmap"] },
              { heading:"Company",   links:["Privacy Policy","Terms of Use","Data Ownership","Contact"] },
            ].map(col => (
              <div key={col.heading}>
                <h5 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:700, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", color:"#b7c6c2", opacity:.5, marginBottom:20 }}>{col.heading}</h5>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {col.links.map(l => (
                    <a key={l} href="#" style={{ fontSize:13, color:"#b7c6c2", textDecoration:"none", fontWeight:500, transition:"color .15s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#ffe17c"}
                      onMouseLeave={e => e.currentTarget.style.color = "#b7c6c2"}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop:"1px solid #272727", paddingTop:28, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <p style={{ fontSize:12, color:"#4b5563", fontWeight:500 }}>© 2025 FXEDGE. All rights reserved.</p>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ width:6,height:6,background:"#22c55e",display:"inline-block",borderRadius:"50%" }}/>
              <span style={{ fontSize:12, color:"#4b5563", fontWeight:500 }}>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
