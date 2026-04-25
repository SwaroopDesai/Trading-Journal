"use client"

const PRESETS = [
  { id: "all", label: "All" },
  { id: "7d",  label: "7D"  },
  { id: "30d", label: "30D" },
  { id: "3m",  label: "3M"  },
  { id: "6m",  label: "6M"  },
  { id: "1y",  label: "1Y"  },
]

export default function DateRangeBar({ T, value, onChange, count, total }) {
  return (
    <div className="date-range-bar" style={{
      display:"flex", alignItems:"center", gap:10, flexWrap:"wrap",
      padding:"8px 28px", borderBottom:`1px solid ${T.border}`,
      background:T.surface,
    }}>
      <span style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.12em",textTransform:"uppercase",flexShrink:0}}>
        Period
      </span>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className="fx-btn"
            style={{
              padding:"3px 11px",
              borderRadius:999,
              fontSize:11,
              fontWeight:700,
              border:`1px solid ${value===p.id ? T.accentBright : T.border}`,
              background: value===p.id ? `${T.accent}22` : "transparent",
              color: value===p.id ? T.accentBright : T.textDim,
              cursor:"pointer",
              transition:"all .15s",
              minHeight:26,
              letterSpacing:"0.05em",
              fontFamily:"Inter,sans-serif",
            }}
          >{p.label}</button>
        ))}
      </div>
      {value !== "all" && (
        <span style={{fontSize:11,color:T.textDim,marginLeft:4}}>
          {count} trade{count !== 1 ? "s" : ""} · {total - count} outside range
        </span>
      )}
    </div>
  )
}
