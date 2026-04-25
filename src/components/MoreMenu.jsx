"use client"
import { HeaderMeta } from "@/components/ui";

export default function MoreMenu({T, setTab, ALL_TABS}) {
  const extra = ALL_TABS.filter(t=>!["dashboard","journal","heatmap"].includes(t.id))
  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <HeaderMeta
        T={T}
        eyebrow="Workspace"
        title="All Sections"
        subtitle="Jump into the deeper tools, reviews, and utilities without losing your place."
      />
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
        {extra.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background:`linear-gradient(180deg,${T.surface},${T.surface2})`,border:`1px solid ${T.border}`,borderRadius:18,
            padding:"18px 16px",display:"flex",alignItems:"flex-start",gap:12,
            cursor:"pointer",textAlign:"left",transition:"border-color .15s, transform .15s, box-shadow .15s",
            boxShadow:`0 16px 40px ${T.cardGlow}`,
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accentBright;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 20px 50px ${T.cardGlow}`}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=`0 16px 40px ${T.cardGlow}`}}>
            <span style={{fontSize:26,lineHeight:1,marginTop:2}}>{t.icon}</span>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:700,color:T.text}}>{t.label}</div>
              <div style={{fontSize:12,color:T.textDim,lineHeight:1.5}}>
                {t.id==="daily"&&"Set your bias, levels, and session plan before the open."}
                {t.id==="analytics"&&"Break down performance trends, sessions, and setups."}
                {t.id==="missed"&&"Log setups you saw but didn't take — track your opportunity cost."}
                {t.id==="calendar"&&"High-impact economic events with live countdown and Prev/Fcst/Actual."}
                {t.id==="weekly"&&"Plan the week with clearer structure, bias, and focus."}
                {t.id==="mind"&&"Track psychology, mistakes, and emotional consistency."}
                {t.id==="playbook"&&"Turn your best setups into repeatable execution rules."}
                {t.id==="calculator"&&"Use quick risk sizing tools before you enter."}
                {t.id==="gallery"&&"Review your screenshot library in one clean place."}
                {t.id==="review"&&"Wrap the week with lessons, stats, and next focus."}
                {t.id==="ai"&&"Get journal feedback and coaching from your AI analyst."}
                {t.id==="export"&&"Download clean CSV snapshots of your trading data."}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
