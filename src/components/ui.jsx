"use client"
import { useState, useRef, useCallback, useEffect } from "react";
import { normalizeImageList } from "@/lib/utils";
import { DARK } from "@/lib/constants";

// ─── Spinner / Loading ─────────────────────────────────────────────────────
export function Spinner({T,label}) {
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

// ─── Overlay / Modal backdrop ──────────────────────────────────────────────
export function Overlay({onClose,children}){
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16,backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()}>{children}</div>
    </div>
  )
}

// ─── Tab panel (show/hide) ─────────────────────────────────────────────────
export function TabPanel({active,children}) {
  return (
    <div
      aria-hidden={!active}
      style={{
        display:active?"block":"none",
        minHeight:active?"auto":0,
        animation:active?"tabFadeIn .2s ease":"none",
      }}
    >
      {children}
    </div>
  )
}

// ─── Mobile bottom nav ─────────────────────────────────────────────────────
export function BottomNav({T,tab,setTab,TABS,MOBILE_PRIMARY}){
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

// ─── Button ────────────────────────────────────────────────────────────────
export function Btn({T,onClick,children,ghost,danger,disabled}){
  const bg = danger?T.red:ghost?"none":`linear-gradient(135deg,${T.accentBright},${T.pink})`
  return (
    <button disabled={disabled} onClick={onClick} style={{background:bg,color:ghost?T.textDim:"#fff",border:ghost?`1px solid ${T.border}`:"none",padding:"9px 18px",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:13,borderRadius:10,cursor:disabled?"not-allowed":"pointer",whiteSpace:"nowrap",opacity:disabled?0.6:1}}>
      {children}
    </button>
  )
}

// ─── Card / Card title ─────────────────────────────────────────────────────
export function Card({T,children,style={},glow}){
  return <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px 20px",boxShadow:glow?`0 4px 30px ${T.cardGlow}`:"none",...style}}>{children}</div>
}

export function CardTitle({T,children,meta}) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:14}}>
      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}}>{children}</div>
      {meta&&<div style={{fontSize:11,color:T.textDim}}>{meta}</div>}
    </div>
  )
}

// ─── Section leads / headers ───────────────────────────────────────────────
export function SectionLead({T,eyebrow,title,copy,action,compact}) {
  return (
    <div style={{display:"flex",alignItems:compact?"flex-start":"center",justifyContent:"space-between",gap:16,flexWrap:"wrap",marginBottom:compact?14:18}}>
      <div style={{maxWidth:620}}>
        {eyebrow&&<div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:7}}>{eyebrow}</div>}
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:compact?18:22,fontWeight:800,color:T.text,letterSpacing:"-0.04em",lineHeight:1.04}}>{title}</div>
        {copy&&<div style={{fontSize:12,color:T.textDim,marginTop:7,lineHeight:1.7}}>{copy}</div>}
      </div>
      {action&&<div style={{flexShrink:0}}>{action}</div>}
    </div>
  )
}

export function HeaderMeta({T,eyebrow,title,subtitle,actions}) {
  return (
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
      <div style={{minWidth:0}}>
        {eyebrow&&<div style={{fontSize:10,color:T.muted,letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>{eyebrow}</div>}
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:28,fontWeight:800,color:T.text,letterSpacing:"-0.04em",lineHeight:1}}>{title}</div>
        {subtitle&&<div style={{fontSize:13,color:T.textDim,marginTop:10,lineHeight:1.7,maxWidth:620}}>{subtitle}</div>}
      </div>
      {actions&&<div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>{actions}</div>}
    </div>
  )
}

// ─── Session pill / clock dropdown ────────────────────────────────────────
export function SessionPill({T,session,compact,mobile,open,onToggle}) {
  const tones = {
    overlap: { dot:"#f59e0b", glow:"#f59e0b33", bg:`linear-gradient(135deg,${T.amber}22,${T.pink}14)` },
    london:  { dot:T.accentBright, glow:`${T.accentBright}33`, bg:`linear-gradient(135deg,${T.accent}22,${T.pink}12)` },
    newyork: { dot:T.green, glow:`${T.green}33`, bg:`linear-gradient(135deg,${T.green}18,${T.accent}10)` },
    asian:   { dot:"#38bdf8", glow:"#38bdf833", bg:`linear-gradient(135deg,#38bdf824,${T.accent}10)` },
    closed:  { dot:T.textDim, glow:`${T.textDim}22`, bg:`linear-gradient(135deg,${T.surface2},${T.surface})` },
  }
  const tone = tones[session?.tone] || tones.closed
  const sessionCode = session?.label==="London / NY" ? "OVR" : session?.label==="New York" ? "NY" : session?.label==="Between Sessions" ? "OFF" : (session?.label || "SES").slice(0,3).toUpperCase()
  const panelStyle = mobile
    ? {position:"absolute",right:0,top:"calc(100% + 10px)",width:"min(320px, calc(100vw - 32px))"}
    : {position:"absolute",right:0,top:"calc(100% + 10px)",width:compact?260:320}
  return (
    <div style={{position:"relative"}}>
      <button onClick={onToggle} title={`${session?.label} live. Next ${session?.nextLabel} in ${session?.nextIn}`} style={{minWidth:mobile?0:(compact?118:220),width:mobile?"100%":"auto",padding:mobile?"9px 10px":compact?"8px 10px":"10px 12px",borderRadius:18,background:tone.bg,border:`1px solid ${open?tone.dot:T.border}`,display:"flex",alignItems:"center",gap:mobile?8:10,boxShadow:open?`0 18px 36px ${tone.glow}`:`0 10px 30px ${T.cardGlow}`,cursor:"pointer",textAlign:"left"}}>
        <div style={{width:compact?28:34,height:compact?28:34,borderRadius:12,background:`linear-gradient(135deg,${tone.dot}30,${tone.dot}12)`,border:`1px solid ${tone.dot}55`,display:"grid",placeItems:"center",flexShrink:0}}>
          <span style={{fontSize:compact?10:11,fontWeight:800,color:tone.dot,letterSpacing:"0.08em"}}>{sessionCode}</span>
        </div>
        <div style={{lineHeight:1.1,minWidth:0}}>
          {!compact&&<div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:5}}>Current Session</div>}
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:compact?13:15,fontWeight:800,color:T.text,letterSpacing:"-0.03em",whiteSpace:mobile?"normal":"nowrap"}}>{session?.label}</div>
          {!compact&&<div style={{fontSize:11,color:T.textDim,marginTop:4,whiteSpace:mobile?"normal":"nowrap"}}>{session?.detail} · Next {session?.nextLabel} in {session?.nextIn}</div>}
        </div>
        {!mobile&&<div style={{marginLeft:"auto",fontSize:11,color:T.textDim}}>{open?"Hide":"Open"}</div>}
      </button>
      {open&&(
        <div style={{...panelStyle,background:`linear-gradient(180deg,${T.surface},${T.surface2})`,border:`1px solid ${T.border}`,borderRadius:18,padding:"14px 14px 12px",boxShadow:`0 24px 60px ${T.bg}aa`,zIndex:60}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,gap:12}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:5}}>Session Pulse</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:17,fontWeight:800,color:T.text}}>{session?.label}</div>
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
                  <span style={{width:8,height:8,borderRadius:"50%",background:market.active?tone.dot:T.textDim,boxShadow:`0 0 0 4px ${market.active?tone.glow:`${T.textDim}14`}`}} />
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:T.text}}>{market.label}</div>
                    <div style={{fontSize:11,color:T.textDim}}>{market.hours} local</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,fontWeight:800,color:T.text}}>{market.time}</div>
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
export function EmptyState({T,title,copy,action,compact}) {
  return (
    <div style={{background:`linear-gradient(180deg,${T.surface} 0%,${T.surface2} 100%)`,border:`1px dashed ${T.border}`,borderRadius:compact?18:22,padding:compact?"28px 20px":"44px 28px",textAlign:"center",boxShadow:`inset 0 18px 40px ${T.bg}40`,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-36,left:"50%",transform:"translateX(-50%)",width:compact?120:160,height:compact?120:160,borderRadius:"50%",background:`radial-gradient(circle, ${T.accent}18 0%, transparent 70%)`,pointerEvents:"none"}} />
      <div style={{position:"relative"}}>
        <div style={{width:compact?42:50,height:compact?42:50,borderRadius:16,margin:"0 auto 14px",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${T.accent}18,${T.pink}14)`,border:`1px solid ${T.accent}26`,fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,color:T.accentBright,fontSize:compact?13:15,boxShadow:`0 12px 28px ${T.cardGlow}`}}>FX</div>
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:compact?20:24,fontWeight:800,color:T.text,marginBottom:10,letterSpacing:"-0.03em"}}>{title}</div>
        <div style={{maxWidth:compact?420:520,margin:"0 auto",fontSize:13,color:T.textDim,lineHeight:1.7}}>{copy}</div>
        {action&&<div style={{marginTop:20}}>{action}</div>}
      </div>
    </div>
  )
}

// ─── Modal shell ───────────────────────────────────────────────────────────
export function ModalShell({T,title,subtitle,onClose,children,footer,width=640}) {
  return (
    <Overlay onClose={onClose}>
      <div style={{background:`linear-gradient(180deg,${T.surface} 0%,${T.surface2} 100%)`,border:`1px solid ${T.border}`,borderRadius:22,width:`min(${width}px,96vw)`,maxHeight:"92vh",display:"flex",flexDirection:"column",boxShadow:`0 36px 80px ${T.bg}a0`,overflow:"hidden"}}>
        <div style={{padding:"20px 24px 18px",borderBottom:`1px solid ${T.border}`,background:`linear-gradient(180deg,${T.surface} 0%,${T.surface}dd 100%)`,display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16}}>
          <div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:22,fontWeight:800,color:T.text,letterSpacing:"-0.04em",lineHeight:1.05}}>{title}</div>
            {subtitle&&<div style={{fontSize:12,color:T.textDim,marginTop:8,lineHeight:1.6,maxWidth:420}}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.textDim,cursor:"pointer",fontSize:18,width:34,height:34,borderRadius:12,flexShrink:0}}>×</button>
        </div>
        <div style={{padding:"20px 22px",overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:16}}>{children}</div>
        {footer&&<div style={{padding:"15px 22px",borderTop:`1px solid ${T.border}`,display:"flex",gap:10,background:`linear-gradient(180deg,${T.surface}ee 0%,${T.surface2} 100%)`}}>{footer}</div>}
      </div>
    </Overlay>
  )
}

// ─── Inline primitives ─────────────────────────────────────────────────────
export function Chip({T,active,onClick,children}){return <button onClick={onClick} style={{background:active?`${T.accent}20`:"none",border:`1px solid ${active?T.accentBright:T.border}`,color:active?T.accentBright:T.textDim,padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:active?700:400,cursor:"pointer",fontFamily:"Inter,sans-serif",transition:"all .15s"}}>{children}</button>}
export function Badge({color,children}){return <span style={{display:"inline-block",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700,background:`${color}20`,color,border:`1px solid ${color}40`}}>{children}</span>}
export function Toggle({T,value,opts,onChange}){return <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{opts.map(o=><button key={o.v||o} onClick={()=>onChange(o.v||o)} style={{background:(o.v||o)===value?`${T.accentBright}25`:"none",border:`1px solid ${(o.v||o)===value?T.accentBright:T.border}`,color:(o.v||o)===value?T.accentBright:T.textDim,padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}>{o.l||o}</button>)}</div>}
export function Inp({T,type="text",...props}){return <input type={type} style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.text,fontFamily:"Inter,sans-serif",fontSize:13,padding:"9px 12px",width:"100%",outline:"none",borderRadius:10,transition:"border .15s"}} onFocus={e=>e.target.style.borderColor=T.accentBright} onBlur={e=>e.target.style.borderColor=T.border} {...props}/>}
export function Sel({T,val,opts,on}){return <select value={val} onChange={e=>on(e.target.value)} style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.text,fontFamily:"Inter,sans-serif",fontSize:13,padding:"9px 12px",width:"100%",outline:"none",borderRadius:10}}>{opts.map(o=><option key={o} style={{background:T.surface}}>{o}</option>)}</select>}
export function Textarea({T,...props}){return <textarea style={{background:T.surface2,border:`1px solid ${T.border}`,color:T.text,fontFamily:"Inter,sans-serif",fontSize:13,padding:"9px 12px",width:"100%",outline:"none",borderRadius:10,resize:"vertical"}} onFocus={e=>e.target.style.borderColor=T.accentBright} onBlur={e=>e.target.style.borderColor=T.border} {...props}/>}
export function FL({label,T,children,full}){return <div style={{gridColumn:full?"1/-1":"auto"}}><div style={{fontSize:11,fontWeight:600,color:T.textDim,marginBottom:6}}>{label}</div>{children}</div>}
export function Section({T,title,children}){return <div><div style={{fontSize:11,fontWeight:700,color:T.accentBright,letterSpacing:"0.12em",textTransform:"uppercase",paddingBottom:8,borderBottom:`1px solid ${T.border}`,marginBottom:12}}>{title}</div>{children}</div>}

// ─── Image input components ────────────────────────────────────────────────
export function PasteImageInput({T, value, onChange, label}) {
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
            <button onClick={()=>onChange("")} style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,.7)",border:"none",color:"#fff",borderRadius:"50%",width:24,height:24,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
        ) : (
          <div style={{color:T.muted,fontSize:12}}>
            <div style={{fontSize:24,marginBottom:6}}>🖼</div>
            <div style={{fontWeight:600,color:T.textDim,marginBottom:2}}>{pasting?"Processing...":"Ctrl+V to paste"}</div>
            <div>or <label style={{color:T.accentBright,cursor:"pointer"}}><input type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/> browse file</label></div>
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
        const reader = new FileReader()
        reader.onload = ev => { addImage(ev.target.result); setPasting(false) }
        reader.readAsDataURL(file)
        e.preventDefault()
        setPasting(true)
        break
      }
    }
  }, [addImage])

  const handleFiles = (e) => {
    const files = Array.from(e.target.files||[])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => addImage(ev.target.result)
      reader.readAsDataURL(file)
    })
    e.target.value = ""
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div
        tabIndex={0}
        onPaste={handlePaste}
        style={{border:`2px dashed ${images.length?T.accentBright:T.border}`,borderRadius:12,padding:"14px",textAlign:"center",outline:"none",background:T.surface2,transition:"border .2s"}}
        onFocus={e=>e.currentTarget.style.borderColor=T.accentBright}
        onBlur={e=>e.currentTarget.style.borderColor=images.length?T.accentBright:T.border}
      >
        <div style={{color:T.muted,fontSize:12}}>
          <div style={{fontWeight:700,color:T.textDim,marginBottom:4}}>{pasting?"Processing...":"Paste or upload screenshots"}</div>
          <div>{images.length}/{max} added</div>
          <div style={{marginTop:6}}>or <label style={{color:T.accentBright,cursor:"pointer"}}><input type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleFiles}/> browse files</label></div>
        </div>
      </div>
      {images.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:10}}>
          {images.map((src, index)=>(
            <div key={`${label}-${index}`} style={{position:"relative",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
              <img src={src} alt={`${label} ${index+1}`} style={{width:"100%",height:100,objectFit:"cover"}}/>
              <button onClick={()=>removeImage(index)} style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,.7)",border:"none",color:"#fff",borderRadius:999,width:22,height:22,cursor:"pointer",fontSize:12,fontWeight:700}}>×</button>
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
