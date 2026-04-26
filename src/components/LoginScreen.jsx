"use client"
import { useState, useEffect, useRef, useCallback } from "react";
import GlowBtn from "@/components/GlowBtn";

/* ── Feature cards ─────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: "cpu",
    title: "Neural Latency",
    desc: "Proprietary routing protocols that move data faster than thought. Sub-millisecond execution as a standard, not a feature.",
  },
  {
    icon: "bar-chart-3",
    title: "Smart Flow",
    desc: "Visualise liquidity pools with surgical precision. Our data layer aggregates institutional depth into a single ethereal stream.",
  },
  {
    icon: "shield",
    title: "Void Security",
    desc: "Your edge remains in the shadows. Multi-signature encryption and private access nodes keep your data yours alone.",
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
function GradientHeading({ children, style = {}, tag: Tag = "h1" }) {
  return (
    <Tag className="phantom-gradient-text" style={style}>
      {children}
    </Tag>
  )
}

/* ── Main component ────────────────────────────────────────────────── */
export default function LoginScreen({ supabase }) {
  const [email,   setEmail]   = useState("")
  const [sent,    setSent]    = useState(false)
  const [err,     setErr]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  /* ── Auth ── */
  const handleSubmit = useCallback(async () => {
    if (!email.trim()) return
    setLoading(true); setErr(null)
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
  }, [email, supabase])

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

        @media (max-width: 768px) {
          .phantom-hero-title { font-size: 72px !important; }
          .phantom-features-grid { grid-template-columns: 1fr !important; }
          .phantom-nav-center { display: none !important; }
          .phantom-cta-heading { font-size: 42px !important; }
          .phantom-root, .phantom-root * { cursor: auto !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .phantom-reveal, .phantom-glow-blob, .phantom-bounce { animation: none !important; opacity: 1 !important; }
        }
      `}</style>

      <GhostCursor />

      <div className="phantom-root">

        {/* ── Fixed Navigation ── */}
        <nav style={{
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
            <a href="#features" className="phantom-nav-link">Ecosystem</a>
            <a href="#cta"      className="phantom-nav-link">Collective</a>
          </div>

          {/* Enter */}
          <button
            className="phantom-pill phantom-pill-ghost"
            style={{ padding:"10px 24px", fontSize:10 }}
            onClick={() => { setShowForm(true); setTimeout(()=>document.getElementById("ph-email")?.focus(), 100) }}
          >
            Enter
          </button>
        </nav>

        {/* ── Hero ── */}
        <section style={{
          height: "100vh",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "80px 24px 0",
          position: "relative", overflow: "hidden",
        }}>
          <div className="phantom-glow-blob" />

          {/* Badge */}
          <div className="phantom-badge phantom-reveal">
            <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--purple)", boxShadow:"0 0 6px rgba(177,158,239,0.8)" }}/>
            Intelligent Trading Infrastructure
          </div>

          {/* Title */}
          <GradientHeading
            className="phantom-reveal phantom-reveal-d1 phantom-hero-title"
            style={{ fontSize:160, margin:"32px 0 24px" }}
          >
            FXEDGE
          </GradientHeading>

          {/* Subtitle */}
          <p className="phantom-reveal phantom-reveal-d2" style={{
            fontFamily: "'Satoshi',sans-serif", fontSize:20, lineHeight:1.65,
            color: "rgba(255,255,255,0.42)", maxWidth:560, margin:"0 0 48px", fontWeight:400,
          }}>
            A ghost in the machine. Redefining disciplined execution through ethereal minimalist architecture.
          </p>

          {/* Auth form / CTAs */}
          <div className="phantom-reveal phantom-reveal-d3" style={{ width:"100%", maxWidth:440 }}>
            {sent ? (
              <div style={{
                border: "1px solid rgba(177,158,239,0.3)",
                background: "rgba(177,158,239,0.06)",
                borderRadius: 16, padding: "28px 32px", textAlign:"center",
              }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.3em", textTransform:"uppercase", color:"var(--purple)", marginBottom:10 }}>
                  Check Your Inbox
                </div>
                <p style={{ fontFamily:"'Satoshi',sans-serif", fontSize:15, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>
                  Magic link sent to <span style={{ color:"#fff" }}>{email}</span>
                </p>
              </div>
            ) : showForm ? (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <input
                  id="ph-email"
                  className="phantom-input"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
                {err && <div style={{ fontSize:12, color:"#ef4444", textAlign:"center" }}>{err}</div>}
                <button
                  className="phantom-pill phantom-pill-primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ width:"100%" }}
                >
                  {loading ? "Sending…" : "Send Magic Link"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:12, cursor:"none", fontFamily:"'Satoshi',sans-serif" }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
                <button
                  className="phantom-pill phantom-pill-primary"
                  onClick={() => { setShowForm(true); setTimeout(()=>document.getElementById("ph-email")?.focus(), 100) }}
                >
                  Enter the Void
                </button>
                <a href="#features">
                  <button className="phantom-pill phantom-pill-ghost">
                    Explore
                  </button>
                </a>
              </div>
            )}
          </div>

          {/* Scroll cue */}
          <div className="phantom-bounce" style={{ position:"absolute", bottom:40, opacity:0.25 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" style={{ padding:"120px 48px" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:72 }}>
              <h2 className="phantom-display" style={{ fontSize:44, color:"#fff", marginBottom:12 }}>
                Engineered for Edge
              </h2>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.25em", textTransform:"uppercase", color:"rgba(255,255,255,0.3)" }}>
                The Core Components
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

        {/* ── CTA Section ── */}
        <section id="cta" style={{ padding:"120px 48px", textAlign:"center", position:"relative" }}>
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
              THE FUTURE IS GHOSTLY.
            </GradientHeading>

            <p style={{
              fontSize:18, color:"rgba(255,255,255,0.38)",
              lineHeight:1.7, marginBottom:52,
              fontFamily:"'Satoshi',sans-serif",
            }}>
              Don&apos;t trade the market. Become the market.
            </p>

            <div style={{ position:"relative", display:"inline-block" }}>
              <div className="phantom-cta-glow"/>
              <button
                className="phantom-pill phantom-pill-primary"
                style={{ fontSize:12, padding:"18px 52px", position:"relative" }}
                onClick={() => { setShowForm(true); window.scrollTo({top:0,behavior:"smooth"}); setTimeout(()=>document.getElementById("ph-email")?.focus(), 700) }}
              >
                Join the Collective
              </button>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{
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

          <div style={{ display:"flex", gap:28 }}>
            {["Privacy","Terms","Discord"].map(l => (
              <a key={l} href="#" className="phantom-nav-link" style={{ letterSpacing:"0.12em" }}>{l}</a>
            ))}
          </div>

          <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"rgba(255,255,255,0.15)", fontFamily:"'Satoshi',sans-serif" }}>
            © 2026 FXEDGE. VANISHING INTO THIN AIR.
          </p>
        </footer>
      </div>
    </>
  )
}
