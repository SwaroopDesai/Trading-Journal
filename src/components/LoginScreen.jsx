"use client"
import { useState, useEffect, useRef, useCallback } from "react";
import GlowBtn from "@/components/GlowBtn";

/* ── Pain points ───────────────────────────────────────────────────── */
const PAIN_POINTS = [
  "They take the same losing setup twice in the same week — because they never wrote it down.",
  "They think they're calm and disciplined. Their trade log says otherwise.",
  "They can't remember why they entered a trade three days later.",
  "One bad Friday wipes out two weeks of careful gains.",
  "They have no idea which pairs or sessions actually make them money.",
]

/* ── AI features ────────────────────────────────────────────────────── */
const AI_FEATURES = [
  {
    icon: "scan-eye",
    title: "AI Trade Review",
    desc: "Upload a screenshot of your chart and get an instant breakdown — setup quality, bias alignment, and exactly what you could do better next time.",
  },
  {
    icon: "brain",
    title: "Weekly AI Debrief",
    desc: "Every week, AI reads through your trades and tells you what to focus on. No guessing. No blind spots. Just a clear picture of where your edge is and where it isn't.",
  },
  {
    icon: "newspaper",
    title: "Smart News Filter",
    desc: "High-impact events like NFP, CPI, and FOMC — filtered for your pairs automatically. Know what's moving the market before it moves against you.",
  },
]

/* ── Feature cards ─────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: "notebook-pen",
    title: "Log Every Trade",
    desc: "Entry, SL, TP, setup, emotions — all in one place. Takes 2 minutes per trade. Saves you from repeating the same mistakes.",
  },
  {
    icon: "bar-chart-3",
    title: "See Your Patterns",
    desc: "Which pairs do you actually win on? Which sessions drain your account? Your journal shows you the truth your memory hides.",
  },
  {
    icon: "shield-check",
    title: "Trade With Discipline",
    desc: "A pre-trade checklist keeps you honest before every entry. No more FOMO trades. No more revenge. Just the plan.",
  },
]

/* ── Ghost cursor (canvas trail) ───────────────────────────────────── */
function GhostCursor() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const COUNT = 20
    const pts   = Array.from({ length: COUNT }, () => ({ x: -1000, y: -1000 }))
    const mouse = { x: -1000, y: -1000, active: false }
    let fadeTimer, rafId

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }

    const onMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
      clearTimeout(fadeTimer)
      fadeTimer = setTimeout(() => { mouse.active = false }, 300)
    }

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Lead point chases cursor with inertia
      pts[0].x += (mouse.x - pts[0].x) * 0.38
      pts[0].y += (mouse.y - pts[0].y) * 0.38

      // Chain follow + FBM micro-jitter
      const t = Date.now() * 0.0018
      for (let i = 1; i < COUNT; i++) {
        pts[i].x += (pts[i - 1].x - pts[i].x) * 0.32 + Math.sin(t + i * 0.7) * 0.45
        pts[i].y += (pts[i - 1].y - pts[i].y) * 0.32 + Math.cos(t + i * 0.7) * 0.45
      }

      const baseAlpha = mouse.active ? 0.7 : 0.06

      // Draw tapered segments — thick at head, thin at tail
      for (let i = 0; i < COUNT - 1; i++) {
        const frac   = 1 - i / COUNT
        const alpha  = frac * frac * baseAlpha        // pow(frac, 2) → bloom-like density
        const width  = frac * 2.8

        ctx.beginPath()
        ctx.moveTo(pts[i].x, pts[i].y)
        ctx.lineTo(pts[i + 1].x, pts[i + 1].y)
        ctx.strokeStyle  = "#B19EEF"
        ctx.lineWidth    = width
        ctx.shadowBlur   = 18 * frac
        ctx.shadowColor  = "#B19EEF"
        ctx.globalAlpha  = alpha
        ctx.lineCap      = "round"
        ctx.stroke()
      }

      // Bloom dot at the tip
      ctx.beginPath()
      ctx.arc(pts[0].x, pts[0].y, 3.5, 0, Math.PI * 2)
      ctx.fillStyle   = "#B19EEF"
      ctx.shadowBlur  = 24
      ctx.shadowColor = "#B19EEF"
      ctx.globalAlpha = mouse.active ? 1 : 0.08
      ctx.fill()

      ctx.globalAlpha = 1
      ctx.shadowBlur  = 0
      rafId = requestAnimationFrame(tick)
    }

    resize()
    window.addEventListener("resize", resize)
    window.addEventListener("mousemove", onMove)
    rafId = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(rafId)
      clearTimeout(fadeTimer)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed", inset: 0,
        width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 999,
      }}
    />
  )
}

/* ── Icon helper ───────────────────────────────────────────────────── */
function Icon({ name, size = 24, color = "%23B19EEF" }) {
  return (
    <img
      src={`https://api.iconify.design/lucide/${name}.svg?color=${color}`}
      width={size} height={size}
      alt=""
      aria-hidden="true"
      style={{ display: "block" }}
    />
  )
}

/* ── Gradient text heading ─────────────────────────────────────────── */
function GradientHeading({ children, style = {}, tag: Tag = "h1", className = "" }) {
  return (
    <Tag className={`phantom-gradient-text ${className}`} style={style}>
      {children}
    </Tag>
  )
}

/* ── Main component ────────────────────────────────────────────────── */
export default function LoginScreen({ supabase }) {
  // Waitlist state
  const [wEmail,   setWEmail]   = useState("")
  const [wSent,    setWSent]    = useState(false)
  const [wErr,     setWErr]     = useState(null)
  const [wLoading, setWLoading] = useState(false)

  // Login state
  const [lEmail,   setLEmail]   = useState("")
  const [lSent,    setLSent]    = useState(false)
  const [lErr,     setLErr]     = useState(null)
  const [lLoading, setLLoading] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  /* ── Waitlist submit ── */
  const handleWaitlist = useCallback(async () => {
    if (!wEmail.trim()) return
    setWLoading(true); setWErr(null)
    try {
      const { error } = await supabase
        .from("waitlist")
        .insert({ email: wEmail.trim().toLowerCase() })
      if (error) {
        if (error.code === "23505") throw new Error("You're already on the list!")
        throw error
      }
      setWSent(true)
    } catch (e) {
      setWErr(e.message)
    } finally {
      setWLoading(false)
    }
  }, [wEmail, supabase])

  /* ── Login submit ── */
  const handleLogin = useCallback(async () => {
    if (!lEmail.trim()) return
    setLLoading(true); setLErr(null)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: lEmail.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
      setLSent(true)
    } catch (e) {
      setLErr(e.message)
    } finally {
      setLLoading(false)
    }
  }, [lEmail, supabase])

  return (
    <>
      {/* ── CSS ── */}
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700,800,900&f[]=satoshi@400,500,700&display=swap');

        :root { --purple: #B19EEF; --bg: #050505; }

        .phantom-root {
          font-family: 'Satoshi', sans-serif;
          background: var(--bg);
          color: #fff;
          overflow-x: hidden;
          min-height: 100vh;
          cursor: none;
        }
        .phantom-root * { box-sizing: border-box; }

        /* Hide default cursor sitewide when on this page */
        .phantom-root, .phantom-root * { cursor: none !important; }

        /* Gradient heading */
        .phantom-gradient-text {
          font-family: 'Cabinet Grotesk', sans-serif;
          font-weight: 900;
          letter-spacing: -0.05em;
          line-height: 0.95;
          background: linear-gradient(to bottom, #ffffff 0%, rgba(255,255,255,0.38) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }

        /* Display font */
        .phantom-display {
          font-family: 'Cabinet Grotesk', sans-serif;
          letter-spacing: -0.05em;
          font-weight: 800;
        }

        /* Glass card */
        .phantom-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px;
          padding: 40px;
          transition: border-color 0.45s ease, box-shadow 0.45s ease, transform 0.45s cubic-bezier(0.25,0.46,0.45,1);
        }
        .phantom-card:hover {
          border-color: rgba(177,158,239,0.35);
          box-shadow: 0 0 40px rgba(177,158,239,0.08);
          transform: translateY(-4px);
        }

        /* Text selection */
        ::selection { background: var(--purple); color: #000; }

        /* Pill button */
        .phantom-pill {
          border-radius: 9999px !important;
          font-family: 'Cabinet Grotesk', sans-serif;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: none;
          transition: transform 0.3s cubic-bezier(0.25,0.46,0.45,1), box-shadow 0.3s ease, letter-spacing 0.4s ease;
          border: none;
          outline: none;
        }
        .phantom-pill:hover  { transform: scale(1.05); }
        .phantom-pill:active { transform: scale(0.95); }
        .phantom-pill-primary {
          background: var(--purple);
          color: #050505;
          padding: 14px 40px;
        }
        .phantom-pill-primary:hover { box-shadow: 0 0 32px rgba(177,158,239,0.45); }
        .phantom-pill-ghost {
          background: transparent;
          color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.12) !important;
          padding: 14px 40px;
        }
        .phantom-pill-ghost:hover { background: rgba(255,255,255,0.04); color: #fff; }

        /* Nav link */
        .phantom-nav-link {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
          text-decoration: none;
          transition: color 0.2s;
        }
        .phantom-nav-link:hover { color: #fff; }

        /* Input */
        .phantom-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9999px;
          color: #fff;
          font-family: 'Satoshi', sans-serif;
          font-size: 14px;
          padding: 14px 24px;
          outline: none;
          width: 100%;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .phantom-input::placeholder { color: rgba(255,255,255,0.28); }
        .phantom-input:focus {
          border-color: rgba(177,158,239,0.5);
          box-shadow: 0 0 0 3px rgba(177,158,239,0.12);
        }

        /* Hero glow blob */
        .phantom-glow-blob {
          position: absolute;
          width: 640px; height: 640px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(177,158,239,0.13) 0%, transparent 70%);
          filter: blur(90px);
          pointer-events: none;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation: phantomPulse 6s ease-in-out infinite;
        }
        @keyframes phantomPulse {
          0%,100% { opacity: 0.7; transform: translate(-50%,-50%) scale(1); }
          50%      { opacity: 1;   transform: translate(-50%,-50%) scale(1.08); }
        }

        /* Badge */
        .phantom-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border: 1px solid rgba(177,158,239,0.28);
          background: rgba(177,158,239,0.06);
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--purple);
        }

        /* CTA glow */
        .phantom-cta-glow {
          position: absolute;
          width: 400px; height: 200px;
          background: radial-gradient(ellipse, rgba(177,158,239,0.22) 0%, transparent 70%);
          filter: blur(40px);
          left: 50%; bottom: -20px;
          transform: translateX(-50%);
          pointer-events: none;
          transition: opacity 0.4s ease;
        }

        /* Chevron bounce */
        @keyframes phantomBounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(6px); }
        }
        .phantom-bounce { animation: phantomBounce 2.2s ease-in-out infinite; }

        /* Reveal */
        @keyframes phantomFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .phantom-reveal { animation: phantomFadeUp 1s cubic-bezier(0.16,1,0.3,1) both; }
        .phantom-reveal-d1 { animation-delay: 0.1s; }
        .phantom-reveal-d2 { animation-delay: 0.25s; }
        .phantom-reveal-d3 { animation-delay: 0.4s; }
        .phantom-reveal-d4 { animation-delay: 0.55s; }

        /* Pain point row */
        .phantom-pain-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px 24px;
          background: rgba(239,68,68,0.03);
          border: 1px solid rgba(239,68,68,0.09);
          border-radius: 16px;
          transition: border-color 0.3s ease, background 0.3s ease;
        }
        .phantom-pain-item:hover {
          border-color: rgba(239,68,68,0.2);
          background: rgba(239,68,68,0.06);
        }

        /* Wide feature highlight card (calendar / mobile) */
        .phantom-wide-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 28px;
          padding: 64px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.45s ease;
        }
        .phantom-wide-card:hover { border-color: rgba(177,158,239,0.25); }

        /* Two-col grid */
        .phantom-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }

        /* Mobile stat pill */
        .phantom-stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: rgba(177,158,239,0.06);
          border: 1px solid rgba(177,158,239,0.18);
          border-radius: 9999px;
          font-size: 13px;
          color: rgba(255,255,255,0.7);
          font-family: 'Satoshi', sans-serif;
        }

        /* ── Mobile ─────────────────────────────────────────────────── */
        @media (max-width: 768px) {
          /* Restore cursor on touch */
          .phantom-root, .phantom-root * { cursor: auto !important; }

          /* Nav */
          .phantom-nav-center { display: none !important; }
          .phantom-nav { padding: 0 20px !important; }

          /* Hero */
          .phantom-hero { padding: 100px 20px 60px !important; }
          .phantom-hero-title { font-size: clamp(36px, 13vw, 56px) !important; margin-left: 0 !important; margin-right: 0 !important; width: 100% !important; }
          .phantom-hero-sub { font-size: 16px !important; }
          .phantom-hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .phantom-hero-btns button, .phantom-hero-btns a { width: 100% !important; }
          .phantom-glow-blob { width: 320px !important; height: 320px !important; }

          /* Sections */
          .phantom-section { padding: 72px 20px !important; }
          .phantom-section-sm { padding: 0 20px 72px !important; }

          /* Grids */
          .phantom-features-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .phantom-two-col { grid-template-columns: 1fr !important; gap: 40px !important; }

          /* Cards */
          .phantom-card { padding: 28px 24px !important; border-radius: 18px !important; }
          .phantom-wide-card { padding: 28px 20px !important; border-radius: 20px !important; }

          /* Section headings */
          .phantom-section-h2 { font-size: 34px !important; }
          .phantom-cta-heading { font-size: 38px !important; }

          /* Pain section heading */
          .phantom-pain-heading { font-size: 34px !important; }

          /* Calendar mock cards */
          .phantom-cal-row { padding: 12px 14px !important; }
          .phantom-cal-pair { display: none !important; }

          /* Stat pills — stack 2 per row */
          .phantom-stat-pills { gap: 10px !important; }
          .phantom-stat-pill { font-size: 12px !important; padding: 10px 14px !important; }

          /* Wide-card inner two-col already collapses above */

          /* Footer */
          .phantom-footer { flex-direction: column !important; align-items: flex-start !important; gap: 20px !important; padding: 32px 20px !important; }
          .phantom-footer-links { gap: 16px !important; }
        }

        /* ── Small phones ── */
        @media (max-width: 390px) {
          .phantom-hero-title { font-size: clamp(32px, 12vw, 44px) !important; }
          .phantom-section-h2 { font-size: 28px !important; }
          .phantom-cta-heading { font-size: 32px !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          .phantom-reveal, .phantom-glow-blob, .phantom-bounce { animation: none !important; opacity: 1 !important; }
        }
      `}</style>

      <GhostCursor />

      <div className="phantom-root">

        {/* ── Fixed Navigation ── */}
        <nav className="phantom-nav" style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 80, zIndex: 50,
          background: "rgba(5,5,5,0.92)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
        }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--purple)", boxShadow:"0 0 10px rgba(177,158,239,0.6)" }}/>
            <span className="phantom-display" style={{ fontSize:16, color:"#fff", letterSpacing:"-0.03em" }}>FXEDGE</span>
          </div>

          {/* Center links */}
          <div className="phantom-nav-center" style={{ display:"flex", gap:40 }}>
            <a href="#features" className="phantom-nav-link">Features</a>
            <a href="#cta"      className="phantom-nav-link">Get Started</a>
          </div>

          {/* Enter */}
          <button
            className="phantom-pill phantom-pill-ghost"
            style={{ padding:"10px 24px", fontSize:10 }}
            onClick={() => { setShowLogin(true); setTimeout(()=>document.getElementById("ph-login-email")?.focus(), 100) }}
          >
            Log In
          </button>
        </nav>

        {/* ── Hero ── */}
        <section className="phantom-hero" style={{
          minHeight: "100vh",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "100px 24px 60px",
          position: "relative", overflow: "hidden",
        }}>
          <div className="phantom-glow-blob" />

          {/* Badge */}
          <div className="phantom-badge phantom-reveal">
            <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--purple)", boxShadow:"0 0 6px rgba(177,158,239,0.8)" }}/>
            AI-Powered Trading Journal
          </div>

          {/* Title */}
          <GradientHeading
            className="phantom-reveal phantom-reveal-d1 phantom-hero-title"
            style={{ fontSize:160, margin:"32px 0 24px" }}
          >
            FXEDGE
          </GradientHeading>

          {/* Subtitle */}
          <p className="phantom-reveal phantom-reveal-d2 phantom-hero-sub" style={{
            fontFamily: "'Satoshi',sans-serif", fontSize:20, lineHeight:1.65,
            color: "rgba(255,255,255,0.42)", maxWidth:560, margin:"0 0 48px", fontWeight:400,
          }}>
            Stop trading from memory. Log every trade, track your patterns, and finally understand what&apos;s costing you.
          </p>

          {/* ── Waitlist form ── */}
          <div className="phantom-reveal phantom-reveal-d3" style={{ width:"100%", maxWidth:440 }}>
            {wSent ? (
              <div style={{
                border: "1px solid rgba(177,158,239,0.3)",
                background: "rgba(177,158,239,0.06)",
                borderRadius: 16, padding: "28px 32px", textAlign:"center",
              }}>
                <div style={{ fontSize:24, marginBottom:12 }}>🎉</div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.3em", textTransform:"uppercase", color:"var(--purple)", marginBottom:10 }}>
                  You&apos;re on the list!
                </div>
                <p style={{ fontFamily:"'Satoshi',sans-serif", fontSize:15, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>
                  We&apos;ll reach out to <span style={{ color:"#fff" }}>{wEmail}</span> when access opens up.
                </p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ display:"flex", gap:10 }}>
                  <input
                    id="ph-waitlist-email"
                    className="phantom-input"
                    type="email"
                    placeholder="Enter your email to request access"
                    value={wEmail}
                    onChange={e => setWEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleWaitlist()}
                    style={{ flex:1 }}
                  />
                  <button
                    className="phantom-pill phantom-pill-primary"
                    onClick={handleWaitlist}
                    disabled={wLoading}
                    style={{ whiteSpace:"nowrap", padding:"14px 24px" }}
                  >
                    {wLoading ? "…" : "Request Access"}
                  </button>
                </div>
                {wErr && <div style={{ fontSize:12, color:"#ef4444", textAlign:"center" }}>{wErr}</div>}
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.2)", textAlign:"center", fontFamily:"'Satoshi',sans-serif" }}>
                  Early access only. No spam, ever.
                </p>
              </div>
            )}
          </div>

          {/* ── Login modal overlay ── */}
          {showLogin && (
            <div
              onClick={(e) => e.target === e.currentTarget && setShowLogin(false)}
              style={{
                position:"fixed", inset:0, zIndex:200,
                background:"rgba(0,0,0,0.7)", backdropFilter:"blur(12px)",
                display:"flex", alignItems:"center", justifyContent:"center",
                padding:24,
              }}
            >
              <div style={{
                background:"#0d0d0d", border:"1px solid rgba(177,158,239,0.2)",
                borderRadius:24, padding:"40px 36px", width:"100%", maxWidth:400,
                position:"relative",
              }}>
                <button
                  onClick={() => setShowLogin(false)}
                  style={{ position:"absolute", top:16, right:16, background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:20, cursor:"pointer" }}
                >✕</button>

                <div style={{ marginBottom:28 }}>
                  <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.25em", textTransform:"uppercase", color:"var(--purple)", marginBottom:8 }}>Welcome back</p>
                  <h3 className="phantom-display" style={{ fontSize:24, color:"#fff" }}>Log in to FXEDGE</h3>
                </div>

                {lSent ? (
                  <div style={{ textAlign:"center", padding:"20px 0" }}>
                    <div style={{ fontSize:32, marginBottom:12 }}>📬</div>
                    <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.25em", textTransform:"uppercase", color:"var(--purple)", marginBottom:8 }}>Check your inbox</p>
                    <p style={{ fontFamily:"'Satoshi',sans-serif", fontSize:14, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>
                      Magic link sent to <span style={{ color:"#fff" }}>{lEmail}</span>
                    </p>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <input
                      id="ph-login-email"
                      className="phantom-input"
                      type="email"
                      placeholder="Your email address"
                      value={lEmail}
                      onChange={e => setLEmail(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleLogin()}
                    />
                    {lErr && <div style={{ fontSize:12, color:"#ef4444", textAlign:"center" }}>{lErr}</div>}
                    <button
                      className="phantom-pill phantom-pill-primary"
                      onClick={handleLogin}
                      disabled={lLoading}
                      style={{ width:"100%" }}
                    >
                      {lLoading ? "Sending…" : "Send Magic Link"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scroll cue */}
          <div className="phantom-bounce" style={{ position:"absolute", bottom:40, opacity:0.25 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </section>

        {/* ── Why traders fail ── */}
        <section className="phantom-section" style={{ padding:"120px 48px" }}>
          <div style={{ maxWidth:1100, margin:"0 auto" }}>
            <div className="phantom-two-col">
              {/* Left */}
              <div>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.25em", textTransform:"uppercase", color:"rgba(239,68,68,0.7)", marginBottom:20 }}>
                  The Hard Truth
                </p>
                <h2 className="phantom-display phantom-section-h2 phantom-pain-heading" style={{ fontSize:50, color:"#fff", lineHeight:1.1, marginBottom:24 }}>
                  Most traders fail for the same reasons.
                </h2>
                <p style={{ fontSize:16, color:"rgba(255,255,255,0.38)", lineHeight:1.8, marginBottom:36 }}>
                  It&apos;s not the market. It&apos;s not bad luck. It&apos;s the same avoidable mistakes, repeated over and over — because there&apos;s no record to learn from.
                </p>
                <button
                  className="phantom-pill phantom-pill-primary"
                  onClick={() => { window.scrollTo({top:0,behavior:"smooth"}); setTimeout(()=>document.getElementById("ph-waitlist-email")?.focus(), 700) }}
                >
                  Request Access
                </button>
              </div>
              {/* Right — pain list */}
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {PAIN_POINTS.map((p, i) => (
                  <div key={i} className="phantom-pain-item">
                    <span style={{ color:"#ef4444", fontSize:16, marginTop:1, flexShrink:0 }}>✗</span>
                    <p style={{ fontSize:14, color:"rgba(255,255,255,0.5)", lineHeight:1.7, fontFamily:"'Satoshi',sans-serif", margin:0 }}>{p}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Divider ── */}
        <div style={{ maxWidth:1100, margin:"0 auto 0", height:1, background:"linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)" }}/>

        {/* ── Features ── */}
        <section id="features" className="phantom-section" style={{ padding:"120px 48px" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:72 }}>
              <h2 className="phantom-display phantom-section-h2" style={{ fontSize:44, color:"#fff", marginBottom:12 }}>
                Everything you need to improve
              </h2>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.25em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)" }}>
                The tools that turn losing traders into consistent ones
              </p>
            </div>

            <div className="phantom-features-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
              {FEATURES.map((f, i) => (
                <div key={f.title} className="phantom-card" style={{ animationDelay:`${i * 0.12}s` }}>
                  <div style={{
                    width:52, height:52, borderRadius:14,
                    background:"rgba(177,158,239,0.1)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    marginBottom:28,
                  }}>
                    <Icon name={f.icon} size={24} />
                  </div>
                  <h3 className="phantom-display" style={{ fontSize:20, color:"#fff", marginBottom:14 }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize:14, color:"rgba(255,255,255,0.38)", lineHeight:1.75, fontFamily:"'Satoshi',sans-serif" }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AI Features ── */}
        <section className="phantom-section-sm" style={{ padding:"0 48px 120px" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            {/* Header */}
            <div style={{ textAlign:"center", marginBottom:72 }}>
              <div className="phantom-badge" style={{ marginBottom:24 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--purple)", boxShadow:"0 0 6px rgba(177,158,239,0.8)" }}/>
                Powered by AI
              </div>
              <h2 className="phantom-display phantom-section-h2" style={{ fontSize:44, color:"#fff", marginBottom:12 }}>
                Your journal thinks with you
              </h2>
              <p style={{ fontSize:16, color:"rgba(255,255,255,0.35)", maxWidth:480, margin:"0 auto", fontFamily:"'Satoshi',sans-serif", lineHeight:1.7 }}>
                Not just a place to log trades — an AI that actually reads them and tells you what to do next.
              </p>
            </div>

            <div className="phantom-features-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
              {AI_FEATURES.map((f, i) => (
                <div key={f.title} className="phantom-card" style={{ animationDelay:`${i * 0.12}s` }}>
                  <div style={{
                    width:52, height:52, borderRadius:14,
                    background:"rgba(177,158,239,0.1)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    marginBottom:28,
                  }}>
                    <Icon name={f.icon} size={24} />
                  </div>
                  <h3 className="phantom-display" style={{ fontSize:20, color:"#fff", marginBottom:14 }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize:14, color:"rgba(255,255,255,0.38)", lineHeight:1.75, fontFamily:"'Satoshi',sans-serif" }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Economic Calendar ── */}
        <section className="phantom-section-sm" style={{ padding:"0 48px 120px" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div className="phantom-wide-card">
              {/* Background glow */}
              <div style={{ position:"absolute", top:"-40px", right:"-40px", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle, rgba(177,158,239,0.1) 0%, transparent 70%)", filter:"blur(50px)", pointerEvents:"none" }}/>
              <div className="phantom-two-col" style={{ position:"relative" }}>
                {/* Left */}
                <div>
                  <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.25em", textTransform:"uppercase", color:"var(--purple)", marginBottom:20 }}>
                    Economic Calendar
                  </p>
                  <h2 className="phantom-display phantom-section-h2" style={{ fontSize:44, color:"#fff", lineHeight:1.1, marginBottom:20 }}>
                    Never get caught by the news again.
                  </h2>
                  <p style={{ fontSize:16, color:"rgba(255,255,255,0.38)", lineHeight:1.8, marginBottom:36, fontFamily:"'Satoshi',sans-serif" }}>
                    FXEDGE tracks high-impact events — NFP, CPI, FOMC, Interest Rate decisions — and highlights which ones affect your pairs. Know when to be in. Know when to stay out.
                  </p>
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    {["High-impact events colour-coded by risk level","Filtered for your specific pairs","Integrated into your daily planning journal"].map(item => (
                      <div key={item} style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--purple)", flexShrink:0 }}/>
                        <span style={{ fontSize:14, color:"rgba(255,255,255,0.55)", fontFamily:"'Satoshi',sans-serif" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Right — visual mock */}
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[
                    { time:"08:30", event:"Non-Farm Payrolls", impact:"HIGH", pair:"EURUSD, GBPUSD" },
                    { time:"13:30", event:"CPI m/m",          impact:"HIGH", pair:"All USD pairs"  },
                    { time:"15:00", event:"FOMC Statement",   impact:"HIGH", pair:"All USD pairs"  },
                    { time:"09:00", event:"ECB Rate Decision", impact:"MED", pair:"EURUSD"         },
                  ].map((ev, i) => (
                    <div key={i} style={{
                      display:"flex", alignItems:"center", gap:16,
                      padding:"16px 20px",
                      background:"rgba(255,255,255,0.02)",
                      border:"1px solid rgba(255,255,255,0.07)",
                      borderRadius:14,
                    }}>
                      <span style={{ fontSize:12, color:"rgba(255,255,255,0.3)", fontFamily:"'Satoshi',sans-serif", minWidth:40 }}>{ev.time}</span>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, color:"#fff", fontFamily:"'Satoshi',sans-serif", margin:0, fontWeight:600 }}>{ev.event}</p>
                        <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"'Satoshi',sans-serif", margin:0, marginTop:2 }}>{ev.pair}</p>
                      </div>
                      <span style={{
                        fontSize:10, fontWeight:700, letterSpacing:"0.12em", padding:"4px 10px",
                        borderRadius:9999,
                        background: ev.impact === "HIGH" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
                        color: ev.impact === "HIGH" ? "#ef4444" : "#f59e0b",
                        border: `1px solid ${ev.impact === "HIGH" ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.25)"}`,
                      }}>
                        {ev.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Mobile / Any Device ── */}
        <section className="phantom-section-sm" style={{ padding:"0 48px 120px" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div className="phantom-wide-card" style={{ textAlign:"center", background:"rgba(177,158,239,0.03)", borderColor:"rgba(177,158,239,0.1)" }}>
              <div style={{ position:"absolute", bottom:"-60px", left:"50%", transform:"translateX(-50%)", width:500, height:200, background:"radial-gradient(ellipse, rgba(177,158,239,0.15) 0%, transparent 70%)", filter:"blur(50px)", pointerEvents:"none" }}/>
              <div style={{ position:"relative" }}>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.25em", textTransform:"uppercase", color:"var(--purple)", marginBottom:20 }}>
                  Available Everywhere
                </p>
                <h2 className="phantom-display phantom-section-h2" style={{ fontSize:44, color:"#fff", lineHeight:1.1, marginBottom:20 }}>
                  Journal from anywhere. Even mid-session.
                </h2>
                <p style={{ fontSize:16, color:"rgba(255,255,255,0.38)", lineHeight:1.8, maxWidth:560, margin:"0 auto 48px", fontFamily:"'Satoshi',sans-serif" }}>
                  FXEDGE works on your phone, tablet, and desktop — no app download needed. Log a trade between setups. Check your stats on the go. Review your week from your couch.
                </p>
                <div className="phantom-stat-pills" style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
                  {["Works on iOS & Android","No app download needed","Instant sync across devices","Fast enough for live sessions"].map(stat => (
                    <div key={stat} className="phantom-stat-pill">
                      <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--purple)" }}/>
                      {stat}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section id="cta" className="phantom-section" style={{ padding:"120px 48px", textAlign:"center", position:"relative" }}>
          {/* Vertical line from top */}
          <div style={{
            position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
            width:1, height:80,
            background:"linear-gradient(to bottom, transparent, rgba(177,158,239,0.6))",
          }}/>

          <div style={{ maxWidth:700, margin:"0 auto", position:"relative" }}>
            <GradientHeading
              tag="h2"
              className="phantom-cta-heading"
              style={{ fontSize:64, marginBottom:24, lineHeight:1 }}
            >
              KNOW YOUR EDGE.
            </GradientHeading>

            <p style={{
              fontSize:18, color:"rgba(255,255,255,0.38)",
              lineHeight:1.7, marginBottom:52,
              fontFamily:"'Satoshi',sans-serif",
            }}>
              Every consistent trader has a journal. This is yours.
            </p>

            <div style={{ position:"relative", display:"inline-block" }}>
              <div className="phantom-cta-glow"/>
              <button
                className="phantom-pill phantom-pill-primary"
                style={{ fontSize:12, padding:"18px 52px", position:"relative" }}
                onClick={() => { window.scrollTo({top:0,behavior:"smooth"}); setTimeout(()=>document.getElementById("ph-waitlist-email")?.focus(), 700) }}
              >
                Request Access
              </button>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="phantom-footer" style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "48px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 24,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"rgba(255,255,255,0.4)" }}/>
            <span className="phantom-display" style={{ fontSize:12, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em" }}>
              FXEDGE STUDIO
            </span>
          </div>

          <div className="phantom-footer-links" style={{ display:"flex", gap:28 }}>
            {["Privacy","Terms","Discord"].map(l => (
              <a key={l} href="#" className="phantom-nav-link" style={{ letterSpacing:"0.12em" }}>{l}</a>
            ))}
          </div>

          <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"rgba(255,255,255,0.15)", fontFamily:"'Satoshi',sans-serif" }}>
            © 2026 FXEDGE. Built for traders who take it seriously.
          </p>
        </footer>
      </div>
    </>
  )
}
