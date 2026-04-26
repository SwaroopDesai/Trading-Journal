"use client"
import { useState } from "react";

/* ── Feature data (matches superdesign card order) ─────────────── */
const FEATURES = [
  { lucide:"search",      accent:"blue",  title:"Pattern Detection",    desc:"Auto-surfaces your edges and leaks from your trade history. Know exactly where your high-probability setups originate." },
  { lucide:"calendar",    accent:"pink",  title:"Strategic Planning",   desc:"Set bias, key liquidity levels, and session plans before the open. Architect the day before the market moves." },
  { lucide:"zap",         accent:"blue",  title:"Economic Radar",       desc:"High-impact events with live countdowns and bank holiday warnings baked directly into your workflow." },
  { lucide:"eye-off",     accent:"pink",  title:"Missed Trade Tracker", desc:"Log setups you identified but didn't execute. Quantify the psychological cost of hesitation and over-filtering." },
  { lucide:"bar-chart-3", accent:"blue",  title:"Advanced Analytics",   desc:"Drawdown charts, session grids, and streak tapes. A comprehensive calendar view of your equity performance." },
  { lucide:"brain-circuit",accent:"pink", title:"AI Trade Coach",       desc:"A neural engine that reads your unique journal data to provide personalised coaching based on your real performance." },
]

const FOOTER_LINKS = {
  Platform: ["Journal","Planning","AI Coach"],
  Legal:    ["Privacy","Terms","Data Ownership"],
}

/* ── Iconify SVG via API (no npm dep) ──────────────────────────── */
function LucideIcon({ name, color, size=22 }) {
  return (
    <img
      src={`https://api.iconify.design/lucide/${name}.svg?color=${encodeURIComponent(color)}`}
      width={size} height={size} alt="" aria-hidden="true"
      onError={e => { e.currentTarget.style.display = "none" }}
      style={{ display:"block", flexShrink:0 }}
    />
  )
}

/* ── Main component ─────────────────────────────────────────────── */
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

  /* ── Design tokens (dark / light) ── */
  const BG        = dark ? "#0a0a0a"  : "#f9f8f6"
  const SURF      = dark ? "#141414"  : "#ffffff"
  const BORDER    = dark ? "#262626"  : "#e5e5e5"
  const TEXT      = dark ? "#ffffff"  : "#1a1a1a"
  const DIMMED    = dark ? "#9ca3af"  : "#6b7280"   // gray-400 / gray-500
  const MUTED     = dark ? "#4b5563"  : "#9ca3af"   // gray-600 / gray-400
  const BLUE      = "#3b82f6"
  const PINK      = "#ec4899"
  const NAV_BG    = dark ? "rgba(10,10,10,0.9)"  : "rgba(249,248,246,0.92)"
  const BTN_BG    = dark ? "#ffffff"  : "#1a1a1a"
  const BTN_TXT   = dark ? "#0a0a0a"  : "#ffffff"

  /* ── CSS (scoped inside the page) ── */
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,800;0,900;1,400&family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

    /* Gradient text — must be a CSS class for -webkit-background-clip to work cross-browser */
    .gradient-text {
      background: linear-gradient(135deg, ${BLUE} 0%, ${PINK} 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
    }

    /* Glow orb animations */
    @keyframes pulse-orb {
      0%, 100% { transform: translate(0,0) scale(1); opacity:.5; }
      50%       { transform: translate(50px,-30px) scale(1.1); opacity:.8; }
    }

    /* Entrance animation */
    @keyframes heroIn {
      from { opacity:0; transform:translateY(24px); }
      to   { opacity:1; transform:translateY(0); }
    }

    /* Feature card hover — border-top accent reveal */
    .feat-card {
      background: ${SURF};
      border-top: 1px solid ${BORDER};
      transition: border-top-color .4s cubic-bezier(.25,.46,.45,.94),
                  background .4s cubic-bezier(.25,.46,.45,.94),
                  transform .4s cubic-bezier(.25,.46,.45,.94);
    }
    .feat-card:hover {
      border-top-color: ${BLUE};
      background: ${dark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)"};
      transform: translateY(-4px);
    }

    /* CTA button shimmer */
    .btn-shimmer {
      position:relative; overflow:hidden;
      transition: opacity .15s, transform .15s;
    }
    .btn-shimmer::after {
      content:''; position:absolute;
      top:0; left:-100%; width:100%; height:100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.22), transparent);
      transition: .5s;
    }
    .btn-shimmer:hover::after { left:100%; }
    .btn-shimmer:hover { opacity:.93; }

    /* Email input */
    .email-field {
      width:100%; background:${dark ? "#0a0a0a" : "#f9f8f6"};
      border:none; border-bottom:1px solid ${BORDER};
      padding:14px 8px; font-size:14px; font-family:'Inter',sans-serif;
      color:${TEXT}; outline:none;
      transition: border-color .2s;
    }
    .email-field::placeholder { color:${MUTED}; font-style:italic; }
    .email-field:focus { border-bottom-color:${BLUE}; }

    /* Nav link hover */
    .nav-link { transition:color .15s; color:${DIMMED}; font-size:11px; font-weight:500; letter-spacing:.3em; text-transform:uppercase; text-decoration:none; }
    .nav-link:hover { color:${BLUE}; }

    /* Responsive */
    @media(max-width:1024px){
      .hero-row { flex-direction:column !important; align-items:flex-start !important; }
      .signin-col { width:100% !important; max-width:480px !important; }
      .feat-grid { grid-template-columns:1fr 1fr !important; }
      .hero-h1 { font-size:64px !important; }
    }
    @media(max-width:640px){
      .hero-h1 { font-size:42px !important; }
      .hero-section { padding:120px 24px 60px !important; }
      .feat-section { padding:64px 24px !important; }
      .footer-section { padding:48px 24px 24px !important; }
      .feat-grid { grid-template-columns:1fr !important; }
      .footer-top { flex-direction:column !important; gap:48px !important; }
      .footer-links { grid-template-columns:1fr 1fr !important; }
    }
  `

  return (
    <div style={{ minHeight:"100vh", background:BG, color:TEXT, fontFamily:"'Inter',sans-serif" }}>
      <style>{css}</style>

      {/* ── Glow orbs ── */}
      <div aria-hidden style={{
        position:"fixed", top:0, left:"-10%",
        width:600, height:600, pointerEvents:"none", zIndex:0,
        background:`radial-gradient(circle, rgba(59,130,246,.15) 0%, transparent 70%)`,
        filter:"blur(80px)", animation:"pulse-orb 8s ease-in-out infinite",
      }}/>
      <div aria-hidden style={{
        position:"fixed", bottom:0, right:"-10%",
        width:500, height:500, pointerEvents:"none", zIndex:0,
        background:`radial-gradient(circle, rgba(236,72,153,.12) 0%, transparent 70%)`,
        filter:"blur(80px)", animation:"pulse-orb 10s ease-in-out infinite reverse",
      }}/>

      {/* ════════════════════════════════ NAV ════════════════════════════════ */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:50,
        background:NAV_BG, backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)",
        borderBottom:`1px solid ${BORDER}`,
        height:80, padding:"0 32px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        {/* Logo */}
        <span className="gradient-text" style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, letterSpacing:"-0.04em", textTransform:"uppercase" }}>
          FXEDGE
        </span>

        {/* Right: nav links + status + toggle */}
        <div style={{ display:"flex", alignItems:"center", gap:32 }}>
          <div style={{ display:"flex", alignItems:"center", gap:32 }}>
            <a href="#features" className="nav-link">Features</a>
            <a href="#stats" className="nav-link">Performance</a>
          </div>

          {/* Separator */}
          <div style={{ width:1, height:16, background:BORDER }}/>

          {/* Live status */}
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase" }}>
            <span style={{ color:MUTED, fontSize:10 }}>Status:</span>
            <span style={{ color:BLUE, display:"flex", alignItems:"center", gap:5 }}>
              <span style={{
                width:6, height:6, borderRadius:"50%", background:BLUE, display:"inline-block",
                boxShadow:`0 0 0 0 ${BLUE}`,
                animation:"pulse-orb 2s ease-in-out infinite",
              }}/>
              Active Live Edge
            </span>
          </div>

          {/* Dark / Light toggle */}
          <button onClick={() => setDark(d => !d)} style={{
            background:"none", border:`1px solid ${BORDER}`,
            color:DIMMED, padding:"6px 14px",
            cursor:"pointer", fontSize:11, fontFamily:"Inter,sans-serif",
            letterSpacing:"0.06em",
          }}>{dark ? "☀ Light" : "🌙 Dark"}</button>
        </div>
      </nav>

      {/* ════════════════════════════════ HERO ═══════════════════════════════ */}
      <main id="stats" className="hero-section" style={{ position:"relative", zIndex:1, padding:"160px 32px 128px", maxWidth:1280, margin:"0 auto" }}>

        {/* Badge */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:10,
          border:`1px solid rgba(59,130,246,.3)`, background:"rgba(59,130,246,.05)",
          padding:"8px 20px", marginBottom:48,
          fontSize:11, fontWeight:700, color:BLUE, letterSpacing:"0.3em", textTransform:"uppercase",
          animation:"heroIn .5s cubic-bezier(.16,1,.3,1) both",
        }}>
          <span style={{ width:4, height:4, background:BLUE, display:"inline-block" }}/>
          Institutional Grade Journaling
        </div>

        {/* Headline + form row */}
        <div className="hero-row" style={{ display:"flex", alignItems:"flex-end", gap:64, flexWrap:"nowrap" }}>

          {/* ── Left: headline + subtitle + stats ── */}
          <div style={{ flex:1, minWidth:0, animation:"heroIn .6s .05s cubic-bezier(.16,1,.3,1) both" }}>
            <h1 className="hero-h1" style={{
              fontFamily:"'Playfair Display',serif",
              fontSize:96, fontWeight:900,
              lineHeight:0.85, letterSpacing:"-0.04em",
              marginBottom:48, color:TEXT,
            }}>
              <span style={{ display:"block" }}>The journal</span>
              <span className="gradient-text" style={{ display:"block" }}>around your edge.</span>
            </h1>

            <p style={{
              fontSize:18, color:DIMMED, lineHeight:1.75, maxWidth:520,
              marginBottom:48, fontStyle:"italic", fontFamily:"'Playfair Display',serif",
            }}>
              Transcending simple trade logging. We provide a surgical environment for ICT and SMC
              practitioners to dissect, analyse, and refine every execution.
            </p>

            {/* Stat pills — left-border editorial style */}
            <div style={{ display:"flex", gap:0, marginBottom:0 }}>
              {[
                { n:"15+",  label:"Prop Tools" },
                { n:"SMC",  label:"Native Engine", italic:true },
                { n:"100%", label:"Data Sovereignty" },
              ].map((s, i) => (
                <div key={s.label} style={{ borderLeft:`1px solid ${BORDER}`, paddingLeft:24, marginRight:32 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:30, fontWeight:900, marginBottom:4, fontStyle: s.italic ? "italic" : "normal", color:TEXT }}>{s.n}</div>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.28em", textTransform:"uppercase", color:MUTED }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: sign-in card ── */}
          <div className="signin-col" style={{
            flexShrink:0, width:420,
            animation:"heroIn .7s .12s cubic-bezier(.16,1,.3,1) both",
          }}>
            {!sent ? (
              <div style={{ background:SURF, border:`1px solid ${BORDER}`, padding:"40px" }}>
                <h3 style={{ fontSize:17, fontWeight:700, color:TEXT, letterSpacing:"-0.01em", marginBottom:6 }}>
                  Secure Access
                </h3>
                <p style={{ fontSize:11, color:MUTED, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:32 }}>
                  Passwordless magic link authentication
                </p>

                {/* Email — bottom border only, no rounded corners */}
                <div style={{ marginBottom:24 }}>
                  <input
                    className="email-field"
                    type="email"
                    placeholder="Professional Email Address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && send()}
                  />
                </div>

                {/* White CTA button (matches superdesign HTML) */}
                <button
                  className="btn-shimmer"
                  onClick={send}
                  disabled={loading}
                  style={{
                    width:"100%", padding:"18px 0",
                    background: loading ? MUTED : BTN_BG,
                    color: BTN_TXT,
                    border:"none", cursor: loading ? "not-allowed" : "pointer",
                    fontFamily:"'Inter',sans-serif", fontSize:11,
                    fontWeight:700, letterSpacing:"0.22em", textTransform:"uppercase",
                  }}
                >
                  {loading ? "Sending…" : "Request Magic Link"}
                </button>

                {error && (
                  <p style={{ fontSize:11, color:"#f87171", marginTop:12 }}>{error}</p>
                )}

                {/* Trust line */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, marginTop:20 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <span style={{ fontSize:9, color:MUTED, textTransform:"uppercase", letterSpacing:"0.2em" }}>
                    End-to-End Encrypted Data Infrastructure
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ background:SURF, border:`1px solid ${BORDER}`, padding:"40px", textAlign:"center" }}>
                <div style={{ fontSize:44, marginBottom:16 }}>📬</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:TEXT, marginBottom:8 }}>
                  Check your inbox
                </div>
                <div style={{ fontSize:13, color:DIMMED, lineHeight:1.7 }}>
                  Magic link sent to <strong style={{ color:BLUE }}>{email}</strong>.<br/>
                  Click it to open your journal.
                </div>
                <button onClick={() => setSent(false)} style={{
                  marginTop:24, background:"none", border:`1px solid ${BORDER}`,
                  color:DIMMED, padding:"10px 24px", cursor:"pointer",
                  fontSize:11, letterSpacing:"0.1em", fontFamily:"Inter,sans-serif",
                }}>
                  Use different email
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ════════════════════════════════ FEATURES ═══════════════════════════ */}
      <section id="features" className="feat-section" style={{
        background:BG, borderTop:`1px solid ${BORDER}`,
        padding:"96px 32px", position:"relative", zIndex:1,
      }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>

          {/* Section header — two-column flex */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:72, flexWrap:"wrap", gap:24 }}>
            <div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:44, fontWeight:900, color:TEXT, letterSpacing:"-0.03em", marginBottom:8 }}>
                Infrastructure
              </h2>
              <p style={{ fontSize:11, color:MUTED, textTransform:"uppercase", letterSpacing:"0.22em", fontWeight:700 }}>
                Optimised for professional tape reading
              </p>
            </div>
            <p style={{ fontSize:14, color:DIMMED, fontStyle:"italic", fontFamily:"'Playfair Display',serif", maxWidth:320, lineHeight:1.7, textAlign:"right" }}>
              Built by traders who understand the necessity of precision and the cost of hesitation.
            </p>
          </div>

          {/* 3-col grid — gap:1px fills with border colour (superdesign separator trick) */}
          <div className="feat-grid" style={{
            display:"grid", gridTemplateColumns:"repeat(3,1fr)",
            gap:"1px", background:BORDER,
            border:`1px solid ${BORDER}`,
          }}>
            {FEATURES.map(f => (
              <div key={f.title} className="feat-card" style={{ padding:"48px 40px", display:"flex", flexDirection:"column", gap:28 }}>
                {/* Icon box */}
                <div style={{
                  width:48, height:48,
                  border:`1px solid ${f.accent === "blue" ? "rgba(59,130,246,.25)" : "rgba(236,72,153,.25)"}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0,
                }}>
                  <LucideIcon
                    name={f.lucide}
                    color={f.accent === "blue" ? BLUE : PINK}
                    size={22}
                  />
                </div>

                <div>
                  <h4 style={{ fontFamily:"'Playfair Display',serif", fontSize:19, fontWeight:900, color:TEXT, marginBottom:12, letterSpacing:"-0.01em" }}>
                    {f.title}
                  </h4>
                  <p style={{ fontSize:13, color:DIMMED, lineHeight:1.75, fontWeight:300 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════ FOOTER ═════════════════════════════ */}
      <footer className="footer-section" style={{
        background:BG, borderTop:`1px solid ${BORDER}`,
        padding:"80px 32px 40px", position:"relative", zIndex:1,
      }}>
        <div style={{ maxWidth:1280, margin:"0 auto" }}>

          {/* Top row */}
          <div className="footer-top" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:64, gap:48 }}>

            {/* Brand + desc + social */}
            <div style={{ maxWidth:340 }}>
              <span className="gradient-text" style={{
                fontFamily:"'Playfair Display',serif", fontSize:36,
                fontWeight:900, textTransform:"uppercase", letterSpacing:"-0.03em",
                display:"block", marginBottom:20,
              }}>FXEDGE</span>

              <p style={{ fontSize:13, color:DIMMED, lineHeight:1.75, fontWeight:300, marginBottom:28 }}>
                Crafted for the discerning trader who values data sovereignty and execution precision.
                Built to last through all market cycles.
              </p>

              {/* Social icons */}
              <div style={{ display:"flex", gap:20 }}>
                {[
                  { label:"X (Twitter)", path:"M4 4l16 16M4 20L20 4" },
                  { label:"Discord",     path:"M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" },
                  { label:"YouTube",     path:"M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z M10 15.5l5.19-3L10 9.5z" },
                ].map(s => (
                  <a key={s.label} href="#" aria-label={s.label} style={{ color:MUTED, transition:"color .15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = TEXT}
                    onMouseLeave={e => e.currentTarget.style.color = MUTED}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <path d={s.path}/>
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            <div className="footer-links" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:48 }}>
              {Object.entries(FOOTER_LINKS).map(([group, links]) => (
                <div key={group} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <h5 style={{ fontSize:10, fontWeight:700, letterSpacing:"0.3em", textTransform:"uppercase", color:MUTED }}>
                    {group}
                  </h5>
                  {links.map(l => (
                    <a key={l} href="#" style={{ fontSize:13, color:DIMMED, textDecoration:"none", transition:"color .15s" }}
                      onMouseEnter={e => e.currentTarget.style.color = BLUE}
                      onMouseLeave={e => e.currentTarget.style.color = DIMMED}>{l}</a>
                  ))}
                </div>
              ))}
              {/* System status column */}
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <h5 style={{ fontSize:10, fontWeight:700, letterSpacing:"0.3em", textTransform:"uppercase", color:MUTED }}>System</h5>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:8, height:8, background:"#22c55e", display:"inline-block" }}/>
                  <span style={{ fontSize:12, color:DIMMED }}>All Nodes Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:28, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
            <p style={{ fontSize:10, color:MUTED, textTransform:"uppercase", letterSpacing:"0.2em", fontWeight:500 }}>
              © 2025 FXEDGE INFRASTRUCTURE. All Rights Reserved.
            </p>
            <p style={{ fontSize:10, color:dark ? "#374151" : "#9ca3af", textTransform:"uppercase", letterSpacing:"0.2em", fontWeight:500 }}>
              Designed for high performance. Optimised for alpha.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
