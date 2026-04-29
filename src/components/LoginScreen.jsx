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

/* ── Pairs marquee data ─────────────────────────────────────────────── */
const MARQUEE_PAIRS = [
  // Majors
  { pair:"EURUSD", change:"+0.12%", up:true  }, { pair:"GBPUSD", change:"-0.08%", up:false },
  { pair:"USDJPY", change:"+0.23%", up:true  }, { pair:"USDCHF", change:"-0.05%", up:false },
  { pair:"AUDUSD", change:"+0.18%", up:true  }, { pair:"USDCAD", change:"-0.14%", up:false },
  { pair:"NZDUSD", change:"+0.09%", up:true  },
  // Crosses
  { pair:"EURGBP", change:"+0.06%", up:true  }, { pair:"EURJPY", change:"+0.31%", up:true  },
  { pair:"GBPJPY", change:"-0.19%", up:false }, { pair:"EURCHF", change:"-0.03%", up:false },
  { pair:"EURCAD", change:"+0.15%", up:true  }, { pair:"EURAUD", change:"-0.11%", up:false },
  { pair:"GBPCHF", change:"+0.07%", up:true  }, { pair:"GBPAUD", change:"-0.22%", up:false },
  { pair:"GBPCAD", change:"+0.10%", up:true  }, { pair:"AUDJPY", change:"+0.28%", up:true  },
  { pair:"CADJPY", change:"-0.16%", up:false }, { pair:"CHFJPY", change:"+0.04%", up:true  },
  { pair:"NZDJPY", change:"-0.09%", up:false }, { pair:"AUDCAD", change:"+0.13%", up:true  },
  { pair:"AUDCHF", change:"-0.07%", up:false }, { pair:"AUDNZD", change:"+0.05%", up:true  },
  { pair:"NZDCAD", change:"-0.11%", up:false }, { pair:"NZDCHF", change:"+0.08%", up:true  },
  { pair:"CADCHF", change:"-0.04%", up:false }, { pair:"GBPNZD", change:"+0.17%", up:true  },
  // Metals
  { pair:"XAUUSD", change:"+0.44%", up:true  }, { pair:"XAGUSD", change:"-0.31%", up:false },
  // Indices
  { pair:"GER30",  change:"+0.67%", up:true  }, { pair:"SPX500", change:"+0.38%", up:true  },
  { pair:"NAS100", change:"-0.25%", up:false }, { pair:"US30",   change:"+0.19%", up:true  },
  { pair:"UK100",  change:"-0.12%", up:false }, { pair:"JP225",  change:"+0.51%", up:true  },
  { pair:"AUS200", change:"-0.09%", up:false },
  // Crypto
  { pair:"BTCUSD", change:"+1.24%", up:true  }, { pair:"ETHUSD", change:"+0.87%", up:true  },
  // Oil
  { pair:"USOIL",  change:"-0.55%", up:false }, { pair:"UKOIL",  change:"-0.48%", up:false },
]

/* ── App feature grid data ──────────────────────────────────────────── */
const APP_FEATURES = [
  { icon:"layout-dashboard", label:"Dashboard",      desc:"P&L, win rate, equity curve at a glance"   },
  { icon:"notebook-pen",     label:"Trade Journal",  desc:"Log every trade in under 2 minutes"        },
  { icon:"calendar-check",   label:"Daily Plan",     desc:"Pre-session bias and watchlist"            },
  { icon:"bar-chart-3",      label:"Analytics",      desc:"50+ stats broken down by pair and session" },
  { icon:"brain",            label:"Psychology",     desc:"Emotion and mistake pattern tracking"      },
  { icon:"map",              label:"Heatmap",        desc:"Visualise your best and worst days"        },
  { icon:"book-open",        label:"Playbook",       desc:"Document your setups with rules"           },
  { icon:"sparkles",         label:"AI Analysis",    desc:"Screenshot upload → instant AI feedback"  },
  { icon:"newspaper",        label:"Calendar",       desc:"High-impact news filtered for your pairs"  },
  { icon:"search",           label:"Patterns",       desc:"AI detects recurring habits in your data"  },
  { icon:"eye",              label:"Missed Trades",  desc:"Track setups you saw but didn't take"      },
  { icon:"file-down",        label:"Export",         desc:"Download your journal as CSV or PDF"       },
]

/* ── FAQ data ───────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: "Is FXEDGE free to use?",
    a: "During the early access / beta period it is completely free for approved users. Pricing will be introduced when we open to the public — early access members will always get a better deal.",
  },
  {
    q: "Do I need to connect my broker or MT4/MT5?",
    a: "No connection needed. FXEDGE is a manual journal — you log trades yourself. This means it works with every broker, every platform, and every market without giving anyone access to your account.",
  },
  {
    q: "Is my trade data private and secure?",
    a: "Yes. Your data belongs to you only. We use Supabase with row-level security — it is physically impossible for another user to read your trades. We will never sell or share your data.",
  },
  {
    q: "What trading styles and markets does it support?",
    a: "FXEDGE is built around ICT and SMC concepts — kill zones, liquidity sweeps, order blocks, POI, manipulation, and higher timeframe structure. It supports Forex, Gold, Silver, Indices (GER30, NAS100, SPX500, US30), and Crypto. Any discretionary trader will find it useful.",
  },
  {
    q: "When will I get access after joining the waitlist?",
    a: "We review applications and approve in batches every few days. Earlier signups get priority. You will receive a magic link by email the moment your spot opens — no password required.",
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

/* ── Scroll reveal hook ────────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    if (!els.length) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-revealed')
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
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
  const [faqOpen,   setFaqOpen]   = useState(null)

  useReveal()

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

        /* Hero floating cards */
        @keyframes heroFloat1 {
          0%,100% { transform: translateY(-50%); }
          50%      { transform: translateY(calc(-50% - 14px)); }
        }
        @keyframes heroFloat2 {
          0%,100% { transform: translateY(-44%); }
          50%      { transform: translateY(calc(-44% + 14px)); }
        }
        .phantom-hero-float {
          position: absolute;
          top: 50%;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 20px 22px;
          pointer-events: none;
        }
        .phantom-hero-float-l {
          left: 60px;
          width: 224px;
          animation: heroFloat1 5.5s ease-in-out infinite;
        }
        .phantom-hero-float-r {
          right: 60px;
          width: 210px;
          animation: heroFloat2 6s ease-in-out infinite;
        }
        @media (max-width: 1280px) {
          .phantom-hero-float-l { left: 24px; }
          .phantom-hero-float-r { right: 24px; }
        }
        @media (max-width: 1080px) {
          .phantom-hero-float { display: none !important; }
        }

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

        /* ── Scroll reveal ──────────────────────────────────────── */
        [data-reveal] {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity .85s cubic-bezier(.16,1,.3,1), transform .85s cubic-bezier(.16,1,.3,1);
        }
        [data-reveal].is-revealed { opacity: 1; transform: none; }
        [data-reveal][data-delay="1"] { transition-delay: .08s; }
        [data-reveal][data-delay="2"] { transition-delay: .17s; }
        [data-reveal][data-delay="3"] { transition-delay: .26s; }
        [data-reveal][data-delay="4"] { transition-delay: .35s; }
        @media (prefers-reduced-motion: reduce) {
          [data-reveal] { opacity: 1 !important; transform: none !important; transition: none !important; }
        }

        /* ── Stats bar ──────────────────────────────────────────── */
        .phantom-stat-bar { display: flex; align-items: stretch; }
        .phantom-stat-item {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 8px; padding: 40px 56px; flex: 1;
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        .phantom-stat-item:last-child { border-right: none; }

        /* ── How it works ───────────────────────────────────────── */
        .phantom-step-grid { display: grid; grid-template-columns: repeat(3,1fr); }
        .phantom-step { padding: 44px 40px; border-right: 1px solid rgba(255,255,255,0.07); }
        .phantom-step:last-child { border-right: none; }

        /* ── Testimonials ───────────────────────────────────────── */
        .phantom-testi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }

        /* Stars */
        .phantom-stars { color: var(--purple); font-size: 13px; letter-spacing: 3px; margin-bottom: 20px; }

        /* ── Pairs marquee ──────────────────────────────────────── */
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .phantom-marquee-outer {
          overflow: hidden;
          mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
        }
        .phantom-marquee-track {
          display: inline-flex;
          animation: marqueeScroll 70s linear infinite;
          will-change: transform;
        }
        .phantom-marquee-outer:hover .phantom-marquee-track { animation-play-state: paused; }
        .phantom-marquee-item {
          display: flex; align-items: center; gap: 10px;
          padding: 0 28px;
          border-right: 1px solid rgba(255,255,255,0.05);
          white-space: nowrap;
          font-family: 'Cabinet Grotesk', sans-serif;
          font-weight: 800; font-size: 12px; letter-spacing: 0.04em;
          flex-shrink: 0;
        }

        /* ── Feature grid ───────────────────────────────────────── */
        .phantom-feat-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 22px;
          overflow: hidden;
        }
        .phantom-feat-item {
          padding: 28px 20px 24px;
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; text-align: center;
          border-right: 1px solid rgba(255,255,255,0.07);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.01);
          transition: background .3s;
          cursor: default;
        }
        .phantom-feat-item:hover { background: rgba(177,158,239,0.06); }
        .phantom-feat-item:nth-child(6n) { border-right: none; }
        .phantom-feat-item:nth-child(n+7) { border-bottom: none; }

        /* ── AI chat preview ────────────────────────────────────── */
        .phantom-chat-wrap {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 32px;
          display: flex; flex-direction: column; gap: 16px;
          max-height: 520px; overflow: hidden;
        }
        .phantom-chat-user {
          align-self: flex-end;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 18px 18px 4px 18px;
          padding: 12px 18px;
          font-family: 'Satoshi', sans-serif;
          font-size: 13px; color: rgba(255,255,255,0.65);
          max-width: 72%;
        }
        .phantom-chat-ai {
          align-self: flex-start;
          background: rgba(177,158,239,0.07);
          border: 1px solid rgba(177,158,239,0.18);
          border-radius: 18px 18px 18px 4px;
          padding: 18px 20px;
          font-family: 'Satoshi', sans-serif;
          font-size: 13px; color: rgba(255,255,255,0.7);
          line-height: 1.75; max-width: 90%;
        }
        .phantom-chat-ai strong { color: #fff; font-weight: 700; }
        .phantom-chat-ai .chat-tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 3px 10px; border-radius: 999px;
          font-size: 11px; font-weight: 700;
          background: rgba(177,158,239,0.12);
          color: var(--purple); margin-bottom: 12px;
        }
        .phantom-typing {
          display: flex; gap: 5px; align-items: center; padding: 4px 0;
        }
        .phantom-typing span {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--purple); opacity: .5;
          animation: typingDot 1.2s ease-in-out infinite;
        }
        .phantom-typing span:nth-child(2) { animation-delay: .2s; }
        .phantom-typing span:nth-child(3) { animation-delay: .4s; }
        @keyframes typingDot {
          0%,80%,100% { transform: scale(.7); opacity:.3; }
          40%          { transform: scale(1);  opacity:1;  }
        }

        /* ── FAQ ────────────────────────────────────────────────── */
        .phantom-faq-item {
          border-bottom: 1px solid rgba(255,255,255,0.07);
          padding: 0;
          overflow: hidden;
        }
        .phantom-faq-item:first-child { border-top: 1px solid rgba(255,255,255,0.07); }
        .phantom-faq-q {
          display: flex; justify-content: space-between; align-items: center;
          padding: 24px 4px;
          cursor: pointer;
          font-family: 'Cabinet Grotesk', sans-serif;
          font-size: 17px; font-weight: 800;
          color: rgba(255,255,255,0.85);
          letter-spacing: -0.02em;
          transition: color .2s;
          gap: 16px;
        }
        .phantom-faq-q:hover { color: #fff; }
        .phantom-faq-chevron {
          font-size: 18px; color: var(--purple); flex-shrink: 0;
          transition: transform .3s cubic-bezier(.16,1,.3,1);
        }
        .phantom-faq-chevron.open { transform: rotate(45deg); }
        .phantom-faq-a {
          font-family: 'Satoshi', sans-serif;
          font-size: 15px; color: rgba(255,255,255,0.42);
          line-height: 1.8; padding: 0 4px 24px;
          max-height: 0; overflow: hidden;
          transition: max-height .4s cubic-bezier(.16,1,.3,1), padding .3s;
        }
        .phantom-faq-a.open { max-height: 200px; }

        /* ── Mobile additions ───────────────────────────────────── */
        @media (max-width: 768px) {
          .phantom-stat-bar { flex-wrap: wrap; }
          .phantom-stat-item { width: 50%; padding: 28px 16px; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
          .phantom-step-grid { grid-template-columns: 1fr; }
          .phantom-step { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.07); padding: 32px 24px; }
          .phantom-step:last-child { border-bottom: none; }
          .phantom-testi-grid { grid-template-columns: 1fr; }
          .phantom-feat-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .phantom-feat-item:nth-child(6n) { border-right: 1px solid rgba(255,255,255,0.07); }
          .phantom-feat-item:nth-child(3n) { border-right: none !important; }
          .phantom-feat-item:nth-child(n+10) { border-bottom: none; }
          .phantom-feat-item:nth-child(n+7):nth-child(-n+9) { border-bottom: 1px solid rgba(255,255,255,0.07); }
          .phantom-chat-wrap { padding: 20px; }
          .phantom-faq-q { font-size: 15px; }
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

          {/* ── Left float: trade card ── */}
          <div className="phantom-hero-float phantom-hero-float-l">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <span style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:900, fontSize:15, color:"#fff", letterSpacing:"-0.04em" }}>EURUSD</span>
              <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.12em", textTransform:"uppercase" }}>London</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <span style={{ background:"rgba(34,197,94,0.12)", color:"#4ade80", padding:"3px 10px", borderRadius:999, fontSize:11, fontWeight:700 }}>LONG ↑</span>
              <span style={{ color:"#4ade80", fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:900, fontSize:15 }}>+2.3R</span>
            </div>
            {/* Sparkline */}
            <svg width="180" height="38" viewBox="0 0 180 38" fill="none" aria-hidden="true" style={{ display:"block", marginBottom:10 }}>
              <defs>
                <linearGradient id="sg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(74,222,128,0.18)"/>
                  <stop offset="100%" stopColor="rgba(74,222,128,0)"/>
                </linearGradient>
              </defs>
              <path d="M0 30 C18 28 32 24 52 20 C72 16 86 12 106 8 C126 4 148 3 180 2" stroke="rgba(74,222,128,0.55)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M0 30 C18 28 32 24 52 20 C72 16 86 12 106 8 C126 4 148 3 180 2 L180 38 L0 38 Z" fill="url(#sg1)"/>
            </svg>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.25)" }}>Entry 1.08420</span>
              <span style={{ fontSize:10, color:"rgba(255,255,255,0.25)" }}>+46 pips</span>
            </div>
          </div>

          {/* ── Right float: weekly stats ── */}
          <div className="phantom-hero-float phantom-hero-float-r">
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.16em", color:"rgba(255,255,255,0.28)", textTransform:"uppercase", marginBottom:16 }}>This Week</div>
            {[
              { label:"Win Rate",  value:"68%",    accent:true  },
              { label:"Avg R:R",   value:"2.1R",   accent:false },
              { label:"Best Pair", value:"EURUSD", accent:false },
              { label:"Net P&L",   value:"+8.4R",  accent:true  },
            ].map(row => (
              <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:11 }}>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:"'Satoshi',sans-serif" }}>{row.label}</span>
                <span style={{ fontSize:13, fontWeight:900, fontFamily:"'Cabinet Grotesk',sans-serif", letterSpacing:"-0.03em", color: row.accent ? "#4ade80" : "rgba(255,255,255,0.85)" }}>{row.value}</span>
              </div>
            ))}
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:11, marginTop:4, fontSize:11, color:"rgba(177,158,239,0.65)", fontFamily:"'Satoshi',sans-serif" }}>
              ↑ 12% vs last week
            </div>
          </div>

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
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.22)", textAlign:"center", fontFamily:"'Satoshi',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", boxShadow:"0 0 6px rgba(74,222,128,0.7)", display:"inline-block", flexShrink:0 }}/>
                  412 traders already on the waitlist · Early access only
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
          <div className="phantom-bounce" style={{ position:"absolute", bottom:76, opacity:0.22 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>

          {/* ── Pairs ticker pinned to bottom of hero ── */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, borderTop:"1px solid rgba(255,255,255,0.06)", background:"rgba(0,0,0,0.25)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", padding:"13px 0" }}>
            <div className="phantom-marquee-outer">
              <div className="phantom-marquee-track">
                {[...MARQUEE_PAIRS, ...MARQUEE_PAIRS].map((p, i) => (
                  <div key={i} className="phantom-marquee-item" aria-hidden={i >= MARQUEE_PAIRS.length}>
                    <span style={{ color: p.up ? "#4ade80" : "#f87171", fontSize:8 }}>{p.up ? "▲" : "▼"}</span>
                    <span style={{ color:"rgba(255,255,255,0.7)" }}>{p.pair}</span>
                    <span style={{ color: p.up ? "#4ade80" : "#f87171", fontSize:11, fontWeight:700 }}>{p.change}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats trust bar ── */}
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <div className="phantom-stat-bar" style={{ maxWidth:1100, margin:"0 auto" }}>
            {[
              { num:"500+",   label:"Traders on the waitlist"       },
              { num:"2 min",  label:"To log a complete trade"       },
              { num:"10+",    label:"Metrics tracked automatically" },
              { num:"Weekly", label:"AI debrief, every week"        },
            ].map((s, i) => (
              <div key={i} className="phantom-stat-item" data-reveal data-delay={String(i + 1)}>
                <span style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:900, fontSize:34, color:"#fff", letterSpacing:"-0.05em", lineHeight:1 }}>{s.num}</span>
                <span style={{ fontSize:11, color:"rgba(255,255,255,0.28)", letterSpacing:"0.1em", textAlign:"center", fontFamily:"'Satoshi',sans-serif" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Why traders fail ── */}
        <section className="phantom-section" style={{ padding:"120px 48px" }}>
          <div style={{ maxWidth:1100, margin:"0 auto" }}>
            <div className="phantom-two-col" data-reveal>
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

        {/* ── How it works ── */}
        <section className="phantom-section" style={{ padding:"120px 48px" }}>
          <div style={{ maxWidth:1100, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:72 }} data-reveal>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.25em", textTransform:"uppercase", color:"rgba(177,158,239,0.6)", marginBottom:16 }}>
                How It Works
              </p>
              <h2 className="phantom-display phantom-section-h2" style={{ fontSize:44, color:"#fff", marginBottom:0 }}>
                Set up in one session. Use it forever.
              </h2>
            </div>

            <div className="phantom-step-grid" style={{ border:"1px solid rgba(255,255,255,0.07)", borderRadius:24, overflow:"hidden" }}>
              {[
                {
                  num: "01",
                  title: "Log your trade",
                  body: "Fill in what happened — pair, setup, entry, SL, TP, emotions, mistakes. Takes under 2 minutes. Works on any device, even mid-session.",
                  icon: "notebook-pen",
                },
                {
                  num: "02",
                  title: "Find your edge",
                  body: "FXEDGE shows which pairs, sessions, and setups actually work for you. Not what worked for someone on YouTube — what works for you, based on your own trades.",
                  icon: "bar-chart-3",
                },
                {
                  num: "03",
                  title: "Trade better",
                  body: "Use your data to fix the real leaks. Stop the same mistakes. Build a system based on evidence, not gut feeling. Let AI read your journal every week.",
                  icon: "trending-up",
                },
              ].map((s, i) => (
                <div key={i} className="phantom-step" data-reveal data-delay={String(i + 1)}
                  style={{ background:"rgba(255,255,255,0.01)" }}>
                  <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:12, fontWeight:900, color:"rgba(177,158,239,0.35)", letterSpacing:"0.14em", marginBottom:28 }}>{s.num}</div>
                  <div style={{ width:44, height:44, borderRadius:12, background:"rgba(177,158,239,0.08)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:24 }}>
                    <Icon name={s.icon} size={20} />
                  </div>
                  <h3 className="phantom-display" style={{ fontSize:21, color:"#fff", marginBottom:14 }}>{s.title}</h3>
                  <p style={{ fontSize:14, color:"rgba(255,255,255,0.38)", lineHeight:1.8, fontFamily:"'Satoshi',sans-serif", margin:0 }}>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Divider ── */}
        <div style={{ maxWidth:1100, margin:"0 auto 0", height:1, background:"linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)" }}/>

        {/* ── Feature overview grid ── */}
        <section className="phantom-section" style={{ padding:"120px 48px" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:64 }} data-reveal>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.25em", textTransform:"uppercase", color:"rgba(177,158,239,0.6)", marginBottom:16 }}>Everything inside</p>
              <h2 className="phantom-display phantom-section-h2" style={{ fontSize:44, color:"#fff", marginBottom:12 }}>
                One journal. Twelve tools.
              </h2>
              <p style={{ fontSize:16, color:"rgba(255,255,255,0.32)", fontFamily:"'Satoshi',sans-serif", maxWidth:480, margin:"0 auto" }}>
                Everything a serious trader needs — built in, not bolted on.
              </p>
            </div>
            <div className="phantom-feat-grid" data-reveal>
              {APP_FEATURES.map((f, i) => (
                <div key={i} className="phantom-feat-item" title={f.desc}>
                  <div style={{ width:42, height:42, borderRadius:12, background:"rgba(177,158,239,0.09)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Icon name={f.icon} size={18} />
                  </div>
                  <span style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:12, color:"rgba(255,255,255,0.7)", letterSpacing:"0.01em" }}>{f.label}</span>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.28)", fontFamily:"'Satoshi',sans-serif", lineHeight:1.5 }}>{f.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

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

        {/* ── AI chat preview ── */}
        <section className="phantom-section-sm" style={{ padding:"0 48px 120px" }}>
          <div style={{ maxWidth:1100, margin:"0 auto" }}>
            <div className="phantom-wide-card" style={{ background:"rgba(177,158,239,0.02)", borderColor:"rgba(177,158,239,0.1)" }}>
              <div style={{ position:"absolute", top:-60, right:-60, width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(177,158,239,0.12) 0%,transparent 70%)", filter:"blur(60px)", pointerEvents:"none" }}/>
              <div className="phantom-two-col" style={{ position:"relative", gap:60 }}>

                {/* Left — copy */}
                <div data-reveal>
                  <div className="phantom-badge" style={{ marginBottom:24 }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--purple)", boxShadow:"0 0 6px rgba(177,158,239,0.8)" }}/>
                    Weekly AI Debrief
                  </div>
                  <h2 className="phantom-display phantom-section-h2" style={{ fontSize:42, color:"#fff", lineHeight:1.1, marginBottom:20 }}>
                    Your AI coach reads every trade you log.
                  </h2>
                  <p style={{ fontSize:15, color:"rgba(255,255,255,0.38)", lineHeight:1.85, fontFamily:"'Satoshi',sans-serif", marginBottom:32 }}>
                    Every week FXEDGE AI reads through your full trade history and tells you exactly what to fix — which sessions are costing you, which setups are working, and where your emotional leaks are. No guessing. No spreadsheets.
                  </p>
                  {["Detects your losing patterns automatically","Compares this week vs last week","Tells you what to focus on next session","Reads emotions, mistakes, and R:R together"].map((item,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--purple)", flexShrink:0 }}/>
                      <span style={{ fontSize:14, color:"rgba(255,255,255,0.5)", fontFamily:"'Satoshi',sans-serif" }}>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Right — live chat mock */}
                <div data-reveal data-delay="2">
                  {/* Header bar */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, paddingBottom:16, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(177,158,239,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>✦</div>
                    <div>
                      <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:900, fontSize:13, color:"#fff" }}>FXEDGE AI</div>
                      <div style={{ fontSize:10, color:"#4ade80", display:"flex", alignItems:"center", gap:5 }}>
                        <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", display:"inline-block" }}/>online
                      </div>
                    </div>
                  </div>

                  <div className="phantom-chat-wrap" style={{ padding:0, background:"none", border:"none", maxHeight:"none" }}>
                    {/* User message */}
                    <div className="phantom-chat-user">Run my weekly debrief — Apr 21 to 25</div>

                    {/* AI response 1 */}
                    <div className="phantom-chat-ai">
                      <div className="chat-tag">✦ Weekly Debrief · Apr 21–25</div>
                      <div>
                        You took <strong>14 trades</strong>, finishing <strong style={{ color:"#4ade80" }}>+6.2R</strong>. Win rate <strong>64%</strong> (9W / 5L). Your average winner was 2.1R vs loser 0.8R — solid asymmetry.<br/><br/>
                        <span style={{ color:"#f87171" }}>⚠ 4 of your 5 losses came after 3PM NY.</span> You are consistently over-trading the late session. Consider a hard cut-off at NY open close.<br/><br/>
                        <span style={{ color:"#4ade80" }}>✓ London kill zone is your strongest window</span> — 7 of 8 wins. Liquidity sweep + OB entries averaged +2.4R.
                      </div>
                    </div>

                    {/* User message 2 */}
                    <div className="phantom-chat-user">Which pair should I focus on next week?</div>

                    {/* AI response 2 */}
                    <div className="phantom-chat-ai">
                      Based on your last 90 days:<br/><br/>
                      <strong style={{ color:"#4ade80" }}>🥇 EURUSD</strong> — 71% win rate, avg +2.3R (28 trades)<br/>
                      <strong style={{ color:"#4ade80" }}>🥈 XAUUSD</strong> — 68% win rate, avg +1.9R (12 trades)<br/>
                      <strong style={{ color:"#f87171" }}>⚠ GBPJPY</strong> — 38% win rate. Suggest removing until studied further.
                    </div>

                    {/* Typing indicator */}
                    <div style={{ display:"flex", alignItems:"center", gap:10, opacity:0.5 }}>
                      <div style={{ width:26, height:26, borderRadius:"50%", background:"rgba(177,158,239,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11 }}>✦</div>
                      <div className="phantom-typing">
                        <span/><span/><span/>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="phantom-section-sm" style={{ padding:"0 48px 120px" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:64 }} data-reveal>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.25em", textTransform:"uppercase", color:"rgba(177,158,239,0.6)", marginBottom:16 }}>
                Traders who stopped guessing
              </p>
              <h2 className="phantom-display phantom-section-h2" style={{ fontSize:44, color:"#fff" }}>
                Real results. Real traders.
              </h2>
            </div>

            <div className="phantom-testi-grid">
              {[
                {
                  quote: "I was making money some weeks and blowing it the next, with no idea why. Two weeks of logging showed me I was overtrading Asian session after every bad London day. The journal literally diagnosed me.",
                  name: "Marcus T.",
                  role: "Forex Trader · London",
                },
                {
                  quote: "The pre-trade checklist stopped me from entering a revenge trade after a -1.5R loss on NFP. I checked the list, knew I wasn't calm, and stayed out. It saved my entire week.",
                  name: "Priya S.",
                  role: "ICT Trader · 2 years",
                },
                {
                  quote: "Every other journal I tried was a spreadsheet. FXEDGE shows you patterns you can't see yourself — which sessions drain you, which setups win, which emotions kill your R:R.",
                  name: "James O.",
                  role: "SMC Trader · Full time",
                },
              ].map((t, i) => (
                <div key={i} className="phantom-card" data-reveal data-delay={String(i + 1)}
                  style={{ display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                  <div>
                    <div className="phantom-stars">★★★★★</div>
                    <p style={{ fontSize:14, color:"rgba(255,255,255,0.5)", lineHeight:1.85, fontFamily:"'Satoshi',sans-serif", margin:0 }}>
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:14, marginTop:28, paddingTop:24, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{
                      width:38, height:38, borderRadius:"50%", flexShrink:0,
                      background:`rgba(177,158,239,${0.12 + i * 0.04})`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:900, fontSize:15, color:"var(--purple)",
                    }}>
                      {t.name[0]}
                    </div>
                    <div>
                      <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:900, fontSize:14, color:"#fff", letterSpacing:"-0.02em" }}>{t.name}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.28)", fontFamily:"'Satoshi',sans-serif", marginTop:3 }}>{t.role}</div>
                    </div>
                  </div>
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

        {/* ── FAQ ── */}
        <section className="phantom-section-sm" style={{ padding:"0 48px 120px" }}>
          <div style={{ maxWidth:800, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:64 }} data-reveal>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.25em", textTransform:"uppercase", color:"rgba(177,158,239,0.6)", marginBottom:16 }}>FAQ</p>
              <h2 className="phantom-display phantom-section-h2" style={{ fontSize:44, color:"#fff" }}>
                Questions answered.
              </h2>
            </div>
            <div data-reveal>
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="phantom-faq-item">
                  <div className="phantom-faq-q" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                    <span>{item.q}</span>
                    <span className={`phantom-faq-chevron${faqOpen === i ? " open" : ""}`}>+</span>
                  </div>
                  <div className={`phantom-faq-a${faqOpen === i ? " open" : ""}`}>
                    {item.a}
                  </div>
                </div>
              ))}
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
