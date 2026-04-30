"use client"

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

// Build a year → month → totalR map from trades
function buildMonthlyMap(trades) {
  const map = {}
  trades.forEach(t => {
    if (!t.date) return
    const d = new Date(t.date)
    if (isNaN(d)) return
    const y = d.getFullYear()
    const m = d.getMonth() // 0-indexed
    const r = Number(t.rr) || 0
    if (!map[y]) map[y] = {}
    map[y][m] = (map[y][m] || 0) + r
  })
  return map
}

// Map R value to a color
function cellColor(r, maxAbs, T) {
  if (r === undefined || r === null) return "transparent"
  if (Math.abs(r) < 0.01) return T.surface2
  const intensity = Math.min(Math.abs(r) / Math.max(maxAbs, 1), 1)
  const hex = Math.round(intensity * 200).toString(16).padStart(2, "0")
  return r > 0 ? `${T.green}${hex}` : `${T.red}${hex}`
}

export default function MonthlyReturns({ T, trades = [], compact = false }) {
  const map = buildMonthlyMap(trades)
  const years = Object.keys(map).map(Number).sort((a, b) => b - a)

  if (!years.length) return null

  // Find max abs R for color scaling
  let maxAbs = 0
  years.forEach(y => {
    MONTHS.forEach((_, m) => {
      const v = map[y]?.[m]
      if (v !== undefined) maxAbs = Math.max(maxAbs, Math.abs(v))
    })
  })

  const latestYear = years[0]

  if (compact && latestYear) {
    const yearTotal = MONTHS.reduce((acc, _, m) => acc + (map[latestYear]?.[m] || 0), 0)
    return (
      <div style={{
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        background: T.surface,
        padding: "12px 14px",
        overflow: "hidden",
        height: "100%",
        minHeight: 216,
        display: "flex",
        flexDirection: "column",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "baseline",
          marginBottom: 12,
        }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: T.muted,
              letterSpacing: "0.1em", textTransform: "uppercase",
              marginBottom: 4,
            }}>Monthly Heatmap</div>
            <div style={{ fontSize: 11, color: T.textDim }}>{latestYear}</div>
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: 16,
            fontWeight: 800,
            color: yearTotal >= 0 ? T.green : T.red,
            letterSpacing: "-0.04em",
          }}>{yearTotal >= 0 ? "+" : ""}{yearTotal.toFixed(1)}R</div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,minmax(0,1fr))",
          gap: 6,
          flex: 1,
          alignContent: "start",
        }}>
          {MONTHS.map((month, m) => {
            const v = map[latestYear]?.[m]
            const bg = cellColor(v, maxAbs, T)
            const active = v !== undefined
            return (
              <div key={month} style={{
                minHeight: 38,
                borderRadius: 8,
                background: active ? bg : T.surface2,
                border: `1px solid ${active ? (v >= 0 ? `${T.green}33` : `${T.red}33`) : T.border}`,
                padding: "6px 7px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 4,
              }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: T.textDim, letterSpacing: "0.05em" }}>{month}</span>
                <span style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: 10,
                  fontWeight: 800,
                  color: active ? (v >= 0 ? T.green : T.red) : T.muted,
                }}>
                  {active ? (v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1)) : "-"}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      borderRadius: 14,
      border: `1px solid ${T.border}`,
      background: T.surface,
      padding: "12px 14px",
      overflow: "hidden",
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: T.muted,
        letterSpacing: "0.1em", textTransform: "uppercase",
        marginBottom: 10,
      }}>Monthly Returns</div>

      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%", borderCollapse: "separate",
          borderSpacing: "3px", minWidth: 380,
          tableLayout: "fixed",
        }}>
          <thead>
            <tr>
              <th style={{
                width: 36, fontSize: 9, fontWeight: 700,
                color: T.muted, textAlign: "left",
                paddingBottom: 4, letterSpacing: "0.06em",
              }}>YEAR</th>
              {MONTHS.map(m => (
                <th key={m} style={{
                  fontSize: 9, fontWeight: 700, color: T.muted,
                  textAlign: "center", paddingBottom: 4,
                  letterSpacing: "0.04em",
                }}>{m}</th>
              ))}
              <th style={{
                width: 36, fontSize: 9, fontWeight: 700,
                color: T.muted, textAlign: "right",
                paddingBottom: 4, letterSpacing: "0.04em",
              }}>TOT</th>
            </tr>
          </thead>
          <tbody>
            {years.map(y => {
              const yearTotal = MONTHS.reduce((acc, _, m) => acc + (map[y]?.[m] || 0), 0)
              return (
                <tr key={y}>
                  <td style={{
                    fontSize: 10, fontWeight: 700,
                    color: T.textDim, paddingRight: 4,
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  }}>{y}</td>
                  {MONTHS.map((_, m) => {
                    const v = map[y]?.[m]
                    const bg = cellColor(v, maxAbs, T)
                    const textColor = v !== undefined && Math.abs(v) > maxAbs * 0.25
                      ? (v > 0 ? T.green : T.red)
                      : T.textDim
                    return (
                      <td key={m} style={{
                        height: 26,
                        background: bg,
                        borderRadius: 4,
                        textAlign: "center",
                        verticalAlign: "middle",
                        fontSize: 9,
                        fontWeight: 700,
                        color: v !== undefined ? textColor : T.muted,
                        fontFamily: "'JetBrains Mono','Fira Code',monospace",
                        letterSpacing: "-0.02em",
                        border: `1px solid ${T.border}30`,
                        cursor: v !== undefined ? "default" : "default",
                        transition: "background 0.15s",
                      }}>
                        {v !== undefined
                          ? (v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1))
                          : <span style={{ opacity: 0.2 }}>·</span>
                        }
                      </td>
                    )
                  })}
                  <td style={{
                    textAlign: "right",
                    fontSize: 10,
                    fontWeight: 700,
                    color: yearTotal >= 0 ? T.green : T.red,
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                    letterSpacing: "-0.02em",
                    paddingLeft: 6,
                  }}>
                    {yearTotal >= 0 ? `+${yearTotal.toFixed(1)}` : yearTotal.toFixed(1)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginTop: 8, justifyContent: "flex-end",
      }}>
        <span style={{ fontSize: 9, color: T.muted }}>Loss</span>
        {[0.15, 0.3, 0.5, 0.7, 0.9].map(f => (
          <div key={f} style={{
            width: 14, height: 10, borderRadius: 2,
            background: `${T.red}${Math.round(f * 200).toString(16).padStart(2,"0")}`,
          }}/>
        ))}
        <div style={{ width: 14, height: 10, borderRadius: 2, background: T.surface2, border: `1px solid ${T.border}` }}/>
        {[0.15, 0.3, 0.5, 0.7, 0.9].map(f => (
          <div key={f} style={{
            width: 14, height: 10, borderRadius: 2,
            background: `${T.green}${Math.round(f * 200).toString(16).padStart(2,"0")}`,
          }}/>
        ))}
        <span style={{ fontSize: 9, color: T.muted }}>Win</span>
      </div>
    </div>
  )
}
