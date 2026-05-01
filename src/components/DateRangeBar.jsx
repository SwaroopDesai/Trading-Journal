"use client"

const PRESETS = [
  { id: "all", label: "All" },
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "3m", label: "3M" },
  { id: "6m", label: "6M" },
  { id: "1y", label: "1Y" },
]

export default function DateRangeBar({ T, value, onChange, count, total }) {
  const isFiltered = value !== "all";

  return (
    <div
      className="date-range-bar"
      style={{
        borderBottom: `1px solid ${T.border}`,
        background: T.bg,
        padding: "8px 24px",
      }}
    >
      <div style={{
        maxWidth: 1800,
        margin: 0,
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}>
        <span style={{
          color: T.muted,
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}>
          Period
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            border: `1px solid ${T.border}`,
            background: T.surface,
            borderRadius: 999,
            padding: 3,
          }}
        >
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className="fx-btn"
              style={{
                color: value === p.id ? "#fff" : T.textDim,
                background: value === p.id ? T.accent : "transparent",
                border: "none",
                borderRadius: 999,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: 11,
                fontWeight: 850,
                minHeight: 28,
                minWidth: 38,
                padding: "4px 10px",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        {isFiltered && (
          <div style={{ color: T.textDim, fontSize: 11, fontWeight: 700 }}>
            {count}/{total} trades
          </div>
        )}
      </div>
    </div>
  )
}
