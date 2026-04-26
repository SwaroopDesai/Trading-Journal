"use client"
import { useState } from "react";
import { DARK, LIGHT } from "@/lib/constants";

const FEATURES = [
  { icon:"📊", title:"Pattern Detection",      desc:"Auto-surfaces your edges and leaks from your trade history. Know exactly where your edge is — and where it isn't." },
  { icon:"📅", title:"Daily & Weekly Planning", desc:"Set bias, key levels, and session plan before the open. Build the day before the market does." },
  { icon:"📰", title:"Economic Calendar",       desc:"High-impact events with live countdown, Supabase cache fallback, and bank holiday warnings." },
  { icon:"👁",  title:"Missed Trade Tracker",   desc:"Log setups you saw but didn't take. Find out if you're over-filtering or saving yourself from bad trades." },
  { icon:"🔥", title:"Heatmap & Analytics",     desc:"Calendar view, session grid, day-of-week breakdown, streak tape, and drawdown chart — all in one." },
  { icon:"✨", title:"AI Trade Coach",           desc:"Reads your actual journal data and gives you personalised coaching — not generic advice." },
]

const STATS = [
  { n:"15+", label:"tools in one app" },
  { n:"ICT/SMC", label:"native concepts" },
  { n:"100%", label:"your data, your control" },
]

export default function LoginScreen({ supabase }) {
  const [email,   setEmail]   = useState("")
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [dark,    setDark]    = useState(true)
  const T = dark ? DARK : LIGHT

  const send = async () => {
    if (!email) return
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email, options:{ emailRedirectTo: window.location.origin }
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true); setLoading(false)
  }

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"Inter,sans-serif", transition:"background .3s, color .3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes heroFade { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes glowPulse { 0%,100%{opacity:.3} 50%{opacity:.7} }
        .feat-card:hover { border-color: ${T.accentBright}66 !important; transform:translateY(-3px); }
        .feat-card { transition: border-color .2s, transform .2s, box-shadow .2s; }
        .sign-in-btn:hover { opacity:.9; transform:scale(1.02); }
        .sign-in-btn { transition: opacity .15s, transform .15s; }
        @media(max-width:640px){
          .hero-title{font-size:36px !important;}
          .features-grid{grid-template-columns:1fr !important;}
          .stats-row{gap:20px !important;}
          .hero-pad{padding:60px 20px 40px !important;}
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position:"sticky", top:0, zIndex:50,
        borderBottom:`1px solid ${T.border}`,
        background:`${T.bg}ee`, backdropFilter:"blur(14px)",
        padding:"14px 32px", display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:20, fontWeight:800, background:`linear-gradient(135deg,${T.accentBright},${T.pink})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          FXEDGE
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:11, color:T.muted, letterSpacing:"0.1em" }}>ICT / SMC</span>
          <button onClick={() => setDark(!dark)} style={{
            background:T.surface2, border:`1px solid ${T.border}`,
            color:T.textDim, padding:"5px 14px", borderRadius:20,
            cursor:"pointer", fontSize:12, fontFamily:"Inter,sans-serif",
          }}>{dark ? "☀️ Light" : "🌙 Dark"}</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-pad" style={{ padding:"80px 32px 60px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        {/* Background glow orbs */}
        <div aria-hidden style={{ position:"absolute", top:-100, left:"20%", width:400, height:400, borderRadius:"50%", background:`radial-gradient(circle,${T.accent}18 0%,transparent 70%)`, animation:"glowPulse 4s ease-in-out infinite", pointerEvents:"none" }}/>
        <div aria-hidden style={{ position:"absolute", top:-60, right:"15%", width:300, height:300, borderRadius:"50%", background:`radial-gradient(circle,${T.pink}12 0%,transparent 70%)`, animation:"glowPulse 5s ease-in-out infinite 1s", pointerEvents:"none" }}/>

        <div style={{ position:"relative", animation:"heroFade .6s cubic-bezier(.16,1,.3,1) both" }}>
          {/* Badge */}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:6,
            background:`${T.accent}18`, border:`1px solid ${T.accent}40`,
            borderRadius:999, padding:"5px 14px", marginBottom:24,
            fontSize:11, fontWeight:700, color:T.accentBright, letterSpacing:"0.1em",
          }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:T.accentBright, display:"inline-block" }}/>
            BUILT FOR ICT &amp; SMC TRADERS
          </div>

          {/* Headline */}
          <h1 className="hero-title" style={{
            fontFamily:"'Plus Jakarta Sans',sans-serif",
            fontSize:52, fontWeight:800, lineHeight:1.1,
            letterSpacing:"-0.03em", marginBottom:20,
            background:`linear-gradient(135deg,${T.text} 30%,${T.accentBright})`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>
            The trading journal<br/>built around your edge.
          </h1>

          {/* Sub */}
          <p style={{ fontSize:16, color:T.textDim, lineHeight:1.75, maxWidth:520, margin:"0 auto 36px" }}>
            Log trades, plan sessions, detect patterns, track missed setups, and get AI coaching — all in one clean app designed specifically for ICT and SMC traders.
          </p>

          {/* Stats */}
          <div className="stats-row" style={{ display:"flex", justifyContent:"center", gap:40, marginBottom:48 }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:800, color:T.accentBright }}>{s.n}</div>
                <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Sign-in form */}
          {!sent ? (
            <div style={{
              background:T.surface, border:`1px solid ${T.border}`,
              borderRadius:20, padding:"24px 28px",
              maxWidth:400, margin:"0 auto",
              boxShadow:`0 20px 60px ${T.cardGlow}`,
              animation:"heroFade .7s .15s cubic-bezier(.16,1,.3,1) both",
            }}>
              <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>
                Get started — it&apos;s free
              </div>
              <div style={{ fontSize:12, color:T.muted, marginBottom:16 }}>
                No password needed. We&apos;ll send you a magic link.
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <input
                  type="email" placeholder="your@email.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                  style={{
                    flex:1, background:T.surface2, border:`1px solid ${T.border}`,
                    color:T.text, fontFamily:"Inter,sans-serif", fontSize:14,
                    padding:"11px 14px", borderRadius:10, outline:"none",
                  }}
                />
                <button className="sign-in-btn" onClick={send} disabled={loading} style={{
                  background:`linear-gradient(135deg,${T.accentBright},${T.pink})`,
                  color:"#fff", border:"none", padding:"11px 20px",
                  fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:13,
                  fontWeight:700, cursor:"pointer", borderRadius:10,
                  whiteSpace:"nowrap", opacity:loading?.7:1,
                }}>
                  {loading ? "…" : "Sign In →"}
                </button>
              </div>
              {error && <div style={{ fontSize:12, color:T.red, marginTop:8 }}>{error}</div>}
            </div>
          ) : (
            <div style={{
              background:T.surface, border:`1px solid ${T.green}44`,
              borderRadius:20, padding:"28px",
              maxWidth:400, margin:"0 auto", textAlign:"center",
              boxShadow:`0 20px 60px ${T.cardGlow}`,
            }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📬</div>
              <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:16, fontWeight:700, color:T.text, marginBottom:6 }}>Check your inbox</div>
              <div style={{ fontSize:13, color:T.textDim, lineHeight:1.6 }}>
                Magic link sent to <strong style={{ color:T.accentBright }}>{email}</strong>.<br/>Click it to open your journal.
              </div>
              <button onClick={() => setSent(false)} style={{ marginTop:16, background:"none", border:`1px solid ${T.border}`, color:T.textDim, padding:"7px 18px", borderRadius:8, cursor:"pointer", fontSize:12 }}>
                Use different email
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding:"60px 32px", maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.accentBright, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:10 }}>Everything you need</div>
          <h2 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:28, fontWeight:800, color:T.text, letterSpacing:"-0.02em" }}>
            Not just a trade logger.
          </h2>
          <p style={{ fontSize:14, color:T.textDim, marginTop:8, lineHeight:1.7 }}>
            Every feature is designed around how ICT and SMC traders actually work.
          </p>
        </div>

        <div className="features-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className="feat-card" style={{
              background:`linear-gradient(160deg,${T.surface},${T.surface2})`,
              border:`1px solid ${T.border}`, borderRadius:18,
              padding:"22px 20px",
              boxShadow:`0 8px 28px ${T.cardGlow}`,
              animation:`heroFade .5s ${.1 + i * .07}s cubic-bezier(.16,1,.3,1) both`,
            }}>
              <div style={{ fontSize:26, marginBottom:12, display:"inline-block", animation:"float 4s ease-in-out infinite", animationDelay:`${i * .4}s` }}>{f.icon}</div>
              <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14, fontWeight:800, color:T.text, marginBottom:6 }}>{f.title}</div>
              <div style={{ fontSize:12, color:T.textDim, lineHeight:1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding:"32px", borderTop:`1px solid ${T.border}`, textAlign:"center" }}>
        <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:18, fontWeight:800, background:`linear-gradient(135deg,${T.accentBright},${T.pink})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:6 }}>FXEDGE</div>
        <div style={{ fontSize:11, color:T.muted }}>Trading Journal · Built for ICT / SMC traders · Your data stays yours</div>
      </footer>
    </div>
  )
}
