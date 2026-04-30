"use client"
import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { fmtDate, fmtRR } from "@/lib/utils";

const RANGES = [
  { id:"all", label:"All" },
  { id:"7d",  label:"7D"  },
  { id:"30d", label:"30D" },
  { id:"90d", label:"90D" },
  { id:"6m",  label:"6M"  },
  { id:"1y",  label:"1Y"  },
];

function filterByRange(data, range) {
  if (range === "all" || !data.length) return data;
  const now = new Date();
  const cutoff = new Date(now);
  if (range === "7d")  cutoff.setDate(now.getDate() - 7);
  if (range === "30d") cutoff.setDate(now.getDate() - 30);
  if (range === "90d") cutoff.setDate(now.getDate() - 90);
  if (range === "6m")  cutoff.setMonth(now.getMonth() - 6);
  if (range === "1y")  cutoff.setFullYear(now.getFullYear() - 1);
  const filtered = data.filter(d => d.date && new Date(d.date) >= cutoff);
  if (!filtered.length) return data;
  let cum = 0;
  return filtered.map(d => {
    const rr = Number(d.rr) || 0;
    cum += rr;
    return { ...d, rr, r: cum };
  });
}

// ── Nice round tick generation ─────────────────────────────────────────────
function niceTicks(min, max, count = 5) {
  const range = max - min || 1;
  const raw = range / (count - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const nice = [1, 2, 2.5, 5, 10].find(n => n * mag >= raw) * mag;
  const lo = Math.floor(min / nice) * nice;
  const ticks = [];
  for (let i = 0; ticks.length < count + 2; i++) {
    const v = parseFloat((lo + i * nice).toFixed(10));
    if (v >= min - nice * 0.5) ticks.push(v);
    if (ticks.length && ticks[ticks.length - 1] > max + nice * 0.5) break;
  }
  return ticks.filter(v => v >= min - nice * 0.1 && v <= max + nice * 0.1);
}

// ── Compute monotone Hermite tangents ──────────────────────────────────────
function computeTangents(pts) {
  const n = pts.length;
  if (n < 2) return { m: new Array(n).fill(0), dx: [] };
  const dx = [], dy = [], slope = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i]    = pts[i+1].x - pts[i].x;
    dy[i]    = pts[i+1].y - pts[i].y;
    slope[i] = dy[i] / dx[i];
  }
  const m = new Array(n);
  m[0] = slope[0];
  for (let i = 1; i < n - 1; i++) {
    m[i] = slope[i-1] * slope[i] <= 0 ? 0 : (slope[i-1] + slope[i]) / 2;
  }
  m[n-1] = slope[n-2];
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(slope[i]) < 1e-12) { m[i] = m[i+1] = 0; continue; }
    const a = m[i] / slope[i], b = m[i+1] / slope[i];
    const h = Math.hypot(a, b);
    if (h > 3) { const t = 3/h; m[i] = t*a*slope[i]; m[i+1] = t*b*slope[i]; }
  }
  return { m, dx };
}

function cubicSeg(pts, m, dx, i) {
  const x1 = pts[i].x   + dx[i]/3;
  const y1 = pts[i].y   + (dx[i]/3) * m[i];
  const x2 = pts[i+1].x - dx[i]/3;
  const y2 = pts[i+1].y - (dx[i]/3) * m[i+1];
  return `M ${pts[i].x},${pts[i].y} C ${x1},${y1} ${x2},${y2} ${pts[i+1].x},${pts[i+1].y}`;
}

function smoothPath(pts) {
  if (pts.length < 2) return pts.length === 1 ? `M ${pts[0].x},${pts[0].y}` : "";
  const { m, dx } = computeTangents(pts);
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const x1 = pts[i].x   + dx[i]/3;
    const y1 = pts[i].y   + (dx[i]/3) * m[i];
    const x2 = pts[i+1].x - dx[i]/3;
    const y2 = pts[i+1].y - (dx[i]/3) * m[i+1];
    d += ` C ${x1},${y1} ${x2},${y2} ${pts[i+1].x},${pts[i+1].y}`;
  }
  return d;
}

// ── Annotation pill ────────────────────────────────────────────────────────
function AnnotationPill({ x, y, label, color, above, svgW }) {
  const PW = Math.max(label.length * 6.2 + 14, 54);
  const PH = 16;
  const GAP = 8;
  const px = Math.max(PW / 2 + 6, Math.min(svgW - PW / 2 - 6, x));
  const py = above ? y - GAP - PH : y + GAP;
  const lineY1 = above ? y - GAP + 1 : y + GAP - 1;
  return (
    <g>
      <line x1={x} y1={lineY1} x2={px} y2={above ? py + PH : py}
        stroke={color} strokeWidth="1" strokeDasharray="2 3" opacity="0.45"/>
      <rect x={px - PW/2} y={py} width={PW} height={PH} rx={PH/2}
        fill={`${color}1a`} stroke={color} strokeWidth="0.75" opacity="0.95"/>
      <text x={px} y={py + PH/2 + 3.5} textAnchor="middle"
        fill={color} fontSize="9" fontWeight="700"
        fontFamily="var(--font-geist-sans)"
        letterSpacing="0.04em">
        {label}
      </text>
    </g>
  );
}

const fmtStat = fmtRR;
const FF = "var(--font-geist-sans)";

// ── Main component ─────────────────────────────────────────────────────────
export default function EquityCurve({ T, data = [] }) {
  const [range, setRange]       = useState("all");
  const [tooltip, setTip]       = useState(null);
  const [selectedTrade, setSel] = useState(null);
  const [size, setSize]         = useState({ w: 0 });
  const wrapRef = useRef(null);
  const svgRef  = useRef(null);
  const ddRef   = useRef(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const width = el.getBoundingClientRect().width || el.clientWidth || el.parentElement?.clientWidth || 0;
      setSize({ w: Math.max(width, 200) });
    };
    measure();
    const frame = requestAnimationFrame(measure);
    const ro = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width || el.clientWidth || el.parentElement?.clientWidth || 0;
      setSize({ w: Math.max(width, 200) });
    });
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, []);

  const filtered = filterByRange(data, range);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const netPL  = filtered.length ? filtered[filtered.length - 1].r : 0;
  const allR   = filtered.map(d => d.r);
  const peak   = filtered.length ? Math.max(0, ...allR) : 0;
  const trough = filtered.length ? Math.min(0, ...allR) : 0;

  const peakArr = [], ddArr = [];
  let runPk = -Infinity, maxDD = 0;
  filtered.forEach(d => {
    if (d.r > runPk) runPk = d.r;
    peakArr.push(runPk);
    const dd = d.r - runPk;
    ddArr.push(dd);
    if (dd < maxDD) maxDD = dd;
  });

  // ── Layout constants ──────────────────────────────────────────────────────
  const w   = size.w || 720;
  const YAX = 42;          // left Y-axis label column width
  const PR  = 10;
  const PT  = 16;          // top padding inside chart SVG
  const PB  = 28;          // bottom (date labels)
  const ECH = Math.round(Math.min(Math.max(w * 0.16, 140), 220));   // equity curve height
  const DDH = Math.round(Math.min(Math.max(w * 0.055, 44), 78));    // drawdown pane height
  const GAP = 0;           // gap between the two charts

  const cW = w - YAX - PR;
  const cH = ECH - PT - PB;

  const minR = filtered.length ? Math.min(0, ...allR) : 0;
  const maxR = filtered.length ? Math.max(0, ...allR) : 1;
  const rng  = maxR - minR || 1;

  const px = i => YAX + (i / Math.max(filtered.length - 1, 1)) * cW;
  const py = v => PT + cH - ((v - minR) / rng) * cH;
  const z0 = py(0);

  const pts = filtered.map((d, i) => ({ x: px(i), y: py(d.r), d, i }));

  // Y-axis ticks
  const ticks = niceTicks(minR, maxR, 5);

  // ── Segment colors ────────────────────────────────────────────────────────
  const segments = [];
  if (pts.length >= 2) {
    const { m, dx } = computeTangents(pts);
    for (let i = 0; i < pts.length - 1; i++) {
      const r  = filtered[i + 1].r;
      const pk = peakArr[i + 1];
      const dd = r - pk;
      const ddFrac = maxDD !== 0 ? dd / maxDD : 0;
      let color;
      if (dd >= -0.001)        color = T.green;
      else if (ddFrac < 0.45)  color = T.amber;
      else                      color = T.red;
      segments.push({ d: cubicSeg(pts, m, dx, i), color });
    }
  }

  // ── Drawdown area path ────────────────────────────────────────────────────
  // Maps drawdown values (all ≤ 0) to an inverted bar chart
  const minDD = maxDD < 0 ? maxDD : -1;  // most negative drawdown
  const ddPts = filtered.map((d, i) => ({
    x: px(i),
    y: (ddArr[i] / minDD) * DDH,  // 0 = top, DDH = max depth
  }));

  let ddPath = "";
  if (ddPts.length >= 2) {
    ddPath  = `M ${ddPts[0].x},0`;
    ddPts.forEach(p => { ddPath += ` L ${p.x},${p.y}`; });
    ddPath += ` L ${ddPts[ddPts.length - 1].x},0 Z`;
  }

  // ── Annotations ───────────────────────────────────────────────────────────
  const annotations = [];
  if (filtered.length >= 5) {
    const peakIdx   = allR.indexOf(Math.max(...allR));
    const troughIdx = allR.indexOf(Math.min(...allR));

    if (peakIdx >= 0 && peak > 0) {
      const p = pts[peakIdx];
      const above = p.y / ECH > 0.35;
      annotations.push({ x: p.x, y: p.y, label: `Peak ${fmtStat(peak)}`, color: T.green, above });
    }
    if (troughIdx >= 0 && trough < 0 && troughIdx !== peakIdx) {
      const p = pts[troughIdx];
      const tooClose = annotations.length > 0 && Math.abs(annotations[0].x - p.x) < 72;
      if (!tooClose) {
        const above = p.y / ECH < 0.6;
        annotations.push({ x: p.x, y: p.y, label: `Low ${fmtStat(trough)}`, color: T.red, above });
      }
    }
  }

  const last      = pts[pts.length - 1];
  const lineColor = netPL >= 0 ? T.green : T.red;

  const displayR     = tooltip ? tooltip.pt.d.r : netPL;
  const displayColor = displayR >= 0 ? T.green : T.red;

  const onMove = useCallback((e) => {
    if (!svgRef.current || !pts.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = w / Math.max(rect.width, 1);
    const scaleY = ECH / Math.max(rect.height, 1);
    const cssX = e.clientX - rect.left;
    const rx   = cssX * scaleX;
    const step = cW / Math.max(filtered.length - 1, 1);
    const idx  = Math.max(0, Math.min(filtered.length - 1, Math.round((rx - YAX) / step)));
    const pt = pts[idx];
    setTip({ idx, screenX: cssX, screenY: pt.y / scaleY, pt });
  }, [pts, cW, filtered.length, YAX, ECH, w]);

  const onLeave = () => setTip(null);

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!data.length) {
    return (
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 16, padding: "48px 24px", textAlign: "center",
      }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none"
          style={{ margin: "0 auto 16px", display:"block" }}>
          <rect width="40" height="40" rx="12" fill={`${T.accentBright}18`}/>
          <polyline points="8,28 16,18 22,22 32,10"
            stroke={T.accentBright} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div style={{
          fontFamily: FF, fontSize: 16, fontWeight: 700,
          color: T.text, letterSpacing: "-0.02em", marginBottom: 6,
        }}>No equity data yet</div>
        <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.6 }}>
          Log your first trade to start building your curve.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      overflow: "hidden",
    }}>

      {/* ── Header: live R + range pills ── */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px 8px",
        gap: 10, flexWrap: "wrap",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{
            fontFamily: FF, fontSize: 20, fontWeight: 700,
            color: displayColor, letterSpacing: "-0.04em", lineHeight: 1,
            transition: "color 0.12s",
          }}>
            {fmtStat(displayR)}
          </span>
          {tooltip
            ? <span style={{ fontSize: 10, color: T.muted }}>
                {tooltip.pt.d.date ? fmtDate(tooltip.pt.d.date) : `#${tooltip.idx + 1}`}
              </span>
            : <>
                <span style={{ fontSize: 10, color: T.muted }}>·</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: T.green }}>pk {fmtStat(peak)}</span>
                {maxDD < 0 && <>
                  <span style={{ fontSize: 10, color: T.muted }}>·</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.red }}>dd {fmtStat(maxDD)}</span>
                </>}
              </>
          }
        </div>

        {/* Range pills */}
        <div style={{
          display: "flex", gap: 2,
          background: T.surface2, border: `1px solid ${T.border}`,
          borderRadius: 7, padding: 2, flexShrink: 0,
        }}>
          {RANGES.map(r => (
            <button key={r.id} onClick={() => setRange(r.id)} style={{
              background: range === r.id ? T.accent : "transparent",
              color: range === r.id ? "#fff" : T.textDim,
              border: "none", borderRadius: 5,
              padding: "2px 8px", fontSize: 10, fontWeight: 700,
              cursor: "pointer",
              fontFamily: FF,
              letterSpacing: "0.03em",
              transition: "background .12s, color .12s",
            }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Equity curve SVG ── */}
      <div ref={wrapRef} style={{ position: "relative", minHeight: w > 0 ? ECH : 130 }}>
        {w > 0 && (
          <svg
            ref={svgRef}
            width={w} height={ECH}
            viewBox={`0 0 ${w} ${ECH}`}
            style={{ display:"block", width:"100%", height:"auto", cursor:"crosshair" }}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            onClick={() => {
              if (tooltip) setSel(s => s?.i === tooltip.idx ? null : { ...tooltip.pt.d, i: tooltip.idx });
            }}
          >
            <defs>
              <filter id="ec-glow" x="-30%" y="-80%" width="160%" height="260%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
                <feColorMatrix in="blur" type="saturate" values="2" result="sat"/>
                <feMerge>
                  <feMergeNode in="sat"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="ec-dot" x="-120%" y="-120%" width="340%" height="340%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Y-axis label column background */}
            <rect x={0} y={0} width={YAX - 4} height={ECH} fill={T.surface}/>

            {/* Tick lines + Y-axis labels */}
            {ticks.map((v, i) => {
              const yy = py(v);
              if (yy < PT - 6 || yy > PT + cH + 6) return null;
              const isZero = Math.abs(v) < 0.001;
              return (
                <g key={i}>
                  <line
                    x1={YAX} y1={yy} x2={w - PR} y2={yy}
                    stroke={T.border}
                    strokeWidth={isZero ? 1 : 0.5}
                    strokeDasharray={isZero ? "4 8" : "2 8"}
                    opacity={isZero ? 0.9 : 0.35}
                  />
                  <text
                    x={YAX - 6} y={yy + 3.5}
                    textAnchor="end"
                    fill={isZero ? T.textDim : T.muted}
                    fontSize="9"
                    fontWeight={isZero ? "700" : "500"}
                    fontFamily="'JetBrains Mono','Fira Code',monospace"
                  >
                    {v >= 0 ? `+${v.toFixed(0)}` : v.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Vertical separator line */}
            <line x1={YAX} y1={PT - 4} x2={YAX} y2={PT + cH}
              stroke={T.border} strokeWidth="1" opacity="0.3"/>

            {/* Segmented colored curve */}
            {segments.map((seg, i) => (
              <path key={i} d={seg.d}
                fill="none" stroke={seg.color}
                strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                filter="url(#ec-glow)"
              />
            ))}

            {/* Annotation pills */}
            {annotations.map((ann, i) => (
              <AnnotationPill key={i} {...ann} svgW={w}/>
            ))}

            {/* Trade dots */}
            {filtered.length <= 80 && pts.map((p, i) => {
              const d = p.d;
              const dotC = d.result === "WIN" ? T.green : d.result === "LOSS" ? T.red : (T.amber || "#f59e0b");
              const isSel = selectedTrade?.i === i;
              return (
                <circle key={i}
                  cx={p.x} cy={p.y}
                  r={isSel ? 6 : 2.5}
                  fill={dotC}
                  stroke={T.surface}
                  strokeWidth={isSel ? 2 : 1.5}
                  opacity={isSel ? 1 : 0.7}
                />
              );
            })}

            {/* Crosshair */}
            {tooltip && (() => {
              const p = tooltip.pt;
              return (
                <>
                  <line x1={p.x} y1={PT} x2={p.x} y2={PT + cH}
                    stroke={T.border} strokeWidth="1" opacity="0.6"/>
                  <circle cx={p.x} cy={p.y} r="5"
                    fill={p.d.r >= 0 ? T.green : T.red}
                    stroke={T.surface} strokeWidth="2.5"/>
                </>
              );
            })()}

            {/* Animated endpoint */}
            {last && !tooltip && (
              <>
                <circle cx={last.x} cy={last.y} r="12" fill={lineColor} opacity="0.08" filter="url(#ec-dot)">
                  <animate attributeName="r"       values="10;22;10" dur="3s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.08;0;0.08" dur="3s" repeatCount="indefinite"/>
                </circle>
                <circle cx={last.x} cy={last.y} r="4.5" fill={lineColor} stroke={T.surface} strokeWidth="2.5"/>
              </>
            )}

            {/* Date labels */}
            {filtered.length > 1 && (
              <>
                <text x={YAX + 4} y={ECH - 8} fill={T.muted}
                  fontSize="9" fontWeight="500"
                  fontFamily={FF}>
                  {filtered[0].date ? fmtDate(filtered[0].date) : "First"}
                </text>
                <text x={w - PR - 2} y={ECH - 8} fill={T.muted}
                  textAnchor="end" fontSize="9" fontWeight="500"
                  fontFamily={FF}>
                  {filtered[filtered.length - 1].date ? fmtDate(filtered[filtered.length - 1].date) : "Latest"}
                </text>
              </>
            )}
          </svg>
        )}

        {/* Hover tooltip */}
        {tooltip && (() => {
          const { pt, screenX, screenY } = tooltip;
          const d = pt.d;
          const r = Number(d.rr) || 0;
          const containerW = wrapRef.current?.getBoundingClientRect().width || w;
          const left = Math.min(Math.max(screenX - 68, 8), Math.max(containerW - 152, 8));
          const above = pt.y / ECH > 0.55;
          return (
            <div style={{
              position: "absolute",
              left,
              top: above ? screenY - 88 : screenY + 14,
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 10, padding: "10px 13px",
              pointerEvents: "none", zIndex: 20,
              boxShadow: `0 16px 40px ${T.bg}cc`,
              minWidth: 140,
            }}>
              {d.pair && (
                <div style={{
                  fontFamily: FF,
                  fontSize: 13, fontWeight: 700,
                  color: T.text, marginBottom: 7,
                  letterSpacing: "-0.02em",
                }}>{d.pair}</div>
              )}
              <div style={{ display: "flex", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 9, color: T.muted, letterSpacing:"0.08em", marginBottom: 3 }}>TRADE</div>
                  <div style={{
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                    fontSize: 15, fontWeight: 700,
                    color: r >= 0 ? T.green : T.red,
                    letterSpacing: "-0.03em",
                  }}>{fmtStat(r)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: T.muted, letterSpacing:"0.08em", marginBottom: 3 }}>TOTAL</div>
                  <div style={{
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                    fontSize: 15, fontWeight: 700,
                    color: d.r >= 0 ? T.green : T.red,
                    letterSpacing: "-0.03em",
                  }}>{fmtStat(d.r)}</div>
                </div>
              </div>
              {d.result && (
                <div style={{
                  marginTop: 8, display: "inline-block",
                  padding: "2px 8px", borderRadius: 5, fontSize: 9, fontWeight: 700,
                  background: d.result === "WIN" ? `${T.green}22` : d.result === "LOSS" ? `${T.red}22` : `${T.amber}22`,
                  color: d.result === "WIN" ? T.green : d.result === "LOSS" ? T.red : T.amber,
                }}>{d.result}</div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Drawdown depth pane ── */}
      {maxDD < 0 && w > 0 && (
        <div style={{ borderTop: `1px solid ${T.border}` }}>
          {/* Label row */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 14px 2px",
          }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: T.muted,
              letterSpacing: "0.12em", textTransform: "uppercase",
            }}>Drawdown</span>
            <span style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: 9, fontWeight: 700, color: T.red,
            }}>{fmtStat(maxDD)}</span>
          </div>
          <svg
            ref={ddRef}
            width={w} height={DDH}
            viewBox={`0 0 ${w} ${DDH}`}
            style={{ display: "block", width: "100%", height: "auto" }}
          >
            <defs>
              <linearGradient id="dd-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.red} stopOpacity="0.35"/>
                <stop offset="100%" stopColor={T.red} stopOpacity="0.04"/>
              </linearGradient>
            </defs>

            {/* Zero line (top) */}
            <line x1={YAX} y1={0.5} x2={w - PR} y2={0.5}
              stroke={T.border} strokeWidth="1" opacity="0.4"/>

            {/* Max DD label on right */}
            <text x={YAX - 6} y={DDH - 3}
              textAnchor="end" fill={T.muted} fontSize="8"
              fontFamily="'JetBrains Mono','Fira Code',monospace">
              {fmtStat(maxDD)}
            </text>

            {/* Drawdown area */}
            {ddPath && (
              <path d={ddPath} fill="url(#dd-fill)" stroke="none"/>
            )}

            {/* Drawdown line on top of fill */}
            {ddPts.length >= 2 && (
              <polyline
                points={ddPts.map(p => `${p.x},${p.y}`).join(" ")}
                fill="none"
                stroke={T.red}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
            )}

            {/* Crosshair sync with main chart */}
            {tooltip && (() => {
              const p = ddPts[tooltip.idx];
              if (!p) return null;
              return (
                <line x1={p.x} y1={0} x2={p.x} y2={DDH}
                  stroke={T.border} strokeWidth="1" opacity="0.5"/>
              );
            })()}
          </svg>
        </div>
      )}

      {/* ── Selected trade panel ── */}
      {selectedTrade && (() => {
        const d = selectedTrade;
        const r = Number(d.rr) || 0;
        const rc = d.result === "WIN" ? T.green : d.result === "LOSS" ? T.red : (T.amber || "#f59e0b");
        return (
          <div style={{
            borderTop: `1px solid ${T.border}`,
            background: T.surface2,
            padding: "12px 16px",
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 8 }}>
              <div style={{ display:"flex", alignItems:"center", gap: 8, flexWrap:"wrap" }}>
                <span style={{
                  fontFamily: FF, fontSize: 16, fontWeight: 700,
                  color: T.accentBright, letterSpacing: "-0.03em",
                }}>{d.pair || "Trade"}</span>
                {d.direction && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: "2px 8px", borderRadius: 6,
                    background: d.direction === "LONG" ? `${T.green}20` : `${T.red}20`,
                    color: d.direction === "LONG" ? T.green : T.red,
                  }}>{d.direction}</span>
                )}
                {d.date && <span style={{ fontSize: 11, color: T.muted }}>{fmtDate(d.date)}</span>}
                {d.session && (
                  <span style={{
                    fontSize: 10, color: T.textDim,
                    background: T.surface, border: `1px solid ${T.border}`,
                    padding: "2px 7px", borderRadius: 999,
                  }}>{d.session}</span>
                )}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                {d.result && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: "2px 9px", borderRadius: 6,
                    background: `${rc}20`, color: rc,
                  }}>{d.result}</span>
                )}
                <span style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: 17, fontWeight: 700,
                  color: r >= 0 ? T.green : T.red, letterSpacing: "-0.04em",
                }}>{fmtStat(r)}</span>
                <button onClick={() => setSel(null)} style={{
                  background: "none", border: `1px solid ${T.border}`,
                  color: T.muted, width: 26, height: 26,
                  borderRadius: 7, cursor: "pointer", fontSize: 15,
                  display: "grid", placeItems: "center",
                }}>×</button>
              </div>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(80px,1fr))",
              gap: 6,
            }}>
              {[
                { l:"Setup",   v: d.setup },
                { l:"Emotion", v: d.emotion },
                { l:"Pips",    v: d.pips ? `${d.pips >= 0 ? "+" : ""}${d.pips}` : null },
                { l:"Entry",   v: d.entry || null },
              ].filter(x => x.v).map(x => (
                <div key={x.l} style={{
                  background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 8, padding: "7px 10px",
                }}>
                  <div style={{
                    fontSize: 9, fontWeight: 700, color: T.muted,
                    letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3,
                  }}>{x.l}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{x.v}</div>
                </div>
              ))}
            </div>
            {d.notes && (
              <div style={{
                marginTop: 8, fontSize: 12, color: T.textDim, lineHeight: 1.6,
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 8, padding: "8px 12px",
              }}>{d.notes}</div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
