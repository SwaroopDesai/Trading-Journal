"use client"
import { createClient } from "@/lib/supabase"
import { useState, useMemo, useEffect, useCallback } from "react";

const PAIRS = ["EURUSD","GBPUSD","USDCAD","GER30","SPX500","NAS100"];
const SESSIONS = ["London","New York","Asian","London/NY Overlap"];
const BIASES = ["Bullish","Bearish","Neutral"];
const SETUPS = ["Manipulation + POI","Liquidity Sweep","Breaker Block","Order Block","Fair Value Gap","CHoCH + BOS","Kill Zone Entry","Other"];
const MISTAKES = ["Moved SL","FOMO Entry","Ignored Bias","Wrong Session","Over-leveraged","No Confirmation","Revenge Trade","None"];
const EMOTIONS = ["Calm & Focused","Confident","Anxious","Impatient","Revenge Mode","Bored","Overconfident","Fearful"];
const KILL_ZONES = ["London Open (02-05 EST)","NY Open (08-11 EST)","London Close (10-12 EST)","Asian Killzone (20-23 EST)","None"];
const POI_TYPES = ["Order Block","Breaker Block","FVG","Mitigation Block","Liquidity Pool","Premium/Discount","VWAP","PDHL"];
const MANI_TYPES = ["Liquidity Sweep High","Liquidity Sweep Low","Stop Hunt","False Break","Judas Swing","None"];
const fmtDate = d => new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"2-digit"});
const fmtRR = rr => rr >= 0 ? `+${rr.toFixed(2)}R` : `${rr.toFixed(2)}R`;

// ── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ supabase }) {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const sendMagicLink = async () => {
    if (!email) return
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
    if (error) { setError(error.message); setLoading(false); return; }
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{minHeight:"100vh",background:"#080c10",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:24,fontFamily:"'DM Mono',monospace",padding:24}}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@800&display=swap');"}</style>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:32,color:"#00c9a7",letterSpacing:"0.08em",fontWeight:800}}>FX<span style={{color:"#dce6f0"}}>EDGE</span></div>
      <div style={{fontSize:11,color:"#4a5a6a",letterSpacing:"0.2em",marginTop:-16}}>TRADING JOURNAL</div>
      {!sent ? (
        <div style={{background:"#0d1117",border:"1px solid #1e2a35",borderRadius:6,padding:28,width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:14}}>
          <div style={{fontSize:11,color:"#6b7f8f",letterSpacing:"0.1em"}}>ENTER YOUR EMAIL TO LOGIN</div>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&sendMagicLink()}
            style={{background:"#131920",border:"1px solid #1e2a35",color:"#dce6f0",fontFamily:"'DM Mono',monospace",fontSize:13,padding:"10px 12px",borderRadius:3,outline:"none",width:"100%"}}
          />
          {error && <div style={{fontSize:11,color:"#ef4444"}}>{error}</div>}
          <button
            onClick={sendMagicLink}
            disabled={loading}
            style={{background:"#00c9a7",color:"#020f0d",border:"none",padding:"10px 20px",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600,cursor:"pointer",borderRadius:3,opacity:loading?0.6:1}}
          >
            {loading ? "Sending..." : "Send Magic Link"}
          </button>
        </div>
      ) : (
        <div style={{background:"#0d1117",border:"1px solid #1e2a35",borderRadius:6,padding:28,width:"100%",maxWidth:360,textAlign:"center",gap:12,display:"flex",flexDirection:"column"}}>
          <div style={{fontSize:28}}>📬</div>
          <div style={{fontSize:13,color:"#dce6f0"}}>Check your email</div>
          <div style={{fontSize:11,color:"#6b7f8f",lineHeight:1.6}}>We sent a magic link to <b style={{color:"#00c9a7"}}>{email}</b>. Click it to sign in.</div>
          <button onClick={()=>setSent(false)} style={{background:"none",border:"1px solid #1e2a35",color:"#6b7f8f",padding:"8px 16px",fontFamily:"'DM Mono',monospace",fontSize:11,cursor:"pointer",borderRadius:3,marginTop:8}}>Use different email</button>
        </div>
      )}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const supabase = createClient()
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [trades, setTrades] = useState([]);
  const [dailyPlans, setDailyPlans] = useState([]);
  const [weeklyPlans, setWeeklyPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [tradeModal, setTradeModal] = useState(null);
  const [dailyModal, setDailyModal] = useState(null);
  const [weeklyModal, setWeeklyModal] = useState(null);
  const [filterPair, setFilterPair] = useState("ALL");
  const [filterResult, setFilterResult] = useState("ALL");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [imgViewer, setImgViewer] = useState(null);

  // ── Auth listener ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Load data ──
  const loadAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const [t, d, w] = await Promise.all([
        supabase.from("trades").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("daily_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("weekly_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ])
      if (t.error) throw t.error
      if (d.error) throw d.error
      if (w.error) throw w.error
      setTrades((t.data || []).map(r => ({ ...r, _dbid: r.id })))
      setDailyPlans((d.data || []).map(r => ({ ...r, _dbid: r.id })))
      setWeeklyPlans((w.data || []).map(r => ({ ...r, _dbid: r.id })))
    } catch (e) {
      setError("Failed to load data: " + e.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { if (user) loadAll() }, [user, loadAll])

  // ── Save Trade ──
  const saveTrade = async (t) => {
    setSyncing(true)
    try {
      const payload = { ...t, user_id: user.id }
      delete payload._dbid
      delete payload.id
      delete payload.created_at
      if (t._dbid) {
        const { error } = await supabase.from("trades").update(payload).eq("id", t._dbid).eq("user_id", user.id)
        if (error) throw error
        setTrades(ts => ts.map(x => x._dbid === t._dbid ? { ...payload, _dbid: t._dbid } : x))
      } else {
        const { data, error } = await supabase.from("trades").insert([payload]).select()
        if (error) throw error
        setTrades(ts => [{ ...data[0], _dbid: data[0].id }, ...ts])
      }
      setTradeModal(null)
    } catch (e) {
      setError("Failed to save trade: " + e.message)
    } finally {
      setSyncing(false)
    }
  }

  // ── Save Daily ──
  const saveDaily = async (p) => {
    setSyncing(true)
    try {
      const payload = { ...p, user_id: user.id }
      delete payload._dbid
      delete payload.id
      delete payload.created_at
      if (p._dbid) {
        const { error } = await supabase.from("daily_plans").update(payload).eq("id", p._dbid).eq("user_id", user.id)
        if (error) throw error
        setDailyPlans(ps => ps.map(x => x._dbid === p._dbid ? { ...payload, _dbid: p._dbid } : x))
      } else {
        const { data, error } = await supabase.from("daily_plans").insert([payload]).select()
        if (error) throw error
        setDailyPlans(ps => [{ ...data[0], _dbid: data[0].id }, ...ps])
      }
      setDailyModal(null)
    } catch (e) {
      setError("Failed to save daily plan: " + e.message)
    } finally {
      setSyncing(false)
    }
  }

  // ── Save Weekly ──
  const saveWeekly = async (p) => {
    setSyncing(true)
    try {
      const payload = { ...p, user_id: user.id }
      delete payload._dbid
      delete payload.id
      delete payload.created_at
      if (p._dbid) {
        const { error } = await supabase.from("weekly_plans").update(payload).eq("id", p._dbid).eq("user_id", user.id)
        if (error) throw error
        setWeeklyPlans(ps => ps.map(x => x._dbid === p._dbid ? { ...payload, _dbid: p._dbid } : x))
      } else {
        const { data, error } = await supabase.from("weekly_plans").insert([payload]).select()
        if (error) throw error
        setWeeklyPlans(ps => [{ ...data[0], _dbid: data[0].id }, ...ps])
      }
      setWeeklyModal(null)
    } catch (e) {
      setError("Failed to save weekly plan: " + e.message)
    } finally {
      setSyncing(false)
    }
  }

  // ── Delete ──
  const confirmDelete = async () => {
    setSyncing(true)
    try {
      const tbl = { trade: "trades", daily: "daily_plans", weekly: "weekly_plans" }[deleteTarget.type]
      const { error } = await supabase.from(tbl).delete().eq("id", deleteTarget.dbid).eq("user_id", user.id)
      if (error) throw error
      if (deleteTarget.type === "trade") setTrades(ts => ts.filter(x => x._dbid !== deleteTarget.dbid))
      if (deleteTarget.type === "daily") setDailyPlans(ps => ps.filter(x => x._dbid !== deleteTarget.dbid))
      if (deleteTarget.type === "weekly") setWeeklyPlans(ps => ps.filter(x => x._dbid !== deleteTarget.dbid))
      setDeleteTarget(null)
    } catch (e) {
      setError("Failed to delete: " + e.message)
    } finally {
      setSyncing(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setTrades([]); setDailyPlans([]); setWeeklyPlans([])
  }

  // Expose save for WeeklyReview component
  useEffect(() => {
    window._saveWeeklyReview = (updated) => saveWeekly(updated)
    return () => { delete window._saveWeeklyReview }
  }, [user])

  const stats = useMemo(() => {
    const t=trades, wins=t.filter(x=>x.result==="WIN"), losses=t.filter(x=>x.result==="LOSS"), be=t.filter(x=>x.result==="BREAKEVEN");
    const totalR=t.reduce((s,x)=>s+(x.rr||0),0), avgRR=wins.length?wins.reduce((s,x)=>s+x.rr,0)/wins.length:0, winRate=t.length?(wins.length/t.length)*100:0;
    const byPair=PAIRS.map(p=>{const pt=t.filter(x=>x.pair===p);return{pair:p,count:pt.length,wins:pt.filter(x=>x.result==="WIN").length,totalR:pt.reduce((s,x)=>s+(x.rr||0),0)};});
    const bySession=SESSIONS.map(s=>{const st=t.filter(x=>x.session===s);return{session:s,count:st.length,wins:st.filter(x=>x.result==="WIN").length,totalR:st.reduce((s2,x)=>s2+(x.rr||0),0)};}).filter(x=>x.count>0);
    const equityCurve=[];let cum=0;
    [...t].sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach(x=>{cum+=(x.rr||0);equityCurve.push({r:cum,result:x.result});});
    return {total:t.length,wins:wins.length,losses:losses.length,be:be.length,totalR,avgRR,winRate,byPair,bySession,equityCurve};
  },[trades]);

  const filtered = useMemo(()=>trades.filter(t=>(filterPair==="ALL"||t.pair===filterPair)&&(filterResult==="ALL"||t.result===filterResult)).sort((a,b)=>new Date(b.date)-new Date(a.date)),[trades,filterPair,filterResult]);

  const TABS=[{id:"dashboard",icon:"◈",label:"Dashboard"},{id:"journal",icon:"◎",label:"Journal"},{id:"daily",icon:"◷",label:"Daily"},{id:"weekly",icon:"◻",label:"Weekly"},{id:"analytics",icon:"▦",label:"Analytics"},{id:"psychology",icon:"◉",label:"Mind"},{id:"calculator",icon:"◧",label:"Calc"},{id:"news",icon:"◨",label:"News"},{id:"gallery",icon:"◫",label:"Gallery"},{id:"review",icon:"◬",label:"Review"}];

  // ── Auth loading ──
  if (authLoading) return (
    <div style={{minHeight:"100vh",background:"#080c10",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&display=swap'); @keyframes pulse{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}"}</style>
      <div style={{display:"flex",gap:8}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#00c9a7",animation:`pulse 1.2s ${i*0.2}s infinite ease-in-out`}}/>)}</div>
    </div>
  )

  // ── Not logged in ──
  if (!user) return <LoginScreen supabase={supabase} />

  // ── Data loading ──
  if (loading) return (
    <div style={{minHeight:"100vh",background:"#080c10",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,fontFamily:"monospace"}}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&display=swap'); @keyframes pulse{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}"}</style>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:32,color:"#00c9a7",letterSpacing:"0.08em",fontWeight:800}}>FX<span style={{color:"#dce6f0"}}>EDGE</span></div>
      <div style={{display:"flex",gap:8}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#00c9a7",animation:`pulse 1.2s ${i*0.2}s infinite ease-in-out`}}/>)}</div>
      <div style={{fontSize:11,color:"#4a5a6a",letterSpacing:"0.2em"}}>LOADING YOUR JOURNAL</div>
    </div>
  )

  return (
    <div className="app">
      <style>{CSS}</style>
      <nav className="sidebar">
        <div className="logo">FX<span>EDGE</span></div>
        {TABS.map(t=><button key={t.id} className={`nav-item ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}><span className="nav-icon">{t.icon}</span><span>{t.label}</span></button>)}
        <div style={{flex:1}}/>
        <div className="user-email">{user.email}</div>
        <div className="sync-status" onClick={loadAll}>☁ {syncing?"Saving...":"Live Sync"}</div>
        <button className="signout-btn" onClick={signOut}>Sign Out</button>
        <div className="sidebar-footer">ICT · SMC</div>
      </nav>
      <main className="main">
        <div className="topbar">
          <div>
            <div className="page-title">{TABS.find(t=>t.id===tab)?.label}</div>
            <div className="page-sub">{new Date().toLocaleDateString("en-GB",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}</div>
          </div>
          <div className="topbar-actions">
            <div className="sync-pill" onClick={loadAll}>{syncing?"⟳ Saving":"☁ Synced"}</div>
            {tab==="journal"&&<button className="btn-add" onClick={()=>setTradeModal("new")}>+ Log Trade</button>}
            {tab==="daily"&&<button className="btn-add" onClick={()=>setDailyModal("new")}>+ Daily Plan</button>}
            {tab==="weekly"&&<button className="btn-add" onClick={()=>setWeeklyModal("new")}>+ Weekly Plan</button>}
          </div>
        </div>
        {error&&<div className="error-banner">⚠ {error}<button onClick={()=>setError(null)} style={{marginLeft:12,background:"none",border:"none",color:"inherit",cursor:"pointer",fontWeight:700}}>✕</button></div>}
        <div className="content">
          {tab==="dashboard"&&<Dashboard stats={stats} trades={trades} dailyPlans={dailyPlans} weeklyPlans={weeklyPlans} onNewTrade={()=>setTradeModal("new")} onNewDaily={()=>setDailyModal("new")}/>}
          {tab==="journal"&&<Journal filtered={filtered} filterPair={filterPair} setFilterPair={setFilterPair} filterResult={filterResult} setFilterResult={setFilterResult} onEdit={t=>setTradeModal(t)} onDelete={t=>setDeleteTarget({type:"trade",dbid:t._dbid,name:`${t.pair} ${t.direction}`})} onViewImg={setImgViewer} onNew={()=>setTradeModal("new")}/>}
          {tab==="daily"&&<DailyTab plans={dailyPlans} onEdit={p=>setDailyModal(p)} onDelete={p=>setDeleteTarget({type:"daily",dbid:p._dbid,name:`Daily ${p.date}`})} onNew={()=>setDailyModal("new")}/>}
          {tab==="weekly"&&<WeeklyTab plans={weeklyPlans} onEdit={p=>setWeeklyModal(p)} onDelete={p=>setDeleteTarget({type:"weekly",dbid:p._dbid,name:`Week ${p.weekStart}`})} onNew={()=>setWeeklyModal("new")}/>}
          {tab==="analytics"&&<Analytics stats={stats} trades={trades}/>}
          {tab==="psychology"&&<Psychology stats={stats} trades={trades}/>}
          {tab==="calculator"&&<Calculator/>}
          {tab==="news"&&<NewsCalendar/>}
          {tab==="gallery"&&<ScreenshotGallery trades={trades}/>}
          {tab==="review"&&<WeeklyReview weeklyPlans={weeklyPlans} trades={trades}/>}
        </div>
      </main>
      {tradeModal&&<TradeModal initial={tradeModal==="new"?null:tradeModal} onSave={saveTrade} onClose={()=>setTradeModal(null)} syncing={syncing}/>}
      {dailyModal&&<DailyModal initial={dailyModal==="new"?null:dailyModal} onSave={saveDaily} onClose={()=>setDailyModal(null)} syncing={syncing}/>}
      {weeklyModal&&<WeeklyModal initial={weeklyModal==="new"?null:weeklyModal} onSave={saveWeekly} onClose={()=>setWeeklyModal(null)} syncing={syncing}/>}
      {deleteTarget&&(
        <div className="overlay" onClick={()=>setDeleteTarget(null)}>
          <div className="confirm-modal" onClick={e=>e.stopPropagation()}>
            <div className="confirm-title">Delete this entry?</div>
            <div className="confirm-sub">{deleteTarget.name}</div>
            <div className="confirm-sub" style={{color:"#ef4444",fontSize:10,marginTop:-10}}>Permanently removed from cloud.</div>
            <div className="confirm-actions">
              <button className="btn-danger" onClick={confirmDelete} disabled={syncing}>{syncing?"Deleting...":"Delete"}</button>
              <button className="btn-ghost" onClick={()=>setDeleteTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {imgViewer&&<div className="overlay" onClick={()=>setImgViewer(null)}><img src={imgViewer} alt="chart" style={{maxWidth:"95vw",maxHeight:"90vh",borderRadius:4}}/></div>}
      <nav className="bottom-nav">{TABS.map(t=><button key={t.id} className={`bn-item ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}><span className="bn-icon">{t.icon}</span><span>{t.label}</span></button>)}</nav>
    </div>
  );
}

function Dashboard({stats,trades,dailyPlans,weeklyPlans,onNewTrade,onNewDaily}) {
  const [newsEvents,setNewsEvents] = useState([])
  const [newsLoading,setNewsLoading] = useState(true)
  useEffect(()=>{
    fetchForexNews().then(d=>{
      setNewsEvents(d.filter(e=>e.impact==="High"))
      setNewsLoading(false)
    }).catch(()=>setNewsLoading(false))
  },[])
  const today=new Date().toISOString().split("T")[0];
  const todayTrades=trades.filter(t=>t.date===today);
  const latestDaily=[...dailyPlans].sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  const latestWeekly=[...weeklyPlans].sort((a,b)=>new Date(b.weekStart)-new Date(a.weekStart))[0];
  return (
    <div>
      <div className="kpi-row">
        <KPI label="Total R" value={`${stats.totalR>=0?"+":""}${stats.totalR.toFixed(2)}R`} color={stats.totalR>=0?"var(--green)":"var(--red)"} sub={`${stats.total} trades`}/>
        <KPI label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color={stats.winRate>=55?"var(--green)":stats.winRate>=45?"var(--amber)":"var(--red)"} sub={`${stats.wins}W · ${stats.losses}L · ${stats.be}BE`}/>
        <KPI label="Avg RR" value={`${stats.avgRR.toFixed(2)}R`} color={stats.avgRR>=2?"var(--green)":stats.avgRR>=1?"var(--amber)":"var(--red)"} sub="on wins"/>
        <KPI label="Best Pair" value={[...stats.byPair].sort((a,b)=>b.totalR-a.totalR)[0]?.pair||"—"} color="var(--accent)" sub={`${([...stats.byPair].sort((a,b)=>b.totalR-a.totalR)[0]?.totalR||0)>=0?"+":""}${([...stats.byPair].sort((a,b)=>b.totalR-a.totalR)[0]?.totalR||0).toFixed(1)}R`}/>
      </div>
      <div className="dash-grid">
        <div className="card span2"><div className="card-title">Equity Curve (R)</div><MiniEquityCurve data={stats.equityCurve}/></div>
        <div className="card"><div className="card-title">Today</div>
          {todayTrades.length===0?<div className="empty-state"><div style={{opacity:.4}}>No trades today</div><button className="btn-sm" onClick={onNewTrade}>+ Log Trade</button></div>
          :todayTrades.map(t=><div key={t._dbid} className="mini-trade"><span className="mini-pair">{t.pair}</span><span className={`dir-badge dir-${t.direction?.toLowerCase()}`}>{t.direction}</span><span className={`result-badge result-${t.result?.toLowerCase()}`}>{t.result}</span><span className={t.rr>=0?"rr-pos":"rr-neg"}>{fmtRR(t.rr||0)}</span></div>)}
        </div>
        <div className="card"><div className="card-title">Daily Bias {latestDaily&&<span className="card-date">{fmtDate(latestDaily.date)}</span>}</div>
          {latestDaily?<div>{latestDaily.pairs?.map(p=><div key={p} className="bias-row"><span className="bias-pair">{p}</span><span className={`bias-tag bias-${latestDaily.biases?.[p]?.toLowerCase()}`}>{latestDaily.biases?.[p]}</span></div>)}<div className="card-note">{latestDaily.notes}</div></div>
          :<div className="empty-state"><button className="btn-sm" onClick={onNewDaily}>+ Add Daily Plan</button></div>}
        </div>
        <div className="card"><div className="card-title">Weekly Theme {latestWeekly&&<span className="card-date">{latestWeekly.weekStart}</span>}</div>
          {latestWeekly?<div><div className="weekly-bias-tag">{latestWeekly.overallBias}</div><div className="card-note" style={{marginTop:8}}>{latestWeekly.marketStructure}</div><div className="card-label" style={{marginTop:8}}>Key Events</div><div className="card-note">{latestWeekly.keyEvents}</div></div>
          :<div className="empty-state">No weekly plan yet</div>}
        </div>
        <div className="card"><div className="card-title">By Pair</div>
          {stats.byPair.filter(p=>p.count>0).length===0?<div className="empty-state" style={{fontSize:11}}>Log trades to see data</div>
          :stats.byPair.filter(p=>p.count>0).map(p=><div key={p.pair} className="bar-row"><span className="bar-label">{p.pair}</span><div className="bar-track"><div className="bar-fill" style={{width:`${Math.min(100,Math.abs(p.totalR)*12)}%`,background:p.totalR>=0?"var(--green)":"var(--red)"}}/></div><span className={p.totalR>=0?"rr-pos":"rr-neg"} style={{fontSize:11,minWidth:40,textAlign:"right"}}>{p.totalR>=0?"+":""}{p.totalR.toFixed(1)}R</span><span style={{fontSize:10,color:"var(--muted)",marginLeft:6}}>{p.wins}/{p.count}</span></div>)}
        </div>
        <div className="card span2">
          <div className="card-title">
            ⚡ HIGH IMPACT NEWS THIS WEEK
            <span style={{fontSize:9,color:"var(--muted)",marginLeft:"auto"}}>USD · EUR · GBP</span>
          </div>
          {newsLoading ? (
            <div style={{fontSize:11,color:"var(--muted)",padding:"8px 0"}}>Loading...</div>
          ) : newsEvents.length===0 ? (
            <div style={{fontSize:11,color:"var(--muted)",padding:"8px 0"}}>No high impact events this week</div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {newsEvents.slice(0,8).map((e,i)=>{
                const isKey=["NFP","Non-Farm","CPI","GDP","FOMC","Interest Rate","Fed"].some(k=>e.title?.includes(k))
                const cc=e.country==="USD"?"#3b82f6":e.country==="EUR"?"#00c9a7":"#8b5cf6"
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",background:isKey?"rgba(239,68,68,0.06)":"var(--surface2)",border:`1px solid ${isKey?"rgba(239,68,68,0.25)":"var(--border)"}`,borderRadius:3}}>
                    {isKey&&<span style={{fontSize:8,background:"var(--red)",color:"#fff",padding:"1px 5px",borderRadius:2,fontWeight:700,letterSpacing:"0.08em",flexShrink:0}}>KEY</span>}
                    <span style={{fontSize:9,color:"var(--text-dim)",minWidth:90,flexShrink:0}}>
                      {e.date} {e.date&&e.time ? (() => { try { const dt=new Date(`${e.date}T${e.time}`); return isNaN(dt)?e.time:dt.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) } catch{return e.time} })() : ""}
                    </span>
                    <span style={{fontSize:9,fontWeight:700,color:cc,minWidth:28,flexShrink:0}}>{e.country}</span>
                    <span style={{fontSize:11,color:"var(--text)",flex:1}}>{e.title}</span>
                    <span style={{fontSize:9,color:"var(--red)",letterSpacing:"0.08em",flexShrink:0}}>HIGH</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function KPI({label,value,color,sub}){return <div className="kpi-card"><div className="kpi-label">{label}</div><div className="kpi-value" style={{color}}>{value}</div><div className="kpi-sub">{sub}</div></div>;}
function MiniEquityCurve({data}){
  if(!data.length) return <div className="empty-state" style={{fontSize:11,padding:"24px 0"}}>Your equity curve will appear here after logging trades</div>;
  const W=500,H=80,vals=data.map(d=>d.r),mn=Math.min(0,...vals),mx=Math.max(0,...vals),rng=mx-mn||1;
  const px=i=>(i/(data.length-1||1))*(W-20)+10, py=v=>H-8-((v-mn)/rng)*(H-16);
  const path=data.map((d,i)=>`${i===0?"M":"L"} ${px(i)} ${py(d.r)}`).join(" ");
  const col=data[data.length-1]?.r>=0?"#22c55e":"#ef4444";
  return <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}><defs><linearGradient id="eq" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity="0.25"/><stop offset="100%" stopColor={col} stopOpacity="0"/></linearGradient></defs><line x1="10" y1={py(0)} x2={W-10} y2={py(0)} stroke="#2a2a3a" strokeWidth="1" strokeDasharray="3 3"/><path d={path+` L ${px(data.length-1)} ${H} L ${px(0)} ${H} Z`} fill="url(#eq)"/><path d={path} fill="none" stroke={col} strokeWidth="1.5"/></svg>;
}

function Journal({filtered,filterPair,setFilterPair,filterResult,setFilterResult,onEdit,onDelete,onViewImg,onNew}){
  return <div>
    <div className="filter-bar">
      <div className="filter-group">{["ALL",...PAIRS].map(p=><button key={p} className={`chip ${filterPair===p?"active":""}`} onClick={()=>setFilterPair(p)}>{p}</button>)}</div>
      <div className="filter-group">{["ALL","WIN","LOSS","BREAKEVEN"].map(r=><button key={r} className={`chip ${filterResult===r?"active":""}`} onClick={()=>setFilterResult(r)}>{r}</button>)}</div>
    </div>
    {filtered.length===0&&<div className="empty-big">Your journal is empty and ready.<br/><button className="btn-add" style={{marginTop:16}} onClick={onNew}>+ Log Your First Trade</button></div>}
    <div className="trade-list">{filtered.map(t=><div key={t._dbid} className="trade-card">
      <div className="tc-header">
        <div className="tc-left"><span className="tc-pair">{t.pair}</span><span className={`dir-badge dir-${t.direction?.toLowerCase()}`}>{t.direction}</span><span className="tc-date">{fmtDate(t.date)}</span><span className="tc-session">{t.session}</span></div>
        <div className="tc-right"><span className={`result-badge result-${t.result?.toLowerCase()}`}>{t.result}</span><span className={t.rr>=0?"rr-pos rr-big":"rr-neg rr-big"}>{fmtRR(t.rr||0)}</span></div>
      </div>
      <div className="tc-meta">
        <MT label="D.Bias" value={t.dailyBias} color={t.dailyBias==="Bullish"?"var(--green)":t.dailyBias==="Bearish"?"var(--red)":null}/>
        <MT label="W.Bias" value={t.weeklyBias} color={t.weeklyBias==="Bullish"?"var(--green)":t.weeklyBias==="Bearish"?"var(--red)":null}/>
        <MT label="Manip" value={t.manipulation}/><MT label="POI" value={t.poi}/>
        <MT label="KZ" value={t.killzone?.split(" ")[0]}/><MT label="Setup" value={t.setup}/>
        {t.emotion&&<MT label="Emotion" value={t.emotion}/>}
        {t.mistakes&&t.mistakes!=="None"&&<MT label="Mistake" value={t.mistakes} color="var(--red)"/>}
      </div>
      {t.notes&&<div className="tc-notes">{t.notes}</div>}
      {t.tags?.length>0&&<div className="tc-tags">{t.tags.map(tag=><span key={tag} className="tag">{tag}</span>)}</div>}
      <div className="tc-prices"><span>Entry <b>{t.entry}</b></span><span>SL <b style={{color:"var(--red)"}}>{t.sl}</b></span><span>TP <b style={{color:"var(--green)"}}>{t.tp}</b></span><span>Pips <b>{t.pips>=0?"+":""}{t.pips}</b></span></div>
      <div className="tc-footer">
        <div className="tc-shots">{t.preScreenshot&&<span className="shot-thumb" onClick={()=>onViewImg(t.preScreenshot)}>📸 Pre</span>}{t.postScreenshot&&<span className="shot-thumb" onClick={()=>onViewImg(t.postScreenshot)}>📸 Post</span>}</div>
        <div className="tc-actions"><button className="btn-icon" onClick={()=>onEdit(t)}>✎ Edit</button><button className="btn-icon danger" onClick={()=>onDelete(t)}>✕</button></div>
      </div>
    </div>)}</div>
  </div>;
}
function MT({label,value,color}){if(!value)return null;return <div className="meta-tag"><span className="meta-label">{label}</span><span className="meta-value" style={{color:color||"var(--text-dim)"}}>{value}</span></div>;}

function DailyTab({plans,onEdit,onDelete,onNew}){
  const sorted=[...plans].sort((a,b)=>new Date(b.date)-new Date(a.date));
  return <div>
    {sorted.length===0&&<div className="empty-big">No daily plans yet.<br/><button className="btn-add" style={{marginTop:16}} onClick={onNew}>+ Create Daily Plan</button></div>}
    <div className="plan-list">{sorted.map(p=><div key={p._dbid} className="plan-card">
      <div className="plan-header"><div><div className="plan-date">{fmtDate(p.date)}</div><div className="plan-pairs">{p.pairs?.map(pair=><span key={pair} className={`bias-tag bias-${p.biases?.[pair]?.toLowerCase()}`} style={{marginRight:4}}>{pair}: {p.biases?.[pair]}</span>)}</div></div><div className="plan-actions"><button className="btn-icon" onClick={()=>onEdit(p)}>✎</button><button className="btn-icon danger" onClick={()=>onDelete(p)}>✕</button></div></div>
      <PS label="Weekly Theme" text={p.weeklyTheme}/><PS label="Key Levels" text={p.keyLevels}/><PS label="Expected Manipulation" text={p.manipulation} color="var(--amber)"/><PS label="Watchlist" text={p.watchlist}/>{p.notes&&<PS label="Notes" text={p.notes}/>}
    </div>)}</div>
  </div>;
}
function WeeklyTab({plans,onEdit,onDelete,onNew}){
  const sorted=[...plans].sort((a,b)=>new Date(b.weekStart)-new Date(a.weekStart));
  return <div>
    {sorted.length===0&&<div className="empty-big">No weekly plans yet.<br/><button className="btn-add" style={{marginTop:16}} onClick={onNew}>+ Create Weekly Plan</button></div>}
    <div className="plan-list">{sorted.map(p=><div key={p._dbid} className="plan-card">
      <div className="plan-header"><div><div className="plan-date">Week {p.weekStart} → {p.weekEnd}</div><div className="weekly-bias-tag" style={{marginTop:4}}>{p.overallBias}</div></div><div className="plan-actions"><button className="btn-icon" onClick={()=>onEdit(p)}>✎</button><button className="btn-icon danger" onClick={()=>onDelete(p)}>✕</button></div></div>
      <div className="weekly-pairs-grid">{PAIRS.map(pair=><div key={pair} className="weekly-pair-cell"><div className="wpc-pair">{pair}</div><div className={`wpc-bias bias-${p.pairs?.[pair]?.toLowerCase()}`}>{p.pairs?.[pair]||"—"}</div>{p.premiumDiscount?.[pair]&&<div className="wpc-pd">{p.premiumDiscount[pair]}</div>}</div>)}</div>
      <PS label="Market Structure" text={p.marketStructure}/><PS label="Key Events" text={p.keyEvents} color="var(--amber)"/><PS label="Targets" text={p.targets}/>{p.notes&&<PS label="Rules / Notes" text={p.notes}/>}{p.review&&<PS label="Week Review" text={p.review} color="var(--accent)"/>}
    </div>)}</div>
  </div>;
}
function PS({label,text,color}){return <div className="plan-section"><div className="plan-label">{label}</div><div className="plan-text" style={color?{color}:{}}>{text}</div></div>;}

function Analytics({stats,trades}){
  const byKZ=KILL_ZONES.map(kz=>{const t=trades.filter(x=>x.killzone===kz);return{kz:kz.split(" ")[0],count:t.length,wins:t.filter(x=>x.result==="WIN").length,totalR:t.reduce((s,x)=>s+(x.rr||0),0)};}).filter(x=>x.count>0);
  const byManip=MANI_TYPES.filter(m=>m!=="None").map(m=>{const t=trades.filter(x=>x.manipulation===m);return{m,count:t.length,wins:t.filter(x=>x.result==="WIN").length};}).filter(x=>x.count>0);
  const bySetup=SETUPS.map(s=>{const t=trades.filter(x=>x.setup===s);return{s,count:t.length,wins:t.filter(x=>x.result==="WIN").length,totalR:t.reduce((a,x)=>a+(x.rr||0),0)};}).filter(x=>x.count>0);
  const E=<div className="empty-state" style={{fontSize:11}}>Log trades to see data</div>;
  return <div className="an-grid">
    <div className="card"><div className="card-title">By Session</div>{stats.bySession.length===0?E:stats.bySession.map(s=><AnRow key={s.session} label={s.session.split("/")[0]} wins={s.wins} count={s.count} totalR={s.totalR} color="var(--green)"/>)}</div>
    <div className="card"><div className="card-title">By Kill Zone</div>{byKZ.length===0?E:byKZ.map(k=><AnRow key={k.kz} label={k.kz} wins={k.wins} count={k.count} totalR={k.totalR} color="var(--accent)"/>)}</div>
    <div className="card"><div className="card-title">By Setup</div>{bySetup.length===0?E:bySetup.map(s=><AnRow key={s.s} label={s.s} wins={s.wins} count={s.count} totalR={s.totalR} color="var(--accent)" wide/>)}</div>
    <div className="card"><div className="card-title">By Manipulation</div>{byManip.length===0?E:byManip.map(m=><AnRow key={m.m} label={m.m} wins={m.wins} count={m.count} totalR={null} color="var(--green)" wide/>)}</div>
    <div className="card span2"><div className="card-title">Pair Deep Dive</div>
      {stats.byPair.filter(p=>p.count>0).length===0?E:<div className="pair-grid">{stats.byPair.filter(p=>p.count>0).map(p=><div key={p.pair} className="pair-cell"><div className="pc-pair">{p.pair}</div><div className={p.totalR>=0?"rr-pos":"rr-neg"} style={{fontSize:18,fontWeight:700}}>{p.totalR>=0?"+":""}{p.totalR.toFixed(1)}R</div><div style={{fontSize:11,color:"var(--text-dim)"}}>{p.wins}/{p.count} · {p.count>0?(p.wins/p.count*100).toFixed(0):0}%</div></div>)}</div>}
    </div>
  </div>;
}
function AnRow({label,wins,count,totalR,color,wide}){
  return <div className="an-row"><span className="an-label" style={wide?{minWidth:140}:{}}>{label}</span><div className="bar-track"><div className="bar-fill" style={{width:`${Math.min(100,count>0?wins/count*100:0)}%`,background:color}}/></div><span style={{fontSize:11,color:"var(--text-dim)",minWidth:50,textAlign:"right"}}>{wins}/{count}</span>{totalR!==null&&<span className={totalR>=0?"rr-pos":"rr-neg"} style={{fontSize:11,minWidth:40,textAlign:"right"}}>{totalR>=0?"+":""}{totalR.toFixed(1)}R</span>}</div>;
}

function Psychology({stats,trades}){
  const byEmotion=EMOTIONS.map(e=>{const t=trades.filter(x=>x.emotion===e);return{emotion:e,count:t.length,wins:t.filter(x=>x.result==="WIN").length,totalR:t.reduce((s,x)=>s+(x.rr||0),0)};}).filter(x=>x.count>0).sort((a,b)=>b.count-a.count);
  const mistakes=MISTAKES.filter(m=>m!=="None").map(m=>{const t=trades.filter(x=>x.mistakes===m);return{mistake:m,count:t.length,totalR:t.reduce((s,x)=>s+(x.rr||0),0)};}).filter(x=>x.count>0).sort((a,b)=>b.count-a.count);
  const perfect=trades.filter(t=>t.mistakes==="None"&&["Calm & Focused","Confident"].includes(t.emotion));
  const mistakeTrades=trades.filter(t=>t.mistakes!=="None");
  return <div className="an-grid">
    <div className="card span2"><div className="card-title">Psychology Overview</div>
      <div className="psych-kpi-row">
        <div className="psych-kpi"><div className="pk-label">Perfect Execution</div><div className="pk-value" style={{color:"var(--green)"}}>{perfect.length}</div><div className="pk-sub">{trades.length>0?(perfect.length/trades.length*100).toFixed(0):0}% of trades</div></div>
        <div className="psych-kpi"><div className="pk-label">Trades with Mistakes</div><div className="pk-value" style={{color:"var(--red)"}}>{mistakeTrades.length}</div><div className="pk-sub">{trades.length>0?(mistakeTrades.length/trades.length*100).toFixed(0):0}% of trades</div></div>
        <div className="psych-kpi"><div className="pk-label">R Lost to Mistakes</div><div className="pk-value" style={{color:"var(--amber)"}}>{mistakeTrades.reduce((s,t)=>s+Math.min(0,t.rr||0),0).toFixed(1)}R</div><div className="pk-sub">estimated cost</div></div>
        <div className="psych-kpi"><div className="pk-label">Best State</div><div className="pk-value" style={{color:"var(--accent)",fontSize:13}}>{[...byEmotion].sort((a,b)=>b.totalR-a.totalR)[0]?.emotion||"—"}</div><div className="pk-sub">highest R</div></div>
      </div>
    </div>
    <div className="card"><div className="card-title">By Emotion</div>{byEmotion.length===0?<div className="empty-state" style={{fontSize:11}}>Log trades with emotions</div>:byEmotion.map(e=><AnRow key={e.emotion} label={e.emotion} wins={e.wins} count={e.count} totalR={e.totalR} color={e.totalR>=0?"var(--green)":"var(--red)"} wide/>)}</div>
    <div className="card"><div className="card-title">Mistake Tracker</div>{mistakes.length===0?<div className="empty-state" style={{color:"var(--green)",fontSize:11}}>No mistakes logged 🎯</div>:mistakes.map(m=><div key={m.mistake} className="an-row"><span className="an-label" style={{minWidth:140,color:"var(--red)"}}>{m.mistake}</span><div className="bar-track"><div className="bar-fill" style={{width:`${Math.min(100,m.count*20)}%`,background:"var(--red)"}}/></div><span style={{fontSize:11,color:"var(--text-dim)",minWidth:30,textAlign:"right"}}>{m.count}×</span><span className={m.totalR>=0?"rr-pos":"rr-neg"} style={{fontSize:11,minWidth:40,textAlign:"right"}}>{m.totalR>=0?"+":""}{m.totalR.toFixed(1)}R</span></div>)}</div>
    <div className="card span2"><div className="card-title">Discipline Log</div>
      {trades.length===0?<div className="empty-state" style={{fontSize:11}}>No trades yet</div>:<div style={{overflowX:"auto"}}><table className="psych-table"><thead><tr><th>Date</th><th>Pair</th><th>Emotion</th><th>Mistake</th><th>Result</th><th>R</th></tr></thead><tbody>
        {[...trades].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,20).map(t=><tr key={t._dbid} className={t.mistakes!=="None"?"mistake-row":""}><td>{fmtDate(t.date)}</td><td><b>{t.pair}</b></td><td>{t.emotion}</td><td style={{color:t.mistakes!=="None"?"var(--red)":"var(--green)"}}>{t.mistakes}</td><td><span className={`result-badge result-${t.result?.toLowerCase()}`}>{t.result}</span></td><td className={t.rr>=0?"rr-pos":"rr-neg"}>{fmtRR(t.rr||0)}</td></tr>)}
      </tbody></table></div>}
    </div>
  </div>;
}

function TradeModal({initial,onSave,onClose,syncing}){
  const blank={pair:"EURUSD",date:new Date().toISOString().split("T")[0],direction:"LONG",session:"London",killzone:"London Open (02-05 EST)",dailyBias:"Bullish",weeklyBias:"Bullish",marketProfile:"Trending",manipulation:"Liquidity Sweep Low",poi:"Order Block",setup:"Manipulation + POI",entry:"",sl:"",tp:"",result:"WIN",rr:"",pips:"",emotion:"Calm & Focused",mistakes:"None",notes:"",preScreenshot:"",postScreenshot:"",tags:""};
  const [f,setF]=useState(initial?{...initial,tags:(initial.tags||[]).join(",")}:blank);
  const upd=(k,v)=>setF(x=>({...x,[k]:v}));
  const handleImg=(k,e)=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>upd(k,ev.target.result);r.readAsDataURL(file);};
  const calcRR=()=>{const e=parseFloat(f.entry),s=parseFloat(f.sl),t=parseFloat(f.tp);if(!e||!s||!t)return;const risk=Math.abs(e-s),reward=Math.abs(t-e);if(risk>0)upd("rr",(reward/risk).toFixed(2));};
  const submit=()=>{
    let rr=parseFloat(f.rr)||(f.result==="WIN"?1:f.result==="LOSS"?-1:0);
    if(f.result==="LOSS")rr=-Math.abs(rr);if(f.result==="BREAKEVEN")rr=0;
    onSave({...f,rr,pips:parseFloat(f.pips)||0,entry:parseFloat(f.entry)||0,sl:parseFloat(f.sl)||0,tp:parseFloat(f.tp)||0,tags:f.tags?f.tags.split(",").map(t=>t.trim()).filter(Boolean):[]});
  };
  return <div className="overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}>
    <div className="modal-header"><div className="modal-title">{initial?"Edit Trade":"Log New Trade"}</div><button className="modal-close" onClick={onClose}>✕</button></div>
    <div className="modal-body">
      <div className="form-section">INSTRUMENT & TIMING</div>
      <div className="form-grid">
        <F label="Date"><input type="date" className="inp" value={f.date} onChange={e=>upd("date",e.target.value)}/></F>
        <F label="Pair"><S val={f.pair} opts={PAIRS} on={v=>upd("pair",v)}/></F>
        <F label="Direction"><div className="toggle-group"><button className={`tog ${f.direction==="LONG"?"tog-long":""}`} onClick={()=>upd("direction","LONG")}>LONG</button><button className={`tog ${f.direction==="SHORT"?"tog-short":""}`} onClick={()=>upd("direction","SHORT")}>SHORT</button></div></F>
        <F label="Session"><S val={f.session} opts={SESSIONS} on={v=>upd("session",v)}/></F>
        <F label="Kill Zone"><S val={f.killzone} opts={KILL_ZONES} on={v=>upd("killzone",v)}/></F>
        <F label="Market Profile"><div className="toggle-group">{["Trending","Ranging","Volatile"].map(m=><button key={m} className={`tog ${f.marketProfile===m?"tog-active":""}`} onClick={()=>upd("marketProfile",m)}>{m}</button>)}</div></F>
      </div>
      <div className="form-section">BIAS & CONTEXT</div>
      <div className="form-grid">
        <F label="Daily Bias"><S val={f.dailyBias} opts={BIASES} on={v=>upd("dailyBias",v)}/></F>
        <F label="Weekly Bias"><S val={f.weeklyBias} opts={BIASES} on={v=>upd("weeklyBias",v)}/></F>
        <F label="Manipulation"><S val={f.manipulation} opts={MANI_TYPES} on={v=>upd("manipulation",v)}/></F>
        <F label="POI Type"><S val={f.poi} opts={POI_TYPES} on={v=>upd("poi",v)}/></F>
        <F label="Setup" full><S val={f.setup} opts={SETUPS} on={v=>upd("setup",v)}/></F>
      </div>
      <div className="form-section">PRICE LEVELS</div>
      <div className="form-grid">
        <F label="Entry"><input type="number" className="inp" placeholder="1.08420" value={f.entry} onChange={e=>upd("entry",e.target.value)} onBlur={calcRR}/></F>
        <F label="Stop Loss"><input type="number" className="inp" placeholder="1.08220" value={f.sl} onChange={e=>upd("sl",e.target.value)} onBlur={calcRR}/></F>
        <F label="Take Profit"><input type="number" className="inp" placeholder="1.08820" value={f.tp} onChange={e=>upd("tp",e.target.value)} onBlur={calcRR}/></F>
        <F label="Pips"><input type="number" className="inp" placeholder="+40" value={f.pips} onChange={e=>upd("pips",e.target.value)}/></F>
      </div>
      <div className="form-section">RESULT</div>
      <div className="form-grid">
        <F label="Result"><div className="toggle-group">{["WIN","LOSS","BREAKEVEN"].map(r=><button key={r} className={`tog ${f.result===r?`tog-${r.toLowerCase()}`:""}`} onClick={()=>upd("result",r)}>{r}</button>)}</div></F>
        <F label="R:R Achieved"><input type="number" className="inp" placeholder="auto-calc" value={f.rr} onChange={e=>upd("rr",e.target.value)}/></F>
      </div>
      <div className="form-section">PSYCHOLOGY</div>
      <div className="form-grid">
        <F label="Emotion"><S val={f.emotion} opts={EMOTIONS} on={v=>upd("emotion",v)}/></F>
        <F label="Mistake"><S val={f.mistakes} opts={MISTAKES} on={v=>upd("mistakes",v)}/></F>
        <F label="Tags (comma-sep)" full><input className="inp" placeholder="A+ Setup, HTF Aligned" value={f.tags} onChange={e=>upd("tags",e.target.value)}/></F>
      </div>
      <div className="form-section">NOTES & SCREENSHOTS</div>
      <F label="Trade Notes" full><textarea className="inp ta" rows={3} placeholder="Rationale, lessons, observations..." value={f.notes} onChange={e=>upd("notes",e.target.value)}/></F>
      <div className="form-grid" style={{marginTop:12}}>
        <F label="Pre-Trade Screenshot"><input type="file" accept="image/*" className="inp-file" onChange={e=>handleImg("preScreenshot",e)}/>{f.preScreenshot&&<img src={f.preScreenshot} alt="pre" style={{width:"100%",marginTop:6,borderRadius:4,border:"1px solid var(--border)"}}/>}</F>
        <F label="Post-Trade Screenshot"><input type="file" accept="image/*" className="inp-file" onChange={e=>handleImg("postScreenshot",e)}/>{f.postScreenshot&&<img src={f.postScreenshot} alt="post" style={{width:"100%",marginTop:6,borderRadius:4,border:"1px solid var(--border)"}}/>}</F>
      </div>
    </div>
    <div className="modal-footer"><button className="btn-add" onClick={submit} disabled={syncing}>{syncing?"Saving to cloud...":initial?"Update Trade":"Log Trade"}</button><button className="btn-ghost" onClick={onClose}>Cancel</button></div>
  </div></div>;
}

function DailyModal({initial,onSave,onClose,syncing}){
  const blank={date:new Date().toISOString().split("T")[0],pairs:["EURUSD","GBPUSD"],biases:{},weeklyTheme:"",keyLevels:"",manipulation:"",watchlist:"",notes:""};
  const [f,setF]=useState(initial||blank);
  const upd=(k,v)=>setF(x=>({...x,[k]:v}));
  const togglePair=p=>setF(x=>({...x,pairs:x.pairs.includes(p)?x.pairs.filter(pp=>pp!==p):[...x.pairs,p]}));
  const setBias=(pair,bias)=>setF(x=>({...x,biases:{...x.biases,[pair]:bias}}));
  return <div className="overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}>
    <div className="modal-header"><div className="modal-title">{initial?"Edit Daily Plan":"New Daily Plan"}</div><button className="modal-close" onClick={onClose}>✕</button></div>
    <div className="modal-body">
      <div className="form-grid"><F label="Date"><input type="date" className="inp" value={f.date} onChange={e=>upd("date",e.target.value)}/></F></div>
      <div className="form-section">PAIRS IN FOCUS</div>
      <div className="chip-row">{PAIRS.map(p=><button key={p} className={`chip ${f.pairs?.includes(p)?"active":""}`} onClick={()=>togglePair(p)}>{p}</button>)}</div>
      <div className="form-section">DAILY BIAS</div>
      {f.pairs?.map(p=><div key={p} className="bias-form-row"><span className="bias-pair-label">{p}</span><div className="toggle-group">{BIASES.map(b=><button key={b} className={`tog ${f.biases?.[p]===b?`tog-${b.toLowerCase()}`:""}`} onClick={()=>setBias(p,b)}>{b}</button>)}</div></div>)}
      <div className="form-section">ANALYSIS</div>
      <F label="Weekly Theme" full><textarea className="inp ta" rows={2} value={f.weeklyTheme} onChange={e=>upd("weeklyTheme",e.target.value)}/></F>
      <F label="Key Levels" full><textarea className="inp ta" rows={2} value={f.keyLevels} onChange={e=>upd("keyLevels",e.target.value)}/></F>
      <F label="Expected Manipulation" full><textarea className="inp ta" rows={2} placeholder="Where do you expect the Judas swing / liquidity sweep?" value={f.manipulation} onChange={e=>upd("manipulation",e.target.value)}/></F>
      <F label="Watchlist / Trade Plan" full><textarea className="inp ta" rows={2} value={f.watchlist} onChange={e=>upd("watchlist",e.target.value)}/></F>
      <F label="Notes" full><textarea className="inp ta" rows={2} value={f.notes} onChange={e=>upd("notes",e.target.value)}/></F>
    </div>
    <div className="modal-footer"><button className="btn-add" onClick={()=>onSave(f)} disabled={syncing}>{syncing?"Saving...":initial?"Update":"Save Plan"}</button><button className="btn-ghost" onClick={onClose}>Cancel</button></div>
  </div></div>;
}

function WeeklyModal({initial,onSave,onClose,syncing}){
  const mon=()=>{const d=new Date();d.setDate(d.getDate()-d.getDay()+1);return d.toISOString().split("T")[0];};
  const fri=()=>{const d=new Date();d.setDate(d.getDate()-d.getDay()+5);return d.toISOString().split("T")[0];};
  const blank={weekStart:mon(),weekEnd:fri(),overallBias:"",pairs:{},premiumDiscount:{},marketStructure:"",keyEvents:"",targets:"",notes:"",review:""};
  const [f,setF]=useState(initial||blank);
  const upd=(k,v)=>setF(x=>({...x,[k]:v}));
  const setPair=(p,v)=>setF(x=>({...x,pairs:{...x.pairs,[p]:v}}));
  const setPD=(p,v)=>setF(x=>({...x,premiumDiscount:{...x.premiumDiscount,[p]:v}}));
  return <div className="overlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}>
    <div className="modal-header"><div className="modal-title">{initial?"Edit Weekly Plan":"New Weekly Plan"}</div><button className="modal-close" onClick={onClose}>✕</button></div>
    <div className="modal-body">
      <div className="form-grid">
        <F label="Week Start"><input type="date" className="inp" value={f.weekStart} onChange={e=>upd("weekStart",e.target.value)}/></F>
        <F label="Week End"><input type="date" className="inp" value={f.weekEnd} onChange={e=>upd("weekEnd",e.target.value)}/></F>
        <F label="Overall Bias / Theme" full><input className="inp" placeholder="USD Weakness, Risk-on..." value={f.overallBias} onChange={e=>upd("overallBias",e.target.value)}/></F>
      </div>
      <div className="form-section">PAIR BIAS & PREMIUM / DISCOUNT</div>
      {PAIRS.map(p=><div key={p} className="weekly-form-row"><span className="bias-pair-label">{p}</span><div className="toggle-group">{BIASES.map(b=><button key={b} className={`tog ${f.pairs?.[p]===b?`tog-${b.toLowerCase()}`:""}`} onClick={()=>setPair(p,b)}>{b}</button>)}</div><div className="toggle-group" style={{marginLeft:8}}>{["Premium","Discount","EQ"].map(pd=><button key={pd} className={`tog ${f.premiumDiscount?.[p]===pd?"tog-active":""}`} onClick={()=>setPD(p,pd)}>{pd}</button>)}</div></div>)}
      <div className="form-section">MARKET CONTEXT</div>
      <F label="Market Structure" full><textarea className="inp ta" rows={2} placeholder="DXY position, correlations, structure..." value={f.marketStructure} onChange={e=>upd("marketStructure",e.target.value)}/></F>
      <F label="Key Economic Events" full><textarea className="inp ta" rows={2} placeholder="NFP Fri, FOMC Wed, CPI Tue..." value={f.keyEvents} onChange={e=>upd("keyEvents",e.target.value)}/></F>
      <F label="Weekly Targets" full><textarea className="inp ta" rows={2} placeholder="EURUSD 1.0950, GBPUSD 1.2800..." value={f.targets} onChange={e=>upd("targets",e.target.value)}/></F>
      <F label="Rules / Notes" full><textarea className="inp ta" rows={2} value={f.notes} onChange={e=>upd("notes",e.target.value)}/></F>
      <F label="End of Week Review" full><textarea className="inp ta" rows={3} placeholder="Fill at end of week..." value={f.review} onChange={e=>upd("review",e.target.value)}/></F>
    </div>
    <div className="modal-footer"><button className="btn-add" onClick={()=>onSave(f)} disabled={syncing}>{syncing?"Saving...":initial?"Update":"Save Plan"}</button><button className="btn-ghost" onClick={onClose}>Cancel</button></div>
  </div></div>;
}


// ── Position Size Calculator ──────────────────────────────────────────────────
function Calculator() {
  const [accountSize, setAccountSize] = useState("10000")
  const [riskPct, setRiskPct] = useState("1")
  const [slPipsInput, setSlPipsInput] = useState("")
  const [pair, setPair] = useState("EURUSD")
  const [pipValue, setPipValue] = useState("10")

  const PRESET_RISKS = ["0.5","1","1.5","2","3"]
  const PRESET_PIPS = ["5","10","15","20","25","30","50"]
  const PIP_VALUES = {EURUSD:"10",GBPUSD:"10",USDCAD:"7.5",GER30:"1",SPX500:"1",NAS100:"1"}

  const calc = () => {
    const acc = parseFloat(accountSize)||0
    const risk = parseFloat(riskPct)||0
    const slPips = parseFloat(slPipsInput)||0
    const pv = parseFloat(pipValue)||10
    if(!acc||!risk||!slPips||!pv) return null
    const riskAmt = acc * (risk/100)
    const lots = riskAmt / (slPips * pv)
    return { riskAmt: riskAmt.toFixed(2), slPips: slPips.toFixed(1), lots: lots.toFixed(2), units: Math.round(lots * 100000) }
  }

  const result = calc()

  return (
    <div style={{maxWidth:600}}>
      <div className="card" style={{marginBottom:12}}>
        <div className="card-title">POSITION SIZE CALCULATOR</div>
        <div className="form-grid" style={{gap:14}}>
          <div>
            <div style={{fontSize:9,color:"var(--muted)",letterSpacing:"0.15em",marginBottom:5}}>ACCOUNT SIZE ($)</div>
            <input className="inp" type="number" placeholder="10000" value={accountSize} onChange={e=>setAccountSize(e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:9,color:"var(--muted)",letterSpacing:"0.15em",marginBottom:5}}>PAIR</div>
            <select className="inp" value={pair} onChange={e=>{setPair(e.target.value);setPipValue(PIP_VALUES[e.target.value]||"10")}}>
              {PAIRS.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
          <div style={{gridColumn:"1/-1"}}>
            <div style={{fontSize:9,color:"var(--muted)",letterSpacing:"0.15em",marginBottom:5}}>STOP LOSS (PIPS)</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>
              {PRESET_PIPS.map(p=><button key={p} className={`tog ${slPipsInput===p?"tog-active":""}`} onClick={()=>setSlPipsInput(p)}>{p}</button>)}
            </div>
            <input className="inp" type="number" placeholder="Enter pips manually e.g. 20" value={slPipsInput} onChange={e=>setSlPipsInput(e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:9,color:"var(--muted)",letterSpacing:"0.15em",marginBottom:5}}>PIP VALUE ($ per pip per lot)</div>
            <input className="inp" type="number" placeholder="10" value={pipValue} onChange={e=>setPipValue(e.target.value)}/>
          </div>
          <div>
            <div style={{fontSize:9,color:"var(--muted)",letterSpacing:"0.15em",marginBottom:5}}>RISK %</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>
              {PRESET_RISKS.map(r=><button key={r} className={`tog ${riskPct===r?"tog-active":""}`} onClick={()=>setRiskPct(r)}>{r}%</button>)}
            </div>
            <input className="inp" type="number" placeholder="1" value={riskPct} onChange={e=>setRiskPct(e.target.value)}/>
          </div>
        </div>
      </div>

      {result ? (
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
          <div className="card" style={{textAlign:"center"}}>
            <div style={{fontSize:9,color:"var(--muted)",letterSpacing:"0.15em",marginBottom:8}}>RISK AMOUNT</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:700,color:"var(--red)"}}>-${result.riskAmt}</div>
            <div style={{fontSize:10,color:"var(--text-dim)",marginTop:4}}>{riskPct}% of account</div>
          </div>
          <div className="card" style={{textAlign:"center"}}>
            <div style={{fontSize:9,color:"var(--muted)",letterSpacing:"0.15em",marginBottom:8}}>SL DISTANCE</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:700,color:"var(--amber)"}}>{result.slPips}</div>
            <div style={{fontSize:10,color:"var(--text-dim)",marginTop:4}}>pips</div>
          </div>
          <div className="card" style={{textAlign:"center"}}>
            <div style={{fontSize:9,color:"var(--muted)",letterSpacing:"0.15em",marginBottom:8}}>LOT SIZE</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:700,color:"var(--accent)"}}>{result.lots}</div>
            <div style={{fontSize:10,color:"var(--text-dim)",marginTop:4}}>standard lots</div>
          </div>
          <div className="card" style={{textAlign:"center"}}>
            <div style={{fontSize:9,color:"var(--muted)",letterSpacing:"0.15em",marginBottom:8}}>UNITS</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:700,color:"var(--accent2)"}}>{result.units.toLocaleString()}</div>
            <div style={{fontSize:10,color:"var(--text-dim)",marginTop:4}}>micro/nano units</div>
          </div>
        </div>
      ) : (
        <div className="card" style={{textAlign:"center",padding:"32px"}}>
          <div style={{fontSize:11,color:"var(--muted)"}}>Fill in all fields to calculate position size</div>
        </div>
      )}

      <div className="card" style={{marginTop:12}}>
        <div className="card-title">QUICK REFERENCE — PIP VALUES (per standard lot)</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[{p:"EURUSD",v:"$10"},{p:"GBPUSD",v:"$10"},{p:"USDCAD",v:"~$7.5"},{p:"GER30",v:"€1"},{p:"SPX500",v:"$1"},{p:"NAS100",v:"$1"}].map(x=>(
            <div key={x.p} style={{background:"var(--surface2)",border:"1px solid var(--border)",padding:"8px 12px",borderRadius:3}}>
              <div style={{fontSize:10,color:"var(--accent)",fontWeight:600}}>{x.p}</div>
              <div style={{fontSize:12,color:"var(--text)",marginTop:2}}>{x.v} / pip</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Shared news fetch hook ────────────────────────────────────────────────────
const HIGH_IMPACT_KEYWORDS = ["NFP","Non-Farm","CPI","GDP","FOMC","Interest Rate","Fed","Inflation","Unemployment","Retail Sales","PMI","ISM","PPI","ECB","BOE","Jackson Hole"]

async function fetchForexNews() {
  const ts = Date.now()
  const r = await fetch(`/api/news?t=${ts}`, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" }
  })
  if (!r.ok) throw new Error("Calendar temporarily unavailable")
  const data = await r.json()
  if (data.error) throw new Error(data.error)
  return data
}

// ── Economic Calendar (News) ──────────────────────────────────────────────────
function NewsCalendar() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState("ALL")

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true); setError(null)
    try { setEvents(await fetchForexNews()) }
    catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const impactColor = i => i==="High"?"var(--red)":i==="Medium"?"var(--amber)":"var(--muted)"
  const currencyColor = c => c==="USD"?"#3b82f6":c==="EUR"?"#00c9a7":c==="GBP"?"#8b5cf6":"var(--muted)"
  const isKeyEvent = title => HIGH_IMPACT_KEYWORDS.some(k=>title?.includes(k))

  const filtered = filter==="ALL"?events:events.filter(e=>e.country===filter||(filter==="HIGH"&&e.impact==="High"))

  const groupByDate = evts => {
    const g={}
    evts.forEach(e=>{ const d=e.date||"Unknown"; if(!g[d])g[d]=[]; g[d].push(e) })
    return g
  }

  const groups = groupByDate(filtered)

  if(loading) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"60px",gap:12}}>
      <div style={{display:"flex",gap:8}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#00c9a7",animation:`pulse 1.2s ${i*0.2}s infinite ease-in-out`}}/>)}</div>
      <div style={{fontSize:11,color:"var(--muted)",letterSpacing:"0.15em"}}>LOADING CALENDAR</div>
    </div>
  )

  if(error) return (
    <div style={{textAlign:"center",padding:"40px"}}>
      <div style={{color:"var(--red)",marginBottom:8,fontSize:12}}>⚠ {error}</div>
      <div style={{fontSize:11,color:"var(--muted)",marginBottom:16}}>The calendar feed may be temporarily unavailable.</div>
      <button className="btn-add" onClick={load}>↻ Try Again</button>
    </div>
  )

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{fontSize:9,color:"var(--muted)",letterSpacing:"0.15em",alignSelf:"center"}}>FILTER:</div>
        {["ALL","HIGH","USD","EUR","GBP"].map(f=>(
          <button key={f} className={`chip ${filter===f?"active":""}`} onClick={()=>setFilter(f)}>{f}</button>
        ))}
        <button className="btn-sm" onClick={load} style={{marginLeft:"auto"}}>↻ Refresh</button>
      </div>

      {filtered.length===0 && <div className="empty-big">No events found for this filter.</div>}

      {Object.entries(groups).map(([date, evts]) => (
        <div key={date} style={{marginBottom:20}}>
          <div style={{fontSize:9,color:"var(--accent)",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:8,paddingBottom:6,borderBottom:"1px solid rgba(0,201,167,.15)"}}>{date}</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {evts.map((e,i) => {
              const isKey = isKeyEvent(e.title)
              return (
                <div key={i} style={{background:isKey?"rgba(239,68,68,0.05)":"var(--surface)",border:`1px solid ${isKey?"rgba(239,68,68,0.3)":"var(--border)"}`,borderRadius:4,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                  {isKey && <div style={{fontSize:9,background:"var(--red)",color:"#fff",padding:"1px 6px",borderRadius:2,letterSpacing:"0.1em",fontWeight:700}}>KEY</div>}
                  <div style={{minWidth:55,fontSize:11,color:"var(--text-dim)"}}>{e.time||"All Day"}</div>
                  <div style={{width:36,height:20,background:`${currencyColor(e.country)}22`,border:`1px solid ${currencyColor(e.country)}`,borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:currencyColor(e.country)}}>{e.country}</div>
                  <div style={{flex:1,minWidth:160}}>
                    <div style={{fontSize:12,color:isKey?"var(--text)":"var(--text)",fontWeight:isKey?700:500}}>{e.title}</div>
                    {(e.forecast||e.previous) && (
                      <div style={{fontSize:10,color:"var(--text-dim)",marginTop:3,display:"flex",gap:12,flexWrap:"wrap"}}>
                        {e.forecast&&<span>Forecast: <b style={{color:"var(--text)"}}>{e.forecast}</b></span>}
                        {e.previous&&<span>Previous: <b style={{color:"var(--text)"}}>{e.previous}</b></span>}
                      </div>
                    )}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:impactColor(e.impact)}}/>
                    <span style={{fontSize:9,color:impactColor(e.impact),letterSpacing:"0.1em"}}>{e.impact?.toUpperCase()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
      <div style={{fontSize:10,color:"var(--muted)",textAlign:"center",marginTop:16}}>ForexFactory · USD, EUR, GBP · High & Medium Impact</div>
    </div>
  )
}


// ── Screenshot Gallery ────────────────────────────────────────────────────────
function ScreenshotGallery({trades}) {
  const [selected, setSelected] = useState(null)
  const [filterPair, setFilterPair] = useState("ALL")
  const [filterType, setFilterType] = useState("ALL") // ALL | PRE | POST

  const withShots = trades.filter(t => t.preScreenshot || t.postScreenshot)
  const filtered = withShots.filter(t =>
    (filterPair === "ALL" || t.pair === filterPair) 
  )

  // Build flat list of images
  const images = []
  filtered.forEach(t => {
    if ((filterType === "ALL" || filterType === "PRE") && t.preScreenshot) {
      images.push({ src: t.preScreenshot, type: "PRE", trade: t })
    }
    if ((filterType === "ALL" || filterType === "POST") && t.postScreenshot) {
      images.push({ src: t.postScreenshot, type: "POST", trade: t })
    }
  })

  const resultColor = r => r==="WIN"?"var(--green)":r==="LOSS"?"var(--red)":"var(--amber)"

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{fontSize:9,color:"var(--muted)",letterSpacing:"0.15em",alignSelf:"center"}}>PAIR:</div>
        {["ALL",...PAIRS].map(p=><button key={p} className={`chip ${filterPair===p?"active":""}`} onClick={()=>setFilterPair(p)}>{p}</button>)}
        <div style={{width:1,height:16,background:"var(--border)",margin:"0 4px"}}/>
        <div style={{fontSize:9,color:"var(--muted)",letterSpacing:"0.15em",alignSelf:"center"}}>TYPE:</div>
        {["ALL","PRE","POST"].map(t=><button key={t} className={`chip ${filterType===t?"active":""}`} onClick={()=>setFilterType(t)}>{t}</button>)}
      </div>

      {images.length === 0 ? (
        <div className="empty-big">
          No screenshots yet.<br/>
          <span style={{fontSize:11,color:"var(--muted)"}}>Add pre/post screenshots when logging trades to see them here.</span>
        </div>
      ) : (
        <>
          <div style={{fontSize:10,color:"var(--muted)",marginBottom:12}}>{images.length} screenshot{images.length!==1?"s":""}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
            {images.map((img, i) => (
              <div key={i} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:6,overflow:"hidden",cursor:"pointer",transition:"border-color .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(0,201,167,.4)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}
                onClick={()=>setSelected(img)}
              >
                <div style={{position:"relative",paddingTop:"60%",background:"#0a0a0f",overflow:"hidden"}}>
                  <img src={img.src} alt="chart" style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"cover"}}/>
                  <div style={{position:"absolute",top:6,left:6,background:"rgba(0,0,0,0.75)",borderRadius:2,padding:"2px 7px",fontSize:9,color:"var(--text-dim)",letterSpacing:"0.1em"}}>{img.type}</div>
                  <div style={{position:"absolute",top:6,right:6,background:resultColor(img.trade.result),borderRadius:2,padding:"2px 7px",fontSize:9,color:"#000",fontWeight:700}}>{img.trade.result}</div>
                </div>
                <div style={{padding:"10px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:"var(--accent)"}}>{img.trade.pair}</span>
                    <span className={img.trade.rr>=0?"rr-pos":"rr-neg"} style={{fontSize:12,fontWeight:700}}>{img.trade.rr>=0?"+":""}{(img.trade.rr||0).toFixed(2)}R</span>
                  </div>
                  <div style={{display:"flex",gap:8,fontSize:10,color:"var(--text-dim)"}}>
                    <span>{fmtDate(img.trade.date)}</span>
                    <span className={`dir-badge dir-${img.trade.direction?.toLowerCase()}`}>{img.trade.direction}</span>
                  </div>
                  {img.trade.setup && <div style={{fontSize:9,color:"var(--muted)",marginTop:4}}>{img.trade.setup}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Lightbox */}
      {selected && (
        <div className="overlay" onClick={()=>setSelected(null)}>
          <div style={{maxWidth:"90vw",maxHeight:"90vh",display:"flex",flexDirection:"column",gap:12}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"6px 6px 0 0",padding:"10px 16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:"var(--accent)"}}>{selected.trade.pair}</span>
                <span className={`dir-badge dir-${selected.trade.direction?.toLowerCase()}`}>{selected.trade.direction}</span>
                <span className={`result-badge result-${selected.trade.result?.toLowerCase()}`}>{selected.trade.result}</span>
                <span className={selected.trade.rr>=0?"rr-pos":"rr-neg"} style={{fontWeight:700}}>{selected.trade.rr>=0?"+":""}{(selected.trade.rr||0).toFixed(2)}R</span>
                <span style={{fontSize:10,color:"var(--muted)"}}>{fmtDate(selected.trade.date)}</span>
                <span style={{fontSize:10,color:"var(--text-dim)",background:"var(--surface2)",padding:"2px 8px",borderRadius:2}}>{selected.type} TRADE</span>
              </div>
              <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:"var(--text-dim)",cursor:"pointer",fontSize:18}}>✕</button>
            </div>
            <img src={selected.src} alt="chart" style={{maxWidth:"90vw",maxHeight:"80vh",borderRadius:"0 0 6px 6px",objectFit:"contain",border:"1px solid var(--border)"}}/>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Weekly Review ─────────────────────────────────────────────────────────────
function WeeklyReview({weeklyPlans, trades}) {
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [reviewText, setReviewText] = useState("")
  const [saving, setSaving] = useState(false)

  const sorted = [...weeklyPlans].sort((a,b)=>new Date(b.weekStart)-new Date(a.weekStart))

  const getWeekTrades = (plan) => {
    if(!plan) return []
    return trades.filter(t => t.date >= plan.weekStart && t.date <= plan.weekEnd)
  }

  const openReview = (plan) => {
    setSelectedWeek(plan)
    setReviewText(plan.review || "")
  }

  const weekStats = (plan) => {
    const wt = getWeekTrades(plan)
    const wins = wt.filter(t=>t.result==="WIN").length
    const losses = wt.filter(t=>t.result==="LOSS").length
    const totalR = wt.reduce((s,t)=>s+(t.rr||0),0)
    const winRate = wt.length ? (wins/wt.length*100).toFixed(0) : 0
    return { wt, wins, losses, totalR, winRate }
  }

  const REVIEW_PROMPTS = [
    "Did I follow my daily bias?",
    "Did I wait for manipulation before entry?",
    "Did I trade in the kill zone?",
    "Did I manage risk properly?",
    "What was my biggest mistake?",
    "What did I do well?",
    "What will I improve next week?"
  ]

  return (
    <div>
      {sorted.length === 0 && (
        <div className="empty-big">No weekly plans yet.<br/><span style={{fontSize:11,color:"var(--muted)"}}>Create a weekly plan first, then come back to review it.</span></div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:12}}>
        {sorted.map(plan => {
          const {wt, wins, losses, totalR, winRate} = weekStats(plan)
          const hasReview = plan.review && plan.review.trim().length > 0
          return (
            <div key={plan._dbid} style={{background:"var(--surface)",border:`1px solid ${hasReview?"rgba(0,201,167,.3)":"var(--border)"}`,borderRadius:6,padding:16}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
                <div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700}}>{plan.weekStart} → {plan.weekEnd}</div>
                  {plan.overallBias && <div style={{fontSize:10,color:"var(--accent)",marginTop:3}}>{plan.overallBias}</div>}
                </div>
                {hasReview && <span style={{fontSize:9,background:"rgba(0,201,167,.15)",color:"var(--accent)",border:"1px solid rgba(0,201,167,.3)",padding:"2px 8px",borderRadius:2,letterSpacing:"0.08em"}}>REVIEWED</span>}
              </div>

              {/* Week stats */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
                {[
                  {label:"Trades",value:wt.length,color:"var(--text)"},
                  {label:"Wins",value:wins,color:"var(--green)"},
                  {label:"Losses",value:losses,color:"var(--red)"},
                  {label:"Total R",value:`${totalR>=0?"+":""}${totalR.toFixed(1)}R`,color:totalR>=0?"var(--green)":"var(--red)"},
                ].map(s=>(
                  <div key={s.label} style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:3,padding:"8px",textAlign:"center"}}>
                    <div style={{fontSize:9,color:"var(--muted)",letterSpacing:"0.1em",marginBottom:3}}>{s.label}</div>
                    <div style={{fontSize:14,fontWeight:700,color:s.color}}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Bias summary */}
              {plan.pairs && Object.keys(plan.pairs).length > 0 && (
                <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:12}}>
                  {Object.entries(plan.pairs).map(([pair,bias])=>(
                    <span key={pair} className={`bias-tag bias-${bias?.toLowerCase()}`}>{pair}: {bias}</span>
                  ))}
                </div>
              )}

              {/* Review preview or prompt */}
              {hasReview ? (
                <div style={{fontSize:11,color:"var(--text-dim)",lineHeight:1.6,background:"var(--surface2)",padding:"10px 12px",borderRadius:3,borderLeft:"2px solid var(--accent)",marginBottom:12}}>
                  {plan.review.slice(0,200)}{plan.review.length>200?"...":""}
                </div>
              ) : (
                <div style={{fontSize:11,color:"var(--muted)",marginBottom:12,fontStyle:"italic"}}>No review written yet</div>
              )}

              <button className="btn-add" style={{width:"100%",fontSize:10}} onClick={()=>openReview(plan)}>
                {hasReview ? "Edit Review" : "Write Review"}
              </button>
            </div>
          )
        })}
      </div>

      {/* Review Modal */}
      {selectedWeek && (
        <div className="overlay" onClick={()=>setSelectedWeek(null)}>
          <div className="modal" style={{maxWidth:680}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Week Review — {selectedWeek.weekStart}</div>
              <button className="modal-close" onClick={()=>setSelectedWeek(null)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Week performance */}
              {(() => {
                const {wt,wins,losses,totalR,winRate} = weekStats(selectedWeek)
                return wt.length > 0 ? (
                  <div>
                    <div style={{fontSize:9,color:"var(--accent)",letterSpacing:"0.2em",marginBottom:8}}>WEEK PERFORMANCE</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:8}}>
                      {[{l:"Trades",v:wt.length},{l:"Win Rate",v:winRate+"%"},{l:"Wins",v:wins},{l:"Total R",v:`${totalR>=0?"+":""}${totalR.toFixed(1)}R`}].map(s=>(
                        <div key={s.l} style={{background:"var(--surface2)",border:"1px solid var(--border)",padding:"8px",borderRadius:3,textAlign:"center"}}>
                          <div style={{fontSize:9,color:"var(--muted)",marginBottom:3}}>{s.l}</div>
                          <div style={{fontSize:14,fontWeight:700}}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                    {/* Trades this week */}
                    <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:12}}>
                      {wt.map(t=>(
                        <div key={t._dbid} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",background:"var(--surface2)",borderRadius:3,fontSize:11}}>
                          <span style={{color:"var(--accent)",fontWeight:600,minWidth:60}}>{t.pair}</span>
                          <span className={`dir-badge dir-${t.direction?.toLowerCase()}`}>{t.direction}</span>
                          <span className={`result-badge result-${t.result?.toLowerCase()}`}>{t.result}</span>
                          <span className={t.rr>=0?"rr-pos":"rr-neg"} style={{marginLeft:"auto",fontWeight:700}}>{t.rr>=0?"+":""}{(t.rr||0).toFixed(2)}R</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <div style={{fontSize:11,color:"var(--muted)",marginBottom:12}}>No trades logged for this week.</div>
              })()}

              {/* Review prompts */}
              <div style={{fontSize:9,color:"var(--accent)",letterSpacing:"0.2em",marginBottom:8}}>REVIEW PROMPTS</div>
              <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:12}}>
                {REVIEW_PROMPTS.map((p,i)=>(
                  <div key={i} style={{fontSize:11,color:"var(--text-dim)",padding:"5px 10px",background:"var(--surface2)",borderRadius:3,borderLeft:"2px solid var(--border)"}}>
                    {i+1}. {p}
                  </div>
                ))}
              </div>

              <div style={{fontSize:9,color:"var(--muted)",letterSpacing:"0.15em",marginBottom:6}}>YOUR REVIEW</div>
              <textarea
                className="inp ta"
                rows={8}
                placeholder={"Write your weekly review here...\n\nTip: Answer the prompts above to structure your review."}
                value={reviewText}
                onChange={e=>setReviewText(e.target.value)}
                style={{width:"100%"}}
              />
            </div>
            <div className="modal-footer">
              <button className="btn-add" disabled={saving} onClick={async ()=>{
                setSaving(true)
                // Update review in the weeklyPlans via parent — we emit via a custom event
                const updated = {...selectedWeek, review: reviewText}
                window._saveWeeklyReview && window._saveWeeklyReview(updated)
                setSaving(false)
                setSelectedWeek(null)
              }}>{saving?"Saving...":"Save Review"}</button>
              <button className="btn-ghost" onClick={()=>setSelectedWeek(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function F({label,children,full}){return <div style={{gridColumn:full?"1/-1":"auto"}}><div style={{fontSize:9,color:"var(--muted)",letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:5}}>{label}</div>{children}</div>;}
function S({val,opts,on}){return <select className="inp" value={val} onChange={e=>on(e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select>;}

const CSS=`
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');
  :root{--bg:#080c10;--surface:#0d1117;--surface2:#131920;--border:#1e2a35;--accent:#00c9a7;--accent2:#0094ff;--green:#22c55e;--red:#ef4444;--amber:#f59e0b;--text:#dce6f0;--text-dim:#6b7f8f;--muted:#4a5a6a;--sidebar-w:180px;}
  *{box-sizing:border-box;margin:0;padding:0;}body{background:var(--bg);color:var(--text);font-family:'DM Mono',monospace;}
  ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--border)}
  .app{display:flex;min-height:100vh;}
  .sidebar{width:var(--sidebar-w);background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:50;}
  .logo{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;padding:20px 18px 16px;letter-spacing:.05em;}.logo span{color:var(--accent);}
  .nav-item{display:flex;align-items:center;gap:10px;padding:10px 18px;background:none;border:none;border-left:2px solid transparent;color:var(--text-dim);cursor:pointer;font-family:'DM Mono',monospace;font-size:12px;text-align:left;width:100%;transition:all .15s;}
  .nav-item:hover{color:var(--text);background:var(--surface2);}.nav-item.active{color:var(--accent);background:rgba(0,201,167,.07);border-left-color:var(--accent);}
  .nav-icon{font-size:14px;}
  .user-email{padding:8px 18px;font-size:9px;color:var(--muted);letter-spacing:.05em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .sync-status{padding:4px 18px;font-size:9px;color:var(--accent);letter-spacing:.1em;cursor:pointer;opacity:.7;}.sync-status:hover{opacity:1;}
  .signout-btn{margin:6px 12px;padding:7px 12px;background:none;border:1px solid var(--border);color:var(--muted);font-family:'DM Mono',monospace;font-size:10px;cursor:pointer;border-radius:3px;text-align:left;transition:.15s;}.signout-btn:hover{border-color:var(--red);color:var(--red);}
  .sidebar-footer{padding:8px 18px 16px;font-size:9px;color:var(--muted);letter-spacing:.2em;}
  .main{margin-left:var(--sidebar-w);flex:1;display:flex;flex-direction:column;min-height:100vh;}
  .topbar{padding:14px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:var(--surface);position:sticky;top:0;z-index:40;}
  .page-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;}.page-sub{font-size:10px;color:var(--text-dim);margin-top:2px;letter-spacing:.08em;}
  .topbar-actions{display:flex;align-items:center;gap:8px;}
  .sync-pill{font-size:10px;color:var(--accent);background:rgba(0,201,167,.08);border:1px solid rgba(0,201,167,.2);padding:4px 10px;border-radius:20px;cursor:pointer;}
  .error-banner{background:#450a0a;border-bottom:1px solid #991b1b;color:#fca5a5;padding:10px 24px;font-size:12px;display:flex;align-items:center;}
  .content{padding:20px 24px;flex:1;}
  .btn-add{background:var(--accent);color:#020f0d;border:none;padding:8px 16px;font-family:'DM Mono',monospace;font-size:11px;font-weight:500;cursor:pointer;border-radius:3px;transition:.15s;}
  .btn-add:hover{background:#00e0bb;}.btn-add:disabled{opacity:.5;cursor:not-allowed;}
  .btn-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);padding:8px 16px;font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;border-radius:3px;}
  .btn-ghost:hover{border-color:var(--text-dim);color:var(--text);}
  .btn-danger{background:#7f1d1d;color:#fca5a5;border:none;padding:8px 16px;font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;border-radius:3px;}
  .btn-danger:hover{background:var(--red);color:#fff;}.btn-danger:disabled{opacity:.5;cursor:not-allowed;}
  .btn-sm{background:var(--surface2);color:var(--text-dim);border:1px solid var(--border);padding:5px 12px;font-size:10px;font-family:'DM Mono',monospace;cursor:pointer;border-radius:3px;}
  .btn-icon{background:none;border:none;color:var(--text-dim);cursor:pointer;padding:4px 8px;font-size:11px;font-family:'DM Mono',monospace;transition:.15s;border-radius:2px;}
  .btn-icon:hover{background:var(--surface2);color:var(--text);}.btn-icon.danger:hover{color:var(--red);}
  .filter-bar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;}.filter-group{display:flex;flex-wrap:wrap;gap:4px;}
  .chip{background:none;border:1px solid var(--border);color:var(--text-dim);padding:3px 10px;font-size:10px;font-family:'DM Mono',monospace;cursor:pointer;border-radius:2px;transition:.12s;}
  .chip:hover{border-color:var(--text-dim);color:var(--text);}.chip.active{border-color:var(--accent);color:var(--accent);background:rgba(0,201,167,.08);}
  .chip-row{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;}
  .kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;}
  .kpi-card{background:var(--surface);border:1px solid var(--border);padding:14px 16px;border-radius:4px;}
  .kpi-label{font-size:9px;color:var(--muted);letter-spacing:.15em;text-transform:uppercase;margin-bottom:6px;}
  .kpi-value{font-family:'Syne',sans-serif;font-size:22px;font-weight:700;line-height:1;}.kpi-sub{font-size:10px;color:var(--text-dim);margin-top:5px;}
  .dash-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
  .card{background:var(--surface);border:1px solid var(--border);padding:16px;border-radius:4px;}.card.span2{grid-column:1/-1;}
  .card-title{font-size:9px;color:var(--muted);letter-spacing:.15em;text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;gap:8px;}
  .card-date{color:var(--accent);}.card-note{font-size:11px;color:var(--text-dim);line-height:1.5;margin-top:4px;}.card-label{font-size:9px;color:var(--muted);letter-spacing:.12em;text-transform:uppercase;}
  .mini-trade{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);font-size:11px;}.mini-trade:last-child{border-bottom:none;}
  .mini-pair{font-weight:500;color:var(--accent);min-width:60px;}
  .empty-state{display:flex;flex-direction:column;align-items:center;padding:20px;color:var(--muted);font-size:11px;gap:8px;text-align:center;}
  .empty-big{text-align:center;padding:60px 20px;color:var(--text-dim);font-size:12px;line-height:2;}
  .bias-row{display:flex;align-items:center;justify-content:space-between;padding:4px 0;}.bias-pair{font-size:11px;font-weight:500;}
  .weekly-bias-tag{display:inline-block;background:rgba(0,201,167,.12);border:1px solid rgba(0,201,167,.3);color:var(--accent);padding:3px 10px;font-size:10px;border-radius:2px;}
  .bar-row{display:flex;align-items:center;gap:8px;padding:4px 0;}.bar-label{font-size:10px;color:var(--text-dim);min-width:65px;}
  .bar-track{flex:1;height:4px;background:var(--surface2);border-radius:2px;overflow:hidden;}.bar-fill{height:100%;border-radius:2px;transition:width .4s;}
  .dir-badge{display:inline-block;padding:1px 6px;font-size:9px;border-radius:2px;font-weight:500;}
  .dir-long{background:#052e16;color:#4ade80;border:1px solid #166534;}.dir-short{background:#450a0a;color:#f87171;border:1px solid #991b1b;}
  .result-badge{display:inline-block;padding:2px 7px;font-size:9px;border-radius:2px;}
  .result-win{background:#052e16;color:#4ade80;border:1px solid #166534;}.result-loss{background:#450a0a;color:#f87171;border:1px solid #991b1b;}.result-breakeven{background:#1c1a05;color:#fbbf24;border:1px solid #78350f;}
  .rr-pos{color:var(--green);font-weight:500;}.rr-neg{color:var(--red);font-weight:500;}.rr-big{font-size:14px;font-weight:700;}
  .bias-tag{display:inline-block;padding:1px 6px;font-size:9px;border-radius:2px;font-weight:500;}
  .bias-bullish{background:#052e16;color:#4ade80;}.bias-bearish{background:#450a0a;color:#f87171;}.bias-neutral{background:#1c1a05;color:#fbbf24;}
  .trade-list{display:flex;flex-direction:column;gap:8px;}
  .trade-card{background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:14px;transition:.15s;}.trade-card:hover{border-color:rgba(0,201,167,.3);}
  .tc-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:6px;}
  .tc-left{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}.tc-right{display:flex;align-items:center;gap:8px;}
  .tc-pair{font-family:'Syne',sans-serif;font-size:16px;font-weight:700;color:var(--accent);}
  .tc-date{font-size:10px;color:var(--muted);}.tc-session{font-size:9px;color:var(--text-dim);background:var(--surface2);padding:1px 6px;border-radius:2px;}
  .tc-meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;}
  .meta-tag{display:flex;align-items:center;gap:4px;background:var(--surface2);border:1px solid var(--border);padding:2px 7px;border-radius:2px;}
  .meta-label{font-size:8px;color:var(--muted);letter-spacing:.1em;}.meta-value{font-size:9px;}
  .tc-notes{font-size:11px;color:var(--text-dim);line-height:1.5;margin-bottom:8px;padding:6px 8px;background:var(--surface2);border-radius:3px;border-left:2px solid var(--border);}
  .tc-tags{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;}
  .tag{background:rgba(0,148,255,.1);border:1px solid rgba(0,148,255,.25);color:var(--accent2);padding:1px 7px;font-size:9px;border-radius:2px;}
  .tc-prices{display:flex;gap:16px;font-size:10px;color:var(--text-dim);margin-bottom:8px;flex-wrap:wrap;}.tc-prices b{color:var(--text);}
  .tc-footer{display:flex;align-items:center;justify-content:space-between;}.tc-shots{display:flex;gap:8px;}
  .shot-thumb{font-size:10px;color:var(--accent);cursor:pointer;padding:2px 6px;border:1px solid rgba(0,201,167,.2);border-radius:2px;}.shot-thumb:hover{background:rgba(0,201,167,.1);}
  .tc-actions{display:flex;gap:4px;}
  .plan-list{display:flex;flex-direction:column;gap:12px;}
  .plan-card{background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:16px;}
  .plan-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;}
  .plan-date{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;}.plan-pairs{margin-top:6px;display:flex;flex-wrap:wrap;gap:4px;}.plan-actions{display:flex;gap:4px;}
  .plan-section{margin-bottom:10px;}.plan-label{font-size:9px;color:var(--muted);letter-spacing:.15em;text-transform:uppercase;margin-bottom:3px;}.plan-text{font-size:12px;color:var(--text-dim);line-height:1.5;}
  .weekly-pairs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;}
  .weekly-pair-cell{background:var(--surface2);border:1px solid var(--border);padding:8px 10px;border-radius:3px;}
  .wpc-pair{font-size:10px;font-weight:500;color:var(--text-dim);margin-bottom:3px;}.wpc-bias{font-size:11px;font-weight:600;}.wpc-pd{font-size:9px;color:var(--muted);margin-top:2px;}
  .wpc-bias.bias-bullish{color:var(--green);}.wpc-bias.bias-bearish{color:var(--red);}.wpc-bias.bias-neutral{color:var(--amber);}
  .an-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
  .an-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(30,42,53,.5);}.an-row:last-child{border-bottom:none;}
  .an-label{font-size:10px;color:var(--text-dim);min-width:80px;}
  .pair-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;}
  .pair-cell{background:var(--surface2);border:1px solid var(--border);padding:12px;border-radius:3px;text-align:center;}.pc-pair{font-size:10px;color:var(--text-dim);margin-bottom:4px;}
  .psych-kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
  .psych-kpi{background:var(--surface2);border:1px solid var(--border);padding:14px;border-radius:3px;text-align:center;}
  .pk-label{font-size:9px;color:var(--muted);letter-spacing:.12em;margin-bottom:6px;}.pk-value{font-family:'Syne',sans-serif;font-size:24px;font-weight:700;}.pk-sub{font-size:9px;color:var(--text-dim);margin-top:4px;}
  .psych-table{width:100%;border-collapse:collapse;font-size:11px;}
  .psych-table th{font-size:9px;color:var(--muted);letter-spacing:.1em;padding:6px 10px;border-bottom:1px solid var(--border);text-align:left;}
  .psych-table td{padding:7px 10px;border-bottom:1px solid rgba(30,42,53,.5);}.psych-table tr:hover td{background:var(--surface2);}.mistake-row td{background:rgba(239,68,68,.04);}
  .overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px;}
  .modal{background:var(--surface);border:1px solid var(--border);border-radius:6px;width:100%;max-width:640px;max-height:90vh;display:flex;flex-direction:column;}
  .modal-header{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
  .modal-title{font-family:'Syne',sans-serif;font-size:16px;font-weight:700;}.modal-close{background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:16px;}
  .modal-body{padding:20px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:12px;}.modal-footer{padding:14px 20px;border-top:1px solid var(--border);display:flex;gap:8px;}
  .form-section{font-size:9px;color:var(--accent);letter-spacing:.2em;text-transform:uppercase;padding:8px 0 4px;border-bottom:1px solid rgba(0,201,167,.15);margin-top:4px;}
  .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .inp{background:var(--surface2);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:12px;padding:8px 10px;width:100%;outline:none;border-radius:3px;transition:.15s;}
  .inp:focus{border-color:var(--accent);}.inp::placeholder{color:var(--muted);}select.inp option{background:var(--surface);}.ta{resize:vertical;}
  .inp-file{background:var(--surface2);border:1px dashed var(--border);color:var(--text-dim);font-family:'DM Mono',monospace;font-size:11px;padding:8px 10px;width:100%;border-radius:3px;cursor:pointer;}
  .toggle-group{display:flex;gap:4px;flex-wrap:wrap;}
  .tog{background:var(--surface2);border:1px solid var(--border);color:var(--text-dim);padding:5px 10px;font-size:10px;font-family:'DM Mono',monospace;cursor:pointer;border-radius:2px;transition:.12s;}
  .tog:hover{border-color:var(--text-dim);}
  .tog-long{background:rgba(34,197,94,.12);border-color:#166534;color:var(--green);}.tog-short{background:rgba(239,68,68,.12);border-color:#991b1b;color:var(--red);}
  .tog-win{background:rgba(34,197,94,.12);border-color:#166534;color:var(--green);}.tog-loss{background:rgba(239,68,68,.12);border-color:#991b1b;color:var(--red);}.tog-breakeven{background:rgba(245,158,11,.12);border-color:#78350f;color:var(--amber);}
  .tog-active{border-color:var(--accent);color:var(--accent);background:rgba(0,201,167,.1);}
  .tog-bullish{background:rgba(34,197,94,.12);border-color:#166534;color:var(--green);}.tog-bearish{background:rgba(239,68,68,.12);border-color:#991b1b;color:var(--red);}.tog-neutral{background:rgba(245,158,11,.12);border-color:#78350f;color:var(--amber);}
  .tog-trending{background:rgba(0,148,255,.12);border-color:rgba(0,148,255,.4);color:var(--accent2);}.tog-ranging{background:rgba(245,158,11,.12);border-color:#78350f;color:var(--amber);}.tog-volatile{background:rgba(239,68,68,.12);border-color:#991b1b;color:var(--red);}
  .bias-form-row{display:flex;align-items:center;gap:12px;padding:5px 0;border-bottom:1px solid var(--border);}
  .bias-pair-label{font-size:11px;font-weight:500;min-width:70px;color:var(--text);}
  .weekly-form-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);flex-wrap:wrap;}
  .confirm-modal{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:28px 32px;text-align:center;min-width:280px;}
  .confirm-title{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;margin-bottom:6px;}.confirm-sub{font-size:11px;color:var(--text-dim);margin-bottom:20px;}.confirm-actions{display:flex;gap:8px;justify-content:center;}
  @media(max-width:768px){
    :root{--sidebar-w:0px;}.sidebar{display:none;}.main{margin-left:0;padding-bottom:64px;}.content{padding:12px 14px;}.topbar{padding:10px 14px;}
    .kpi-row{grid-template-columns:repeat(2,1fr);gap:8px;}.dash-grid{grid-template-columns:1fr;}.card.span2{grid-column:auto;}
    .an-grid{grid-template-columns:1fr;}.pair-grid{grid-template-columns:repeat(3,1fr);}.psych-kpi-row{grid-template-columns:repeat(2,1fr);}
    .weekly-pairs-grid{grid-template-columns:repeat(2,1fr);}.form-grid{grid-template-columns:1fr;}.filter-bar{gap:5px;}
    .modal{max-height:95vh;border-radius:12px 12px 0 0;position:fixed;bottom:0;left:0;right:0;max-width:100%;}.overlay{align-items:flex-end;padding:0;}
    .bottom-nav{display:flex !important;}.sync-pill{display:none;}
  }
  .bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:var(--surface);border-top:1px solid var(--border);z-index:50;}
  .bn-item{flex:1;display:flex;flex-direction:column;align-items:center;padding:10px 4px 8px;background:none;border:none;color:var(--text-dim);cursor:pointer;font-family:'DM Mono',monospace;font-size:8px;gap:4px;transition:.12s;}
  .bn-item.active{color:var(--accent);}.bn-icon{font-size:16px;}
`;
