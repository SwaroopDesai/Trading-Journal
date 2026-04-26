"use client"
import { useState, useEffect, useRef } from "react";

/* ── Feature cards data ────────────────────────────────────────────── */
const FEATURES = [
  { icon:"cpu",         title:"Core Systems",   desc:"Automated structure tracking and market flow analysis delivered through a clean, noise-free interface." },
  { icon:"bar-chart-3", title:"Visual Data",     desc:"Real-time visualisation of high-speed data. Filter noise and see exactly what matters to your performance." },
  { icon:"layout",      title:"Session Design",  desc:"Architect your day before the open. A clean canvas for mapping your objectives and key levels." },
  { icon:"brain",       title:"Smart Review",    desc:"A layer that monitors your execution habits. Quantify your progress to help maintain discipline." },
  { icon:"shield-check",title:"Secure Access",   desc:"Proprietary encryption protocols ensuring your data and performance metrics remain private." },
  { icon:"zap",         title:"Fast Sync",       desc:"Multi-node infrastructure designed for millisecond synchronisation across all your devices." },
]

/* ── Iconify helper ────────────────────────────────────────────────── */
function Icon({ name, size = 32, color = "%233b82f6" }) {
  return (
    <img
      src={`https://api.iconify.design/lucide/${name}.svg?color=${color}`}
      width={size} height={size}
      alt={name}
      style={{ display:"block" }}
    />
  )
}

/* ── Counter hook ──────────────────────────────────────────────────── */
function useCounter(target, triggered) {
  const [val, setVal] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    if (!triggered || started.current) return
    started.current = true
    let current = 0
    const speed = target / 50
    const update = () => {
      current += speed
      if (current < target) {
        setVal(Math.floor(current))
        requestAnimationFrame(update)
      } else {
        setVal(target)
      }
    }
    requestAnimationFrame(update)
  }, [triggered, target])
  return val
}

/* ── Main component ────────────────────────────────────────────────── */
export default function LoginScreen({ supabase }) {
  const [email, setEmail]   = useState("")
  const [sent, setSent]     = useState(false)
  const [err, setErr]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [heroVisible, setHeroVisible] = useState(false)
  const heroRef = useRef(null)
  const counterVal = useCounter(25, heroVisible)

  /* ── Scroll-reveal observer ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("sd-visible")
          }
        })
      },
      { threshold: 0.08 }
    )
    const heroObs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setHeroVisible(true) },
      { threshold: 0.3 }
    )
    document.querySelectorAll(".sd-reveal").forEach((el) => observer.observe(el))
    if (heroRef.current) heroObs.observe(heroRef.current)
    return () => { observer.disconnect(); heroObs.disconnect() }
  }, [])

  /* ── Auth ── */
  const handleSubmit = async () => {
    if (!email.trim()) return
    setLoading(true)
    setErr(null)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
      setSent(true)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,700&display=swap');

        .sd-root * { border-radius: 0px !important; box-sizing: border-box; }
        .sd-root { font-family: 'Inter', sans-serif; background: #000; color: #fff; margin: 0; overflow-x: hidden; }
        .sd-serif { font-family: 'Playfair Display', serif; }

        /* Gradient shift background */
        @keyframes sd-gradient-shift {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
        .sd-bg {
          background: linear-gradient(-45deg, #000000, #050505, #080808, #000000);
          background-size: 400% 400%;
          animation: sd-gradient-shift 18s ease infinite;
          min-height: 100vh;
        }

        /* Breathing float */
        @keyframes sd-breathing {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-6px); }
        }
        .sd-breathe { animation: sd-breathing 5s ease-in-out infinite; }

        /* Scroll reveal */
        .sd-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 1s cubic-bezier(0.25, 0.46, 0.45, 1),
                      transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 1);
          will-change: transform, opacity;
        }
        .sd-reveal.sd-visible { opacity: 1; transform: translateY(0); }
        .sd-d1 { transition-delay: 150ms; }
        .sd-d2 { transition-delay: 300ms; }
        .sd-d3 { transition-delay: 450ms; }
        .sd-d4 { transition-delay: 600ms; }
        .sd-d5 { transition-delay: 750ms; }
        .sd-d6 { transition-delay: 900ms; }

        /* Line expand */
        @keyframes sd-line-expand {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        .sd-line-trigger.sd-visible .sd-line {
          animation: sd-line-expand 1.5s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }
        .sd-line {
          transform: scaleX(0);
          transform-origin: left center;
        }

        /* Feature cards */
        .sd-card {
          border: 1px solid #1a1a1a;
          background: #050505;
          padding: 48px;
          transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 1),
                      border-color 0.4s ease,
                      background 0.4s ease,
                      box-shadow 0.4s ease;
        }
        .sd-card:hover {
          border-color: #3b82f6;
          background: #080808;
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(59,130,246,0.06);
        }

        /* Button */
        .sd-btn {
          background: #fff;
          color: #000;
          border: none;
          padding: 16px 40px;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.3s ease, color 0.3s ease, transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 1);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .sd-btn:hover  { background: #3b82f6; color: #fff; transform: scale(1.04); }
        .sd-btn:active { transform: scale(0.96); }
        .sd-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* Input */
        .sd-input {
          background: transparent;
          border: 1px solid #222;
          color: #fff;
          padding: 16px 24px;
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 15px;
          outline: none;
          width: 100%;
          transition: border-color 0.3s ease;
        }
        .sd-input::placeholder { color: #444; }
        .sd-input:focus { border-color: #3b82f6; }

        /* Nav */
        .sd-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          border-bottom: 1px solid #1a1a1a;
          background: rgba(0,0,0,0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 48px;
        }

        /* Mobile */
        @media (max-width: 768px) {
          .sd-nav { padding: 16px 20px; }
          .sd-hero-h1 { font-size: 64px !important; }
          .sd-stats-grid { grid-template-columns: 1fr !important; gap: 24px !important; border-left: none !important; border-right: none !important; }
          .sd-stats-mid { border-left: none !important; border-right: none !important; }
          .sd-cta-row { flex-direction: column !important; }
          .sd-features-grid { grid-template-columns: 1fr !important; border-left: none !important; }
          .sd-section { padding: 80px 20px !important; }
          .sd-hero-inner { padding: 160px 20px 80px !important; }
          .sd-nav-links { display: none !important; }
        }
      `}</style>

      <div className="sd-root sd-bg">

        {/* ── Navigation ── */}
        <nav className="sd-nav">
          <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:16, fontWeight:800, letterSpacing:"0.18em", textTransform:"uppercase", color:"#fff" }}>
              FXEDGE
            </span>
            <span style={{ fontSize:9, color:"#444", letterSpacing:"0.14em", textTransform:"uppercase" }}>/ SMC</span>
          </div>
          <div className="sd-nav-links" style={{ display:"flex", alignItems:"center", gap:40 }}>
            <a href="#features" style={{ fontSize:11, fontWeight:600, letterSpacing:"0.16em", textTransform:"uppercase", color:"#666", textDecoration:"none", transition:"color 0.2s" }}
              onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="#666"}>
              Features
            </a>
            <button className="sd-btn" onClick={()=>document.getElementById("sd-email")?.focus()}>
              Enter
            </button>
          </div>
        </nav>

        {/* ── Hero ── */}
        <main className="sd-hero-inner" ref={heroRef}
          style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"192px 48px 128px", maxWidth:900, margin:"0 auto" }}>

          {/* Eyebrow */}
          <div className="sd-reveal">
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.5em", textTransform:"uppercase", color:"#3b82f6" }}>
              Master Your Performance
            </span>
          </div>

          {/* Headline */}
          <h1 className="sd-serif sd-reveal sd-d1 sd-breathe sd-hero-h1"
            style={{ fontSize:96, fontWeight:900, letterSpacing:"-0.03em", lineHeight:1, margin:"40px 0 32px", color:"#fff" }}>
            Master Your<br />Edge.
          </h1>

          {/* Subtitle */}
          <p className="sd-serif sd-reveal sd-d2"
            style={{ fontSize:20, color:"#555", lineHeight:1.7, maxWidth:600, fontStyle:"italic", margin:"0 0 64px" }}>
            A refined environment for maintaining discipline, finding clarity, and refining your unique trading edge.
          </p>

          {/* Stats row */}
          <div className="sd-reveal sd-d3 sd-breathe sd-stats-grid"
            style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", width:"100%", maxWidth:720,
              borderTop:"1px solid #1a1a1a", borderBottom:"1px solid #1a1a1a", padding:"40px 0", marginBottom:64, gap:0 }}>
            <div style={{ textAlign:"center" }}>
              <div className="sd-serif" style={{ fontSize:40, fontWeight:900, color:"#fff" }}>
                {counterVal}+
              </div>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"#444", marginTop:8 }}>
                Analysis Tools
              </div>
            </div>
            <div className="sd-stats-mid" style={{ textAlign:"center", borderLeft:"1px solid #1a1a1a", borderRight:"1px solid #1a1a1a" }}>
              <div className="sd-serif" style={{ fontSize:40, fontWeight:900, color:"#fff" }}>99.9%</div>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"#444", marginTop:8 }}>
                Reliability
              </div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div className="sd-serif" style={{ fontSize:40, fontWeight:900, fontStyle:"italic", color:"#fff" }}>Real-time</div>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"#444", marginTop:8 }}>
                Sync Speed
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="sd-reveal sd-d4" style={{ width:"100%", maxWidth:480 }}>
            {sent ? (
              <div style={{ border:"1px solid #1a1a1a", padding:"24px 32px", textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.3em", textTransform:"uppercase", color:"#3b82f6", marginBottom:8 }}>
                  Check Your Inbox
                </div>
                <div className="sd-serif" style={{ fontSize:15, color:"#555", fontStyle:"italic" }}>
                  Magic link sent to <span style={{ color:"#fff" }}>{email}</span>
                </div>
              </div>
            ) : (
              <>
                <div className="sd-cta-row" style={{ display:"flex", gap:0 }}>
                  <input
                    id="sd-email"
                    className="sd-input"
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  />
                  <button className="sd-btn" onClick={handleSubmit} disabled={loading}>
                    {loading ? "..." : "Enter"}
                  </button>
                </div>
                {err && (
                  <div style={{ marginTop:12, fontSize:12, color:"#ef4444", letterSpacing:"0.04em" }}>{err}</div>
                )}
                <p style={{ marginTop:16, fontSize:9, color:"#333", letterSpacing:"0.25em", textTransform:"uppercase" }}>
                  One-click access to your terminal
                </p>
              </>
            )}
          </div>
        </main>

        {/* ── Features ── */}
        <section id="features" className="sd-section"
          style={{ borderTop:"1px solid #111", padding:"128px 48px" }}>
          <div style={{ maxWidth:1280, margin:"0 auto" }}>

            {/* Section heading */}
            <div className="sd-reveal sd-line-trigger" style={{ textAlign:"center", marginBottom:80 }}>
              <h2 className="sd-serif" style={{ fontSize:48, fontWeight:700, textTransform:"uppercase", letterSpacing:"-0.02em", marginBottom:16, color:"#fff" }}>
                The Core
              </h2>
              <div className="sd-line" style={{ width:96, height:1, background:"#3b82f6", margin:"0 auto 16px" }} />
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.3em", textTransform:"uppercase", color:"#444" }}>
                Simple tools for complex markets
              </p>
            </div>

            {/* 6-card grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", borderLeft:"1px solid #1a1a1a", borderTop:"1px solid #1a1a1a" }}
              className="sd-features-grid">
              {FEATURES.map((f, i) => (
                <div key={f.title}
                  className={`sd-card sd-reveal sd-d${(i % 6) + 1}`}
                  style={{ borderRight:"1px solid #1a1a1a", borderBottom:"1px solid #1a1a1a" }}>
                  <div style={{ marginBottom:32 }}>
                    <Icon name={f.icon} size={36} />
                  </div>
                  <h4 className="sd-serif" style={{ fontSize:22, fontWeight:900, color:"#fff", marginBottom:16 }}>
                    {f.title}
                  </h4>
                  <p style={{ fontSize:13, color:"#555", lineHeight:1.8 }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop:"1px solid #1a1a1a", padding:"48px 48px 40px" }}>
          <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:24 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:800, letterSpacing:"0.18em", textTransform:"uppercase", color:"#fff", marginBottom:6 }}>
                FXEDGE
              </div>
              <div className="sd-serif" style={{ fontSize:12, color:"#333", fontStyle:"italic" }}>
                Master Your Edge.
              </div>
            </div>
            <div style={{ display:"flex", gap:32, alignItems:"center" }}>
              <a href="#features" style={{ fontSize:10, fontWeight:600, letterSpacing:"0.16em", textTransform:"uppercase", color:"#444", textDecoration:"none", transition:"color 0.2s" }}
                onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="#444"}>
                Features
              </a>
              <button className="sd-btn" style={{ padding:"12px 28px", fontSize:10 }}
                onClick={()=>document.getElementById("sd-email")?.focus()}>
                Sign In
              </button>
            </div>
          </div>
          <div style={{ maxWidth:1280, margin:"32px auto 0", borderTop:"1px solid #0f0f0f", paddingTop:24 }}>
            <span style={{ fontSize:10, color:"#2a2a2a", letterSpacing:"0.12em" }}>
              © 2026 FXEDGE · All rights reserved
            </span>
          </div>
        </footer>

      </div>
    </>
  )
}
