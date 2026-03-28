"use client"
import { createClient } from "@/lib/supabase"
import { useState, useMemo, useEffect, useCallback, useRef } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const PAIRS = ["EURUSD","GBPUSD","USDCAD","GER30","SPX500","NAS100"];
const SESSIONS = ["London","New York","Asian","London/NY Overlap"];
const BIASES = ["Bullish","Bearish","Neutral"];
const SETUPS = ["Manipulation + POI","Liquidity Sweep","Breaker Block","Order Block","Fair Value Gap","CHoCH + BOS","Kill Zone Entry","Other"];
const MISTAKES = ["Moved SL","FOMO Entry","Ignored Bias","Wrong Session","Over-leveraged","No Confirmation","Revenge Trade","None"];
const EMOTIONS = ["Calm & Focused","Confident","Anxious","Impatient","Revenge Mode","Bored","Overconfident","Fearful"];
const KILL_ZONES = ["London Open (02-05 EST)","NY Open (08-11 EST)","London Close (10-12 EST)","Asian Killzone (20-23 EST)","None"];
const POI_TYPES = ["Order Block","Breaker Block","FVG","Mitigation Block","Liquidity Pool","Premium/Discount","VWAP","PDHL"];
const MANI_TYPES = ["Liquidity Sweep High","Liquidity Sweep Low","Stop Hunt","False Break","Judas Swing","None"];
const HIGH_IMPACT = ["NFP","Non-Farm","CPI","GDP","FOMC","Interest Rate","Fed","Inflation","Unemployment","Retail Sales","PPI","ECB","BOE"];
const fmtDate = d => new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"2-digit"});
const fmtRR = rr => rr >= 0 ? `+${Number(rr).toFixed(2)}R` : `${Number(rr).toFixed(2)}R`;

// ── Paste Image Hook ──────────────────────────────────────────────────────────
function usePasteImage(onImage) {
  useEffect(() => {
    const handler = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          const reader = new FileReader();
          reader.onload = ev => onImage(ev.target.result);
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [onImage]);
}

// ── Theme ─────────────────────────────────────────────────────────────────────
const DARK = {
  bg:"#0f0f13", surface:"#18181f", surface2:"#22222c", border:"#2d2d3d",
  text:"#f0f0ff", textDim:"#8888aa", muted:"#55556a",
  accent:"#7c3aed", accentBright:"#a855f7", green:"#22c55e", red:"#ef4444", amber:"#f59e0b",
  blue:"#3b82f6", pink:"#ec4899",
  cardGlow:"rgba(124,58,237,0.08)", isDark: true
}
const LIGHT = {
  bg:"#f4f4f8", surface:"#ffffff", surface2:"#f0f0f5", border:"#e0e0ea",
  text:"#12121e", textDim:"#55556a", muted:"#9090a8",
  accent:"#7c3aed", accentBright:"#6d28d9", green:"#16a34a", red:"#dc2626", amber:"#d97706",
  blue:"#2563eb", pink:"#db2777",
  cardGlow:"rgba(124,58,237,0.04)", isDark: false
}

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginScreen({ supabase }) {
  const [email,setEmail] = useState("")
  const [sent,setSent] = useState(false)
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState(null)
  const [dark,setDark] = useState(true)
  const T = dark ? DARK : LIGHT

  const send = async () => {
    if(!email) return
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithOtp({ email, options:{ emailRedirectTo: window.location.origin } })
    if(error){ setError(error.message); setLoading(false); return }
    setSent(true); setLoading(false)
  }

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:24,padding:24,transition:"background .3s"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500&display=swap'); *{box-sizing:border-box;margin:0;padding:0;} @keyframes pulse{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
      <button onClick={()=>setDark(!dark)} style={{position:"absolute",top:20,right:20,background:T.surface2,border:`1px solid ${T.border}`,color:T.textDim,padding:"6px 14px",borderRadius:20,cursor:"pointer",fontSize:13,fontFamily:"Inter,sans-serif"}}>
        {dark?"☀ Light":"🌙 Dark"}
      </button>
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:40,fontWeight:800,background:`linear-gradient(135deg,${T.accentBright},${T.pink})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"-0.02em"}}>FXEDGE</div>
        <div style={{fontFamily:"Inter,sans-serif",fontSize:13,color:T.muted,marginTop:4,letterSpacing:"0.1em"}}>TRADING JOURNAL</div>
      </div>
      {!sent ? (
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:28,width:"100%",maxWidth:380,display:"flex",flexDirection:"column",gap:14,boxShadow:`0 8px 40px ${T.cardGlow}`}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:700,color:T.text}}>Sign in to your journal</div>
          <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.text,fontFamily:"Inter,sans-serif",fontSize:14,padding:"11px 14px",borderRadius:10,outline:"none",width:"100%"}}/>
          {error && <div style={{fontSize:12,color:T.red}}>{error}</div>}
          <button onClick={send} disabled={loading} style={{background:`linear-gradient(135deg,${T.accentBright},${T.pink})`,color:"#fff",border:"none",padding:"12px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer",borderRadius:10,opacity:loading?.6:1}}>
            {loading?"Sending...":"Send Magic Link ✨"}
          </button>
        </div>
      ) : (
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:32,width:"100%",maxWidth:380,textAlign:"center",boxShadow:`0 8px 40px ${T.cardGlow}`}}>
          <div style={{fontSize:40,marginBottom:12}}>📬</div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:700,color:T.text,marginBottom:8}}>Check your email!</div>
          <div style={{fontFamily:"Inter,sans-serif",fontSize:13,color:T.textDim,lineHeight:1.6}}>Magic link sent to <b style={{color:T.accent}}>{email}</b></div>
          <button onClick={()=>setSent(false)} style={{marginTop:16,background:"none",border:`1px solid ${T.border}`,color:T.textDim,padding:"8px 20px",borderRadius:8,cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:13}}>Use different email</button>
        </div>
      )}
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const supabase = createClient()
  const [user,setUser] = useState(null)
  const [authLoading,setAuthLoading] = useState(true)
  const [dark,setDark] = useState(true)
  const T = dark ? DARK : LIGHT
  const [trades,setTrades] = useState([])
  const [dailyPlans,setDailyPlans] = useState([])
  const [weeklyPlans,setWeeklyPlans] = useState([])
  const [loading,setLoading] = useState(true)
  const [syncing,setSyncing] = useState(false)
  const [error,setError] = useState(null)
  const [tab,setTab] = useState("dashboard")
  const [tradeModal,setTradeModal] = useState(null)
  const [dailyModal,setDailyModal] = useState(null)
  const [weeklyModal,setWeeklyModal] = useState(null)
  const [filterPair,setFilterPair] = useState("ALL")
  const [filterResult,setFilterResult] = useState("ALL")
  const [deleteTarget,setDeleteTarget] = useState(null)
  const [imgViewer,setImgViewer] = useState(null)

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{ setUser(session?.user??null); setAuthLoading(false) })
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session)=>setUser(session?.user??null))
    return ()=>subscription.unsubscribe()
  },[])

  const loadAll = useCallback(async()=>{
    if(!user) return
    setLoading(true); setError(null)
    try {
      const [t,d,w] = await Promise.all([
        supabase.from("trades").select("*").eq("user_id",user.id).order("created_at",{ascending:false}),
        supabase.from("daily_plans").select("*").eq("user_id",user.id).order("created_at",{ascending:false}),
        supabase.from("weekly_plans").select("*").eq("user_id",user.id).order("created_at",{ascending:false}),
      ])
      if(t.error)throw t.error; if(d.error)throw d.error; if(w.error)throw w.error
      setTrades((t.data||[]).map(r=>({...r,_dbid:r.id})))
      setDailyPlans((d.data||[]).map(r=>({...r,_dbid:r.id})))
      setWeeklyPlans((w.data||[]).map(r=>({...r,_dbid:r.id})))
    } catch(e){ setError("Failed to load: "+e.message) }
    finally{ setLoading(false) }
  },[user])

  useEffect(()=>{ if(user) loadAll() },[user,loadAll])

  const clean = (obj) => { const o={...obj}; delete o._dbid; delete o.id; delete o.created_at; return o }

  const saveTrade = async(t)=>{
    setSyncing(true)
    try {
      const payload = {...clean(t), user_id:user.id}
      if(t._dbid){ await supabase.from("trades").update(payload).eq("id",t._dbid).eq("user_id",user.id); setTrades(ts=>ts.map(x=>x._dbid===t._dbid?{...payload,_dbid:t._dbid}:x)) }
      else { const {data,error}=await supabase.from("trades").insert([payload]).select(); if(error)throw error; setTrades(ts=>[{...data[0],_dbid:data[0].id},...ts]) }
      setTradeModal(null)
    } catch(e){ setError("Failed to save trade: "+e.message) }
    finally{ setSyncing(false) }
  }

  const saveDaily = async(p)=>{
    setSyncing(true)
    try {
      const payload = {...clean(p), user_id:user.id}
      if(p._dbid){ await supabase.from("daily_plans").update(payload).eq("id",p._dbid).eq("user_id",user.id); setDailyPlans(ps=>ps.map(x=>x._dbid===p._dbid?{...payload,_dbid:p._dbid}:x)) }
      else { const {data,error}=await supabase.from("daily_plans").insert([payload]).select(); if(error)throw error; setDailyPlans(ps=>[{...data[0],_dbid:data[0].id},...ps]) }
      setDailyModal(null)
    } catch(e){ setError("Failed to save daily: "+e.message) }
    finally{ setSyncing(false) }
  }

  const saveWeekly = async(p)=>{
    setSyncing(true)
    try {
      const payload = {...clean(p), user_id:user.id}
      if(p._dbid){ await supabase.from("weekly_plans").update(payload).eq("id",p._dbid).eq("user_id",user.id); setWeeklyPlans(ps=>ps.map(x=>x._dbid===p._dbid?{...payload,_dbid:p._dbid}:x)) }
      else { const {data,error}=await supabase.from("weekly_plans").insert([payload]).select(); if(error)throw error; setWeeklyPlans(ps=>[{...data[0],_dbid:data[0].id},...ps]) }
      setWeeklyModal(null)
    } catch(e){ setError("Failed to save weekly: "+e.message) }
    finally{ setSyncing(false) }
  }

  const confirmDelete = async()=>{
    setSyncing(true)
    try {
      const tbl={trade:"trades",daily:"daily_plans",weekly:"weekly_plans"}[deleteTarget.type]
      const {error}=await supabase.from(tbl).delete().eq("id",deleteTarget.dbid).eq("user_id",user.id)
      if(error)throw error
      if(deleteTarget.type==="trade") setTrades(ts=>ts.filter(x=>x._dbid!==deleteTarget.dbid))
      if(deleteTarget.type==="daily") setDailyPlans(ps=>ps.filter(x=>x._dbid!==deleteTarget.dbid))
      if(deleteTarget.type==="weekly") setWeeklyPlans(ps=>ps.filter(x=>x._dbid!==deleteTarget.dbid))
      setDeleteTarget(null)
    } catch(e){ setError("Failed to delete: "+e.message) }
    finally{ setSyncing(false) }
  }

  const signOut = async()=>{ await supabase.auth.signOut(); setTrades([]); setDailyPlans([]); setWeeklyPlans([]) }

  const stats = useMemo(()=>{
    const t=trades, wins=t.filter(x=>x.result==="WIN"), losses=t.filter(x=>x.result==="LOSS"), be=t.filter(x=>x.result==="BREAKEVEN")
    const totalR=t.reduce((s,x)=>s+(x.rr||0),0), avgRR=wins.length?wins.reduce((s,x)=>s+x.rr,0)/wins.length:0, winRate=t.length?(wins.length/t.length)*100:0
    const byPair=PAIRS.map(p=>{ const pt=t.filter(x=>x.pair===p); return{pair:p,count:pt.length,wins:pt.filter(x=>x.result==="WIN").length,totalR:pt.reduce((s,x)=>s+(x.rr||0),0)} })
    const bySession=SESSIONS.map(s=>{ const st=t.filter(x=>x.session===s); return{session:s,count:st.length,wins:st.filter(x=>x.result==="WIN").length,totalR:st.reduce((s2,x)=>s2+(x.rr||0),0)} }).filter(x=>x.count>0)
    const equityCurve=[];
    let cum=0;
    const sortedT=[...t].sort((a,b)=>new Date(a.date)-new Date(b.date));
    sortedT.forEach(x=>{ cum+=(x.rr||0); equityCurve.push({r:cum,result:x.result}) });
    return {total:t.length,wins:wins.length,losses:losses.length,be:be.length,totalR,avgRR,winRate,byPair,bySession,equityCurve}
  },[trades])

  const filtered = useMemo(()=>trades.filter(t=>(filterPair==="ALL"||t.pair===filterPair)&&(filterResult==="ALL"||t.result===filterResult)).sort((a,b)=>new Date(b.date)-new Date(a.date)),[trades,filterPair,filterResult])

  // Mobile shows only 5 primary tabs; rest accessible via More
  const TABS=[
    {id:"dashboard",icon:"🏠",label:"Dashboard",mobile:true},
    {id:"journal",icon:"📒",label:"Journal",mobile:true},
    {id:"daily",icon:"📅",label:"Daily",mobile:true},
    {id:"heatmap",icon:"📊",label:"Heatmap",mobile:true},
    {id:"more",icon:"⋯",label:"More",mobile:true},
    // Desktop only (accessible via sidebar + More on mobile)
    {id:"weekly",icon:"📋",label:"Weekly",mobile:false},
    {id:"analytics",icon:"📈",label:"Analytics",mobile:false},
    {id:"psychology",icon:"🧠",label:"Mind",mobile:false},
    {id:"playbook",icon:"📖",label:"Playbook",mobile:false},
    {id:"calculator",icon:"🧮",label:"Calculator",mobile:false},
    {id:"gallery",icon:"🖼",label:"Gallery",mobile:false},
    {id:"review",icon:"✍",label:"Review",mobile:false},
    {id:"ai",icon:"🤖",label:"AI Analysis",mobile:false},
    {id:"export",icon:"📤",label:"Export",mobile:false},
  ]
  const ALL_TABS=TABS.filter(t=>t.id!=="more")
  const MOBILE_PRIMARY=TABS.filter(t=>t.mobile)

  const css = buildCSS(T)

  if(authLoading) return <Spinner T={T}/>
  if(!user) return <LoginScreen supabase={supabase}/>
  if(loading) return <Spinner T={T} label="Loading your journal..."/>

  return (
    <div style={{display:"flex",minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"Inter,sans-serif",transition:"background .3s, color .3s"}}>
      <style>{css}</style>

      {/* Sidebar */}
      <nav className="sidebar" style={{background:T.surface,borderRight:`1px solid ${T.border}`}}>
        <div style={{padding:"22px 20px 16px"}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:22,fontWeight:800,background:`linear-gradient(135deg,${T.accentBright},${T.pink})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>FXEDGE</div>
          <div style={{fontSize:9,color:T.muted,letterSpacing:"0.12em",marginTop:2}}>ICT · SMC</div>
        </div>
        {TABS.map(t=>(
          <button key={t.id} className={`nav-btn ${tab===t.id?"nav-active":""}`}
            style={{color:tab===t.id?T.accentBright:T.textDim,background:tab===t.id?`${T.accent}18`:"none",borderLeft:tab===t.id?`3px solid ${T.accentBright}`:"3px solid transparent"}}
            onClick={()=>setTab(t.id)}>
            {t.label}
          </button>
        ))}
        <div style={{flex:1}}/>
        <div style={{padding:"8px 20px",fontSize:11,color:T.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
        <div style={{padding:"4px 20px 4px",fontSize:11,color:syncing?T.amber:T.green,cursor:"pointer"}} onClick={loadAll}>{syncing?"⟳ Saving...":"● Synced"}</div>
        <button onClick={()=>setDark(!dark)} style={{margin:"6px 12px",padding:"8px 14px",background:T.surface2,border:`1px solid ${T.border}`,color:T.textDim,borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"Inter,sans-serif",textAlign:"left"}}>
          {dark?"☀ Light Mode":"🌙 Dark Mode"}
        </button>
        <button onClick={signOut} style={{margin:"4px 12px 16px",padding:"8px 14px",background:"none",border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"Inter,sans-serif",textAlign:"left"}}>Sign Out</button>
      </nav>

      {/* Main */}
      <main style={{flex:1,display:"flex",flexDirection:"column",marginLeft:200}}>
        {/* Topbar */}
        <div style={{padding:"14px 28px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface,position:"sticky",top:0,zIndex:40}}>
          <div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,color:T.text}}>{TABS.find(t=>t.id===tab)?.label}</div>
            <div style={{fontSize:11,color:T.muted,marginTop:1}}>{new Date().toLocaleDateString("en-GB",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>setDark(!dark)} style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.textDim,padding:"7px 14px",borderRadius:20,cursor:"pointer",fontSize:13}}>
              {dark?"☀":"🌙"}
            </button>
            {tab==="journal"&&<Btn T={T} onClick={()=>setTradeModal("new")}>+ Log Trade</Btn>}
            {tab==="daily"&&<Btn T={T} onClick={()=>setDailyModal("new")}>+ Daily Plan</Btn>}
            {tab==="weekly"&&<Btn T={T} onClick={()=>setWeeklyModal("new")}>+ Weekly Plan</Btn>}
          </div>
        </div>

        {error&&<div style={{background:"#450a0a",borderBottom:"1px solid #991b1b",color:"#fca5a5",padding:"10px 28px",fontSize:13,display:"flex",alignItems:"center"}}>⚠ {error}<button onClick={()=>setError(null)} style={{marginLeft:12,background:"none",border:"none",color:"inherit",cursor:"pointer",fontWeight:700}}>✕</button></div>}

        <div style={{padding:"24px 28px",flex:1}}>
          {tab==="dashboard"&&<Dashboard T={T} stats={stats} trades={trades} dailyPlans={dailyPlans} weeklyPlans={weeklyPlans} onNewTrade={()=>setTradeModal("new")} onNewDaily={()=>setDailyModal("new")}/>}
          {tab==="journal"&&<Journal T={T} filtered={filtered} filterPair={filterPair} setFilterPair={setFilterPair} filterResult={filterResult} setFilterResult={setFilterResult} onEdit={t=>setTradeModal(t)} onDelete={t=>setDeleteTarget({type:"trade",dbid:t._dbid,name:`${t.pair} ${t.direction}`})} onViewImg={setImgViewer} onNew={()=>setTradeModal("new")}/>}
          {tab==="daily"&&<DailyTab T={T} plans={dailyPlans} onEdit={p=>setDailyModal(p)} onDelete={p=>setDeleteTarget({type:"daily",dbid:p._dbid,name:`Daily ${p.date}`})} onNew={()=>setDailyModal("new")}/>}
          {tab==="weekly"&&<WeeklyTab T={T} plans={weeklyPlans} onEdit={p=>setWeeklyModal(p)} onDelete={p=>setDeleteTarget({type:"weekly",dbid:p._dbid,name:`Week ${p.weekStart}`})} onNew={()=>setWeeklyModal("new")}/>}
          {tab==="analytics"&&<Analytics T={T} stats={stats} trades={trades}/>}
          {tab==="psychology"&&<Psychology T={T} stats={stats} trades={trades}/>}
          {tab==="calculator"&&<Calculator T={T}/>}
          {tab==="gallery"&&<ScreenshotGallery T={T} trades={trades} onViewImg={setImgViewer}/>}
          {tab==="review"&&<WeeklyReview T={T} weeklyPlans={weeklyPlans} trades={trades} saveWeekly={saveWeekly}/>}
          {tab==="heatmap"&&<Heatmap T={T} trades={trades}/>}
          {tab==="playbook"&&<Playbook T={T} trades={trades}/>}
          {tab==="ai"&&<AIAnalysis T={T} trades={trades} dailyPlans={dailyPlans}/>}
          {tab==="export"&&<ExportTab T={T} trades={trades} dailyPlans={dailyPlans} weeklyPlans={weeklyPlans}/>}
          {tab==="more"&&<MoreMenu T={T} setTab={setTab} ALL_TABS={ALL_TABS}/>}
        </div>
      </main>

      {tradeModal&&(tradeModal!=="new"?<TradeModal T={T} initial={tradeModal} onSave={saveTrade} onClose={()=>setTradeModal(null)} syncing={syncing}/>:<ChecklistGate T={T} onPass={()=>setTradeModal("go")} onClose={()=>setTradeModal(null)}/>)}
      {tradeModal==="go"&&<TradeModal T={T} initial={null} onSave={saveTrade} onClose={()=>setTradeModal(null)} syncing={syncing}/>}
      {dailyModal&&<DailyModal T={T} initial={dailyModal==="new"?null:dailyModal} onSave={saveDaily} onClose={()=>setDailyModal(null)} syncing={syncing}/>}
      {weeklyModal&&<WeeklyModal T={T} initial={weeklyModal==="new"?null:weeklyModal} onSave={saveWeekly} onClose={()=>setWeeklyModal(null)} syncing={syncing}/>}
      {deleteTarget&&(
        <Overlay onClose={()=>setDeleteTarget(null)}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,padding:"32px 40px",textAlign:"center",minWidth:300}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:T.text,marginBottom:8}}>Delete this entry?</div>
            <div style={{fontSize:13,color:T.textDim,marginBottom:4}}>{deleteTarget.name}</div>
            <div style={{fontSize:12,color:T.red,marginBottom:24}}>This is permanent and cannot be undone.</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={confirmDelete} disabled={syncing} style={{background:T.red,color:"#fff",border:"none",padding:"10px 24px",borderRadius:10,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13}}>{syncing?"Deleting...":"Delete"}</button>
              <button onClick={()=>setDeleteTarget(null)} style={{background:"none",border:`1px solid ${T.border}`,color:T.textDim,padding:"10px 24px",borderRadius:10,cursor:"pointer",fontSize:13}}>Cancel</button>
            </div>
          </div>
        </Overlay>
      )}
      {imgViewer&&<Overlay onClose={()=>setImgViewer(null)}><img src={imgViewer} alt="chart" style={{maxWidth:"95vw",maxHeight:"90vh",borderRadius:8,boxShadow:"0 20px 80px rgba(0,0,0,.8)"}}/></Overlay>}
      <BottomNav T={T} tab={tab} setTab={setTab} TABS={TABS} MOBILE_PRIMARY={MOBILE_PRIMARY}/>
    </div>
  )
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
function Spinner({T,label}) {
  const th = T||DARK
  return (
    <div style={{minHeight:"100vh",background:th.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&display=swap'); @keyframes pulse{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:32,fontWeight:800,background:"linear-gradient(135deg,#a855f7,#ec4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>FXEDGE</div>
      <div style={{display:"flex",gap:8}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#a855f7",animation:`pulse 1.2s ${i*0.2}s infinite ease-in-out`}}/>)}</div>
      {label&&<div style={{fontSize:12,color:th.muted,letterSpacing:"0.15em"}}>{label.toUpperCase()}</div>}
    </div>
  )
}
function Overlay({onClose,children}){return <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16,backdropFilter:"blur(4px)"}}><div onClick={e=>e.stopPropagation()}>{children}</div></div>}
function BottomNav({T,tab,setTab,TABS,MOBILE_PRIMARY}){
  const tabs = MOBILE_PRIMARY||TABS.slice(0,5)
  return (
    <nav className="bottom-nav" style={{background:T.surface,borderTop:`1px solid ${T.border}`,paddingBottom:"env(safe-area-inset-bottom)"}}>
      {tabs.map(t=>{
        const isActive = t.id==="more" ? tab==="more" : (t.id===tab || (t.id==="more" && !tabs.find(x=>x.id===tab&&x.mobile)))
        return (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1,display:"flex",flexDirection:"column",alignItems:"center",
            padding:"10px 2px 8px",background:"none",border:"none",
            color:isActive?T.accentBright:T.muted,
            cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:9,gap:3,
            fontWeight:isActive?700:400,transition:"color .15s",
          }}>
            <span style={{fontSize:20,lineHeight:1}}>{t.icon}</span>
            <span style={{letterSpacing:"0.02em"}}>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
function Btn({T,onClick,children,ghost,danger,disabled}){
  const bg = danger?T.red:ghost?"none":`linear-gradient(135deg,${T.accentBright},${T.pink})`
  return <button disabled={disabled} onClick={onClick} style={{background:bg,color:ghost?T.textDim:"#fff",border:ghost?`1px solid ${T.border}`:"none",padding:"9px 18px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13,borderRadius:10,cursor:disabled?"not-allowed":"pointer",whiteSpace:"nowrap",opacity:disabled?0.6:1}}>{children}</button>
}
function Card({T,children,style={},glow}){return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px 20px",boxShadow:glow?`0 4px 30px ${T.cardGlow}`:"none",...style}}>{children}</div>}
function CardTitle({T,children}){return <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>{children}</div>}
function Chip({T,active,onClick,children}){return <button onClick={onClick} style={{background:active?`${T.accent}20`:"none",border:`1px solid ${active?T.accentBright:T.border}`,color:active?T.accentBright:T.textDim,padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:active?700:400,cursor:"pointer",fontFamily:"Inter,sans-serif",transition:"all .15s"}}>{children}</button>}
function Badge({color,children}){return <span style={{display:"inline-block",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700,background:`${color}20`,color,border:`1px solid ${color}40`}}>{children}</span>}
function Toggle({T,value,opts,onChange}){return <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{opts.map(o=><button key={o.v||o} onClick={()=>onChange(o.v||o)} style={{background:(o.v||o)===value?`${T.accentBright}25`:"none",border:`1px solid ${(o.v||o)===value?T.accentBright:T.border}`,color:(o.v||o)===value?T.accentBright:T.textDim,padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>{o.l||o}</button>)}</div>}
function Inp({T,type="text",...props}){return <input type={type} style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.text,fontFamily:"Inter,sans-serif",fontSize:13,padding:"9px 12px",width:"100%",outline:"none",borderRadius:10,transition:"border .15s"}} onFocus={e=>e.target.style.borderColor=T.accentBright} onBlur={e=>e.target.style.borderColor=T.border} {...props}/>}
function Sel({T,val,opts,on}){return <select value={val} onChange={e=>on(e.target.value)} style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.text,fontFamily:"Inter,sans-serif",fontSize:13,padding:"9px 12px",width:"100%",outline:"none",borderRadius:10}}>{opts.map(o=><option key={o} style={{background:T.surface}}>{o}</option>)}</select>}
function Textarea({T,...props}){return <textarea style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.text,fontFamily:"Inter,sans-serif",fontSize:13,padding:"9px 12px",width:"100%",outline:"none",borderRadius:10,resize:"vertical"}} onFocus={e=>e.target.style.borderColor=T.accentBright} onBlur={e=>e.target.style.borderColor=T.border} {...props}/>}
function FL({label,T,children,full}){return <div style={{gridColumn:full?"1/-1":"auto"}}><div style={{fontSize:11,fontWeight:600,color:T.textDim,marginBottom:6}}>{label}</div>{children}</div>}

// Paste-enabled image input
function PasteImageInput({T, value, onChange, label}) {
  const [pasting, setPasting] = useState(false)
  const ref = useRef(null)

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items
    if(!items) return
    for(const item of items) {
      if(item.type.startsWith("image/")) {
        const file = item.getAsFile()
        const reader = new FileReader()
        reader.onload = ev => { onChange(ev.target.result); setPasting(false) }
        reader.readAsDataURL(file)
        e.preventDefault()
        setPasting(true)
        break
      }
    }
  }, [onChange])

  const handleFile = (e) => {
    const file = e.target.files[0]
    if(!file) return
    const reader = new FileReader()
    reader.onload = ev => onChange(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <div
        tabIndex={0}
        onPaste={handlePaste}
        ref={ref}
        style={{border:`2px dashed ${value?T.accentBright:T.border}`,borderRadius:10,padding:"14px",textAlign:"center",cursor:"pointer",outline:"none",background:T.surface2,transition:"border .2s"}}
        onFocus={e=>e.currentTarget.style.borderColor=T.accentBright}
        onBlur={e=>e.currentTarget.style.borderColor=value?T.accentBright:T.border}
      >
        {value ? (
          <div style={{position:"relative"}}>
            <img src={value} alt={label} style={{width:"100%",maxHeight:180,objectFit:"cover",borderRadius:8}}/>
            <button onClick={()=>onChange("")} style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,.7)",border:"none",color:"#fff",borderRadius:"50%",width:24,height:24,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
        ) : (
          <div style={{color:T.muted,fontSize:12}}>
            <div style={{fontSize:24,marginBottom:6}}>📋</div>
            <div style={{fontWeight:600,color:T.textDim,marginBottom:2}}>{pasting?"Processing...":"Ctrl+V to paste"}</div>
            <div>or <label style={{color:T.accentBright,cursor:"pointer"}}><input type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/> browse file</label></div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({T,stats,trades,dailyPlans,weeklyPlans,onNewTrade,onNewDaily}) {
  const today = new Date().toISOString().split("T")[0]
  const todayTrades = trades.filter(t=>t.date===today)
  const latestDaily = [...dailyPlans].sort((a,b)=>new Date(b.date)-new Date(a.date))[0]
  const latestWeekly = [...weeklyPlans].sort((a,b)=>new Date(b.weekStart)-new Date(a.weekStart))[0]

  return (
    <div>
      {/* KPI Row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        {[
          {label:"Total R",value:`${stats.totalR>=0?"+":""}${stats.totalR.toFixed(2)}R`,color:stats.totalR>=0?T.green:T.red,sub:`${stats.total} trades`,gradient:stats.totalR>=0?`linear-gradient(135deg,${T.green}20,${T.green}08)`:`linear-gradient(135deg,${T.red}20,${T.red}08)`},
          {label:"Win Rate",value:`${stats.winRate.toFixed(1)}%`,color:stats.winRate>=55?T.green:stats.winRate>=45?T.amber:T.red,sub:`${stats.wins}W · ${stats.losses}L · ${stats.be}BE`,gradient:`linear-gradient(135deg,${T.blue}20,${T.blue}08)`},
          {label:"Avg RR",value:`${stats.avgRR.toFixed(2)}R`,color:stats.avgRR>=2?T.green:stats.avgRR>=1?T.amber:T.red,sub:"on winning trades",gradient:`linear-gradient(135deg,${T.accent}20,${T.accent}08)`},
          {label:"Best Pair",value:[...stats.byPair].sort((a,b)=>b.totalR-a.totalR)[0]?.pair||"—",color:T.accentBright,sub:`${([...stats.byPair].sort((a,b)=>b.totalR-a.totalR)[0]?.totalR||0)>=0?"+":""}${([...stats.byPair].sort((a,b)=>b.totalR-a.totalR)[0]?.totalR||0).toFixed(1)}R`,gradient:`linear-gradient(135deg,${T.pink}20,${T.pink}08)`},
        ].map(k=>(
          <div key={k.label} style={{background:k.gradient||T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px 20px"}}>
            <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>{k.label}</div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:26,fontWeight:800,color:k.color,lineHeight:1}}>{k.value}</div>
            <div style={{fontSize:11,color:T.textDim,marginTop:6}}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
        {/* Equity Curve */}
        <Card T={T} style={{gridColumn:"1/-1"}} glow>
          <CardTitle T={T}>Equity Curve (R)</CardTitle>
          <MiniEquityCurve T={T} data={stats.equityCurve}/>
        </Card>

        {/* Today */}
        <Card T={T}>
          <CardTitle T={T}>Today&apos;s Trades</CardTitle>
          {todayTrades.length===0
            ?<div style={{textAlign:"center",padding:"20px 0",color:T.muted,fontSize:13}}>No trades today<br/><button onClick={onNewTrade} style={{marginTop:10,background:`linear-gradient(135deg,${T.accentBright},${T.pink})`,color:"#fff",border:"none",padding:"8px 18px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13}}>+ Log Trade</button></div>
            :todayTrades.map(t=>(
              <div key={t._dbid} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,color:T.accentBright,minWidth:65}}>{t.pair}</span>
                <Badge color={t.direction==="LONG"?T.green:T.red}>{t.direction}</Badge>
                <Badge color={t.result==="WIN"?T.green:t.result==="LOSS"?T.red:T.amber}>{t.result}</Badge>
                <span style={{marginLeft:"auto",fontWeight:700,color:t.rr>=0?T.green:T.red}}>{fmtRR(t.rr||0)}</span>
              </div>
            ))
          }
        </Card>

        {/* Daily Bias */}
        <Card T={T}>
          <CardTitle T={T}>Daily Bias {latestDaily&&<span style={{color:T.accent,fontWeight:400}}>{fmtDate(latestDaily.date)}</span>}</CardTitle>
          {latestDaily
            ?<div>{latestDaily.pairs?.map(p=>(
                <div key={p} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
                  <span style={{fontWeight:600,color:T.text,fontSize:13}}>{p}</span>
                  <Badge color={latestDaily.biases?.[p]==="Bullish"?T.green:latestDaily.biases?.[p]==="Bearish"?T.red:T.amber}>{latestDaily.biases?.[p]}</Badge>
                </div>
              ))}<div style={{fontSize:12,color:T.textDim,marginTop:10,lineHeight:1.5}}>{latestDaily.notes}</div>
            </div>
            :<div style={{textAlign:"center",padding:"20px 0",color:T.muted,fontSize:13}}>No daily plan<br/><button onClick={onNewDaily} style={{marginTop:10,background:`linear-gradient(135deg,${T.accentBright},${T.pink})`,color:"#fff",border:"none",padding:"8px 18px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13}}>+ Add Plan</button></div>
          }
        </Card>

        {/* Weekly Theme */}
        <Card T={T}>
          <CardTitle T={T}>Weekly Theme {latestWeekly&&<span style={{color:T.accent,fontWeight:400}}>{latestWeekly.weekStart}</span>}</CardTitle>
          {latestWeekly
            ?<div>
                <div style={{display:"inline-block",background:`${T.accent}20`,border:`1px solid ${T.accent}50`,color:T.accentBright,padding:"4px 14px",borderRadius:20,fontSize:12,fontWeight:700,marginBottom:10}}>{latestWeekly.overallBias}</div>
                <div style={{fontSize:12,color:T.textDim,lineHeight:1.6,marginBottom:8}}>{latestWeekly.marketStructure}</div>
                <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>Key Events</div>
                <div style={{fontSize:12,color:T.amber,lineHeight:1.5}}>{latestWeekly.keyEvents}</div>
              </div>
            :<div style={{color:T.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>No weekly plan yet</div>
          }
        </Card>

        {/* Pair Performance */}
        <Card T={T} style={{gridColumn:"1/-1"}}>
          <CardTitle T={T}>Performance by Pair</CardTitle>
          {stats.byPair.filter(p=>p.count>0).length===0
            ?<div style={{color:T.muted,fontSize:13,textAlign:"center",padding:20}}>Log trades to see pair performance</div>
            :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
              {stats.byPair.filter(p=>p.count>0).map(p=>(
                <div key={p.pair} style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:800,color:T.accentBright,marginBottom:4}}>{p.pair}</div>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:p.totalR>=0?T.green:T.red}}>{p.totalR>=0?"+":""}{p.totalR.toFixed(1)}R</div>
                  <div style={{fontSize:11,color:T.muted,marginTop:2}}>{p.wins}/{p.count} · {p.count>0?(p.wins/p.count*100).toFixed(0):0}%</div>
                </div>
              ))}
            </div>
          }
        </Card>
      </div>
    </div>
  )
}

function MiniEquityCurve({T,data}) {
  if(!data.length) return <div style={{color:T.muted,fontSize:13,textAlign:"center",padding:"24px 0"}}>Your equity curve will appear after logging trades</div>
  const W=500,H=90,vals=data.map(d=>d.r),mn=Math.min(0,...vals),mx=Math.max(0,...vals),rng=mx-mn||1
  const px=i=>(i/(data.length-1||1))*(W-20)+10, py=v=>H-8-((v-mn)/rng)*(H-16)
  const path=data.map((d,i)=>`${i===0?"M":"L"} ${px(i)} ${py(d.r)}`).join(" ")
  const col=data[data.length-1]?.r>=0?T.green:T.red
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      <defs><linearGradient id="eq" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity="0.3"/><stop offset="100%" stopColor={col} stopOpacity="0"/></linearGradient></defs>
      <line x1="10" y1={py(0)} x2={W-10} y2={py(0)} stroke={T.border} strokeWidth="1" strokeDasharray="4 4"/>
      <path d={path+` L ${px(data.length-1)} ${H} L ${px(0)} ${H} Z`} fill="url(#eq)"/>
      <path d={path} fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((d,i)=>i===data.length-1?<circle key={i} cx={px(i)} cy={py(d.r)} r="4" fill={col}/>:null)}
    </svg>
  )
}

// ── Journal ───────────────────────────────────────────────────────────────────
function Journal({T,filtered,filterPair,setFilterPair,filterResult,setFilterResult,onEdit,onDelete,onViewImg,onNew}) {
  return (
    <div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["ALL",...PAIRS].map(p=><Chip key={p} T={T} active={filterPair===p} onClick={()=>setFilterPair(p)}>{p}</Chip>)}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["ALL","WIN","LOSS","BREAKEVEN"].map(r=><Chip key={r} T={T} active={filterResult===r} onClick={()=>setFilterResult(r)}>{r}</Chip>)}
        </div>
      </div>
      {filtered.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:T.muted,fontSize:14}}>Your journal is empty.<br/><button onClick={onNew} style={{marginTop:16,background:`linear-gradient(135deg,${T.accentBright},${T.pink})`,color:"#fff",border:"none",padding:"10px 24px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:14}}>+ Log Your First Trade</button></div>}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {filtered.map(t=>(
          <div key={t._dbid} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px 20px",transition:"border-color .15s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:800,color:T.accentBright}}>{t.pair}</span>
                <Badge color={t.direction==="LONG"?T.green:T.red}>{t.direction}</Badge>
                <span style={{fontSize:12,color:T.muted}}>{fmtDate(t.date)}</span>
                <span style={{fontSize:11,color:T.textDim,background:T.surface2,padding:"2px 8px",borderRadius:6}}>{t.session}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Badge color={t.result==="WIN"?T.green:t.result==="LOSS"?T.red:T.amber}>{t.result}</Badge>
                <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:t.rr>=0?T.green:T.red}}>{fmtRR(t.rr||0)}</span>
              </div>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
              {[{l:"D.Bias",v:t.dailyBias,c:t.dailyBias==="Bullish"?T.green:t.dailyBias==="Bearish"?T.red:T.muted},{l:"W.Bias",v:t.weeklyBias,c:t.weeklyBias==="Bullish"?T.green:t.weeklyBias==="Bearish"?T.red:T.muted},{l:"Manip",v:t.manipulation},{l:"POI",v:t.poi},{l:"KZ",v:t.killzone?.split(" ")[0]},{l:"Setup",v:t.setup},{l:"Emotion",v:t.emotion},{l:"Mistake",v:t.mistakes!=="None"?t.mistakes:null,c:T.red}].filter(x=>x.v).map((x,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:4,background:T.surface2,border:`1px solid ${T.border}`,padding:"3px 8px",borderRadius:6}}>
                  <span style={{fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.1em"}}>{x.l}</span>
                  <span style={{fontSize:11,color:x.c||T.textDim,fontWeight:500}}>{x.v}</span>
                </div>
              ))}
            </div>
            {t.notes&&<div style={{fontSize:12,color:T.textDim,lineHeight:1.6,marginBottom:10,padding:"10px 12px",background:T.surface2,borderRadius:8,borderLeft:`3px solid ${T.accent}`}}>{t.notes}</div>}
            {t.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{t.tags.map(tag=><span key={tag} style={{background:`${T.blue}18`,border:`1px solid ${T.blue}40`,color:T.blue,padding:"2px 10px",fontSize:11,borderRadius:20,fontWeight:600}}>{tag}</span>)}</div>}
            <div style={{display:"flex",gap:16,fontSize:12,color:T.textDim,marginBottom:10,flexWrap:"wrap"}}>
              <span>Entry <b style={{color:T.text}}>{t.entry}</b></span>
              <span>SL <b style={{color:T.red}}>{t.sl}</b></span>
              <span>TP <b style={{color:T.green}}>{t.tp}</b></span>
              <span>Pips <b style={{color:T.text}}>{t.pips>=0?"+":""}{t.pips}</b></span>
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",gap:8}}>
                {t.preScreenshot&&<button onClick={()=>onViewImg(t.preScreenshot)} style={{background:`${T.accent}15`,border:`1px solid ${T.accent}40`,color:T.accentBright,padding:"4px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>📸 Pre</button>}
                {t.postScreenshot&&<button onClick={()=>onViewImg(t.postScreenshot)} style={{background:`${T.accent}15`,border:`1px solid ${T.accent}40`,color:T.accentBright,padding:"4px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>📸 Post</button>}
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>onEdit(t)} style={{background:"none",border:`1px solid ${T.border}`,color:T.textDim,padding:"5px 12px",borderRadius:8,cursor:"pointer",fontSize:12}}>✎ Edit</button>
                <button onClick={()=>onDelete(t)} style={{background:"none",border:`1px solid ${T.border}`,color:T.red,padding:"5px 10px",borderRadius:8,cursor:"pointer",fontSize:12}}>✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Daily Tab ─────────────────────────────────────────────────────────────────
function DailyTab({T,plans,onEdit,onDelete,onNew}) {
  const sorted=[...plans].sort((a,b)=>new Date(b.date)-new Date(a.date))
  return (
    <div>
      {sorted.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:T.muted,fontSize:14}}>No daily plans yet.<br/><button onClick={onNew} style={{marginTop:16,background:`linear-gradient(135deg,${T.accentBright},${T.pink})`,color:"#fff",border:"none",padding:"10px 24px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:14}}>+ Create Daily Plan</button></div>}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {sorted.map(p=>(
          <Card key={p._dbid} T={T}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:17,fontWeight:800,color:T.text}}>{fmtDate(p.date)}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>{p.pairs?.map(pair=><Badge key={pair} color={p.biases?.[pair]==="Bullish"?T.green:p.biases?.[pair]==="Bearish"?T.red:T.amber}>{pair}: {p.biases?.[pair]}</Badge>)}</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>onEdit(p)} style={{background:"none",border:`1px solid ${T.border}`,color:T.textDim,padding:"5px 12px",borderRadius:8,cursor:"pointer",fontSize:12}}>✎</button>
                <button onClick={()=>onDelete(p)} style={{background:"none",border:`1px solid ${T.border}`,color:T.red,padding:"5px 10px",borderRadius:8,cursor:"pointer",fontSize:12}}>✕</button>
              </div>
            </div>
            {[{l:"Weekly Theme",v:p.weeklyTheme},{l:"Key Levels",v:p.keyLevels},{l:"Expected Manipulation",v:p.manipulation,c:T.amber},{l:"Watchlist",v:p.watchlist},{l:"Notes",v:p.notes}].filter(x=>x.v).map(x=>(
              <div key={x.l} style={{marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>{x.l}</div>
                <div style={{fontSize:13,color:x.c||T.textDim,lineHeight:1.6}}>{x.v}</div>
              </div>
            ))}
            {p.chartImage&&<div style={{marginTop:10}}><img src={p.chartImage} alt="chart" style={{width:"100%",maxHeight:220,objectFit:"cover",borderRadius:10,border:`1px solid ${T.border}`,cursor:"pointer"}} onClick={()=>window._viewImg&&window._viewImg(p.chartImage)}/></div>}
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Weekly Tab ────────────────────────────────────────────────────────────────
function WeeklyTab({T,plans,onEdit,onDelete,onNew}) {
  const sorted=[...plans].sort((a,b)=>new Date(b.weekStart)-new Date(a.weekStart))
  return (
    <div>
      {sorted.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:T.muted,fontSize:14}}>No weekly plans yet.<br/><button onClick={onNew} style={{marginTop:16,background:`linear-gradient(135deg,${T.accentBright},${T.pink})`,color:"#fff",border:"none",padding:"10px 24px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:14}}>+ Create Weekly Plan</button></div>}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {sorted.map(p=>(
          <Card key={p._dbid} T={T}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:17,fontWeight:800,color:T.text}}>Week {p.weekStart} → {p.weekEnd}</div>
                {p.overallBias&&<div style={{display:"inline-block",background:`${T.accent}20`,border:`1px solid ${T.accent}50`,color:T.accentBright,padding:"3px 12px",borderRadius:20,fontSize:12,fontWeight:700,marginTop:6}}>{p.overallBias}</div>}
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>onEdit(p)} style={{background:"none",border:`1px solid ${T.border}`,color:T.textDim,padding:"5px 12px",borderRadius:8,cursor:"pointer",fontSize:12}}>✎</button>
                <button onClick={()=>onDelete(p)} style={{background:"none",border:`1px solid ${T.border}`,color:T.red,padding:"5px 10px",borderRadius:8,cursor:"pointer",fontSize:12}}>✕</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
              {PAIRS.map(pair=>(
                <div key={pair} style={{background:T.surface2,border:`1px solid ${T.border}`,padding:"8px 12px",borderRadius:10}}>
                  <div style={{fontSize:11,fontWeight:700,color:T.muted,marginBottom:3}}>{pair}</div>
                  <div style={{fontSize:12,fontWeight:700,color:p.pairs?.[pair]==="Bullish"?T.green:p.pairs?.[pair]==="Bearish"?T.red:T.textDim}}>{p.pairs?.[pair]||"—"}</div>
                  {p.premiumDiscount?.[pair]&&<div style={{fontSize:10,color:T.muted,marginTop:2}}>{p.premiumDiscount[pair]}</div>}
                </div>
              ))}
            </div>
            {[{l:"Market Structure",v:p.marketStructure},{l:"Key Events",v:p.keyEvents,c:T.amber},{l:"Targets",v:p.targets},{l:"Notes",v:p.notes},{l:"Week Review",v:p.review,c:T.accentBright}].filter(x=>x.v).map(x=>(
              <div key={x.l} style={{marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>{x.l}</div>
                <div style={{fontSize:13,color:x.c||T.textDim,lineHeight:1.6}}>{x.v}</div>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  )
}

// ── Analytics ─────────────────────────────────────────────────────────────────
function Analytics({T,stats,trades}) {
  const byKZ=KILL_ZONES.map(kz=>{const t=trades.filter(x=>x.killzone===kz);return{kz:kz.split(" ")[0],count:t.length,wins:t.filter(x=>x.result==="WIN").length,totalR:t.reduce((s,x)=>s+(x.rr||0),0)}}).filter(x=>x.count>0)
  const byManip=MANI_TYPES.filter(m=>m!=="None").map(m=>{const t=trades.filter(x=>x.manipulation===m);return{m,count:t.length,wins:t.filter(x=>x.result==="WIN").length}}).filter(x=>x.count>0)
  const bySetup=SETUPS.map(s=>{const t=trades.filter(x=>x.setup===s);return{s,count:t.length,wins:t.filter(x=>x.result==="WIN").length,totalR:t.reduce((a,x)=>a+(x.rr||0),0)}}).filter(x=>x.count>0)
  const E=<div style={{color:T.muted,fontSize:13,padding:"16px 0",textAlign:"center"}}>Log trades to see data</div>

  const BarRow=({label,wins,count,totalR,color})=>(
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
      <span style={{fontSize:12,color:T.textDim,minWidth:110,flexShrink:0}}>{label}</span>
      <div style={{flex:1,height:6,background:T.surface2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:color,width:`${Math.min(100,count>0?wins/count*100:0)}%`,transition:"width .5s"}}/></div>
      <span style={{fontSize:11,color:T.textDim,minWidth:40,textAlign:"right"}}>{wins}/{count}</span>
      {totalR!==null&&<span style={{fontSize:11,fontWeight:700,color:totalR>=0?T.green:T.red,minWidth:44,textAlign:"right"}}>{totalR>=0?"+":""}{totalR.toFixed(1)}R</span>}
    </div>
  )

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
      <Card T={T}><CardTitle T={T}>By Session</CardTitle>{stats.bySession.length===0?E:stats.bySession.map(s=><BarRow key={s.session} label={s.session.split("/")[0]} wins={s.wins} count={s.count} totalR={s.totalR} color={T.green}/>)}</Card>
      <Card T={T}><CardTitle T={T}>By Kill Zone</CardTitle>{byKZ.length===0?E:byKZ.map(k=><BarRow key={k.kz} label={k.kz} wins={k.wins} count={k.count} totalR={k.totalR} color={T.accentBright}/>)}</Card>
      <Card T={T}><CardTitle T={T}>By Setup</CardTitle>{bySetup.length===0?E:bySetup.map(s=><BarRow key={s.s} label={s.s} wins={s.wins} count={s.count} totalR={s.totalR} color={T.blue}/>)}</Card>
      <Card T={T}><CardTitle T={T}>By Manipulation</CardTitle>{byManip.length===0?E:byManip.map(m=><BarRow key={m.m} label={m.m} wins={m.wins} count={m.count} totalR={null} color={T.pink}/>)}</Card>
    </div>
  )
}

// ── Psychology ────────────────────────────────────────────────────────────────
function Psychology({T,stats,trades}) {
  const byEmotion=EMOTIONS.map(e=>{const t=trades.filter(x=>x.emotion===e);return{emotion:e,count:t.length,wins:t.filter(x=>x.result==="WIN").length,totalR:t.reduce((s,x)=>s+(x.rr||0),0)}}).filter(x=>x.count>0).sort((a,b)=>b.count-a.count)
  const mistakes=MISTAKES.filter(m=>m!=="None").map(m=>{const t=trades.filter(x=>x.mistakes===m);return{mistake:m,count:t.length,totalR:t.reduce((s,x)=>s+(x.rr||0),0)}}).filter(x=>x.count>0).sort((a,b)=>b.count-a.count)
  const perfect=trades.filter(t=>t.mistakes==="None"&&["Calm & Focused","Confident"].includes(t.emotion))
  const mistakeTrades=trades.filter(t=>t.mistakes!=="None")

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
      <Card T={T} style={{gridColumn:"1/-1"}}>
        <CardTitle T={T}>Psychology Overview</CardTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[{l:"Perfect Execution",v:perfect.length,s:`${trades.length>0?(perfect.length/trades.length*100).toFixed(0):0}% of trades`,c:T.green},{l:"With Mistakes",v:mistakeTrades.length,s:`${trades.length>0?(mistakeTrades.length/trades.length*100).toFixed(0):0}% of trades`,c:T.red},{l:"R Lost to Mistakes",v:`${mistakeTrades.reduce((s,t)=>s+Math.min(0,t.rr||0),0).toFixed(1)}R`,s:"estimated cost",c:T.amber},{l:"Best State",v:[...byEmotion].sort((a,b)=>b.totalR-a.totalR)[0]?.emotion||"—",s:"highest R",c:T.accentBright}].map(k=>(
            <div key={k.l} style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.08em",marginBottom:8}}>{k.l}</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div>
              <div style={{fontSize:11,color:T.muted,marginTop:4}}>{k.s}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card T={T}>
        <CardTitle T={T}>By Emotion</CardTitle>
        {byEmotion.length===0?<div style={{color:T.muted,fontSize:13,textAlign:"center",padding:16}}>Log trades with emotions</div>:byEmotion.map(e=>(
          <div key={e.emotion} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontSize:12,color:T.textDim,minWidth:110}}>{e.emotion}</span>
            <div style={{flex:1,height:6,background:T.surface2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",background:e.totalR>=0?T.green:T.red,width:`${Math.min(100,e.count>0?e.wins/e.count*100:0)}%`}}/></div>
            <span style={{fontSize:11,color:T.textDim,minWidth:35,textAlign:"right"}}>{e.wins}/{e.count}</span>
            <span style={{fontSize:11,fontWeight:700,color:e.totalR>=0?T.green:T.red,minWidth:44,textAlign:"right"}}>{e.totalR>=0?"+":""}{e.totalR.toFixed(1)}R</span>
          </div>
        ))}
      </Card>
      <Card T={T}>
        <CardTitle T={T}>Mistake Tracker</CardTitle>
        {mistakes.length===0?<div style={{color:T.green,fontSize:13,textAlign:"center",padding:16}}>No mistakes logged 🎯</div>:mistakes.map(m=>(
          <div key={m.mistake} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontSize:12,color:T.red,minWidth:130}}>{m.mistake}</span>
            <div style={{flex:1,height:6,background:T.surface2,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",background:T.red,width:`${Math.min(100,m.count*20)}%`}}/></div>
            <span style={{fontSize:11,color:T.textDim,minWidth:25,textAlign:"right"}}>{m.count}×</span>
            <span style={{fontSize:11,fontWeight:700,color:m.totalR>=0?T.green:T.red,minWidth:44,textAlign:"right"}}>{m.totalR>=0?"+":""}{m.totalR.toFixed(1)}R</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ── Calculator ────────────────────────────────────────────────────────────────
function Calculator({T}) {
  const [acc,setAcc]=useState("10000")
  const [risk,setRisk]=useState("1")
  const [slPips,setSlPips]=useState("")
  const [pair,setPair]=useState("EURUSD")
  const [pipVal,setPipVal]=useState("10")
  const PIP_VALUES={EURUSD:"10",GBPUSD:"10",USDCAD:"7.5",GER30:"1",SPX500:"1",NAS100:"1"}

  const calc=()=>{
    const a=parseFloat(acc)||0,r=parseFloat(risk)||0,s=parseFloat(slPips)||0,pv=parseFloat(pipVal)||10
    if(!a||!r||!s||!pv) return null
    const riskAmt=a*(r/100), lots=riskAmt/(s*pv)
    return{riskAmt:riskAmt.toFixed(2),lots:lots.toFixed(2),units:Math.round(lots*100000)}
  }
  const result=calc()

  return (
    <div style={{maxWidth:580}}>
      <Card T={T} style={{marginBottom:14}} glow>
        <CardTitle T={T}>Position Size Calculator</CardTitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <FL label="Account Size ($)" T={T}><Inp T={T} type="number" placeholder="10000" value={acc} onChange={e=>setAcc(e.target.value)}/></FL>
          <FL label="Pair" T={T}><Sel T={T} val={pair} opts={PAIRS} on={v=>{setPair(v);setPipVal(PIP_VALUES[v]||"10")}}/></FL>
          <FL label="Stop Loss (Pips)" T={T} full>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              {["5","10","15","20","25","30","50"].map(p=><button key={p} onClick={()=>setSlPips(p)} style={{background:slPips===p?`${T.accentBright}25`:"none",border:`1px solid ${slPips===p?T.accentBright:T.border}`,color:slPips===p?T.accentBright:T.textDim,padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>{p}</button>)}
            </div>
            <Inp T={T} type="number" placeholder="Or type manually e.g. 22" value={slPips} onChange={e=>setSlPips(e.target.value)}/>
          </FL>
          <FL label="Pip Value ($ per lot)" T={T}><Inp T={T} type="number" value={pipVal} onChange={e=>setPipVal(e.target.value)}/></FL>
          <FL label="Risk %" T={T}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              {["0.5","1","1.5","2","3"].map(r=><button key={r} onClick={()=>setRisk(r)} style={{background:risk===r?`${T.accentBright}25`:"none",border:`1px solid ${risk===r?T.accentBright:T.border}`,color:risk===r?T.accentBright:T.textDim,padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>{r}%</button>)}
            </div>
            <Inp T={T} type="number" placeholder="1" value={risk} onChange={e=>setRisk(e.target.value)}/>
          </FL>
        </div>
      </Card>
      {result?(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[{l:"Risk Amount",v:`$${result.riskAmt}`,c:T.red,g:`linear-gradient(135deg,${T.red}20,${T.red}08)`},{l:"Lot Size",v:result.lots,c:T.accentBright,g:`linear-gradient(135deg,${T.accent}20,${T.accent}08)`},{l:"Units",v:parseInt(result.units).toLocaleString(),c:T.blue,g:`linear-gradient(135deg,${T.blue}20,${T.blue}08)`}].map(k=>(
            <div key={k.l} style={{background:k.g,border:`1px solid ${T.border}`,borderRadius:14,padding:"20px",textAlign:"center"}}>
              <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>{k.l}</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:26,fontWeight:800,color:k.c}}>{k.v}</div>
            </div>
          ))}
        </div>
      ):(
        <Card T={T} style={{textAlign:"center",padding:32}}><div style={{color:T.muted,fontSize:13}}>Fill in all fields to calculate position size</div></Card>
      )}
    </div>
  )
}

// ── Screenshot Gallery ────────────────────────────────────────────────────────
function ScreenshotGallery({T,trades,onViewImg}) {
  const [filterPair,setFilterPair]=useState("ALL")
  const [filterType,setFilterType]=useState("ALL")
  const [selected,setSelected]=useState(null)

  const images=[]
  trades.filter(t=>filterPair==="ALL"||t.pair===filterPair).forEach(t=>{
    if((filterType==="ALL"||filterType==="PRE")&&t.preScreenshot) images.push({src:t.preScreenshot,type:"PRE",trade:t})
    if((filterType==="ALL"||filterType==="POST")&&t.postScreenshot) images.push({src:t.postScreenshot,type:"POST",trade:t})
  })

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {["ALL",...PAIRS].map(p=><Chip key={p} T={T} active={filterPair===p} onClick={()=>setFilterPair(p)}>{p}</Chip>)}
        <div style={{width:1,background:T.border,margin:"0 4px"}}/>
        {["ALL","PRE","POST"].map(t=><Chip key={t} T={T} active={filterType===t} onClick={()=>setFilterType(t)}>{t}</Chip>)}
      </div>
      {images.length===0?<div style={{textAlign:"center",padding:"60px 20px",color:T.muted,fontSize:14}}>No screenshots yet.<br/><span style={{fontSize:12}}>Add pre/post screenshots when logging trades.</span></div>:(
        <>
          <div style={{fontSize:12,color:T.muted,marginBottom:12}}>{images.length} screenshot{images.length!==1?"s":""}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
            {images.map((img,i)=>(
              <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"border-color .15s,transform .15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accentBright;e.currentTarget.style.transform="translateY(-2px)"}} onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="none"}} onClick={()=>setSelected(img)}>
                <div style={{position:"relative",paddingTop:"56%",background:T.surface2,overflow:"hidden"}}>
                  <img src={img.src} alt="chart" style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"cover"}}/>
                  <div style={{position:"absolute",top:6,left:6,background:"rgba(0,0,0,.75)",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,color:"#fff"}}>{img.type}</div>
                  <div style={{position:"absolute",top:6,right:6,background:img.trade.result==="WIN"?T.green:img.trade.result==="LOSS"?T.red:T.amber,borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,color:"#fff"}}>{img.trade.result}</div>
                </div>
                <div style={{padding:"10px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:T.accentBright}}>{img.trade.pair}</span>
                    <span style={{fontWeight:800,color:img.trade.rr>=0?T.green:T.red,fontSize:13}}>{fmtRR(img.trade.rr||0)}</span>
                  </div>
                  <div style={{fontSize:11,color:T.muted}}>{fmtDate(img.trade.date)} · {img.trade.direction}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {selected&&(
        <Overlay onClose={()=>setSelected(null)}>
          <div style={{maxWidth:"92vw",display:"flex",flexDirection:"column",gap:0}}>
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"12px 12px 0 0",padding:"12px 18px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:800,color:T.accentBright}}>{selected.trade.pair}</span>
              <Badge color={selected.trade.direction==="LONG"?T.green:T.red}>{selected.trade.direction}</Badge>
              <Badge color={selected.trade.result==="WIN"?T.green:selected.trade.result==="LOSS"?T.red:T.amber}>{selected.trade.result}</Badge>
              <span style={{fontWeight:800,color:selected.trade.rr>=0?T.green:T.red}}>{fmtRR(selected.trade.rr||0)}</span>
              <span style={{fontSize:12,color:T.muted,marginLeft:4}}>{fmtDate(selected.trade.date)}</span>
              <span style={{fontSize:11,background:T.surface2,color:T.textDim,padding:"2px 8px",borderRadius:6}}>{selected.type}</span>
              <button onClick={()=>setSelected(null)} style={{marginLeft:"auto",background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:20}}>✕</button>
            </div>
            <img src={selected.src} alt="chart" style={{maxWidth:"92vw",maxHeight:"80vh",borderRadius:"0 0 12px 12px",objectFit:"contain",border:`1px solid ${T.border}`,borderTop:"none"}}/>
          </div>
        </Overlay>
      )}
    </div>
  )
}

// ── Weekly Review ─────────────────────────────────────────────────────────────
function WeeklyReview({T,weeklyPlans,trades,saveWeekly}) {
  const [selected,setSelected]=useState(null)
  const [reviewText,setReviewText]=useState("")
  const [saving,setSaving]=useState(false)
  const sorted=[...weeklyPlans].sort((a,b)=>new Date(b.weekStart)-new Date(a.weekStart))
  const getWeekTrades=p=>trades.filter(t=>t.date>=p.weekStart&&t.date<=p.weekEnd)
  const open=p=>{setSelected(p);setReviewText(p.review||"")}
  const save=async()=>{setSaving(true);await saveWeekly({...selected,review:reviewText});setSaving(false);setSelected(null)}
  const PROMPTS=["Did I follow my daily bias?","Did I wait for manipulation before entry?","Did I trade in the kill zone?","Did I manage risk properly?","What was my biggest mistake?","What did I do well?","What will I improve next week?"]

  return (
    <div>
      {sorted.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:T.muted,fontSize:14}}>No weekly plans yet. Create one first.</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {sorted.map(plan=>{
          const wt=getWeekTrades(plan),wins=wt.filter(t=>t.result==="WIN").length,totalR=wt.reduce((s,t)=>s+(t.rr||0),0)
          const hasReview=plan.review&&plan.review.trim().length>0
          return (
            <div key={plan._dbid} style={{background:T.surface,border:`1px solid ${hasReview?T.accentBright:T.border}`,borderRadius:14,padding:"18px 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:T.text}}>{plan.weekStart} → {plan.weekEnd}</div>
                  {plan.overallBias&&<div style={{fontSize:12,color:T.accentBright,marginTop:3}}>{plan.overallBias}</div>}
                </div>
                {hasReview&&<Badge color={T.green}>Reviewed</Badge>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
                {[{l:"Trades",v:wt.length,c:T.text},{l:"Wins",v:wins,c:T.green},{l:"Losses",v:wt.length-wins,c:T.red},{l:"Total R",v:`${totalR>=0?"+":""}${totalR.toFixed(1)}R`,c:totalR>=0?T.green:T.red}].map(s=>(
                  <div key={s.l} style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px",textAlign:"center"}}>
                    <div style={{fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.08em",marginBottom:3}}>{s.l}</div>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:800,color:s.c}}>{s.v}</div>
                  </div>
                ))}
              </div>
              {hasReview&&<div style={{fontSize:12,color:T.textDim,lineHeight:1.6,marginBottom:12,padding:"10px 12px",background:T.surface2,borderRadius:8,borderLeft:`3px solid ${T.accentBright}`}}>{plan.review.slice(0,180)}{plan.review.length>180?"...":""}</div>}
              <button onClick={()=>open(plan)} style={{width:"100%",background:`linear-gradient(135deg,${T.accentBright},${T.pink})`,color:"#fff",border:"none",padding:"10px",borderRadius:10,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13}}>
                {hasReview?"Edit Review ✎":"Write Review ✍"}
              </button>
            </div>
          )
        })}
      </div>

      {selected&&(
        <Overlay onClose={()=>setSelected(null)}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,width:"min(640px,95vw)",maxHeight:"90vh",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"18px 22px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:17,fontWeight:800,color:T.text}}>Week Review — {selected.weekStart}</div>
              <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:20}}>✕</button>
            </div>
            <div style={{padding:"20px 22px",overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:14}}>
              {getWeekTrades(selected).length>0&&(
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Trades This Week</div>
                  {getWeekTrades(selected).map(t=>(
                    <div key={t._dbid} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:T.surface2,borderRadius:8,marginBottom:5,fontSize:12}}>
                      <span style={{fontWeight:800,color:T.accentBright,minWidth:65}}>{t.pair}</span>
                      <Badge color={t.direction==="LONG"?T.green:T.red}>{t.direction}</Badge>
                      <Badge color={t.result==="WIN"?T.green:t.result==="LOSS"?T.red:T.amber}>{t.result}</Badge>
                      <span style={{marginLeft:"auto",fontWeight:800,color:t.rr>=0?T.green:T.red}}>{fmtRR(t.rr||0)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Review Prompts</div>
                {PROMPTS.map((p,i)=><div key={i} style={{fontSize:12,color:T.textDim,padding:"6px 10px",background:T.surface2,borderRadius:6,marginBottom:4,borderLeft:`2px solid ${T.border}`}}>{i+1}. {p}</div>)}
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Your Review</div>
                <Textarea T={T} rows={8} placeholder="Write your review here..." value={reviewText} onChange={e=>setReviewText(e.target.value)}/>
              </div>
            </div>
            <div style={{padding:"14px 22px",borderTop:`1px solid ${T.border}`,display:"flex",gap:10}}>
              <Btn T={T} onClick={save}>{saving?"Saving...":"Save Review"}</Btn>
              <Btn T={T} ghost onClick={()=>setSelected(null)}>Cancel</Btn>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  )
}


// ── Pre-Trade Checklist Gate ──────────────────────────────────────────────────
const CHECKLIST_RULES = [
  { id:"bias",     icon:"🧭", label:"I have confirmed the Daily Bias",          detail:"HTF is aligned with your trade direction" },
  { id:"manip",    icon:"🎯", label:"Manipulation / Liquidity Sweep happened",  detail:"Judas swing, stop hunt or sweep confirmed" },
  { id:"kz",       icon:"⏰", label:"I am in a Kill Zone",                      detail:"London, NY Open, or valid session window" },
  { id:"poi",      icon:"📍", label:"I have identified a valid POI",            detail:"Order Block, FVG, Breaker or Mitigation" },
  { id:"risk",     icon:"🛡", label:"Risk is calculated & SL is set",           detail:"Position size and pip risk confirmed" },
  { id:"higher",   icon:"📈", label:"Higher timeframe structure is aligned",    detail:"H4/Daily agrees with your entry direction" },
  { id:"no_revenge",icon:"🧘",label:"I am NOT in revenge mode",                detail:"Calm, focused, and following the plan" },
]

function ChecklistGate({T, onPass, onClose}) {
  const [checked, setChecked] = useState({})
  const [attempted, setAttempted] = useState(false)
  const toggle = id => setChecked(c => ({...c, [id]: !c[id]}))
  const allChecked = CHECKLIST_RULES.every(r => checked[r.id])
  const score = CHECKLIST_RULES.filter(r => checked[r.id]).length

  const handleProceed = () => {
    setAttempted(true)
    if(allChecked) onPass()
  }

  const pct = Math.round((score / CHECKLIST_RULES.length) * 100)
  const progressColor = pct === 100 ? T.green : pct >= 70 ? T.amber : T.red

  return (
    <Overlay onClose={onClose}>
      <div style={{background:T.surface, border:`1px solid ${T.border}`, borderRadius:20, width:"min(520px,96vw)", maxHeight:"92vh", display:"flex", flexDirection:"column", overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"22px 24px 18px", background:`linear-gradient(135deg,${T.accent}20,${T.pink}10)`, borderBottom:`1px solid ${T.border}`}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:20, fontWeight:800, color:T.text}}>Pre-Trade Checklist</div>
            <button onClick={onClose} style={{background:"none", border:"none", color:T.textDim, cursor:"pointer", fontSize:20}}>✕</button>
          </div>
          <div style={{fontSize:13, color:T.textDim}}>Tick every rule before logging your trade</div>
          {/* Progress bar */}
          <div style={{marginTop:14}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6}}>
              <span style={{fontSize:12, fontWeight:700, color:progressColor}}>{score}/{CHECKLIST_RULES.length} rules checked</span>
              <span style={{fontSize:12, fontWeight:800, color:progressColor}}>{pct}%</span>
            </div>
            <div style={{height:6, background:T.surface2, borderRadius:3, overflow:"hidden"}}>
              <div style={{height:"100%", borderRadius:3, background:`linear-gradient(90deg,${progressColor},${T.pink})`, width:`${pct}%`, transition:"width .4s ease"}}/>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div style={{padding:"16px 24px", overflowY:"auto", flex:1, display:"flex", flexDirection:"column", gap:8}}>
          {CHECKLIST_RULES.map(rule => {
            const isChecked = !!checked[rule.id]
            const isError = attempted && !isChecked
            return (
              <div key={rule.id}
                onClick={() => toggle(rule.id)}
                style={{
                  display:"flex", alignItems:"center", gap:14, padding:"14px 16px",
                  background: isChecked ? `${T.green}12` : isError ? `${T.red}08` : T.surface2,
                  border:`1.5px solid ${isChecked ? T.green : isError ? T.red : T.border}`,
                  borderRadius:12, cursor:"pointer", transition:"all .15s",
                  transform: isChecked ? "none" : "none",
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width:24, height:24, borderRadius:8, flexShrink:0,
                  background: isChecked ? T.green : "none",
                  border:`2px solid ${isChecked ? T.green : isError ? T.red : T.border}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"all .2s",
                }}>
                  {isChecked && <span style={{color:"#fff", fontSize:14, fontWeight:700}}>✓</span>}
                </div>
                {/* Icon + text */}
                <span style={{fontSize:20, flexShrink:0}}>{rule.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13, fontWeight:700, color: isChecked ? T.green : T.text, marginBottom:2}}>{rule.label}</div>
                  <div style={{fontSize:11, color:T.muted}}>{rule.detail}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{padding:"16px 24px", borderTop:`1px solid ${T.border}`}}>
          {attempted && !allChecked && (
            <div style={{fontSize:12, color:T.red, marginBottom:10, textAlign:"center", fontWeight:600}}>
              ⚠ Tick all {CHECKLIST_RULES.length} rules before logging a trade
            </div>
          )}
          <button
            onClick={handleProceed}
            style={{
              width:"100%", padding:"13px",
              background: allChecked ? `linear-gradient(135deg,${T.accentBright},${T.pink})` : T.surface2,
              color: allChecked ? "#fff" : T.muted,
              border:`1px solid ${allChecked ? "transparent" : T.border}`,
              borderRadius:12, cursor: allChecked ? "pointer" : "default",
              fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:15,
              transition:"all .3s",
            }}
          >
            {allChecked ? "✅ All rules checked — Log Trade" : `${CHECKLIST_RULES.length - score} rule${CHECKLIST_RULES.length - score !== 1 ? "s" : ""} remaining`}
          </button>
          <div style={{textAlign:"center", marginTop:8}}>
            <button onClick={onPass} style={{background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:11, textDecoration:"underline"}}>Skip checklist (not recommended)</button>
          </div>
        </div>
      </div>
    </Overlay>
  )
}

// ── Advanced Analytics Heatmap ───────────────────────────────────────────────
function Heatmap({T, trades}) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [activeView, setActiveView] = useState("calendar") // calendar | weekday | session | streak | drawdown
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const DAYS_FULL = ["Monday","Tuesday","Wednesday","Thursday","Friday"]
  const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]

  // ── Calendar data ──
  const dailyMap = useMemo(() => {
    const map = {}
    trades.forEach(t => {
      if(!t.date) return
      const d = new Date(t.date)
      if(d.getFullYear()!==year || d.getMonth()!==month) return
      if(!map[t.date]) map[t.date]={r:0,count:0,wins:0,pairs:[]}
      map[t.date].r += (t.rr||0)
      map[t.date].count++
      if(t.result==="WIN") map[t.date].wins++
      if(!map[t.date].pairs.includes(t.pair)) map[t.date].pairs.push(t.pair)
    })
    return map
  },[trades,year,month])

  // ── Month stats ──
  const monthTrades = trades.filter(t=>{ if(!t.date) return false; const d=new Date(t.date); return d.getFullYear()===year&&d.getMonth()===month })
  const monthR = monthTrades.reduce((s,t)=>s+(t.rr||0),0)
  const monthWins = monthTrades.filter(t=>t.result==="WIN").length
  const monthWR = monthTrades.length?(monthWins/monthTrades.length*100).toFixed(0):0

  // ── Day of week performance ──
  const dowData = useMemo(()=>{
    return [1,2,3,4,5].map(dow=>{
      const t = trades.filter(x=>{ if(!x.date)return false; return new Date(x.date).getDay()===dow })
      const wins=t.filter(x=>x.result==="WIN").length
      const totalR=t.reduce((s,x)=>s+(x.rr||0),0)
      return {dow:DAYS_FULL[dow-1], short:["Mon","Tue","Wed","Thu","Fri"][dow-1], count:t.length,wins,totalR,wr:t.length?(wins/t.length*100).toFixed(0):0}
    })
  },[trades])

  // ── Session/time heatmap (day x session grid) ──
  const sessionDowGrid = useMemo(()=>{
    const sessions=["London","New York","Asian","London/NY Overlap"]
    const grid={}
    sessions.forEach(s=>{ grid[s]={}; [1,2,3,4,5].forEach(d=>{ grid[s][d]={r:0,count:0,wins:0} }) })
    trades.forEach(t=>{
      if(!t.date||!t.session) return
      const dow=new Date(t.date).getDay()
      if(dow<1||dow>5) return
      if(!grid[t.session]) return
      grid[t.session][dow].r+=(t.rr||0)
      grid[t.session][dow].count++
      if(t.result==="WIN") grid[t.session][dow].wins++
    })
    return {sessions,grid}
  },[trades])

  // ── Streak data ──
  const streakData = useMemo(()=>{
    const sorted=[...trades].sort((a,b)=>new Date(a.date)-new Date(b.date))
    let curStreak=0,curType=null,maxWin=0,maxLoss=0,curWin=0,curLoss=0
    const streaks=[]
    sorted.forEach(t=>{
      if(t.result==="WIN"){
        if(curType==="WIN") curStreak++; else { curStreak=1; curType="WIN" }
        curWin=curStreak; curLoss=0
      } else if(t.result==="LOSS"){
        if(curType==="LOSS") curStreak++; else { curStreak=1; curType="LOSS" }
        curLoss=curStreak; curWin=0
      }
      maxWin=Math.max(maxWin,curWin)
      maxLoss=Math.max(maxLoss,curLoss)
      streaks.push({result:t.result,r:t.rr||0,date:t.date,pair:t.pair})
    })
    return {curStreak,curType,maxWin,maxLoss,streaks:streaks.slice(-30)}
  },[trades])

  // ── Drawdown data ──
  const drawdownData = useMemo(()=>{
    const sorted=[...trades].sort((a,b)=>new Date(a.date)-new Date(b.date))
    let peak=0,cum=0,maxDD=0,curDD=0
    const points=[]
    sorted.forEach(t=>{
      cum+=(t.rr||0)
      if(cum>peak) peak=cum
      curDD=peak-cum
      if(curDD>maxDD) maxDD=curDD
      points.push({cum,dd:curDD,date:t.date,pair:t.pair})
    })
    return {points,maxDD,currentDD:curDD,peak}
  },[trades])

  // ── Year bar chart ──
  const yearlyData = useMemo(()=>{
    return MONTHS.map((m,mi)=>{
      const mt=trades.filter(t=>{ if(!t.date)return false; const d=new Date(t.date); return d.getFullYear()===year&&d.getMonth()===mi })
      return {month:m,r:mt.reduce((s,t)=>s+(t.rr||0),0),count:mt.length,wins:mt.filter(t=>t.result==="WIN").length}
    })
  },[trades,year])
  const maxAbsR=Math.max(1,...yearlyData.map(d=>Math.abs(d.r)))

  // ── Calendar cell logic ──
  const firstDay=new Date(year,month,1)
  let startDow=firstDay.getDay(); startDow=startDow===0?6:startDow-1
  const daysInMonth=new Date(year,month+1,0).getDate()
  const totalCells=Math.ceil((startDow+daysInMonth)/7)*7
  const cells=[]
  for(let i=0;i<totalCells;i++){
    const dayNum=i-startDow+1
    if(dayNum<1||dayNum>daysInMonth){cells.push(null);continue}
    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}`
    const data=dailyMap[dateStr]||null
    const dow=new Date(year,month,dayNum).getDay()
    cells.push({dayNum,dateStr,data,isWeekend:dow===0||dow===6})
  }

  const getCalColor=(data,isWeekend)=>{
    if(isWeekend) return T.isDark?"#1a1a24":"#f0f0f5"
    if(!data) return T.surface2
    if(data.r>=4) return T.isDark?"#14532d":"#bbf7d0"
    if(data.r>=2) return T.isDark?"#166534":"#86efac"
    if(data.r>0)  return T.isDark?"#15803d":"#4ade80"
    if(data.r>-1) return T.isDark?"#7f1d1d":"#fecaca"
    if(data.r>-3) return T.isDark?"#991b1b":"#f87171"
    return T.isDark?"#450a0a":"#ef4444"
  }
  const getCellBorder=(data,isToday)=>{
    if(isToday) return `2px solid ${T.accentBright}`
    if(!data) return `1px solid ${T.border}`
    return data.r>0?`1px solid ${T.green}60`:`1px solid ${T.red}60`
  }

  const VIEWS=[
    {id:"calendar",label:"📅 Calendar"},
    {id:"weekday",label:"📊 Day of Week"},
    {id:"session",label:"🕐 Session Grid"},
    {id:"streak",label:"🔥 Streaks"},
    {id:"drawdown",label:"📉 Drawdown"},
  ]

  return (
    <div>
      {/* Top stats row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[
          {l:"Total R",v:`${trades.reduce((s,t)=>s+(t.rr||0),0)>=0?"+":""}${trades.reduce((s,t)=>s+(t.rr||0),0).toFixed(2)}R`,c:trades.reduce((s,t)=>s+(t.rr||0),0)>=0?T.green:T.red},
          {l:"Win Rate",v:`${trades.length?(trades.filter(t=>t.result==="WIN").length/trades.length*100).toFixed(1):0}%`,c:T.blue},
          {l:"Max Win Streak",v:`${streakData.maxWin} 🔥`,c:T.green},
          {l:"Max Drawdown",v:`${drawdownData.maxDD.toFixed(2)}R`,c:T.red},
        ].map(k=>(
          <div key={k.l} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>{k.l}</div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:22,fontWeight:800,color:k.c}}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* View switcher */}
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {VIEWS.map(v=>(
          <button key={v.id} onClick={()=>setActiveView(v.id)} style={{
            padding:"8px 16px",borderRadius:20,fontSize:12,fontWeight:activeView===v.id?700:500,cursor:"pointer",fontFamily:"Inter,sans-serif",
            background:activeView===v.id?`linear-gradient(135deg,${T.accentBright},${T.pink})`:`${T.surface}`,
            color:activeView===v.id?"#fff":T.textDim,
            border:`1px solid ${activeView===v.id?"transparent":T.border}`,
            transition:"all .2s",
          }}>{v.label}</button>
        ))}
      </div>

      {/* ── CALENDAR VIEW ── */}
      {activeView==="calendar"&&(
        <div>
          {/* Year overview */}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px 20px",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:T.text}}>Year Overview — {year}</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setYear(y=>y-1)} style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.textDim,padding:"5px 12px",borderRadius:8,cursor:"pointer",fontSize:12}}>◀ {year-1}</button>
                <button onClick={()=>setYear(y=>y+1)} style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.textDim,padding:"5px 12px",borderRadius:8,cursor:"pointer",fontSize:12}}>{year+1} ▶</button>
              </div>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"flex-end",height:90}}>
              {yearlyData.map((d,i)=>(
                <div key={d.month} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}} onClick={()=>{setMonth(i);setActiveView("calendar")}}>
                  <div style={{fontSize:10,fontWeight:700,color:d.r>=0?T.green:T.red,marginBottom:2}}>{d.count>0?`${d.r>=0?"+":""}${d.r.toFixed(1)}`:""}</div>
                  <div style={{
                    width:"100%",borderRadius:"6px 6px 0 0",
                    height:d.count===0?4:Math.max(6,Math.abs(d.r)/maxAbsR*64),
                    background:d.r>0?`linear-gradient(180deg,${T.green},${T.green}66)`:d.r<0?`linear-gradient(180deg,${T.red},${T.red}66)`:T.surface2,
                    border:`1px solid ${i===month?T.accentBright:T.border}`,
                    boxShadow:i===month?`0 0 12px ${T.accentBright}40`:"none",
                    transition:"all .2s",
                  }}/>
                  <div style={{fontSize:10,fontWeight:700,color:i===month?T.accentBright:T.muted}}>{d.month}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly calendar */}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px 20px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:T.text}}>{MONTHS[month]} {year}</div>
                <div style={{display:"flex",gap:14,marginTop:4,flexWrap:"wrap"}}>
                  <span style={{fontSize:12,color:T.muted}}>{monthTrades.length} trades</span>
                  <span style={{fontSize:12,fontWeight:700,color:monthR>=0?T.green:T.red}}>{monthR>=0?"+":""}{monthR.toFixed(2)}R</span>
                  <span style={{fontSize:12,color:T.textDim}}>{monthWR}% WR</span>
                  <span style={{fontSize:12,color:T.textDim}}>{monthWins}W / {monthTrades.length-monthWins}L</span>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1)}} style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.textDim,padding:"6px 14px",borderRadius:8,cursor:"pointer"}}>◀</button>
                <button onClick={()=>{if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1)}} style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.textDim,padding:"6px 14px",borderRadius:8,cursor:"pointer"}}>▶</button>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
              {DAYS_SHORT.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:T.muted,padding:"4px 0"}}>{d}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
              {cells.map((cell,i)=>{
                if(!cell) return <div key={i} style={{aspectRatio:"1"}}/>
                const isToday=cell.dateStr===new Date().toISOString().split("T")[0]
                return (
                  <div key={cell.dateStr} style={{
                    aspectRatio:"1",borderRadius:10,padding:"6px",
                    background:getCalColor(cell.data,cell.isWeekend),
                    border:getCellBorder(cell.data,isToday),
                    display:"flex",flexDirection:"column",justifyContent:"space-between",
                    position:"relative",cursor:cell.data?"pointer":"default",
                    boxShadow:isToday?`0 0 0 2px ${T.accentBright}40`:"none",
                  }}>
                    <div style={{fontSize:11,fontWeight:700,color:cell.isWeekend?T.muted:cell.data?(cell.data.r>=0?"#fff":T.red):T.textDim}}>{cell.dayNum}</div>
                    {cell.data&&(
                      <>
                        <div style={{fontSize:10,fontWeight:800,color:cell.data.r>=0?"#fff":T.red,lineHeight:1}}>{cell.data.r>=0?"+":""}{cell.data.r.toFixed(1)}R</div>
                        <div style={{fontSize:9,color:"rgba(255,255,255,0.7)"}}>{cell.data.count}t · {cell.data.wins}W</div>
                      </>
                    )}
                    {isToday&&<div style={{position:"absolute",top:4,right:5,width:5,height:5,borderRadius:"50%",background:T.accentBright}}/>}
                  </div>
                )
              })}
            </div>
            <div style={{display:"flex",gap:10,marginTop:14,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:T.muted,fontWeight:600}}>Legend:</span>
              {[{c:T.isDark?"#15803d":"#4ade80",l:"Strong Win (4R+)"},{c:T.isDark?"#166534":"#86efac",l:"Win"},{c:T.surface2,l:"No Trade"},{c:T.isDark?"#991b1b":"#f87171",l:"Loss"},{c:T.isDark?"#450a0a":"#ef4444",l:"Heavy Loss"}].map(x=>(
                <div key={x.l} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:14,height:14,borderRadius:4,background:x.c,border:`1px solid ${T.border}`}}/>
                  <span style={{fontSize:10,color:T.muted}}>{x.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DAY OF WEEK VIEW ── */}
      {activeView==="weekday"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px 20px"}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:T.text,marginBottom:16}}>Performance by Day of Week</div>
            {trades.length===0?<div style={{color:T.muted,textAlign:"center",padding:40,fontSize:14}}>Log trades to see day of week performance</div>:(
              <>
                {/* Bar chart */}
                <div style={{display:"flex",gap:8,alignItems:"flex-end",height:140,marginBottom:20}}>
                  {dowData.map(d=>{
                    const maxR=Math.max(1,...dowData.map(x=>Math.abs(x.totalR)))
                    const h=d.count===0?4:Math.max(8,Math.abs(d.totalR)/maxR*120)
                    return (
                      <div key={d.dow} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                        <div style={{fontSize:11,fontWeight:700,color:d.totalR>=0?T.green:T.red}}>{d.count>0?`${d.totalR>=0?"+":""}${d.totalR.toFixed(1)}R`:""}</div>
                        <div style={{
                          width:"100%",borderRadius:"8px 8px 0 0",height:h,
                          background:d.totalR>0?`linear-gradient(180deg,${T.green},${T.green}77)`:d.totalR<0?`linear-gradient(180deg,${T.red},${T.red}77)`:T.surface2,
                          border:`1px solid ${T.border}`,transition:"height .5s",
                        }}/>
                        <div style={{fontSize:12,fontWeight:700,color:T.text}}>{d.short}</div>
                        <div style={{fontSize:10,color:T.muted}}>{d.wr}% WR</div>
                        <div style={{fontSize:10,color:T.muted}}>{d.count}t</div>
                      </div>
                    )
                  })}
                </div>
                {/* Table */}
                <div style={{display:"grid",gridTemplateColumns:"1fr",gap:6}}>
                  {dowData.filter(d=>d.count>0).sort((a,b)=>b.totalR-a.totalR).map((d,i)=>(
                    <div key={d.dow} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:T.surface2,borderRadius:10,border:`1px solid ${d.totalR>0?T.green+"40":d.totalR<0?T.red+"40":T.border}`}}>
                      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:800,color:T.text,minWidth:90}}>{d.dow}</div>
                      <div style={{flex:1,height:6,background:T.surface,borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",background:d.totalR>=0?T.green:T.red,width:`${Math.min(100,d.count>0?d.wins/d.count*100:0)}%`,transition:"width .5s"}}/>
                      </div>
                      <div style={{fontSize:12,color:T.textDim,minWidth:50,textAlign:"right"}}>{d.wins}W / {d.count-d.wins}L</div>
                      <div style={{fontSize:12,fontWeight:700,color:d.totalR>=0?T.green:T.red,minWidth:55,textAlign:"right"}}>{d.totalR>=0?"+":""}{d.totalR.toFixed(2)}R</div>
                      <div style={{fontSize:11,color:T.muted,minWidth:40,textAlign:"right"}}>{d.wr}% WR</div>
                      {i===0&&<span style={{fontSize:10,background:`${T.green}20`,color:T.green,border:`1px solid ${T.green}40`,padding:"2px 8px",borderRadius:10,fontWeight:700}}>Best</span>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── SESSION GRID VIEW ── */}
      {activeView==="session"&&(
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px 20px"}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:T.text,marginBottom:6}}>Session × Day Heatmap</div>
          <div style={{fontSize:12,color:T.muted,marginBottom:16}}>Which session on which day makes you the most money?</div>
          {trades.length===0?<div style={{color:T.muted,textAlign:"center",padding:40,fontSize:14}}>Log trades to see session performance</div>:(
            <>
              {/* Header row */}
              <div style={{display:"grid",gridTemplateColumns:"120px repeat(5,1fr)",gap:6,marginBottom:6}}>
                <div/>
                {["Mon","Tue","Wed","Thu","Fri"].map(d=><div key={d} style={{textAlign:"center",fontSize:12,fontWeight:700,color:T.muted}}>{d}</div>)}
              </div>
              {sessionDowGrid.sessions.map(session=>(
                <div key={session} style={{display:"grid",gridTemplateColumns:"120px repeat(5,1fr)",gap:6,marginBottom:6}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.textDim,display:"flex",alignItems:"center"}}>{session.split("/")[0]}</div>
                  {[1,2,3,4,5].map(dow=>{
                    const cell=sessionDowGrid.grid[session]?.[dow]||{r:0,count:0,wins:0}
                    const bg=cell.count===0?T.surface2:cell.r>2?T.isDark?"#14532d":"#bbf7d0":cell.r>0?T.isDark?"#166534":"#86efac":cell.r<-2?T.isDark?"#450a0a":"#fca5a5":cell.r<0?T.isDark?"#7f1d1d":"#fecaca":T.surface2
                    return (
                      <div key={dow} style={{background:bg,border:`1px solid ${cell.count>0?(cell.r>=0?T.green+"50":T.red+"50"):T.border}`,borderRadius:10,padding:"10px 8px",textAlign:"center",minHeight:60,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3}}>
                        {cell.count===0?(
                          <div style={{fontSize:11,color:T.muted}}>—</div>
                        ):(
                          <>
                            <div style={{fontSize:12,fontWeight:800,color:cell.r>=0?T.green:T.red}}>{cell.r>=0?"+":""}{cell.r.toFixed(1)}R</div>
                            <div style={{fontSize:10,color:T.textDim}}>{cell.wins}W/{cell.count}t</div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── STREAK VIEW ── */}
      {activeView==="streak"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Streak KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {[
              {l:"Current Streak",v:`${streakData.curStreak} ${streakData.curType==="WIN"?"🔥":"❄️"}`,sub:streakData.curType||"—",c:streakData.curType==="WIN"?T.green:T.red},
              {l:"Best Win Streak",v:`${streakData.maxWin} 🔥`,sub:"consecutive wins",c:T.green},
              {l:"Worst Loss Streak",v:`${streakData.maxLoss} ❄️`,sub:"consecutive losses",c:T.red},
              {l:"Total Trades",v:trades.length,sub:`${trades.filter(t=>t.result==="WIN").length}W / ${trades.filter(t=>t.result==="LOSS").length}L`,c:T.accentBright},
            ].map(k=>(
              <div key={k.l} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px"}}>
                <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.1em",marginBottom:8}}>{k.l}</div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:24,fontWeight:800,color:k.c}}>{k.v}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:4}}>{k.sub}</div>
              </div>
            ))}
          </div>
          {/* Streak visualization - last 30 trades */}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px 20px"}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:T.text,marginBottom:16}}>Last 30 Trades — Streak View</div>
            {trades.length===0?<div style={{color:T.muted,textAlign:"center",padding:40,fontSize:14}}>No trades yet</div>:(
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {streakData.streaks.map((t,i)=>(
                  <div key={i} title={`${t.pair} ${t.date} ${t.r>=0?"+":""}${t.r.toFixed(2)}R`} style={{
                    width:36,height:36,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",
                    background:t.result==="WIN"?`${T.green}25`:t.result==="LOSS"?`${T.red}25`:`${T.amber}25`,
                    border:`1.5px solid ${t.result==="WIN"?T.green:t.result==="LOSS"?T.red:T.amber}`,
                    cursor:"default",
                  }}>
                    <span style={{fontSize:16}}>{t.result==="WIN"?"W":t.result==="LOSS"?"L":"B"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DRAWDOWN VIEW ── */}
      {activeView==="drawdown"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {[
              {l:"Max Drawdown",v:`${drawdownData.maxDD.toFixed(2)}R`,c:T.red,sub:"peak to trough"},
              {l:"Current Drawdown",v:`${drawdownData.currentDD.toFixed(2)}R`,c:drawdownData.currentDD>0?T.amber:T.green,sub:"from current peak"},
              {l:"Peak Equity",v:`+${drawdownData.peak.toFixed(2)}R`,c:T.green,sub:"highest point reached"},
            ].map(k=>(
              <div key={k.l} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px"}}>
                <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.1em",marginBottom:8}}>{k.l}</div>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:24,fontWeight:800,color:k.c}}>{k.v}</div>
                <div style={{fontSize:11,color:T.muted,marginTop:4}}>{k.sub}</div>
              </div>
            ))}
          </div>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px 20px"}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:T.text,marginBottom:16}}>Equity & Drawdown Chart</div>
            {drawdownData.points.length===0?<div style={{color:T.muted,textAlign:"center",padding:40,fontSize:14}}>Log trades to see your drawdown chart</div>:(()=>{
              const pts=drawdownData.points
              const W=600,H=160
              const allR=pts.map(p=>p.cum)
              const allDD=pts.map(p=>-p.dd)
              const allVals=[...allR,...allDD,0]
              const mn=Math.min(...allVals),mx=Math.max(...allVals),rng=mx-mn||1
              const px=i=>(i/(pts.length-1||1))*(W-20)+10
              const py=v=>H-8-((v-mn)/rng)*(H-16)
              const equityPath=pts.map((p,i)=>`${i===0?"M":"L"} ${px(i)} ${py(p.cum)}`).join(" ")
              const ddPath=pts.map((p,i)=>`${i===0?"M":"L"} ${px(i)} ${py(-p.dd)}`).join(" ")
              const ddArea=ddPath+` L ${px(pts.length-1)} ${py(0)} L ${px(0)} ${py(0)} Z`
              return (
                <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
                  <defs>
                    <linearGradient id="eqg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.green} stopOpacity="0.3"/><stop offset="100%" stopColor={T.green} stopOpacity="0"/></linearGradient>
                    <linearGradient id="ddg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.red} stopOpacity="0"/><stop offset="100%" stopColor={T.red} stopOpacity="0.3"/></linearGradient>
                  </defs>
                  <line x1="10" y1={py(0)} x2={W-10} y2={py(0)} stroke={T.border} strokeWidth="1" strokeDasharray="4 4"/>
                  <path d={ddArea} fill="url(#ddg)"/>
                  <path d={ddPath} fill="none" stroke={T.red} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7"/>
                  <path d={equityPath+` L ${px(pts.length-1)} ${H} L ${px(0)} ${H} Z`} fill="url(#eqg)"/>
                  <path d={equityPath} fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )
            })()}
            <div style={{display:"flex",gap:16,marginTop:10,alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:20,height:3,borderRadius:2,background:T.green}}/><span style={{fontSize:11,color:T.muted}}>Equity (R)</span></div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:20,height:3,borderRadius:2,background:T.red,opacity:0.7}}/><span style={{fontSize:11,color:T.muted}}>Drawdown</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// ── Trade Modal ───────────────────────────────────────────────────────────────
function TradeModal({T,initial,onSave,onClose,syncing}) {
  const blank={pair:"EURUSD",date:new Date().toISOString().split("T")[0],direction:"LONG",session:"London",killzone:"London Open (02-05 EST)",dailyBias:"Bullish",weeklyBias:"Bullish",marketProfile:"Trending",manipulation:"Liquidity Sweep Low",poi:"Order Block",setup:"Manipulation + POI",entry:"",sl:"",tp:"",result:"WIN",rr:"",pips:"",emotion:"Calm & Focused",mistakes:"None",notes:"",preScreenshot:"",postScreenshot:"",tags:""}
  const [f,setF]=useState(initial?{...initial,tags:(initial.tags||[]).join(",")}:blank)
  const upd=(k,v)=>setF(x=>({...x,[k]:v}))
  const calcRR=()=>{const e=parseFloat(f.entry),s=parseFloat(f.sl),t=parseFloat(f.tp);if(!e||!s||!t)return;const risk=Math.abs(e-s),reward=Math.abs(t-e);if(risk>0)upd("rr",(reward/risk).toFixed(2))}
  const submit=()=>{
    let rr=parseFloat(f.rr)||(f.result==="WIN"?1:f.result==="LOSS"?-1:0)
    if(f.result==="LOSS")rr=-Math.abs(rr);if(f.result==="BREAKEVEN")rr=0
    onSave({...f,rr,pips:parseFloat(f.pips)||0,entry:parseFloat(f.entry)||0,sl:parseFloat(f.sl)||0,tp:parseFloat(f.tp)||0,tags:f.tags?f.tags.split(",").map(t=>t.trim()).filter(Boolean):[]})
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,width:"min(640px,96vw)",maxHeight:"92vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"18px 22px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:17,fontWeight:800,color:T.text}}>{initial?"Edit Trade":"Log New Trade"}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:20}}>✕</button>
        </div>
        <div style={{padding:"20px 22px",overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:16}}>
          <Section T={T} title="Instrument & Timing">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <FL label="Date" T={T}><Inp T={T} type="date" value={f.date} onChange={e=>upd("date",e.target.value)}/></FL>
              <FL label="Pair" T={T}><Sel T={T} val={f.pair} opts={PAIRS} on={v=>upd("pair",v)}/></FL>
              <FL label="Direction" T={T}><Toggle T={T} value={f.direction} opts={["LONG","SHORT"]} onChange={v=>upd("direction",v)}/></FL>
              <FL label="Session" T={T}><Sel T={T} val={f.session} opts={SESSIONS} on={v=>upd("session",v)}/></FL>
              <FL label="Kill Zone" T={T} full><Sel T={T} val={f.killzone} opts={KILL_ZONES} on={v=>upd("killzone",v)}/></FL>
              <FL label="Market Profile" T={T} full><Toggle T={T} value={f.marketProfile} opts={["Trending","Ranging","Volatile"]} onChange={v=>upd("marketProfile",v)}/></FL>
            </div>
          </Section>
          <Section T={T} title="Bias & Context">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <FL label="Daily Bias" T={T}><Toggle T={T} value={f.dailyBias} opts={["Bullish","Bearish","Neutral"]} onChange={v=>upd("dailyBias",v)}/></FL>
              <FL label="Weekly Bias" T={T}><Toggle T={T} value={f.weeklyBias} opts={["Bullish","Bearish","Neutral"]} onChange={v=>upd("weeklyBias",v)}/></FL>
              <FL label="Manipulation" T={T}><Sel T={T} val={f.manipulation} opts={MANI_TYPES} on={v=>upd("manipulation",v)}/></FL>
              <FL label="POI Type" T={T}><Sel T={T} val={f.poi} opts={POI_TYPES} on={v=>upd("poi",v)}/></FL>
              <FL label="Setup" T={T} full><Sel T={T} val={f.setup} opts={SETUPS} on={v=>upd("setup",v)}/></FL>
            </div>
          </Section>
          <Section T={T} title="Price Levels">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <FL label="Entry" T={T}><Inp T={T} type="number" placeholder="1.08420" value={f.entry} onChange={e=>upd("entry",e.target.value)} onBlur={calcRR}/></FL>
              <FL label="Stop Loss" T={T}><Inp T={T} type="number" placeholder="1.08220" value={f.sl} onChange={e=>upd("sl",e.target.value)} onBlur={calcRR}/></FL>
              <FL label="Take Profit" T={T}><Inp T={T} type="number" placeholder="1.08820" value={f.tp} onChange={e=>upd("tp",e.target.value)} onBlur={calcRR}/></FL>
              <FL label="Pips" T={T}><Inp T={T} type="number" placeholder="+40" value={f.pips} onChange={e=>upd("pips",e.target.value)}/></FL>
            </div>
          </Section>
          <Section T={T} title="Result">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <FL label="Result" T={T}><Toggle T={T} value={f.result} opts={["WIN","LOSS","BREAKEVEN"]} onChange={v=>upd("result",v)}/></FL>
              <FL label="R:R Achieved" T={T}><Inp T={T} type="number" placeholder="auto-calculated" value={f.rr} onChange={e=>upd("rr",e.target.value)}/></FL>
            </div>
          </Section>
          <Section T={T} title="Psychology">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <FL label="Emotion" T={T}><Sel T={T} val={f.emotion} opts={EMOTIONS} on={v=>upd("emotion",v)}/></FL>
              <FL label="Mistake" T={T}><Sel T={T} val={f.mistakes} opts={MISTAKES} on={v=>upd("mistakes",v)}/></FL>
              <FL label="Tags (comma separated)" T={T} full><Inp T={T} placeholder="A+ Setup, HTF Aligned" value={f.tags} onChange={e=>upd("tags",e.target.value)}/></FL>
            </div>
          </Section>
          <Section T={T} title="Notes & Screenshots">
            <FL label="Trade Notes" T={T}><Textarea T={T} rows={3} placeholder="Setup rationale, lessons, observations..." value={f.notes} onChange={e=>upd("notes",e.target.value)}/></FL>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
              <FL label="Pre-Trade Screenshot — Ctrl+V to paste" T={T}><PasteImageInput T={T} label="Pre" value={f.preScreenshot} onChange={v=>upd("preScreenshot",v)}/></FL>
              <FL label="Post-Trade Screenshot — Ctrl+V to paste" T={T}><PasteImageInput T={T} label="Post" value={f.postScreenshot} onChange={v=>upd("postScreenshot",v)}/></FL>
            </div>
          </Section>
        </div>
        <div style={{padding:"14px 22px",borderTop:`1px solid ${T.border}`,display:"flex",gap:10}}>
          <Btn T={T} onClick={submit}>{syncing?"Saving to cloud...":initial?"Update Trade":"Log Trade"}</Btn>
          <Btn T={T} ghost onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    </Overlay>
  )
}

// ── Daily Modal ───────────────────────────────────────────────────────────────
function DailyModal({T,initial,onSave,onClose,syncing}) {
  const blank={date:new Date().toISOString().split("T")[0],pairs:["EURUSD","GBPUSD"],biases:{},weeklyTheme:"",keyLevels:"",manipulation:"",watchlist:"",notes:"",chartImage:""}
  const [f,setF]=useState(initial||blank)
  const upd=(k,v)=>setF(x=>({...x,[k]:v}))
  const togglePair=p=>setF(x=>({...x,pairs:x.pairs.includes(p)?x.pairs.filter(pp=>pp!==p):[...x.pairs,p]}))
  const setBias=(pair,bias)=>setF(x=>({...x,biases:{...x.biases,[pair]:bias}}))

  return (
    <Overlay onClose={onClose}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,width:"min(600px,96vw)",maxHeight:"92vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"18px 22px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:17,fontWeight:800,color:T.text}}>{initial?"Edit Daily Plan":"New Daily Plan"}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:20}}>✕</button>
        </div>
        <div style={{padding:"20px 22px",overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:14}}>
          <FL label="Date" T={T}><Inp T={T} type="date" value={f.date} onChange={e=>upd("date",e.target.value)}/></FL>
          <Section T={T} title="Pairs in Focus">
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{PAIRS.map(p=><Chip key={p} T={T} active={f.pairs?.includes(p)} onClick={()=>togglePair(p)}>{p}</Chip>)}</div>
          </Section>
          <Section T={T} title="Daily Bias">
            {f.pairs?.map(p=>(
              <div key={p} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontSize:13,fontWeight:700,color:T.text,minWidth:70}}>{p}</span>
                <Toggle T={T} value={f.biases?.[p]||""} opts={["Bullish","Bearish","Neutral"]} onChange={v=>setBias(p,v)}/>
              </div>
            ))}
          </Section>
          <FL label="Weekly Theme / Context" T={T}><Textarea T={T} rows={2} value={f.weeklyTheme} onChange={e=>upd("weeklyTheme",e.target.value)}/></FL>
          <FL label="Key Levels" T={T}><Textarea T={T} rows={2} value={f.keyLevels} onChange={e=>upd("keyLevels",e.target.value)}/></FL>
          <FL label="Expected Manipulation" T={T}><Textarea T={T} rows={2} placeholder="Where do you expect the Judas swing / liquidity sweep?" value={f.manipulation} onChange={e=>upd("manipulation",e.target.value)}/></FL>
          <FL label="Watchlist / Trade Plan" T={T}><Textarea T={T} rows={2} value={f.watchlist} onChange={e=>upd("watchlist",e.target.value)}/></FL>
          <FL label="Notes" T={T}><Textarea T={T} rows={2} value={f.notes} onChange={e=>upd("notes",e.target.value)}/></FL>
          <FL label="Chart / Analysis Image — Ctrl+V to paste" T={T}><PasteImageInput T={T} label="Chart" value={f.chartImage||""} onChange={v=>upd("chartImage",v)}/></FL>
        </div>
        <div style={{padding:"14px 22px",borderTop:`1px solid ${T.border}`,display:"flex",gap:10}}>
          <Btn T={T} onClick={()=>onSave(f)}>{syncing?"Saving...":initial?"Update":"Save Plan"}</Btn>
          <Btn T={T} ghost onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    </Overlay>
  )
}

// ── Weekly Modal ──────────────────────────────────────────────────────────────
function WeeklyModal({T,initial,onSave,onClose,syncing}) {
  const mon=()=>{const d=new Date();d.setDate(d.getDate()-d.getDay()+1);return d.toISOString().split("T")[0]}
  const fri=()=>{const d=new Date();d.setDate(d.getDate()-d.getDay()+5);return d.toISOString().split("T")[0]}
  const blank={weekStart:mon(),weekEnd:fri(),overallBias:"",pairs:{},premiumDiscount:{},marketStructure:"",keyEvents:"",targets:"",notes:"",review:""}
  const [f,setF]=useState(initial||blank)
  const upd=(k,v)=>setF(x=>({...x,[k]:v}))
  const setPair=(p,v)=>setF(x=>({...x,pairs:{...x.pairs,[p]:v}}))
  const setPD=(p,v)=>setF(x=>({...x,premiumDiscount:{...x.premiumDiscount,[p]:v}}))

  return (
    <Overlay onClose={onClose}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,width:"min(660px,96vw)",maxHeight:"92vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"18px 22px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:17,fontWeight:800,color:T.text}}>{initial?"Edit Weekly Plan":"New Weekly Plan"}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:20}}>✕</button>
        </div>
        <div style={{padding:"20px 22px",overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FL label="Week Start" T={T}><Inp T={T} type="date" value={f.weekStart} onChange={e=>upd("weekStart",e.target.value)}/></FL>
            <FL label="Week End" T={T}><Inp T={T} type="date" value={f.weekEnd} onChange={e=>upd("weekEnd",e.target.value)}/></FL>
          </div>
          <FL label="Overall Bias / Theme" T={T}><Inp T={T} placeholder="USD Weakness, Risk-on, DXY retracement..." value={f.overallBias} onChange={e=>upd("overallBias",e.target.value)}/></FL>
          <Section T={T} title="Pair Bias & Premium / Discount">
            {PAIRS.map(p=>(
              <div key={p} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${T.border}`,flexWrap:"wrap"}}>
                <span style={{fontSize:13,fontWeight:700,color:T.text,minWidth:70}}>{p}</span>
                <Toggle T={T} value={f.pairs?.[p]||""} opts={["Bullish","Bearish","Neutral"]} onChange={v=>setPair(p,v)}/>
                <Toggle T={T} value={f.premiumDiscount?.[p]||""} opts={[{l:"Prem",v:"Premium"},{l:"Disc",v:"Discount"},{l:"EQ",v:"EQ"}]} onChange={v=>setPD(p,v)}/>
              </div>
            ))}
          </Section>
          <FL label="Market Structure" T={T}><Textarea T={T} rows={2} placeholder="DXY position, correlations..." value={f.marketStructure} onChange={e=>upd("marketStructure",e.target.value)}/></FL>
          <FL label="Key Economic Events" T={T}><Textarea T={T} rows={2} placeholder="NFP Fri, FOMC Wed, CPI Tue..." value={f.keyEvents} onChange={e=>upd("keyEvents",e.target.value)}/></FL>
          <FL label="Weekly Targets" T={T}><Textarea T={T} rows={2} placeholder="EURUSD 1.0950, GBPUSD 1.2800..." value={f.targets} onChange={e=>upd("targets",e.target.value)}/></FL>
          <FL label="Rules / Notes" T={T}><Textarea T={T} rows={2} value={f.notes} onChange={e=>upd("notes",e.target.value)}/></FL>
          <FL label="End of Week Review" T={T}><Textarea T={T} rows={3} placeholder="Fill at end of week..." value={f.review} onChange={e=>upd("review",e.target.value)}/></FL>
        </div>
        <div style={{padding:"14px 22px",borderTop:`1px solid ${T.border}`,display:"flex",gap:10}}>
          <Btn T={T} onClick={()=>onSave(f)}>{syncing?"Saving...":initial?"Update":"Save Plan"}</Btn>
          <Btn T={T} ghost onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    </Overlay>
  )
}


// ── More Menu (mobile) ────────────────────────────────────────────────────────
function MoreMenu({T, setTab, ALL_TABS}) {
  const extra = ALL_TABS.filter(t=>!["dashboard","journal","daily","heatmap"].includes(t.id))
  return (
    <div>
      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:T.text,marginBottom:20}}>All Sections</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
        {extra.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,
            padding:"18px 16px",display:"flex",alignItems:"center",gap:12,
            cursor:"pointer",textAlign:"left",transition:"border-color .15s",
          }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=T.accentBright}
          onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
            <span style={{fontSize:28}}>{t.icon}</span>
            <div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:700,color:T.text}}>{t.label}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Playbook Builder ──────────────────────────────────────────────────────────
function Playbook({T, trades}) {
  const [playbooks, setPlaybooks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("fxedge_playbooks")||"[]") } catch { return [] }
  })
  const [modal, setModal] = useState(null) // null | "new" | playbook obj
  const [viewPb, setViewPb] = useState(null)

  const save = (pb) => {
    const updated = pb.id
      ? playbooks.map(x=>x.id===pb.id?pb:x)
      : [...playbooks, {...pb, id:Date.now()}]
    setPlaybooks(updated)
    localStorage.setItem("fxedge_playbooks", JSON.stringify(updated))
    setModal(null)
  }
  const del = (id) => {
    const updated = playbooks.filter(x=>x.id!==id)
    setPlaybooks(updated)
    localStorage.setItem("fxedge_playbooks", JSON.stringify(updated))
    setViewPb(null)
  }

  // Match trades to playbook by setup tag
  const getStats = (pb) => {
    const matched = trades.filter(t =>
      (pb.setup && t.setup===pb.setup) ||
      (pb.tags && pb.tags.some(tag => t.tags?.includes(tag)))
    )
    const wins = matched.filter(t=>t.result==="WIN").length
    const totalR = matched.reduce((s,t)=>s+(t.rr||0),0)
    return { count:matched.length, wins, totalR, wr:matched.length?(wins/matched.length*100).toFixed(0):0, trades:matched }
  }

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:T.text}}>My Playbooks</div>
        <Btn T={T} onClick={()=>setModal("new")}>+ New Playbook</Btn>
      </div>

      {playbooks.length===0&&(
        <div style={{textAlign:"center",padding:"60px 20px",color:T.muted}}>
          <div style={{fontSize:40,marginBottom:12}}>📖</div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:700,color:T.textDim,marginBottom:8}}>No playbooks yet</div>
          <div style={{fontSize:13,marginBottom:20}}>Create playbooks for your setups like &quot;London Sweep + OB&quot; or &quot;NY Kill Zone FVG&quot;</div>
          <Btn T={T} onClick={()=>setModal("new")}>+ Create First Playbook</Btn>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {playbooks.map(pb=>{
          const s=getStats(pb)
          return (
            <div key={pb.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px 20px",cursor:"pointer",transition:"border-color .15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.accentBright}
              onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}
              onClick={()=>setViewPb(pb)}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:800,color:T.text,marginBottom:4}}>{pb.name}</div>
                  {pb.setup&&<span style={{fontSize:11,background:`${T.accent}20`,color:T.accentBright,border:`1px solid ${T.accent}40`,padding:"2px 8px",borderRadius:6}}>{pb.setup}</span>}
                </div>
                <div style={{fontSize:24}}>{pb.emoji||"📖"}</div>
              </div>
              <div style={{fontSize:12,color:T.textDim,lineHeight:1.5,marginBottom:14}}>{pb.description}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {[{l:"Trades",v:s.count,c:T.text},{l:"Win Rate",v:`${s.wr}%`,c:s.wr>=55?T.green:s.wr>=40?T.amber:T.red},{l:"Total R",v:`${s.totalR>=0?"+":""}${s.totalR.toFixed(1)}R`,c:s.totalR>=0?T.green:T.red}].map(k=>(
                  <div key={k.l} style={{background:T.surface2,borderRadius:8,padding:"8px",textAlign:"center"}}>
                    <div style={{fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.1em",marginBottom:3}}>{k.l}</div>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:k.c}}>{k.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Playbook detail modal */}
      {viewPb&&(()=>{
        const s=getStats(viewPb)
        return (
          <Overlay onClose={()=>setViewPb(null)}>
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,width:"min(680px,96vw)",maxHeight:"92vh",display:"flex",flexDirection:"column"}}>
              <div style={{padding:"18px 22px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:T.text}}>{viewPb.emoji} {viewPb.name}</div>
                <button onClick={()=>setViewPb(null)} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:20}}>✕</button>
              </div>
              <div style={{padding:"20px 22px",overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:16}}>
                <div style={{fontSize:13,color:T.textDim,lineHeight:1.6}}>{viewPb.description}</div>
                {/* Rules */}
                {viewPb.rules?.length>0&&(
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:T.accentBright,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>Rules</div>
                    {viewPb.rules.map((r,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 12px",background:T.surface2,borderRadius:8,marginBottom:6}}>
                        <span style={{fontWeight:800,color:T.accentBright,minWidth:20}}>{i+1}.</span>
                        <span style={{fontSize:13,color:T.text}}>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Stats */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                  {[{l:"Trades",v:s.count,c:T.text},{l:"Win Rate",v:`${s.wr}%`,c:s.wr>=55?T.green:s.wr>=40?T.amber:T.red},{l:"Total R",v:`${s.totalR>=0?"+":""}${s.totalR.toFixed(2)}R`,c:s.totalR>=0?T.green:T.red},{l:"Avg R/Win",v:s.wins>0?`+${(s.totalR/s.wins).toFixed(2)}R`:"—",c:T.green}].map(k=>(
                    <div key={k.l} style={{background:T.surface2,borderRadius:10,padding:"12px",textAlign:"center"}}>
                      <div style={{fontSize:9,fontWeight:700,color:T.muted,letterSpacing:"0.1em",marginBottom:5}}>{k.l}</div>
                      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:k.c}}>{k.v}</div>
                    </div>
                  ))}
                </div>
                {/* Matched trades */}
                {s.trades.length>0&&(
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>Matched Trades</div>
                    {s.trades.slice(0,10).map(t=>(
                      <div key={t._dbid} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:T.surface2,borderRadius:8,marginBottom:5,fontSize:12}}>
                        <span style={{fontWeight:800,color:T.accentBright,minWidth:65}}>{t.pair}</span>
                        <Badge color={t.direction==="LONG"?T.green:T.red}>{t.direction}</Badge>
                        <span style={{fontSize:11,color:T.muted}}>{t.date}</span>
                        <Badge color={t.result==="WIN"?T.green:t.result==="LOSS"?T.red:T.amber}>{t.result}</Badge>
                        <span style={{marginLeft:"auto",fontWeight:800,color:t.rr>=0?T.green:T.red}}>{t.rr>=0?"+":""}{(t.rr||0).toFixed(2)}R</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{padding:"14px 22px",borderTop:`1px solid ${T.border}`,display:"flex",gap:10}}>
                <Btn T={T} onClick={()=>{setModal(viewPb);setViewPb(null)}}>✎ Edit</Btn>
                <Btn T={T} danger onClick={()=>del(viewPb.id)}>Delete</Btn>
                <Btn T={T} ghost onClick={()=>setViewPb(null)}>Close</Btn>
              </div>
            </div>
          </Overlay>
        )
      })()}

      {/* Create/Edit modal */}
      {modal&&<PlaybookModal T={T} initial={modal==="new"?null:modal} onSave={save} onClose={()=>setModal(null)}/>}
    </div>
  )
}

function PlaybookModal({T, initial, onSave, onClose}) {
  const EMOJIS=["📖","🎯","⚡","🔥","💎","🧊","🎪","🚀","🛡","⚔"]
  const blank={name:"",description:"",emoji:"📖",setup:"",tags:"",rules:[""]}
  const [f,setF]=useState(initial||blank)
  const upd=(k,v)=>setF(x=>({...x,[k]:v}))
  const addRule=()=>setF(x=>({...x,rules:[...x.rules,""]}))
  const updRule=(i,v)=>setF(x=>({...x,rules:x.rules.map((r,ri)=>ri===i?v:r)}))
  const delRule=(i)=>setF(x=>({...x,rules:x.rules.filter((_,ri)=>ri!==i)}))
  const submit=()=>{
    if(!f.name.trim()) return
    onSave({...f,tags:f.tags?f.tags.split(",").map(t=>t.trim()).filter(Boolean):[],rules:f.rules.filter(r=>r.trim()),id:initial?.id})
  }
  return (
    <Overlay onClose={onClose}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:16,width:"min(560px,96vw)",maxHeight:"92vh",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"18px 22px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:17,fontWeight:800,color:T.text}}>{initial?"Edit Playbook":"New Playbook"}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:20}}>✕</button>
        </div>
        <div style={{padding:"20px 22px",overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {EMOJIS.map(e=><button key={e} onClick={()=>upd("emoji",e)} style={{width:36,height:36,fontSize:20,background:f.emoji===e?`${T.accent}30`:"none",border:`1px solid ${f.emoji===e?T.accentBright:T.border}`,borderRadius:8,cursor:"pointer"}}>{e}</button>)}
          </div>
          <FL label="Playbook Name" T={T}><Inp T={T} placeholder="e.g. London Sweep + OB Entry" value={f.name} onChange={e=>upd("name",e.target.value)}/></FL>
          <FL label="Description" T={T}><Textarea T={T} rows={2} placeholder="What is this setup? When do you use it?" value={f.description} onChange={e=>upd("description",e.target.value)}/></FL>
          <FL label="Primary Setup (matches journal)" T={T}><Sel T={T} val={f.setup} opts={["",  ...SETUPS]} on={v=>upd("setup",v)}/></FL>
          <FL label="Match Tags (comma-sep)" T={T}><Inp T={T} placeholder="A+ Setup, OB, London" value={f.tags} onChange={e=>upd("tags",e.target.value)}/></FL>
          <div>
            <div style={{fontSize:11,fontWeight:600,color:T.textDim,marginBottom:8}}>Rules / Conditions</div>
            {f.rules.map((r,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:6}}>
                <span style={{fontWeight:800,color:T.accentBright,lineHeight:"38px",minWidth:20}}>{i+1}.</span>
                <Inp T={T} placeholder={`Rule ${i+1}...`} value={r} onChange={e=>updRule(i,e.target.value)}/>
                {f.rules.length>1&&<button onClick={()=>delRule(i)} style={{background:"none",border:`1px solid ${T.border}`,color:T.red,padding:"0 10px",borderRadius:8,cursor:"pointer",fontSize:14}}>✕</button>}
              </div>
            ))}
            <button onClick={addRule} style={{background:"none",border:`1px dashed ${T.border}`,color:T.textDim,padding:"8px 16px",borderRadius:8,cursor:"pointer",fontSize:12,width:"100%",marginTop:4}}>+ Add Rule</button>
          </div>
        </div>
        <div style={{padding:"14px 22px",borderTop:`1px solid ${T.border}`,display:"flex",gap:10}}>
          <Btn T={T} onClick={submit}>{initial?"Update":"Save Playbook"}</Btn>
          <Btn T={T} ghost onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    </Overlay>
  )
}

// ── AI Trade Analysis ─────────────────────────────────────────────────────────
function AIAnalysis({T, trades, dailyPlans}) {
  const [mode, setMode] = useState("journal") // journal | notes
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const buildJournalContext = () => {
    const wins=trades.filter(t=>t.result==="WIN"), losses=trades.filter(t=>t.result==="LOSS")
    const totalR=trades.reduce((s,t)=>s+(t.rr||0),0)
    const winRate=trades.length?(wins.length/trades.length*100).toFixed(1):0
    const byMistake={}; trades.forEach(t=>{ if(t.mistakes&&t.mistakes!=="None") byMistake[t.mistakes]=(byMistake[t.mistakes]||0)+1 })
    const byEmotion={}; trades.forEach(t=>{ if(t.emotion) byEmotion[t.emotion]=(byEmotion[t.emotion]||0)+1 })
    const byPair={}; trades.forEach(t=>{ if(!byPair[t.pair]) byPair[t.pair]={count:0,r:0,wins:0}; byPair[t.pair].count++; byPair[t.pair].r+=(t.rr||0); if(t.result==="WIN") byPair[t.pair].wins++ })
    const recentTrades=trades.slice(0,10).map(t=>`${t.date} ${t.pair} ${t.direction} ${t.result} ${t.rr>=0?"+":""}${(t.rr||0).toFixed(2)}R | Setup: ${t.setup} | Emotion: ${t.emotion} | Mistake: ${t.mistakes} | Notes: ${t.notes||"none"}`)
    return `
TRADER JOURNAL SUMMARY:
Total Trades: ${trades.length}
Win Rate: ${winRate}%
Total R: ${totalR>=0?"+":""}${totalR.toFixed(2)}R
Avg RR on wins: ${wins.length?(wins.reduce((s,t)=>s+t.rr,0)/wins.length).toFixed(2):0}R

PAIR PERFORMANCE:
${Object.entries(byPair).map(([p,d])=>`${p}: ${d.count} trades, ${(d.wins/d.count*100).toFixed(0)}% WR, ${d.r>=0?"+":""}${d.r.toFixed(1)}R`).join("\\n")}

TOP MISTAKES:
${Object.entries(byMistake).sort((a,b)=>b[1]-a[1]).map(([m,c])=>`${m}: ${c}x`).join(", ")||"None logged"}

EMOTIONAL STATES:
${Object.entries(byEmotion).sort((a,b)=>b[1]-a[1]).map(([e,c])=>`${e}: ${c}x`).join(", ")||"None logged"}

LAST 10 TRADES:
${recentTrades.join("\\n")}
    `.trim()
  }

  const analyze = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const isJournal = mode==="journal"
      const prompt = isJournal
        ? `You are an expert ICT/SMC trading coach analyzing a trader's journal. Here is their complete journal data:

${buildJournalContext()}

Provide a detailed, honest, and actionable analysis covering:
1. STRENGTHS - what they are doing well
2. WEAKNESSES - their biggest problems and patterns
3. PSYCHOLOGICAL PATTERNS - emotional and discipline issues
4. BEST SETUP - which setup/pair/session is most profitable
5. WORST HABIT - the single most damaging habit with specific advice to fix it
6. THIS WEEK'S FOCUS - one specific thing to work on

Be direct, specific, and use the actual data. Format with clear sections.`
        : `You are an expert ICT/SMC trading coach. A trader has written the following trade notes/journal entry. Analyze it and provide feedback:

"${notes}"

Provide:
1. What they did well
2. What could be improved
3. ICT/SMC concepts that apply to this trade
4. Specific advice for next time

Be concise, direct and actionable.`

      const response = await fetch("/api/analysis", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          prompt
        })
      })
      const data = await response.json()
      if(!response.ok) throw new Error(data.error || data.message || "Request failed")
      setResult(data.text || "No response")
    } catch(e) {
      setError("Analysis failed: "+e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{maxWidth:720}}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"20px",marginBottom:14}}>
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:17,fontWeight:800,color:T.text,marginBottom:6}}>🤖 AI Trading Coach</div>
        <div style={{fontSize:13,color:T.textDim,marginBottom:16}}>Powered by Gemini — your personal ICT/SMC trading analyst</div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[{id:"journal",label:"📊 Analyze My Journal"},{id:"notes",label:"📝 Analyze Trade Notes"}].map(m=>(
            <button key={m.id} onClick={()=>{setMode(m.id);setResult(null)}} style={{padding:"9px 18px",borderRadius:20,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"Inter,sans-serif",background:mode===m.id?`linear-gradient(135deg,${T.accentBright},${T.pink})`:`${T.surface2}`,color:mode===m.id?"#fff":T.textDim,border:`1px solid ${mode===m.id?"transparent":T.border}`}}>{m.label}</button>
          ))}
        </div>
        {mode==="journal"&&(
          <div>
            <div style={{fontSize:12,color:T.textDim,marginBottom:12,padding:"10px 14px",background:T.surface2,borderRadius:8}}>
              Will analyze your last {trades.length} trades — win rate, mistakes, emotional patterns, best pairs, and give you a personalized action plan.
            </div>
            {trades.length===0?<div style={{color:T.amber,fontSize:13}}>⚠ Log some trades first before running analysis.</div>:(
              <Btn T={T} onClick={analyze}>{loading?"🤔 Analyzing...":"🚀 Analyze My Journal"}</Btn>
            )}
          </div>
        )}
        {mode==="notes"&&(
          <div>
            <FL label="Paste your trade notes or journal entry" T={T}>
              <Textarea T={T} rows={5} placeholder="e.g. Took a long on EURUSD during London open. Waited for the liquidity sweep below Asian lows, then entered on the OB retest. SL was 15 pips below the OB, TP at the next draw on liquidity. Felt confident but moved SL early..." value={notes} onChange={e=>setNotes(e.target.value)}/>
            </FL>
            <div style={{marginTop:10}}>
              <Btn T={T} onClick={analyze} disabled={!notes.trim()&&!loading}>{loading?"🤔 Analyzing...":"🔍 Analyze Notes"}</Btn>
            </div>
          </div>
        )}
      </div>

      {error&&<div style={{background:"#450a0a",border:"1px solid #991b1b",color:"#fca5a5",padding:"12px 16px",borderRadius:10,fontSize:13,marginBottom:14}}>{error}</div>}

      {loading&&(
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"32px",textAlign:"center"}}>
          <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:12}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:T.accentBright,animation:`pulse 1.2s ${i*0.2}s infinite ease-in-out`}}/>)}</div>
          <div style={{fontSize:13,color:T.textDim}}>Gemini is analyzing your trading data...</div>
        </div>
      )}

      {result&&(
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"20px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:T.text}}>Analysis Results</div>
            <button onClick={()=>setResult(null)} style={{background:"none",border:`1px solid ${T.border}`,color:T.textDim,padding:"5px 12px",borderRadius:8,cursor:"pointer",fontSize:12}}>Clear</button>
          </div>
          <div style={{fontSize:13,color:T.text,lineHeight:1.8,whiteSpace:"pre-wrap"}}>{result}</div>
        </div>
      )}
    </div>
  )
}

// ── Export Tab ────────────────────────────────────────────────────────────────
function ExportTab({T, trades, dailyPlans, weeklyPlans}) {
  const [exporting, setExporting] = useState(null)

  const downloadCSV = (data, filename) => {
    if(!data.length) return
    const headers = Object.keys(data[0])
    const csv = [
      headers.join(","),
      ...data.map(row=>headers.map(h=>{
        const val = row[h]
        if(val===null||val===undefined) return ""
        if(typeof val==="object") return `"${JSON.stringify(val).replace(/"/g,'""')}"`
        return `"${String(val).replace(/"/g,'""')}"`
      }).join(","))
    ].join("\n")
    const blob = new Blob([csv], {type:"text/csv"})
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href=url; a.download=filename; a.click()
    URL.revokeObjectURL(url)
  }

  const exportTrades = () => {
    setExporting("trades")
    const data = trades.map(t=>({
      date:t.date, pair:t.pair, direction:t.direction, result:t.result,
      rr:t.rr, pips:t.pips, entry:t.entry, sl:t.sl, tp:t.tp,
      session:t.session, killzone:t.killzone, dailyBias:t.dailyBias,
      weeklyBias:t.weeklyBias, manipulation:t.manipulation, poi:t.poi,
      setup:t.setup, emotion:t.emotion, mistakes:t.mistakes,
      notes:t.notes, tags:(t.tags||[]).join(";")
    }))
    downloadCSV(data, `fxedge_trades_${new Date().toISOString().split("T")[0]}.csv`)
    setTimeout(()=>setExporting(null), 1000)
  }

  const exportDaily = () => {
    setExporting("daily")
    const data = dailyPlans.map(p=>({
      date:p.date, pairs:(p.pairs||[]).join(";"),
      weeklyTheme:p.weeklyTheme, keyLevels:p.keyLevels,
      manipulation:p.manipulation, watchlist:p.watchlist, notes:p.notes
    }))
    downloadCSV(data, `fxedge_daily_${new Date().toISOString().split("T")[0]}.csv`)
    setTimeout(()=>setExporting(null), 1000)
  }

  const exportSummary = () => {
    setExporting("summary")
    const wins=trades.filter(t=>t.result==="WIN")
    const losses=trades.filter(t=>t.result==="LOSS")
    const totalR=trades.reduce((s,t)=>s+(t.rr||0),0)
    const byPair={}; trades.forEach(t=>{ if(!byPair[t.pair]) byPair[t.pair]={count:0,wins:0,r:0}; byPair[t.pair].count++; if(t.result==="WIN") byPair[t.pair].wins++; byPair[t.pair].r+=(t.rr||0) })
    const data=[
      {metric:"Total Trades",value:trades.length},
      {metric:"Wins",value:wins.length},
      {metric:"Losses",value:losses.length},
      {metric:"Win Rate",value:`${trades.length?(wins.length/trades.length*100).toFixed(1):0}%`},
      {metric:"Total R",value:totalR.toFixed(2)},
      {metric:"Avg RR on Wins",value:wins.length?(wins.reduce((s,t)=>s+t.rr,0)/wins.length).toFixed(2):"0"},
      {metric:"Best Pair",value:Object.entries(byPair).sort((a,b)=>b[1].r-a[1].r)[0]?.[0]||"—"},
      ...Object.entries(byPair).map(([p,d])=>({metric:`${p} Total R`,value:d.r.toFixed(2)})),
    ]
    downloadCSV(data, `fxedge_summary_${new Date().toISOString().split("T")[0]}.csv`)
    setTimeout(()=>setExporting(null), 1000)
  }

  const EXPORTS = [
    {id:"trades",icon:"📒",title:"Export All Trades",desc:`${trades.length} trades with full details — pair, direction, result, RR, bias, setup, emotion, notes`,action:exportTrades,count:trades.length},
    {id:"daily",icon:"📅",title:"Export Daily Plans",desc:`${dailyPlans.length} daily plans with bias, key levels, and manipulation notes`,action:exportDaily,count:dailyPlans.length},
    {id:"summary",icon:"📊",title:"Export Performance Summary",desc:"Key stats — win rate, total R, pair breakdown, best/worst metrics",action:exportSummary,count:1},
  ]

  return (
    <div style={{maxWidth:620}}>
      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,color:T.text,marginBottom:6}}>Export Your Data</div>
      <div style={{fontSize:13,color:T.textDim,marginBottom:20}}>Download your journal as CSV files — import to Excel, Google Sheets, or share with your mentor.</div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {EXPORTS.map(ex=>(
          <div key={ex.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px 20px",display:"flex",alignItems:"center",gap:16}}>
            <span style={{fontSize:32,flexShrink:0}}>{ex.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:800,color:T.text,marginBottom:4}}>{ex.title}</div>
              <div style={{fontSize:12,color:T.textDim}}>{ex.desc}</div>
            </div>
            <button onClick={ex.action} disabled={ex.count===0||exporting===ex.id} style={{
              background:ex.count===0?T.surface2:`linear-gradient(135deg,${T.accentBright},${T.pink})`,
              color:ex.count===0?T.muted:"#fff",border:"none",padding:"10px 18px",
              borderRadius:10,cursor:ex.count===0?"not-allowed":"pointer",
              fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13,
              whiteSpace:"nowrap",flexShrink:0,
            }}>{exporting===ex.id?"✓ Done!":ex.count===0?"No Data":"⬇ Download CSV"}</button>
          </div>
        ))}
      </div>
      <div style={{marginTop:20,padding:"14px 16px",background:T.surface2,borderRadius:10,fontSize:12,color:T.muted,lineHeight:1.6}}>
        💡 <b style={{color:T.textDim}}>Note:</b> Screenshots are not included in CSV exports due to file size. All other data including notes, tags, bias, and psychology fields are included.
      </div>
    </div>
  )
}

function Section({T,title,children}){return <div><div style={{fontSize:11,fontWeight:700,color:T.accentBright,letterSpacing:"0.12em",textTransform:"uppercase",paddingBottom:8,borderBottom:`1px solid ${T.border}`,marginBottom:12}}>{title}</div>{children}</div>}

// ── CSS ───────────────────────────────────────────────────────────────────────
function buildCSS(T) {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    body { background:${T.bg}; font-family:Inter,sans-serif; }
    ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:${T.bg}}::-webkit-scrollbar-thumb{background:${T.border};border-radius:4px}
    .sidebar { width:200px; position:fixed; top:0; left:0; height:100vh; z-index:50; overflow-y:auto; display:flex; flex-direction:column; }
    .nav-btn { display:block; width:100%; padding:10px 20px; background:none; border:none; border-left:3px solid transparent; cursor:pointer; font-family:Inter,sans-serif; font-size:13px; font-weight:500; text-align:left; transition:all .15s; }
    .nav-btn:hover { background:${T.surface2}; color:${T.text} !important; }
    .bottom-nav { display:none; position:fixed; bottom:0; left:0; right:0; z-index:50; }
    @media(max-width:768px){
      .sidebar{display:none;}
      main{margin-left:0 !important;padding-bottom:76px;}
      .bottom-nav{display:flex !important;}
      .kpi-grid{grid-template-columns:repeat(2,1fr) !important;}
      .hide-mobile{display:none !important;}
    }
  `
}
