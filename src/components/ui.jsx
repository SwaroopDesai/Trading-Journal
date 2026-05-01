"use client"
import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Button as ShadcnButton } from "@/components/ui/button";
import { normalizeImageList } from "@/lib/utils";
import { DARK } from "@/lib/constants";

// ─── Spinner / Loading ─────────────────────────────────────────────────────
export function Spinner({T,label}) {
  const th = T||DARK
  return (
    <div style={{minHeight:"100vh",background:th.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20}} role="status" aria-label="Loading">
      <style>{`@keyframes pulse{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1)}} @media(prefers-reduced-motion:reduce){.fx-pulse{animation:none!important;opacity:1!important}}`}</style>
      <div style={{fontFamily:"var(--font-geist-sans)",fontSize:34,fontWeight:900,color:th.accentBright,letterSpacing:"-0.06em"}}>FXEDGE</div>
      <div style={{display:"flex",gap:8}}>{[0,1,2].map(i=><div key={i} className="fx-pulse" style={{width:8,height:8,borderRadius:"50%",background:th.accentBright,animation:`pulse 1.2s ${i*0.2}s infinite ease-in-out`}}/>)}</div>
      {label&&<div style={{fontSize:12,color:th.muted,letterSpacing:"0.15em"}}>{label.toUpperCase()}</div>}
    </div>
  )
}

export function AppShellSkeleton({T}) {
  const th = T||DARK
  const pulse = {
    background:`linear-gradient(90deg, ${th.surface2} 0%, ${th.border} 50%, ${th.surface2} 100%)`,
    backgroundSize:"220% 100%",
    animation:"skeletonPulse 1.4s ease-in-out infinite",
  }
  const block = (style={}) => <div style={{borderRadius:12,...pulse,...style}} />
  return (
    <div style={{display:"flex",minHeight:"100vh",background:th.bg,color:th.text}} role="status" aria-label="Loading journal">
      <style>{`
        @keyframes skeletonPulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="skeletonPulse"] { animation: none !important; opacity: 0.5; }
        }
      `}</style>
      <nav style={{width:224,background:th.surface,borderRight:`1px solid ${th.border}`,padding:"22px 16px",display:"flex",flexDirection:"column",gap:12}}>
        {block({width:96,height:24,borderRadius:10})}
        {block({width:52,height:10,borderRadius:999,opacity:.7,marginBottom:8})}
        {[...Array(9)].map((_,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 6px"}}>
            {block({width:18,height:18,borderRadius:6})}
            {block({width:i % 3 === 0 ? 92 : 76,height:12,borderRadius:999})}
          </div>
        ))}
        <div style={{flex:1}} />
        {block({width:"100%",height:34,borderRadius:10})}
        {block({width:"100%",height:34,borderRadius:10})}
      </nav>
      <main style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{padding:"14px 28px",borderBottom:`1px solid ${th.border}`,background:th.surface,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:20}}>
          <div style={{minWidth:0}}>
            {block({width:110,height:10,borderRadius:999,marginBottom:14})}
            {block({width:210,height:34,borderRadius:12,marginBottom:12})}
            {block({width:190,height:14,borderRadius:999})}
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:10}}>
            {block({width:78,height:38,borderRadius:999})}
            {block({width:220,height:66,borderRadius:18})}
          </div>
        </div>
        <div style={{padding:"24px 28px",display:"flex",flexDirection:"column",gap:18}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:14}}>
            {[...Array(4)].map((_,i)=>(
              <div key={i} style={{background:th.surface,border:`1px solid ${th.border}`,borderRadius:18,padding:"18px 18px 16px",boxShadow:`0 10px 28px ${th.cardGlow}`}}>
                {block({width:92,height:22,borderRadius:999,marginBottom:16})}
                {block({width:64,height:10,borderRadius:999,marginBottom:10})}
                {block({width:i === 3 ? 88 : 98,height:30,borderRadius:12,marginBottom:12})}
                {block({width:"72%",height:12,borderRadius:999,marginBottom:16})}
                {block({width:"100%",height:4,borderRadius:999})}
              </div>
            ))}
          </div>
          <div style={{background:th.surface,border:`1px solid ${th.border}`,borderRadius:18,padding:"20px 22px"}}>
            {block({width:120,height:12,borderRadius:999,marginBottom:18})}
            {block({width:"100%",height:250,borderRadius:16})}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:14}}>
            {[...Array(2)].map((_,i)=>(
              <div key={i} style={{background:th.surface,border:`1px solid ${th.border}`,borderRadius:18,padding:"20px 22px"}}>
                {block({width:110,height:12,borderRadius:999,marginBottom:16})}
                {block({width:"100%",height:i===0?180:220,borderRadius:16})}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Overlay / Modal backdrop ──────────────────────────────────────────────
export function Overlay({onClose,children}){
  // Close on Escape key
  useEffect(()=>{
    const handler = (e) => { if(e.key==="Escape") onClose?.() }
    document.addEventListener("keydown", handler)
    return ()=>document.removeEventListener("keydown", handler)
  },[onClose])
  return (
    <motion.div
      onClick={onClose}
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,.72)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16,backdropFilter:"blur(4px)"}}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        onClick={e=>e.stopPropagation()}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >{children}</motion.div>
    </motion.div>
  )
}

// ─── Tab panel (show/hide) ─────────────────────────────────────────────────
export function TabPanel({active,children}) {
  return (
    <motion.div
      aria-hidden={!active}
      initial={false}
      animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      style={{
        display:active?"block":"none",
        minHeight:active?"auto":0,
      }}
    >
      {children}
    </motion.div>
  )
}

// ─── Mobile bottom nav ─────────────────────────────────────────────────────
export function BottomNav({T,tab,setTab,TABS,MOBILE_PRIMARY}){
  const tabs = MOBILE_PRIMARY||TABS.slice(0,5)
  return (
    <nav className="bottom-nav" aria-label="Main navigation" style={{background:T.surface,borderTop:`1px solid ${T.border}`,paddingBottom:"env(safe-area-inset-bottom)",boxShadow:`0 -12px 28px ${T.bg}88`}}>
      {tabs.map(t=>{
        const isActive = t.id==="more" ? tab==="more" : (t.id===tab || (t.id==="more" && !tabs.find(x=>x.id===tab&&x.mobile)))
        return (
          <button
            key={t.id}
            onClick={()=>setTab(t.id)}
            aria-label={t.label}
            aria-current={isActive?"page":undefined}
            style={{
              flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",
              padding:"12px 2px 10px",background:"none",border:"none",
              color:isActive?T.accentBright:T.muted,
              cursor:"pointer",fontFamily:"var(--font-geist-sans)",fontSize:11,gap:4,
              fontWeight:isActive?800:600,transition:"color .15s, background .15s",
              minHeight:44,
            }}
          >
            <span aria-hidden="true" style={{position:"absolute",top:7,width:isActive?18:4,height:3,borderRadius:999,background:isActive?T.accentBright:T.border,opacity:isActive?1:.75,transition:"width .15s, background .15s"}} />
            <span style={{letterSpacing:"0.01em"}}>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ─── Button ────────────────────────────────────────────────────────────────
export function Btn({onClick,children,ghost,danger,disabled,ariaLabel,type="button"}){
  return (
    <ShadcnButton
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className="fx-btn min-h-11 rounded-full px-5 text-[13px] font-extrabold tracking-[0.01em]"
      variant={danger ? "destructive" : ghost ? "outline" : "default"}
      size="lg"
    >
      {children}
    </ShadcnButton>
  )
}

// ─── Card / Card title ─────────────────────────────────────────────────────
export function Card({T,children,style={},glow}){
  const brutal = !!T.hardShadow
  // For brutalist: caller's borderRadius/shadow are overridden so all cards stay consistent
  const brutalOverrides = brutal ? { borderRadius:3, border:`2px solid ${T.border}`, boxShadow:T.hardShadow } : {}
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      style={{
      background:T.surface,
      border:`1px solid ${T.border}`,
      borderRadius:20,
      padding:"20px 22px",
      boxShadow:glow?`0 16px 34px ${T.cardGlow}`:`0 8px 22px ${T.cardGlow}`,
      position:"relative",
      overflow:"hidden",
      ...style,
      ...brutalOverrides,
    }}>
      <div style={{position:"relative"}}>{children}</div>
    </motion.div>
  )
}

export function CardTitle({T,children,meta}) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:14}}>
      <div style={{fontFamily:"var(--font-geist-sans)",fontSize:11,fontWeight:900,color:T.muted,letterSpacing:"0.15em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}>{children}</div>
      {meta&&<div style={{fontSize:11,color:T.textDim,fontFamily:"var(--font-geist-sans)"}}>{meta}</div>}
    </div>
  )
}

// ─── Section leads / headers ───────────────────────────────────────────────
export function SectionLead({T,eyebrow,title,copy,action,compact}) {
  return (
    <div style={{display:"flex",alignItems:compact?"flex-start":"center",justifyContent:"space-between",gap:16,flexWrap:"wrap",marginBottom:compact?14:18}}>
      <div style={{maxWidth:620}}>
        {eyebrow&&<div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:7}}>{eyebrow}</div>}
        <h2 style={{fontFamily:"var(--font-geist-sans)",fontSize:compact?20:26,fontWeight:900,color:T.text,letterSpacing:"-0.055em",lineHeight:0.98,margin:0}}>{title}</h2>
        {copy&&<div style={{fontSize:13,color:T.textDim,marginTop:7,lineHeight:1.7}}>{copy}</div>}
      </div>
      {action&&<div style={{flexShrink:0}}>{action}</div>}
    </div>
  )
}

export function HeaderMeta({T,eyebrow,title,subtitle,actions}) {
  return (
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
      <div style={{minWidth:0}}>
        {eyebrow&&<div style={{fontSize:11,color:T.muted,letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>{eyebrow}</div>}
        <h1 style={{fontFamily:"var(--font-geist-sans)",fontSize:34,fontWeight:900,color:T.text,letterSpacing:"-0.06em",lineHeight:0.95,margin:0}}>{title}</h1>
        {subtitle&&<div style={{fontSize:13,color:T.textDim,marginTop:10,lineHeight:1.7,maxWidth:620}}>{subtitle}</div>}
      </div>
      {actions&&<div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>{actions}</div>}
    </div>
  )
}

// ─── Session pill / clock dropdown ────────────────────────────────────────
export function SessionPill({T,session,compact,mobile,open,onToggle}) {
  const isVoid = T.isDark && !T.hardShadow
  const tones = {
    overlap: { dot:T.amber, glow:`${T.amber}33`, bg:`${T.amber}16` },
    london:  { dot:T.accentBright, glow:`${T.accentBright}33`, bg:`${T.accent}16` },
    newyork: { dot:T.green, glow:`${T.green}33`, bg:`${T.green}14` },
    asian:   { dot:T.accentBright, glow:`${T.accentBright}33`, bg:`${T.accent}12` },
    closed:  { dot:T.textDim, glow:`${T.textDim}22`, bg:T.surface2 },
  }
  const tone = tones[session?.tone] || tones.closed
  const sessionCode = session?.label==="London / NY" ? "OVR" : session?.label==="New York" ? "NY" : session?.label==="Between Sessions" ? "OFF" : (session?.label || "SES").slice(0,3).toUpperCase()
  const panelStyle = mobile
    ? {position:"absolute",right:0,top:"calc(100% + 10px)",width:"min(320px, calc(100vw - 32px))"}
    : {position:"absolute",right:0,top:"calc(100% + 10px)",width:compact?260:320}
  return (
    <div style={{position:"relative"}}>
      <button
        onClick={onToggle}
        aria-label={`${session?.label} session. ${open?"Close":"Open"} session details`}
        aria-expanded={open}
        style={{minWidth:mobile?0:(compact?118:220),width:mobile?"100%":"auto",padding:mobile?"9px 10px":compact?"8px 10px":"10px 12px",borderRadius:isVoid?100:18,background:isVoid?"rgba(17,17,26,0.72)":tone.bg,border:`1px solid ${open?tone.dot:(isVoid?"rgba(255,255,255,0.1)":T.border)}`,display:"flex",alignItems:"center",gap:mobile?8:10,boxShadow:open?`0 18px 36px ${tone.glow}`:`0 10px 30px ${T.cardGlow}`,cursor:"pointer",textAlign:"left",position:"relative",backdropFilter:isVoid?"blur(20px)":undefined,WebkitBackdropFilter:isVoid?"blur(20px)":undefined}}
      >
        {session?.tone !== "closed" && !isVoid && (
          <span aria-label="Market open" style={{position:"absolute",top:-3,right:-3,width:9,height:9,borderRadius:"50%",background:tone.dot,border:`2px solid ${T.bg}`,animation:"livePulse 2s ease-in-out infinite",pointerEvents:"none"}}/>
        )}
        {session?.tone !== "closed" && isVoid && (
          <span aria-label="Market open" style={{position:"absolute",top:10,right:10,width:7,height:7,borderRadius:"50%",background:T.green,boxShadow:`0 0 0 4px ${T.green}18, 0 0 18px ${T.green}`,animation:"livePulse 2s ease-in-out infinite",pointerEvents:"none"}}/>
        )}
        <div style={{width:compact?28:34,height:compact?28:34,borderRadius:12,background:`${tone.dot}14`,border:`1px solid ${tone.dot}55`,display:"grid",placeItems:"center",flexShrink:0}}>
          <span style={{fontSize:compact?10:11,fontWeight:800,color:tone.dot,letterSpacing:"0.08em"}}>{sessionCode}</span>
        </div>
        <div style={{lineHeight:1.1,minWidth:0}}>
          {!compact&&<div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:5}}>Current Session</div>}
          <div style={{fontFamily:"var(--font-geist-sans)",fontSize:compact?14:16,fontWeight:900,color:T.text,letterSpacing:"-0.04em",whiteSpace:mobile?"normal":"nowrap"}}>{session?.label}</div>
          {!compact&&<div style={{fontSize:11,color:T.textDim,marginTop:4,whiteSpace:mobile?"normal":"nowrap"}}>{session?.detail} · Next {session?.nextLabel} in {session?.nextIn}</div>}
        </div>
        {!mobile&&<div style={{marginLeft:"auto",fontSize:11,color:T.textDim}}>{open?"Hide":"Open"}</div>}
      </button>
      {open&&(
        <div style={{...panelStyle,background:T.surface,border:`1px solid ${T.border}`,borderRadius:18,padding:"14px 14px 12px",boxShadow:`0 20px 44px ${T.bg}aa`,zIndex:60}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,gap:12}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:5}}>Session Pulse</div>
              <div style={{fontFamily:"var(--font-geist-sans)",fontSize:19,fontWeight:900,color:T.text,letterSpacing:"-0.04em"}}>{session?.label}</div>
            </div>
            <div style={{fontSize:12,color:T.textDim,textAlign:"right"}}>
              <div>{session?.detail}</div>
              <div style={{marginTop:4}}>Next {session?.nextLabel} in {session?.nextIn}</div>
            </div>
          </div>
          <div style={{display:"grid",gap:8}}>
            {session?.markets?.map(market=>(
              <div key={market.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,padding:"10px 12px",borderRadius:14,background:market.active?`${tone.dot}12`:T.surface,border:`1px solid ${market.active?`${tone.dot}55`:T.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:market.active?tone.dot:T.textDim,boxShadow:`0 0 0 4px ${market.active?tone.glow:`${T.textDim}14`}`}} aria-hidden="true" />
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:T.text}}>{market.label}</div>
                    <div style={{fontSize:11,color:T.textDim}}>{market.hours} local</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"var(--font-geist-sans)",fontSize:14,fontWeight:900,color:T.text,letterSpacing:"-0.03em"}}>{market.time}</div>
                  <div style={{fontSize:11,color:market.active?tone.dot:T.textDim}}>{market.active?"Live now":`Opens in ${market.opensIn}`}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────
export function EmptyState({T, title, copy, action, compact, icon}) {
  const iconEl = icon ?? "FX"
  const pad    = compact ? "24px 20px" : "40px 28px"
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: compact ? 14 : 18,
      padding: pad,
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{position:"relative"}}>
        {/* Icon */}
        <div aria-hidden="true" style={{
          display:"inline-flex",
          alignItems:"center",
          justifyContent:"center",
          minWidth: compact ? 34 : 40,
          height: compact ? 34 : 40,
          padding:"0 10px",
          borderRadius: 12,
          background: T.surface2,
          border:`1px solid ${T.border}`,
          color:T.accentBright,
          fontFamily:"'JetBrains Mono','Fira Code',monospace",
          fontSize: compact ? 12 : 13,
          fontWeight: 800,
          letterSpacing:"0.04em",
          marginBottom: compact ? 12 : 14,
        }}>{iconEl}</div>

        <div style={{
          fontFamily:"var(--font-geist-sans)",
          fontSize: compact ? 16 : 19,
          fontWeight: 800, color: T.text,
          marginBottom: 7, letterSpacing:"-0.025em",
        }}>{title}</div>

        <div style={{
          maxWidth: compact ? 400 : 500,
          margin:"0 auto", fontSize:13,
          color:T.textDim, lineHeight:1.6,
        }}>{copy}</div>

        {action && <div style={{marginTop:18}}>{action}</div>}
      </div>
    </div>
  )
}

// ─── Modal shell ───────────────────────────────────────────────────────────
export function ModalShell({T,title,subtitle,onClose,children,footer,width=640}) {
  return (
    <Overlay onClose={onClose}>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,width:`min(${width}px,calc(100vw - 24px))`,maxHeight:"min(88vh, 920px)",display:"flex",flexDirection:"column",boxShadow:`0 38px 100px ${T.bg}b8`,overflow:"hidden"}}>
        <div style={{padding:"20px 24px 17px",borderBottom:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:18}}>
          <div style={{minWidth:0}}>
            <div style={{fontFamily:"var(--font-geist-sans)",fontSize:22,fontWeight:900,color:T.text,letterSpacing:"-0.055em",lineHeight:1.02}}>{title}</div>
            {subtitle&&<div style={{fontSize:12,color:T.textDim,marginTop:8,lineHeight:1.55,maxWidth:520}}>{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="fx-btn"
            style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.textDim,cursor:"pointer",fontSize:16,width:38,height:38,borderRadius:13,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,lineHeight:1}}
          >×</button>
        </div>
        <div style={{padding:"22px 24px",overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:18,scrollbarGutter:"stable"}}>{children}</div>
        {footer&&<div style={{padding:"16px 24px",borderTop:`1px solid ${T.border}`,display:"flex",gap:10,background:T.surface,alignItems:"center",flexWrap:"wrap"}}>{footer}</div>}
      </div>
    </Overlay>
  )
}

// ─── Inline primitives ─────────────────────────────────────────────────────
export function Chip({T,active,onClick,children,ariaLabel}){
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className="fx-btn"
      style={{background:active?`${T.accent}18`:`${T.surface2}70`,border:`1px solid ${active?T.accentBright:T.border}`,color:active?T.accentBright:T.textDim,padding:"8px 14px",borderRadius:999,fontSize:12,fontWeight:active?800:700,cursor:"pointer",fontFamily:"var(--font-geist-sans)",transition:"background .15s, border-color .15s, color .15s",minHeight:40,boxShadow:"none"}}
    >{children}</button>
  )
}

export function Badge({color,children}){
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 9px",borderRadius:7,fontSize:11,fontWeight:700,letterSpacing:"0.04em",background:`${color}18`,color,border:`1px solid ${color}45`,boxShadow:`inset 0 1px 0 ${color}20`,whiteSpace:"nowrap"}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:color,flexShrink:0}} aria-hidden="true"/>
      {children}
    </span>
  )
}

export function Toggle({T,value,opts,onChange}){
  return (
    <div role="group" style={{display:"flex",gap:6,flexWrap:"wrap"}}>
      {opts.map(o=>(
        <button
          key={o.v||o}
          onClick={()=>onChange(o.v||o)}
          aria-pressed={(o.v||o)===value}
          className="fx-btn"
          style={{background:(o.v||o)===value?`${T.accent}18`:`${T.surface2}70`,border:`1px solid ${(o.v||o)===value?T.accentBright:T.border}`,color:(o.v||o)===value?T.accentBright:T.textDim,padding:"8px 13px",borderRadius:10,fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"var(--font-geist-sans)",minHeight:38,letterSpacing:"-0.01em"}}
        >{o.l||o}</button>
      ))}
    </div>
  )
}

export function Inp({T,type="text",label,...props}){
  return (
    <input
      type={type}
      aria-label={label}
      style={{background:`${T.surface2}cc`,border:`1px solid ${T.border}`,color:T.text,fontFamily:"var(--font-geist-sans)",fontSize:13,padding:"12px 13px",width:"100%",outline:"none",borderRadius:12,transition:"border .15s, box-shadow .15s, background .15s",minHeight:44,fontWeight:650}}
      onFocus={e=>{e.target.style.borderColor=T.accentBright;e.target.style.boxShadow=`0 0 0 3px ${T.accentBright}22`}}
      onBlur={e=>{e.target.style.borderColor=T.border;e.target.style.boxShadow="none"}}
      {...props}
    />
  )
}

export function Sel({T,val,opts,on,label}){
  return (
    <select
      value={val}
      onChange={e=>on(e.target.value)}
      aria-label={label}
      style={{background:`${T.surface2}cc`,border:`1px solid ${T.border}`,color:T.text,fontFamily:"var(--font-geist-sans)",fontSize:13,padding:"12px 13px",width:"100%",outline:"none",borderRadius:12,transition:"border .15s, box-shadow .15s, background .15s",minHeight:44,fontWeight:650}}
      onFocus={e=>{e.target.style.borderColor=T.accentBright;e.target.style.boxShadow=`0 0 0 3px ${T.accentBright}22`}}
      onBlur={e=>{e.target.style.borderColor=T.border;e.target.style.boxShadow="none"}}
    >
      {opts.map(o=><option key={o} style={{background:T.surface}}>{o}</option>)}
    </select>
  )
}

export function Textarea({T,...props}){
  return (
    <textarea
      style={{background:`${T.surface2}cc`,border:`1px solid ${T.border}`,color:T.text,fontFamily:"var(--font-geist-sans)",fontSize:13,padding:"12px 13px",width:"100%",outline:"none",borderRadius:12,resize:"vertical",transition:"border .15s, box-shadow .15s, background .15s",lineHeight:1.55,fontWeight:550}}
      onFocus={e=>{e.target.style.borderColor=T.accentBright;e.target.style.boxShadow=`0 0 0 3px ${T.accentBright}22`}}
      onBlur={e=>{e.target.style.borderColor=T.border;e.target.style.boxShadow="none"}}
      {...props}
    />
  )
}

export function FL({label,T,children,full}){return <div style={{gridColumn:full?"1/-1":"auto",minWidth:0}}><div style={{fontSize:10,fontWeight:850,color:T.textDim,marginBottom:7,letterSpacing:"0.08em",textTransform:"uppercase"}}>{label}</div>{children}</div>}
export function Section({T,title,children}){return <section><div style={{display:"flex",alignItems:"center",gap:10,fontSize:10,fontWeight:900,color:T.accentBright,letterSpacing:"0.16em",textTransform:"uppercase",paddingBottom:9,borderBottom:`1px solid ${T.border}`,marginBottom:14}}><span style={{width:6,height:6,borderRadius:"50%",background:T.accentBright,boxShadow:`0 0 0 4px ${T.accent}16`}} aria-hidden="true"/>{title}</div>{children}</section>}

// ─── Image compression (canvas → WebP, ~20-40x smaller, stays base64) ────
function compressImage(file, { maxW = 1280, maxH = 960, quality = 0.82 } = {}) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width, maxH / img.height)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        canvas.getContext("2d").drawImage(img, 0, 0, w, h)
        // Fall back to jpeg if WebP not supported
        const out = canvas.toDataURL("image/webp", quality)
        resolve(out.startsWith("data:image/webp") ? out : canvas.toDataURL("image/jpeg", quality))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })
}

// ─── Image input components ────────────────────────────────────────────────
export function PasteImageInput({T, value, onChange, label, disabled}) {
  const [pasting, setPasting] = useState(false)
  const ref = useRef(null)

  const handlePaste = useCallback((e) => {
    if(disabled) return
    const items = e.clipboardData?.items
    if(!items) return
    for(const item of items) {
      if(item.type.startsWith("image/")) {
        const file = item.getAsFile()
        e.preventDefault()
        setPasting(true)
        compressImage(file).then(src => { onChange(src); setPasting(false) })
        break
      }
    }
  }, [onChange, disabled])

  const handleFile = (e) => {
    if(disabled) return
    const file = e.target.files[0]
    if(!file) return
    setPasting(true)
    compressImage(file).then(src => { onChange(src); setPasting(false) })
  }

  const isLoading = disabled || pasting

  return (
    <div>
      <div
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label={`${label || "Chart"} — paste or upload image`}
        onPaste={handlePaste}
        ref={ref}
        style={{
          border:`1px dashed ${value ? T.accentBright : T.border}`,
          borderRadius:14, padding:value ? 8 : "18px 14px", textAlign:"center",
          cursor: disabled ? "wait" : "pointer",
          outline:"none", background:`${T.surface2}d8`, transition:"border .2s, box-shadow .2s, background .2s",
          opacity: disabled ? 0.6 : 1,
        }}
        onFocus={e=>{ if(!disabled){e.currentTarget.style.borderColor=T.accentBright;e.currentTarget.style.boxShadow=`0 0 0 3px ${T.accentBright}22`} }}
        onBlur={e=>{e.currentTarget.style.borderColor=value?T.accentBright:T.border;e.currentTarget.style.boxShadow="none"}}
      >
        {value ? (
          <div style={{position:"relative"}}>
            <img src={value} alt={label||"Chart screenshot"} loading="lazy" style={{width:"100%",maxHeight:220,objectFit:"cover",borderRadius:10,border:`1px solid ${T.border}`}}/>
            {!disabled && (
              <button
                onClick={()=>onChange("")}
                aria-label="Remove image"
                style={{position:"absolute",top:8,right:8,background:T.surface,border:`1px solid ${T.border}`,color:T.text,borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:13,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}
              >×</button>
            )}
          </div>
        ) : (
          <div style={{color:T.muted,fontSize:12}}>
            <div style={{fontSize:10,fontWeight:900,letterSpacing:"0.16em",marginBottom:8,color:T.accentBright}} aria-hidden="true">{isLoading ? "LOAD" : "CHART"}</div>
            <div style={{fontWeight:600,color:T.textDim,marginBottom:2}}>
              {isLoading ? "Reading chart…" : "Ctrl+V to paste"}
            </div>
            {!disabled && <div>or <label style={{color:T.accentBright,cursor:"pointer"}}><input type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/> browse file</label></div>}
          </div>
        )}
      </div>
    </div>
  )
}

export function MultiImageInput({T, values, onChange, label, max=6}) {
  const [pasting, setPasting] = useState(false)
  const images = normalizeImageList(values)

  const addImage = useCallback((src) => {
    if(!src) return
    const next = [...images, src].slice(0, max)
    onChange(next)
  }, [images, max, onChange])

  const removeImage = (index) => onChange(images.filter((_, i) => i!==index))

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items
    if(!items) return
    for(const item of items) {
      if(item.type.startsWith("image/")) {
        const file = item.getAsFile()
        e.preventDefault()
        setPasting(true)
        compressImage(file).then(src => { addImage(src); setPasting(false) })
        break
      }
    }
  }, [addImage])

  const handleFiles = (e) => {
    const files = Array.from(e.target.files||[])
    files.forEach(file => compressImage(file).then(addImage))
    e.target.value = ""
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div
        tabIndex={0}
        role="button"
        aria-label={`${label||"Screenshots"} — paste or upload. ${images.length} of ${max} added`}
        onPaste={handlePaste}
        style={{border:`1px dashed ${images.length?T.accentBright:T.border}`,borderRadius:14,padding:"18px 14px",textAlign:"center",outline:"none",background:`${T.surface2}d8`,transition:"border .2s, box-shadow .2s, background .2s"}}
        onFocus={e=>{e.currentTarget.style.borderColor=T.accentBright;e.currentTarget.style.boxShadow=`0 0 0 3px ${T.accentBright}22`}}
        onBlur={e=>{e.currentTarget.style.borderColor=images.length?T.accentBright:T.border;e.currentTarget.style.boxShadow="none"}}
      >
        <div style={{color:T.muted,fontSize:12}}>
          <div style={{fontSize:10,fontWeight:900,letterSpacing:"0.16em",color:T.accentBright,marginBottom:7}}>SCREENSHOTS</div>
          <div style={{fontWeight:750,color:T.textDim,marginBottom:4}}>{pasting?"Processing...":"Paste or upload screenshots"}</div>
          <div>{images.length}/{max} attached</div>
          <div style={{marginTop:6}}>or <label style={{color:T.accentBright,cursor:"pointer"}}><input type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleFiles}/> browse files</label></div>
        </div>
      </div>
      {images.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(136px,1fr))",gap:10}}>
          {images.map((src, index)=>(
            <div key={`${label}-${index}`} style={{position:"relative",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
              <img src={src} alt={`${label||"Screenshot"} ${index+1}`} loading="lazy" style={{width:"100%",height:108,objectFit:"cover"}}/>
              <button
                onClick={()=>removeImage(index)}
                aria-label={`Remove ${label||"screenshot"} ${index+1}`}
                style={{position:"absolute",top:7,right:7,background:T.surface,border:`1px solid ${T.border}`,color:T.text,borderRadius:999,width:30,height:30,cursor:"pointer",fontSize:12,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── usePasteImage hook ────────────────────────────────────────────────────
export function usePasteImage(onImage) {
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
