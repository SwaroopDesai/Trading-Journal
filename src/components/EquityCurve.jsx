"use client"
import { useState, useRef, useCallback, useEffect } from "react";
import { fmtDate, fmtRR } from "@/lib/utils";

// ─── Time range filter ─────────────────────────────────────────────────────
const RANGES = [
  { id:"all", label:"All" },
  { id:"7d",  label:"7D"  },
  { id:"30d", label:"30D" },
  { id:"90d", label:"90D" },
  { id:"6m",  label:"6M"  },
  { id:"1y",  label:"1Y"  },
];

function filterByRange(data, range) {
  if(range === "all" || !data.length) return data;
  const now = new Date();
  const cutoff = new Date(now);
  if(range === "7d")  cutoff.setDate(now.getDate() - 7);
  if(range === "30d") cutoff.setDate(now.getDate() - 30);
  if(range === "90d") cutoff.setDate(now.getDate() - 90);
  if(range === "6m")  cutoff.setMonth(now.getMonth() - 6);
  if(range === "1y")  cutoff.setFullYear(now.getFullYear() - 1);
  const filtered = data.filter(d => d.date && new Date(d.date) >= cutoff);
  if(!filtered.length) return data; // fallback to all if range has no data
  // Recompute cumulative R from scratch for filtered window
  let cum = 0;
  return filtered.map(d => { cum += d.rr || 0; return { ...d, r: cum }; });
}

// ─── Smooth bezier path builder ────────────────────────────────────────────
function buildSmoothPath(points) {
  if(points.length < 2) return points.length === 1 ? `M ${points[0].x} ${points[0].y}` : "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for(let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

// ─── Main component ────────────────────────────────────────────────────────
export default function EquityCurve({ T, data = [] }) {
  const [range, setRange] = useState("all");
  const [tooltip, setTooltip] = useState(null); // { x, y, point, index }
  const svgRef = useRef(null);

  const filtered = filterByRange(data, range);

  // ── Compute stats ──────────────────────────────────────────────────────
  const netPL    = filtered.length ? filtered[filtered.length - 1].r : 0;
  const peak     = filtered.length ? Math.max(...filtered.map(d => d.r)) : 0;
  const trough   = filtered.length ? Math.min(...filtered.map(d => d.r)) : 0;
  let   peakSoFar = -Infinity, maxDD = 0;
  filtered.forEach(d => {
    peakSoFar = Math.max(peakSoFar, d.r);
    maxDD = Math.min(maxDD, d.r - peakSoFar);
  });

  const stats = [
    { label:"NET P&L",  value:fmtRR(netPL),  tone: netPL  >= 0 ? T.green : T.red },
    { label:"PEAK",     value:fmtRR(peak),   tone: T.green },
    { label:"TROUGH",   value:fmtRR(trough), tone: trough < 0 ? T.red : T.textDim },
    { label:"MAX DD",   value:fmtRR(maxDD),  tone: maxDD  < 0 ? T.red : T.textDim },
  ];

  // ── SVG layout ─────────────────────────────────────────────────────────
  const W = 1000, H = 280;
  const padL = 6, padR = 6, padTop = 24, padBot = 36;
  const chartW = W - padL - padR;
  const chartH = H - padTop - padBot;

  const allR = filtered.map(d => d.r);
  const minR = filtered.length ? Math.min(0, ...allR) : 0;
  const maxR = filtered.length ? Math.max(0, ...allR) : 1;
  const rng  = maxR - minR || 1;

  const px = i => padL + (i / Math.max(filtered.length - 1, 1)) * chartW;
  const py = v => padTop + chartH - ((v - minR) / rng) * chartH;
  const zeroY = py(0);

  const pts = filtered.map((d, i) => ({ x: px(i), y: py(d.r), ...d, index: i }));
  const linePath  = buildSmoothPath(pts);
  const areaPath  = pts.length > 1
    ? `${linePath} L ${pts[pts.length-1].x} ${zeroY} L ${pts[0].x} ${zeroY} Z`
    : "";

  const endPt  = pts[pts.length - 1];
  const lineCol = netPL >= 0 ? T.green : T.red;

  // ── Gridlines (4 horizontal) ───────────────────────────────────────────
  const gridYs = [0.2, 0.4, 0.6, 0.8].map(f => padTop + chartH * f);

  // ── Hover handler ──────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if(!svgRef.current || !filtered.length) return;
    const rect  = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * W;
    const idx   = Math.round((mouseX - padL) / (chartW / Math.max(filtered.length - 1, 1)));
    const clamped = Math.max(0, Math.min(filtered.length - 1, idx));
    const pt = pts[clamped];
    if(pt) {
      const svgPxX = (pt.x / W) * rect.width + rect.left;
      const svgPxY = (pt.y / H) * rect.height + rect.top;
      setTooltip({ svgX: pt.x, svgY: pt.y, point: filtered[clamped], index: clamped, screenX: svgPxX, screenY: svgPxY });
    }
  }, [filtered, pts]);

  const handleMouseLeave = () => setTooltip(null);

  // ── Empty state ────────────────────────────────────────────────────────
  if(!data.length) {
    return (
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,padding:"48px 28px",textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:16}}>📈</div>
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:22,fontWeight:800,color:T.text,marginBottom:8}}>Equity curve waiting</div>
        <div style={{fontSize:13,color:T.textDim}}>Log a few trades and your R-multiple growth curve will appear here.</div>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:0,background:T.surface,border:`1px solid ${T.border}`,borderRadius:20,overflow:"hidden"}}>

      {/* ── Header ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px 16px",gap:16,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,borderRadius:12,background:`linear-gradient(135deg,${T.green}30,${T.accent}20)`,border:`1px solid ${T.green}40`,display:"grid",placeItems:"center"}}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <polyline points="2,13 6,8 10,10 16,4" stroke={T.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:17,fontWeight:800,color:T.text,letterSpacing:"-0.03em"}}>Equity Curve</div>
            <div style={{fontSize:11,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:2}}>Growth Over Time</div>
          </div>
        </div>

        {/* Time range filters */}
        <div style={{display:"flex",gap:4,background:T.surface2,border:`1px solid ${T.border}`,borderRadius:12,padding:4}}>
          {RANGES.map(r => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              style={{
                background: range === r.id ? T.accent : "none",
                color: range === r.id ? "#fff" : T.textDim,
                border: "none", borderRadius: 8,
                padding: "5px 12px", fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "Inter,sans-serif",
                transition: "all .15s",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0,borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`}}>
        {stats.map((s, i) => (
          <div key={s.label} style={{
            padding:"14px 20px",
            borderRight: i < 3 ? `1px solid ${T.border}` : "none",
          }}>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.14em",marginBottom:6}}>{s.label}</div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:22,fontWeight:800,color:s.tone,letterSpacing:"-0.03em",lineHeight:1}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── SVG Chart ── */}
      <div style={{position:"relative",padding:"0 0 0 0"}}>
        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          style={{display:"block",height:"clamp(200px,30vw,320px)"}}
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="ec-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={lineCol} stopOpacity="0.28"/>
              <stop offset="60%"  stopColor={lineCol} stopOpacity="0.07"/>
              <stop offset="100%" stopColor={lineCol} stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="ec-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={T.accentBright}/>
              <stop offset="100%" stopColor={lineCol}/>
            </linearGradient>
            <filter id="ec-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {gridYs.map((y, i) => (
            <line key={i} x1={padL} y1={y} x2={W-padR} y2={y}
              stroke={T.border} strokeWidth="1" strokeDasharray="4 8" opacity="0.5"/>
          ))}

          {/* Zero line */}
          <line x1={padL} y1={zeroY} x2={W-padR} y2={zeroY}
            stroke={T.border} strokeWidth="1.5" strokeDasharray="6 10" opacity="0.8"/>

          {/* Area fill */}
          {areaPath && <path d={areaPath} fill="url(#ec-area)"/>}

          {/* Main line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#ec-line)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#ec-glow)"
            />
          )}

          {/* Tooltip crosshair */}
          {tooltip && (
            <>
              <line x1={tooltip.svgX} y1={padTop} x2={tooltip.svgX} y2={H-padBot}
                stroke={T.accentBright} strokeWidth="1" strokeDasharray="4 4" opacity="0.5"/>
              <circle cx={tooltip.svgX} cy={tooltip.svgY} r="5"
                fill={lineCol} stroke={T.surface} strokeWidth="2"/>
            </>
          )}

          {/* Animated endpoint dot */}
          {endPt && !tooltip && (
            <>
              <circle cx={endPt.x} cy={endPt.y} r="10" fill={lineCol} opacity="0.15">
                <animate attributeName="r" values="8;14;8" dur="2.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.15;0;0.15" dur="2.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx={endPt.x} cy={endPt.y} r="5.5" fill={lineCol} stroke={T.surface} strokeWidth="2.5"/>
            </>
          )}

          {/* Date labels */}
          {filtered.length > 0 && (
            <>
              <text x={padL+4} y={H-8} fill={T.muted} fontSize="11" fontWeight="600" fontFamily="Inter,sans-serif">
                {filtered[0].date ? fmtDate(filtered[0].date) : "First trade"}
              </text>
              <text x={W-padR-4} y={H-8} fill={T.muted} fontSize="11" fontWeight="600" fontFamily="Inter,sans-serif" textAnchor="end">
                {filtered[filtered.length-1].date ? fmtDate(filtered[filtered.length-1].date) : "Latest"}
              </text>
            </>
          )}
        </svg>

        {/* Tooltip popup (DOM, not SVG, for easy styling) */}
        {tooltip && (() => {
          const p = tooltip.point;
          const r = p.rr || 0;
          return (
            <div style={{
              position:"absolute",
              left:`clamp(8px, calc(${(tooltip.svgX/W)*100}% - 80px), calc(100% - 168px))`,
              top: tooltip.svgY / H < 0.5 ? `calc(${(tooltip.svgY/H)*100}% + 16px)` : `calc(${(tooltip.svgY/H)*100}% - 80px)`,
              background:`linear-gradient(135deg,${T.surface2},${T.surface})`,
              border:`1px solid ${T.border}`,
              borderRadius:12, padding:"10px 14px",
              pointerEvents:"none", zIndex:10,
              boxShadow:`0 12px 32px ${T.bg}cc`,
              minWidth:160,
            }}>
              <div style={{fontSize:10,fontWeight:700,color:T.muted,letterSpacing:"0.1em",marginBottom:6}}>
                {p.date ? fmtDate(p.date) : `Trade #${tooltip.index+1}`}
              </div>
              {p.pair && <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:4}}>{p.pair}</div>}
              <div style={{display:"flex",justifyContent:"space-between",gap:16}}>
                <div>
                  <div style={{fontSize:10,color:T.muted}}>This trade</div>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:800,color:r>=0?T.green:T.red}}>{fmtRR(r)}</div>
                </div>
                <div>
                  <div style={{fontSize:10,color:T.muted}}>Cumulative</div>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:14,fontWeight:800,color:p.r>=0?T.green:T.red}}>{fmtRR(p.r)}</div>
                </div>
              </div>
              {p.result && (
                <div style={{marginTop:6,display:"inline-block",padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:700,
                  background: p.result==="WIN"?`${T.green}20`:p.result==="LOSS"?`${T.red}20`:`${T.amber}20`,
                  color: p.result==="WIN"?T.green:p.result==="LOSS"?T.red:T.amber}}>
                  {p.result}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Footer ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderTop:`1px solid ${T.border}`,flexWrap:"wrap",gap:10}}>
        <div style={{fontSize:11,fontWeight:700,color:T.muted,letterSpacing:"0.1em",textTransform:"uppercase"}}>
          {filtered.length} Trade{filtered.length !== 1 ? "s" : ""} Plotted
        </div>
        <div style={{display:"flex",gap:16,alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:T.textDim}}>
            <span style={{width:20,height:2,background:`linear-gradient(90deg,${T.accentBright},${lineCol})`,borderRadius:2,display:"inline-block"}}/>
            Cumulative R
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:T.textDim}}>
            <span style={{width:20,height:1.5,background:T.border,borderRadius:2,display:"inline-block",borderTop:`1px dashed ${T.border}`}}/>
            Breakeven
          </div>
        </div>
      </div>
    </div>
  );
}
