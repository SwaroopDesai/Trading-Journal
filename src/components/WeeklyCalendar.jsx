"use client"
import { useMemo } from "react";

// ── helpers ───────────────────────────────────────────────────────────────────
function startOfDay(d) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x;
}

function addDays(d, n) {
  const x = new Date(d); x.setDate(x.getDate() + n); return x;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_LABELS = ["M","","W","","F","","S"]; // Mon=0..Sun=6

function cellColor(r, T) {
  if (r === null) return T.surface2;
  if (r >  1)  return T.green;
  if (r >  0)  return `${T.green}77`;
  if (r < -1)  return T.red;
  if (r <  0)  return `${T.red}77`;
  return T.border; // exactly 0
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function WeeklyCalendar({ T, trades }) {
  // Build a map: "YYYY-MM-DD" → { r: sumR, n: count }
  const dayMap = useMemo(() => {
    const m = {};
    trades.forEach(t => {
      if (!t.date) return;
      const key = t.date.slice(0, 10);
      if (!m[key]) m[key] = { r: 0, n: 0 };
      m[key].r += t.rr || 0;
      m[key].n += 1;
    });
    return m;
  }, [trades]);

  // Build 12-week grid ending today (Mon-aligned)
  const WEEKS = 14;
  const today = startOfDay(new Date());
  // Find Monday of current week
  const todayDow = (today.getDay() + 6) % 7; // Mon=0
  const gridEnd  = addDays(today, 6 - todayDow); // last Sunday of current week
  const gridStart = addDays(gridEnd, -(WEEKS * 7 - 1));

  // weeks[col][row] = Date | null
  const weeks = useMemo(() => {
    const cols = [];
    let cur = new Date(gridStart);
    for (let w = 0; w < WEEKS; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        col.push(new Date(cur));
        cur = addDays(cur, 1);
      }
      cols.push(col);
    }
    return cols;
  }, []);

  // Month labels: show month name at the first week it appears
  const monthLabels = useMemo(() => {
    const labels = [];
    weeks.forEach((col, wi) => {
      const m = col[0].getMonth();
      const prev = wi > 0 ? weeks[wi-1][0].getMonth() : -1;
      if (m !== prev) labels.push({ wi, label: MONTHS[m] });
    });
    return labels;
  }, [weeks]);

  const CELL = 14, GAP = 3;
  const colW = CELL + GAP;
  const svgW = WEEKS * colW - GAP + 28; // +28 for day labels on left
  const svgH = 7 * colW - GAP + 20;     // +20 for month labels on top

  const LABEL_X = 22;
  const GRID_X  = 28;
  const GRID_Y  = 18;

  if (!trades.length) return null;

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 16, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.accentBright, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Daily P&L Calendar
        </div>
      </div>

      <div style={{ padding: "16px 18px", overflowX: "auto" }}>
        <svg width={svgW} height={svgH} style={{ display: "block", minWidth: svgW }}>

          {/* Month labels */}
          {monthLabels.map(({ wi, label }) => (
            <text key={wi} x={GRID_X + wi * colW} y={12}
              fontSize="9" fontWeight="700" fill={T.muted}
              fontFamily="Inter,sans-serif" letterSpacing="0.06em">
              {label}
            </text>
          ))}

          {/* Day labels */}
          {DAY_LABELS.map((lbl, di) => lbl && (
            <text key={di} x={LABEL_X} y={GRID_Y + di * colW + CELL * 0.75}
              fontSize="9" fontWeight="600" fill={T.muted}
              fontFamily="Inter,sans-serif" textAnchor="end">
              {lbl}
            </text>
          ))}

          {/* Cells */}
          {weeks.map((col, wi) =>
            col.map((date, di) => {
              const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
              const entry = dayMap[key] || null;
              const r = entry ? +entry.r.toFixed(2) : null;
              const n = entry ? entry.n : 0;
              const isFuture = date > today;
              const col_  = isFuture ? "transparent" : cellColor(r, T);
              const title = isFuture ? "" :
                r !== null
                  ? `${date.toDateString()} · ${r >= 0 ? "+" : ""}${r}R (${n} trade${n !== 1 ? "s" : ""})`
                  : `${date.toDateString()} · No trades`;
              return (
                <rect
                  key={key}
                  x={GRID_X + wi * colW}
                  y={GRID_Y + di * colW}
                  width={CELL} height={CELL}
                  rx={3}
                  fill={col_}
                  stroke={isFuture ? "none" : `${T.border}80`}
                  strokeWidth="0.5"
                >
                  <title>{title}</title>
                </rect>
              );
            })
          )}
        </svg>

        {/* Legend */}
        <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
          {[
            { col: T.green,           label: ">+1R" },
            { col: `${T.green}77`,    label: "0 – +1R" },
            { col: T.border,          label: "Breakeven" },
            { col: `${T.red}77`,      label: "0 – -1R" },
            { col: T.red,             label: "<-1R" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: T.textDim }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: l.col, border: `1px solid ${T.border}`, display: "inline-block" }}/>
              {l.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
