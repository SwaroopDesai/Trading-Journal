"use client"
import { createClient } from "@/lib/supabase";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { DARK, LIGHT, PAIRS, SESSIONS, TAB_STORAGE_KEY, TRADE_BOOT_FIELDS, DAILY_BOOT_FIELDS, WEEKLY_BOOT_FIELDS } from "@/lib/constants";
import { getCurrentSessionInfo, uploadImageValue, uploadImageList, deleteStoredImages, getDailyPlanImages, getWeeklyPlanImages, clearDraft, serializeImageList, getAutoSession } from "@/lib/utils";
import { Spinner, AppShellSkeleton, TabPanel, BottomNav, Overlay, HeaderMeta, SessionPill } from "@/components/ui";
import TradeModal from "@/components/TradeModal";
import Psychology from "@/components/Psychology";
import Calculator from "@/components/Calculator";
import MoreMenu from "@/components/MoreMenu";
import LoginScreen from "@/components/LoginScreen";
import Dashboard from "@/components/tabs/Dashboard";
import Journal from "@/components/tabs/Journal";
import DailyTab, { DailyModal } from "@/components/tabs/DailyTab";
import WeeklyTab, { WeeklyModal } from "@/components/tabs/WeeklyTab";
import Analytics from "@/components/tabs/Analytics";
import ScreenshotGallery from "@/components/tabs/ScreenshotGallery";
import WeeklyReview from "@/components/tabs/WeeklyReview";
import Heatmap from "@/components/tabs/Heatmap";
import Playbook from "@/components/tabs/Playbook";
import AIAnalysis from "@/components/tabs/AIAnalysis";
import ExportTab from "@/components/tabs/ExportTab";

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
  const [sessionTick,setSessionTick] = useState(()=>Date.now())
  const [sessionOpen,setSessionOpen] = useState(false)
  const [viewportWidth,setViewportWidth] = useState(()=>typeof window==="undefined"?0:window.innerWidth)
  const [tradeModal,setTradeModal] = useState(null)
  const [dailyModal,setDailyModal] = useState(null)
  const [weeklyModal,setWeeklyModal] = useState(null)
  const [filterPair,setFilterPair] = useState("ALL")
  const [filterResult,setFilterResult] = useState("ALL")
  const [dismissedStreak,setDismissedStreak] = useState(null)
  const [deleteTarget,setDeleteTarget] = useState(null)
  const [imgViewer,setImgViewer] = useState(null)
  const [mountedTabs,setMountedTabs] = useState(["dashboard"])
  const [toasts,setToasts] = useState([])
  const scrollPositionsRef = useRef({})
  const restoreFrameRef = useRef(null)
  const toastDedupRef = useRef(new Map())

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{ setUser(session?.user??null); setAuthLoading(false) })
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session)=>setUser(session?.user??null))
    return ()=>subscription.unsubscribe()
  },[])

  useEffect(()=>{
    if(typeof window==="undefined") return
    const savedTab = window.localStorage.getItem(TAB_STORAGE_KEY)
    if(savedTab) setTab(savedTab)
  },[])

  useEffect(()=>{
    const id = window.setInterval(()=>setSessionTick(Date.now()), 60000)
    return ()=>window.clearInterval(id)
  },[])

  useEffect(()=>{
    if(typeof window==="undefined") return
    setViewportWidth(window.innerWidth)
    const onResize = ()=>setViewportWidth(window.innerWidth)
    window.addEventListener("resize", onResize)
    return ()=>window.removeEventListener("resize", onResize)
  },[])

  const hydrateMedia = useCallback(async()=>{
    if(!user) return
    try {
      const [t,d] = await Promise.all([
        supabase.from("trades").select("id,preScreenshot,postScreenshot").eq("user_id",user.id),
        supabase.from("daily_plans").select("id,chartImage").eq("user_id",user.id),
      ])
      if(!t.error){
        const byId = new Map((t.data||[]).map(r=>[r.id,r]))
        setTrades(ts=>ts.map(x=>byId.has(x._dbid)?{...x,...byId.get(x._dbid)}:x))
      }
      if(!d.error){
        const byId = new Map((d.data||[]).map(r=>[r.id,r]))
        setDailyPlans(ps=>ps.map(x=>byId.has(x._dbid)?{...x,...byId.get(x._dbid)}:x))
      }
    } catch {}
  },[supabase,user])

  const loadAll = useCallback(async()=>{
    if(!user) return
    setLoading(true); setError(null)
    try {
      const [t,d,w] = await Promise.all([
        supabase.from("trades").select(TRADE_BOOT_FIELDS).eq("user_id",user.id).order("created_at",{ascending:false}),
        supabase.from("daily_plans").select(DAILY_BOOT_FIELDS).eq("user_id",user.id).order("created_at",{ascending:false}),
        supabase.from("weekly_plans").select(WEEKLY_BOOT_FIELDS).eq("user_id",user.id).order("created_at",{ascending:false}),
      ])
      if(t.error)throw t.error; if(d.error)throw d.error; if(w.error)throw w.error
      setTrades((t.data||[]).map(r=>({...r,_dbid:r.id})))
      setDailyPlans((d.data||[]).map(r=>({...r,_dbid:r.id})))
      setWeeklyPlans((w.data||[]).map(r=>({...r,_dbid:r.id})))
      hydrateMedia()
    } catch(e){ setError("Failed to load: "+e.message) }
    finally{ setLoading(false) }
  },[hydrateMedia,supabase,user])

  useEffect(()=>{ if(user) loadAll() },[user,loadAll])

  useEffect(()=>{
    setMountedTabs(prev=>prev.includes(tab)?prev:[...prev,tab])
  },[tab])

  useEffect(()=>{
    if(typeof window==="undefined") return
    window.localStorage.setItem(TAB_STORAGE_KEY, tab)
  },[tab])

  useEffect(()=>{
    if(typeof window==="undefined") return
    if(restoreFrameRef.current) cancelAnimationFrame(restoreFrameRef.current)
    restoreFrameRef.current = requestAnimationFrame(()=>{
      window.scrollTo(0, scrollPositionsRef.current[tab] ?? 0)
    })
    return ()=>{
      if(restoreFrameRef.current) cancelAnimationFrame(restoreFrameRef.current)
    }
  },[tab])

  const changeTab = useCallback((nextTab)=>{
    if(nextTab===tab) return
    if(typeof window!=="undefined") scrollPositionsRef.current[tab] = window.scrollY
    setMountedTabs(prev=>prev.includes(nextTab)?prev:[...prev,nextTab])
    setTab(nextTab)
  },[tab])

  const showToast = useCallback((msg, type="success")=>{
    const key = `${type}:${msg}`
    const now = Date.now()
    const lastShown = toastDedupRef.current.get(key) || 0
    if(now - lastShown < 2000) return
    toastDedupRef.current.set(key, now)
    const id = now + Math.random()
    setToasts(t=>[...t,{id,msg,type}])
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)), 3000)
  },[])

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(()=>{
    const handler=(e)=>{
      const tag=document.activeElement?.tagName
      if(tag==="INPUT"||tag==="TEXTAREA"||document.activeElement?.isContentEditable) return
      if(e.metaKey||e.ctrlKey||e.altKey) return
      const key = e.key.toLowerCase()
      if(key==="escape" && (tradeModal||dailyModal||weeklyModal)){
        e.preventDefault()
        window.dispatchEvent(new Event("fxedge:request-modal-close"))
        return
      }
      if(key==="n"&&!tradeModal&&!dailyModal&&!weeklyModal) setTradeModal("quick")
      if(key==="d") changeTab("daily")
      if(key==="j") changeTab("journal")
      if(key==="w") changeTab("weekly")
      if(key==="a") changeTab("analytics")
      if(key==="h") changeTab("heatmap")
    }
    window.addEventListener("keydown",handler)
    return ()=>window.removeEventListener("keydown",handler)
  },[tradeModal,dailyModal,weeklyModal,changeTab])

  const clean = (obj) => { const o={...obj}; delete o._dbid; delete o.id; delete o.created_at; return o }

  const saveTrade = async(t)=>{
    setSyncing(true)
    try {
      const existing = t._dbid ? trades.find(x=>x._dbid===t._dbid) : null
      const preScreenshot = await uploadImageValue(supabase, user.id, "trades/pre", t.preScreenshot)
      const postScreenshot = await uploadImageValue(supabase, user.id, "trades/post", t.postScreenshot)
      const payload = {...clean({...t, preScreenshot, postScreenshot}), user_id:user.id}
      const isEdit = !!t._dbid
      if(t._dbid){ await supabase.from("trades").update(payload).eq("id",t._dbid).eq("user_id",user.id); setTrades(ts=>ts.map(x=>x._dbid===t._dbid?{...payload,_dbid:t._dbid}:x)) }
      else { const {data,error}=await supabase.from("trades").insert([payload]).select(); if(error)throw error; setTrades(ts=>[{...data[0],_dbid:data[0].id},...ts]); clearDraft(user.id, "trade") }
      if(existing){
        if(existing.preScreenshot && existing.preScreenshot !== preScreenshot) await deleteStoredImages(supabase, existing.preScreenshot)
        if(existing.postScreenshot && existing.postScreenshot !== postScreenshot) await deleteStoredImages(supabase, existing.postScreenshot)
      }
      setTradeModal(null)
      showToast(isEdit ? "Trade updated ✓" : "Trade logged ✓")
    } catch(e){ setError("Failed to save trade: "+e.message) }
    finally{ setSyncing(false) }
  }

  const saveDaily = async(p)=>{
    setSyncing(true)
    try {
      const existing = p._dbid ? dailyPlans.find(x=>x._dbid===p._dbid) : null
      const chartImages = await uploadImageList(supabase, user.id, "daily-plans", getDailyPlanImages(p))
      const payload = {...clean({...p, chartImage:serializeImageList(chartImages)}), user_id:user.id}
      const isEditD = !!p._dbid
      if(p._dbid){ await supabase.from("daily_plans").update(payload).eq("id",p._dbid).eq("user_id",user.id); setDailyPlans(ps=>ps.map(x=>x._dbid===p._dbid?{...payload,_dbid:p._dbid}:x)) }
      else { const {data,error}=await supabase.from("daily_plans").insert([payload]).select(); if(error)throw error; setDailyPlans(ps=>[{...data[0],_dbid:data[0].id},...ps]); clearDraft(user.id, "daily") }
      if(existing) await deleteStoredImages(supabase, getDailyPlanImages(existing).filter(src=>!chartImages.includes(src)))
      setDailyModal(null)
      showToast(isEditD ? "Plan updated ✓" : "Daily plan saved ✓")
    } catch(e){ setError("Failed to save daily: "+e.message) }
    finally{ setSyncing(false) }
  }

  const saveWeekly = async(p)=>{
    setSyncing(true)
    try {
      const existing = p._dbid ? weeklyPlans.find(x=>x._dbid===p._dbid) : null
      const weeklyImages = await uploadImageList(supabase, user.id, "weekly-plans", getWeeklyPlanImages(p))
      const premiumDiscount = {...(p.premiumDiscount||{})}
      if(weeklyImages.length>0) premiumDiscount.__screenshots = weeklyImages
      else delete premiumDiscount.__screenshots
      const payload = {...clean({...p, premiumDiscount}), user_id:user.id}
      const isEditW = !!p._dbid
      if(p._dbid){ await supabase.from("weekly_plans").update(payload).eq("id",p._dbid).eq("user_id",user.id); setWeeklyPlans(ps=>ps.map(x=>x._dbid===p._dbid?{...payload,_dbid:p._dbid}:x)) }
      else { const {data,error}=await supabase.from("weekly_plans").insert([payload]).select(); if(error)throw error; setWeeklyPlans(ps=>[{...data[0],_dbid:data[0].id},...ps]); clearDraft(user.id, "weekly") }
      if(existing) await deleteStoredImages(supabase, getWeeklyPlanImages(existing).filter(src=>!weeklyImages.includes(src)))
      setWeeklyModal(null)
      showToast(isEditW ? "Plan updated ✓" : "Weekly plan saved ✓")
    } catch(e){ setError("Failed to save weekly: "+e.message) }
    finally{ setSyncing(false) }
  }

  const confirmDelete = async()=>{
    setSyncing(true)
    try {
      const tbl={trade:"trades",daily:"daily_plans",weekly:"weekly_plans"}[deleteTarget.type]
      const current =
        deleteTarget.type==="trade" ? trades.find(x=>x._dbid===deleteTarget.dbid) :
        deleteTarget.type==="daily" ? dailyPlans.find(x=>x._dbid===deleteTarget.dbid) :
        weeklyPlans.find(x=>x._dbid===deleteTarget.dbid)
      const {error}=await supabase.from(tbl).delete().eq("id",deleteTarget.dbid).eq("user_id",user.id)
      if(error)throw error
      if(current){
        if(deleteTarget.type==="trade") await deleteStoredImages(supabase, [current.preScreenshot, current.postScreenshot])
        if(deleteTarget.type==="daily") await deleteStoredImages(supabase, getDailyPlanImages(current))
        if(deleteTarget.type==="weekly") await deleteStoredImages(supabase, getWeeklyPlanImages(current))
      }
      if(deleteTarget.type==="trade") setTrades(ts=>ts.filter(x=>x._dbid!==deleteTarget.dbid))
      if(deleteTarget.type==="daily") setDailyPlans(ps=>ps.filter(x=>x._dbid!==deleteTarget.dbid))
      if(deleteTarget.type==="weekly") setWeeklyPlans(ps=>ps.filter(x=>x._dbid!==deleteTarget.dbid))
      setDeleteTarget(null)
      showToast("Deleted")
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
    sortedT.forEach(x=>{ cum+=(x.rr||0); equityCurve.push({r:cum,result:x.result,date:x.date,pair:x.pair,rr:x.rr||0}) });
    return {total:t.length,wins:wins.length,losses:losses.length,be:be.length,totalR,avgRR,winRate,byPair,bySession,equityCurve}
  },[trades])

  const streakAlert = useMemo(() => {
    if (!trades.length) return null;
    const sorted = [...trades].sort((a,b) => new Date(a.date) - new Date(b.date));
    let cur = 0, type = null;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const r = sorted[i].result;
      if (i === sorted.length - 1) { type = r; cur = 1; }
      else if (r === type) cur++;
      else break;
    }
    if (type === "LOSS" && cur >= 3) return { type: "LOSS", count: cur };
    if (type === "WIN"  && cur >= 5) return { type: "WIN",  count: cur };
    return null;
  }, [trades])

  const filtered = useMemo(()=>trades.filter(t=>(filterPair==="ALL"||t.pair===filterPair)&&(filterResult==="ALL"||t.result===filterResult)).sort((a,b)=>new Date(b.date)-new Date(a.date)),[trades,filterPair,filterResult])
  const currentSession = useMemo(()=>getCurrentSessionInfo(new Date(sessionTick)),[sessionTick])
  const compactSession = viewportWidth < 1180
  const isMobileViewport = viewportWidth < 768
  const todayKey = useMemo(()=>new Date().toISOString().split("T")[0],[])
  const latestTrade = useMemo(()=>{
    if(!trades.length) return null
    return [...trades].sort((a,b)=>new Date(b.created_at||b.date)-new Date(a.created_at||a.date))[0]
  },[trades])
  const latestDailyPlan = useMemo(()=>{
    if(!dailyPlans.length) return null
    return [...dailyPlans].sort((a,b)=>new Date(b.created_at||b.date)-new Date(a.created_at||a.date))[0]
  },[dailyPlans])
  const todaysDailyPlan = useMemo(
    ()=>dailyPlans.find(plan=>plan.date===todayKey) || latestDailyPlan,
    [dailyPlans,latestDailyPlan,todayKey]
  )
  const newTradeDefaults = useMemo(()=>{
    const defaults = { session:getAutoSession() }
    if(latestTrade){
      defaults.pair = latestTrade.pair || defaults.pair
      defaults.direction = latestTrade.direction || defaults.direction
      defaults.setup = latestTrade.setup || defaults.setup
      defaults.emotion = latestTrade.emotion || defaults.emotion
      defaults.dailyBias = latestTrade.dailyBias || defaults.dailyBias
      defaults.tags = Array.isArray(latestTrade.tags) ? latestTrade.tags.join(",") : ""
    }
    if(todaysDailyPlan){
      const planBiases = todaysDailyPlan.biases || {}
      const preferredPair = defaults.pair || latestTrade?.pair
      if(preferredPair && planBiases[preferredPair]) defaults.dailyBias = planBiases[preferredPair]
    }
    return defaults
  },[latestTrade,todaysDailyPlan])
  const repeatLastTrade = useCallback(()=>{
    if(!latestTrade) return
    setTradeModal({
      ...latestTrade,
      _dbid: undefined,
      id: undefined,
      created_at: undefined,
      date: todayKey,
      notes: "",
      preScreenshot: "",
      postScreenshot: "",
    })
  },[latestTrade,todayKey])

  // Mobile shows only 5 primary tabs; rest accessible via More
  const TABS=[
    {id:"dashboard",icon:"🏠",label:"Home",mobile:true},
    {id:"journal",icon:"📓",label:"Journal",mobile:true},
    {id:"analytics",icon:"📊",label:"Analytics",mobile:true},
    {id:"heatmap",icon:"🔥",label:"Heatmap",mobile:true},
    {id:"more",icon:"···",label:"More",mobile:true},
    // Desktop only (accessible via sidebar + More on mobile)
    {id:"daily",icon:"📅",label:"Daily",mobile:false},
    {id:"weekly",icon:"🗓",label:"Weekly",mobile:false},
    {id:"psychology",icon:"🧠",label:"Mind",mobile:false},
    {id:"playbook",icon:"PB",label:"Playbook",mobile:false},
    {id:"calculator",icon:"CL",label:"Calculator",mobile:false},
    {id:"gallery",icon:"GL",label:"Gallery",mobile:false},
    {id:"review",icon:"RV",label:"Review",mobile:false},
    {id:"ai",icon:"AI",label:"AI Analysis",mobile:false},
    {id:"export",icon:"EX",label:"Export",mobile:false},
  ]
  const ALL_TABS=TABS.filter(t=>t.id!=="more")
  const MOBILE_PRIMARY=TABS.filter(t=>t.mobile)
  const SIDEBAR_PRIMARY=ALL_TABS.filter(t=>["dashboard","journal","daily","heatmap"].includes(t.id))
  const SIDEBAR_SECONDARY=ALL_TABS.filter(t=>!["dashboard","journal","daily","heatmap"].includes(t.id))

  const css = buildCSS(T)

  if(authLoading) return <Spinner T={T}/>
  if(!user) return <LoginScreen supabase={supabase}/>
  if(loading) return <AppShellSkeleton T={T}/>

  return (
    <div style={{display:"flex",minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"Inter,sans-serif",transition:"background .3s, color .3s"}}>
      <style>{css}</style>

      {/* Sidebar */}
      <nav className="sidebar" style={{background:T.surface,borderRight:`1px solid ${T.border}`}}>
        <div style={{padding:"22px 20px 16px"}}>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:22,fontWeight:800,background:`linear-gradient(135deg,${T.accentBright},${T.pink})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>FXEDGE</div>
          <div style={{fontSize:9,color:T.muted,letterSpacing:"0.12em",marginTop:2}}>ICT / SMC</div>
        </div>
        <div style={{padding:"8px 12px 0"}}>
          {SIDEBAR_PRIMARY.map(t=>(
            <button key={t.id} className={`nav-btn ${tab===t.id?"nav-active":""}`}
              style={{color:tab===t.id?T.text:T.textDim,background:tab===t.id?`linear-gradient(135deg,${T.accent}22,${T.pink}10)`:"none",borderLeft:tab===t.id?`3px solid ${T.accentBright}`:"3px solid transparent",boxShadow:tab===t.id?`inset 0 0 0 1px ${T.accent}28`:"none"}}
              onClick={()=>changeTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{padding:"18px 20px 8px",fontSize:10,color:T.muted,letterSpacing:"0.16em",textTransform:"uppercase"}}>Workspace</div>
        <div style={{padding:"0 12px"}}>
          {SIDEBAR_SECONDARY.map(t=>(
            <button key={t.id} className={`nav-btn ${tab===t.id?"nav-active":""}`}
              style={{color:tab===t.id?T.text:T.textDim,background:tab===t.id?`linear-gradient(135deg,${T.accent}22,${T.pink}10)`:"none",borderLeft:tab===t.id?`3px solid ${T.accentBright}`:"3px solid transparent",boxShadow:tab===t.id?`inset 0 0 0 1px ${T.accent}28`:"none"}}
              onClick={()=>changeTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{flex:1}}/>
        <div style={{padding:"8px 20px",fontSize:11,color:T.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
        <div style={{padding:"4px 20px 4px",fontSize:11,color:syncing?T.amber:T.green,cursor:"pointer"}} onClick={loadAll}>{syncing?"Saving...":"Synced"}</div>
        <button onClick={()=>setDark(!dark)} style={{margin:"6px 12px",padding:"8px 14px",background:T.surface2,border:`1px solid ${T.border}`,color:T.textDim,borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"Inter,sans-serif",textAlign:"left"}}>
          {dark?"Light Mode":"Dark Mode"}
        </button>
        <button onClick={signOut} style={{margin:"4px 12px 16px",padding:"8px 14px",background:"none",border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"Inter,sans-serif",textAlign:"left"}}>Sign Out</button>
      </nav>

      {/* Main */}
      <main className="app-main" style={{flex:1,display:"flex",flexDirection:"column"}}>
        {/* Topbar */}
        <div className="topbar" style={{borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,background:T.surface,position:"sticky",top:0,zIndex:40}}>
          <div style={{flex:1,minWidth:0}}>
            <HeaderMeta
              T={T}
              eyebrow="Trading Journal"
              title={ALL_TABS.find(t=>t.id===tab)?.label || TABS.find(t=>t.id===tab)?.label}
              subtitle={new Date().toLocaleDateString("en-GB",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}
            />
          </div>
          <div className="topbar-right" style={{flexShrink:0,alignSelf:"flex-start",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:10}}>
            <button onClick={()=>setDark(!dark)} aria-label="Toggle theme" className="theme-btn" style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.textDim,borderRadius:20,cursor:"pointer"}}>
              {dark?"Light":"Dark"}
            </button>
            <SessionPill T={T} session={currentSession} compact={compactSession||isMobileViewport} mobile={isMobileViewport} open={sessionOpen} onToggle={()=>setSessionOpen(v=>!v)}/>
          </div>
        </div>
        {error&&<div style={{background:"#450a0a",borderBottom:"1px solid #991b1b",color:"#fca5a5",padding:"10px 28px",fontSize:13,display:"flex",alignItems:"center"}}>Alert: {error}<button onClick={()=>setError(null)} style={{marginLeft:12,background:"none",border:"none",color:"inherit",cursor:"pointer",fontWeight:700}}>x</button></div>}
        {streakAlert && dismissedStreak !== `${streakAlert.type}-${streakAlert.count}` && (
          <div style={{
            background: streakAlert.type === "LOSS" ? `${T.red}18` : `${T.green}18`,
            borderBottom: `1px solid ${streakAlert.type === "LOSS" ? T.red : T.green}44`,
            color: streakAlert.type === "LOSS" ? T.red : T.green,
            padding: "10px 24px", fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <span>
              {streakAlert.type === "LOSS"
                ? `⚠️ ${streakAlert.count} consecutive losses — consider stepping back and reviewing your process.`
                : `🔥 ${streakAlert.count} wins in a row — great momentum, stay disciplined and don't oversize.`}
            </span>
            <button onClick={() => setDismissedStreak(`${streakAlert.type}-${streakAlert.count}`)} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",fontSize:16,lineHeight:1,padding:4}}>✕</button>
          </div>
        )}

        <div className="tab-content" style={{flex:1}}>
          {mountedTabs.includes("dashboard")&&<TabPanel active={tab==="dashboard"}><Dashboard T={T} stats={stats} trades={trades} dailyPlans={dailyPlans} weeklyPlans={weeklyPlans} onNewTrade={()=>setTradeModal("new")} onNewDaily={()=>setDailyModal("new")} onNewWeekly={()=>setWeeklyModal("new")} viewportWidth={viewportWidth}/></TabPanel>}
          {mountedTabs.includes("journal")&&<TabPanel active={tab==="journal"}><Journal T={T} filtered={filtered} filterPair={filterPair} setFilterPair={setFilterPair} filterResult={filterResult} setFilterResult={setFilterResult} onEdit={t=>setTradeModal(t)} onDelete={t=>setDeleteTarget({type:"trade",dbid:t._dbid,name:`${t.pair} ${t.direction}`})} onViewImg={setImgViewer} onNew={()=>setTradeModal("new")} onRepeatLast={latestTrade?repeatLastTrade:null} viewportWidth={viewportWidth}/></TabPanel>}
          {mountedTabs.includes("daily")&&<TabPanel active={tab==="daily"}><DailyTab T={T} plans={dailyPlans} onEdit={p=>setDailyModal(p)} onDelete={p=>setDeleteTarget({type:"daily",dbid:p._dbid,name:`Daily ${p.date}`})} onViewImg={setImgViewer} onNew={()=>setDailyModal("new")}/></TabPanel>}
          {mountedTabs.includes("weekly")&&<TabPanel active={tab==="weekly"}><WeeklyTab T={T} plans={weeklyPlans} onEdit={p=>setWeeklyModal(p)} onDelete={p=>setDeleteTarget({type:"weekly",dbid:p._dbid,name:`Week ${p.weekStart}`})} onViewImg={setImgViewer} onNew={()=>setWeeklyModal("new")}/></TabPanel>}
          {mountedTabs.includes("analytics")&&<TabPanel active={tab==="analytics"}><Analytics T={T} stats={stats} trades={trades} onNewTrade={()=>setTradeModal("new")} viewportWidth={viewportWidth}/></TabPanel>}
          {mountedTabs.includes("psychology")&&<TabPanel active={tab==="psychology"}><Psychology T={T} stats={stats} trades={trades}/></TabPanel>}
          {mountedTabs.includes("calculator")&&<TabPanel active={tab==="calculator"}><Calculator T={T}/></TabPanel>}
          {mountedTabs.includes("gallery")&&<TabPanel active={tab==="gallery"}><ScreenshotGallery T={T} trades={trades} onViewImg={setImgViewer} onNewTrade={()=>setTradeModal("new")} viewportWidth={viewportWidth}/></TabPanel>}
          {mountedTabs.includes("review")&&<TabPanel active={tab==="review"}><WeeklyReview T={T} weeklyPlans={weeklyPlans} trades={trades} saveWeekly={saveWeekly} onNewWeekly={()=>setWeeklyModal("new")} viewportWidth={viewportWidth}/></TabPanel>}
          {mountedTabs.includes("heatmap")&&<TabPanel active={tab==="heatmap"}><Heatmap T={T} trades={trades} viewportWidth={viewportWidth} onViewImg={setImgViewer}/></TabPanel>}
          {mountedTabs.includes("playbook")&&<TabPanel active={tab==="playbook"}><Playbook T={T} trades={trades}/></TabPanel>}
          {mountedTabs.includes("ai")&&<TabPanel active={tab==="ai"}><AIAnalysis T={T} trades={trades} dailyPlans={dailyPlans}/></TabPanel>}
          {mountedTabs.includes("export")&&<TabPanel active={tab==="export"}><ExportTab T={T} trades={trades} dailyPlans={dailyPlans} weeklyPlans={weeklyPlans}/></TabPanel>}
          {mountedTabs.includes("more")&&<TabPanel active={tab==="more"}><MoreMenu T={T} setTab={changeTab} ALL_TABS={ALL_TABS}/></TabPanel>}
        </div>
      </main>

      {/* ── Floating Action Button ── */}
      {!tradeModal && !dailyModal && !weeklyModal && (
        <button
          onClick={() => setTradeModal("quick")}
          title="Quick Log Trade  (N)"
          style={{
            position:"fixed", right:20,
            bottom: isMobileViewport ? 80 : 24,
            width:56, height:56, borderRadius:"50%",
            background:T.accentBright, border:"none",
            color:"#fff", fontSize:28, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 4px 24px ${T.accentBright}70`,
            zIndex:90, transition:"transform .15s, box-shadow .15s",
            fontFamily:"Inter,sans-serif", lineHeight:1,
          }}
          onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.08)"; e.currentTarget.style.boxShadow=`0 6px 32px ${T.accentBright}90`}}
          onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";   e.currentTarget.style.boxShadow=`0 4px 24px ${T.accentBright}70`}}
        >+</button>
      )}

      {tradeModal&&<TradeModal T={T} userId={user.id} initial={tradeModal==="new"||tradeModal==="quick"?null:tradeModal} defaults={newTradeDefaults} initialMode={tradeModal==="quick"?"quick":undefined} onSave={saveTrade} onClose={()=>setTradeModal(null)} syncing={syncing}/>}
      {dailyModal&&<DailyModal T={T} userId={user.id} initial={dailyModal==="new"?null:dailyModal} onSave={saveDaily} onClose={()=>setDailyModal(null)} syncing={syncing}/>}
      {weeklyModal&&<WeeklyModal T={T} userId={user.id} initial={weeklyModal==="new"?null:weeklyModal} onSave={saveWeekly} onClose={()=>setWeeklyModal(null)} syncing={syncing}/>}
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

      {/* ── Toast stack ── */}
      {toasts.length>0&&(
        <div style={{position:"fixed",bottom:isMobileViewport?90:32,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",gap:8,zIndex:500,pointerEvents:"none",alignItems:"center"}}>
          {toasts.map(t=>(
            <div key={t.id} style={{
              background:t.type==="error"?"#dc2626":t.msg==="Deleted"?T.textDim:"#16a34a",
              color:"#fff",padding:"10px 22px",borderRadius:12,
              fontSize:13,fontWeight:700,letterSpacing:"0.01em",
              boxShadow:"0 8px 28px rgba(0,0,0,.5)",
              animation:"toastIn .18s ease",whiteSpace:"nowrap",
              fontFamily:"Inter,sans-serif",
            }}>{t.msg}</div>
          ))}
        </div>
      )}

      <BottomNav T={T} tab={tab} setTab={changeTab} TABS={TABS} MOBILE_PRIMARY={MOBILE_PRIMARY}/>
    </div>
  )
}

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
    .topbar{padding:14px 28px;}
    .tab-content{padding:24px 28px;}
    .topbar-right{min-width:0;}
    .theme-btn{padding:7px 14px;font-size:13px;min-width:auto;}
    .pill-label{max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    @media(max-width:768px){
      .sidebar{display:none;}
      main{margin-left:0 !important;padding-bottom:76px;}
      .bottom-nav{display:flex !important;}
      .kpi-grid{grid-template-columns:repeat(2,1fr) !important;}
      .hide-mobile{display:none !important;}
      .topbar{padding:12px 16px !important;}
      .tab-content{padding:16px 14px !important;}
      .topbar-right{min-width:132px !important;}
      .theme-btn{padding:8px 12px !important;font-size:12px !important;min-width:76px !important;}
      .pill-label{max-width:80px !important;}
    }
  `
}
