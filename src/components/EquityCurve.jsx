"use client"
import { useState, useRef, useEffect, useCallback } from "react";
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
  return filtered.map(d => { cum += d.rr || 0; return { ...d, r: cum }; });
}

// ── Monotone cubic Hermite spline ─────────────────────────────────────────
// Produces visually smooth curves that never overshoot data points.
function smoothPath(pts) {
  if (pts.length < 2) return pts.length === 1 ? `M ${pts[0].x},${pts[0].y}` : "";
  const n = pts.length;
  const dx = [], dy = [], slope = [], alpha = [], beta = [];

  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i+1].x - pts[i].x;
    dy[i] = pts[i+1].y - pts[i].y;
    slope[i] = dy[i] / dx[i];
  }

  // Tangents
  const m = new Array(n);
  m[0] = slope[0];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i-1] * slope[i] <= 0) { m[i] = 0; }
    else { m[i] = (slope[i-1] + slope[i]) / 2; }
  }
  m[n-1] = slope[n-2];

  // Monotonicity clamp
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(slope[i]) < 1e-12) { m[i] = m[i+1] = 0; continue; }
    alpha[i] = m[i] / slope[i];
    beta[i]  = m[i+1] / slope[i];
    const h = Math.hypot(alpha[i], beta[i]);
    if (h > 3) {
      const t = 3 / h;
      m[i]   = t * alpha[i] * slope[i];
      m[i+1] = t * beta[i]  * slope[i];
    }
  }

  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const x1 = pts[i].x   + dx[i] / 3;
    const y1 = pts[i].y   + (dx[i] / 3) * m[i];
    const x2 = pts[i+1].x - dx[i] / 3;
    const y2 = pts[i+1].y - (dx[i] / 3) * m[i+1];
    d += ` C ${x1},${y1} ${x2},${y2} ${pts[i+1].x},${pts[i+1].y}`;
  }
  return d;
}

// fmtRR already prefixes + for positive values, so use it directly
const fmtStat = fmtRR;

// ── Main component ─────────────────────────────────────────────────────────
export default function EquityCurve({ T, data = [] }) {
  const [range, setRange]      = useState("all");
  const [tooltip, setTip]      = useState(null);
  const [selectedTrade, setSel] = useState(null);
  const [size, setSize]        = useState({ w: 0, h: 0 });
  const wrapRef = useRef(null);
  const svgRef  = useRef(null);

  // ── True pixel dimensions via ResizeObserver ────────────────────────────
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setSize({ w: Math.max(w, 200), h: Math.round(Math.max(w * 0.11, 90)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const filtered = filterByRange(data, range);

  // ── Stats ────────────────────────────────────────────────────────────────
  const netPL  = filtered.length ? filtered[filtered.length - 1].r : 0;
  const peak   = filtered.length ? Math.max(0, ...filtered.map(d => d.r)) : 0;
  const trough = filtered.length ? Math.min(0, ...filtered.map(d => d.r)) : 0;
  let peakSoFar = -Infinity, maxDD = 0;
  filtered.forEach(d => {
    if (d.r > peakSoFar) peakSoFar = d.r;
    const dd = d.r - peakSoFar;
    if (dd < maxDD) maxDD = dd;
  });

  const statCards = [
    { label:"NET P&L",  val: fmtStat(netPL), color: netPL  >= 0 ? T.green : T.red },
    { label:"PEAK",     val: fmtStat(peak),  color: T.green },
    { label:"TROUGH",   val: fmtStat(trough),color: trough < 0 ? T.red : T.textDim },
    { label:"MAX DD",   val: fmtStat(maxDD), color: maxDD  < 0 ? T.red : T.textDim },
  ];

  // ── Layout ────────────────────────────────────────────────────────────────
  const { w, h } = size;
  const PL = 20, PR = 20, PT = 20, PB = 32;
  const cW = w - PL - PR;
  const cH = h - PT - PB;

  const allR  = filtered.map(d => d.r);
  const minR  = filtered.length ? Math.min(0, ...allR) : 0;
  const maxR  = filtered.length ? Math.max(0, ...allR) : 1;
  const rng   = maxR - minR || 1;

  const px  = i => PL + (i / Math.max(filtered.length - 1, 1)) * cW;
  const py  = v => PT + cH - ((v - minR) / rng) * cH;
  const z0  = py(0); // zero baseline y

  const pts = filtered.map((d, i) => ({ x: px(i), y: py(d.r), d, i }));
  const line  = smoothPath(pts);
  const area  = pts.length > 1
    ? `${line} L ${pts[pts.length-1].x},${z0} L ${pts[0].x},${z0} Z`
    : "";

  // ── Drawdown band: fill between running-peak line and equity line ─────────
  const peakArr = [];
  let runPk = -Infinity;
  filtered.forEach(d => { if (d.r > runPk) runPk = d.r; peakArr.push(runPk); });
  const ddPath = pts.length > 1
    ? `M ${pts[0].x},${py(peakArr[0])} ` +
      pts.slice(1).map((p, i) => `L ${p.x},${py(peakArr[i + 1])}`).join(" ") +
      ` L ${pts[pts.length - 1].x},${pts[pts.length - 1].y} ` +
      [...pts].reverse().slice(1).map(p => `L ${p.x},${p.y}`).join(" ") +
      " Z"
    : "";

  const last  = pts[pts.length - 1];
  const lineColor = netPL >= 0 ? T.green : T.red;

  // Y gridlines at 25/50/75%
  const gridYs = [0.25, 0.5, 0.75].map(f => PT + cH * f);

  // ── Hover ────────────────────────────────────────────────────────────────
  const onMove = useCallback((e) => {
    if (!svgRef.current || !pts.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rx = e.clientX - rect.left;
    const step = cW / Math.max(filtered.length - 1, 1);
    const idx = Math.max(0, Math.min(filtered.length - 1, Math.round((rx - PL) / step)));
    setTip({ idx, screenX: e.clientX - rect.left, pt: pts[idx] });
  }, [pts, cW, filtered.length]);

  const onLeave = () => setTip(null);

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!data.length) {
    return (
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 20, padding: "60px 28px", textAlign: "center",
      }}>
        <div style={{ fontSize: 42, marginBottom: 16 }}>📈</div>
        <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 8 }}>
          Equity curve waiting
        </div>
        <div style={{ fontSize: 13, color: T.textDim }}>
          Log trades and your R-growth curve will appear here.
        </div>
      </div>
    );
  }

  const FSIZE = Math.max(10, Math.min(13, w / 70));

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 20, overflow: "hidden",
    }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: w < 440 ? "10px 14px 8px" : "12px 18px 10px",
        gap: 8, flexWrap: "wrap",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: `linear-gradient(135deg,${lineColor}25,${lineColor}10)`,
            border: `1px solid ${lineColor}35`,
            display: "grid", placeItems: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <polyline points="1,12 5,7 9,9 15,3" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>Equity Curve</div>
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Cumulative R-Growth</div>
          </div>
        </div>

        {/* Range pills */}
        <div style={{
          display: "flex", gap: 2,
          background: T.surface2, border: `1px solid ${T.border}`,
          borderRadius: 10, padding: 3,
        }}>
          {RANGES.map(r => (
            <button key={r.id} onClick={() => setRange(r.id)} style={{
              background: range === r.id ? lineColor : "transparent",
              color: range === r.id ? "#fff" : T.textDim,
              border: "none", borderRadius: 7,
              padding: w < 440 ? "4px 7px" : "4px 11px",
              fontSize: w < 440 ? 10 : 11, fontWeight: 700,
              cursor: "pointer", fontFamily: "Inter,sans-serif",
              transition: "all .15s",
            }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat cards ── */}
      {(() => {
        const cols2 = w < 440;
        return (
          <div style={{
            display: "grid",
            gridTemplateColumns: cols2 ? "repeat(2,1fr)" : "repeat(4,1fr)",
            borderBottom: `1px solid ${T.border}`,
          }}>
            {statCards.map((s, i) => {
              // 2-col: right border on col 0; 4-col: right border on cols 0-2
              const borderRight = cols2
                ? (i % 2 === 0 ? `1px solid ${T.border}` : "none")
                : (i < 3 ? `1px solid ${T.border}` : "none");
              const borderBottom = cols2 && i < 2 ? `1px solid ${T.border}` : "none";
              return (
                <div key={s.label} style={{ padding: cols2 ? "9px 12px" : "10px 16px", borderRight, borderBottom }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: "0.14em", marginBottom: 5 }}>{s.label}</div>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    fontSize: cols2 ? 16 : "clamp(16px,2.2vw,24px)", fontWeight: 800,
                    color: s.color, letterSpacing: "-0.03em", lineHeight: 1,
                  }}>{s.val}</div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── Chart ── */}
      <div ref={wrapRef} style={{ position: "relative", padding: 0, minHeight: w > 0 ? h : 80 }}>
        {w > 0 && <svg
          ref={svgRef}
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          style={{ display: "block", width: "100%", height: "auto", cursor: "crosshair" }}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          onClick={() => { if (tooltip) setSel(s => s?.i === tooltip.idx ? null : { ...tooltip.pt.d, i: tooltip.idx }); }}
        >
          <defs>
            {/* Area gradient */}
            <linearGradient id="ec-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={lineColor} stopOpacity="0.30"/>
              <stop offset="55%"  stopColor={lineColor} stopOpacity="0.08"/>
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.00"/>
            </linearGradient>
            {/* Line gradient left→right */}
            <linearGradient id="ec-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={T.accentBright || "#8b5cf6"}/>
              <stop offset="100%" stopColor={lineColor}/>
            </linearGradient>
            {/* Glow filter */}
            <filter id="ec-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            {/* Endpoint pulse */}
            <filter id="ec-dot-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Subtle horizontal grid */}
          {gridYs.map((y, i) => (
            <line key={i} x1={PL} y1={y} x2={w - PR} y2={y}
              stroke={T.border} strokeWidth="1" strokeDasharray="3 7" opacity="0.45"/>
          ))}

          {/* Zero baseline */}
          {z0 > PT && z0 < PT + cH && (
            <line x1={PL} y1={z0} x2={w - PR} y2={z0}
              stroke={T.border} strokeWidth="1.5" strokeDasharray="5 9" opacity="0.9"/>
          )}

          {/* Drawdown band */}
          {ddPath && <path d={ddPath} fill={`${T.red}22`} stroke="none"/>}

          {/* Area fill */}
          {area && <path d={area} fill="url(#ec-fill)"/>}

          {/* Main curve */}
          {line && (
            <path
              d={line}
              fill="none"
              stroke="url(#ec-line)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#ec-glow)"
            />
          )}

          {/* Trade dots — colored by result, visible when ≤ 80 trades */}
          {filtered.length <= 80 && pts.map((p, i) => {
            const d = p.d;
            const dotC = d.result === "WIN" ? T.green : d.result === "LOSS" ? T.red : (T.amber || "#f59e0b");
            const isSel = selectedTrade?.i === i;
            return (
              <circle
                key={i}
                cx={p.x} cy={p.y}
                r={isSel ? 6 : 3}
                fill={dotC}
                stroke={T.surface}
                strokeWidth={isSel ? 2.5 : 1.5}
                opacity={isSel ? 1 : 0.8}
              />
            );
          })}

          {/* Hover crosshair */}
          {tooltip && (() => {
            const p = tooltip.pt;
            return (
              <>
                <line x1={p.x} y1={PT} x2={p.x} y2={PT + cH}
                  stroke={lineColor} strokeWidth="1" strokeDasharray="4 4" opacity="0.5"/>
                <circle cx={p.x} cy={p.y} r="5"
                  fill={lineColor} stroke={T.surface} strokeWidth="2.5"/>
              </>
            );
          })()}

          {/* Animated endpoint */}
          {last && !tooltip && (
            <>
              <circle cx={last.x} cy={last.y} r="12" fill={lineColor} opacity="0.12" filter="url(#ec-dot-glow)">
                <animate attributeName="r" values="10;18;10" dur="2.8s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.12;0;0.12" dur="2.8s" repeatCount="indefinite"/>
              </circle>
              <circle cx={last.x} cy={last.y} r="5" fill={lineColor} stroke={T.surface} strokeWidth="2.5"/>
            </>
          )}

          {/* Date labels */}
          {filtered.length > 0 && (
            <>
              <text x={PL + 2} y={h - 8} fill={T.muted}
                fontSize={FSIZE} fontWeight="600" fontFamily="Inter,sans-serif">
                {filtered[0].date ? fmtDate(filtered[0].date) : "First"}
              </text>
              <text x={w - PR - 2} y={h - 8} fill={T.muted} textAnchor="end"
                fontSize={FSIZE} fontWeight="600" fontFamily="Inter,sans-serif">
                {filtered[filtered.length-1].date ? fmtDate(filtered[filtered.length-1].date) : "Latest"}
              </text>
            </>
          )}
        </svg>}

        {/* Tooltip card */}
        {tooltip && (() => {
          const { pt, screenX } = tooltip;
          const d = pt.d;
          const r = d.rr || 0;
          const left = Math.min(Math.max(screenX - 80, 8), w - 176);
          const above = pt.y / h > 0.55;
          return (
            <div style={{
              position: "absolute",
              left, top: above ? pt.y - 100 : pt.y + 16,
              background: `linear-gradient(135deg,${T.surface2},${T.surface})`,
              border: `1px solid ${T.border}`,
              borderRadius: 12, padding: "10px 14px",
              pointerEvents: "none", zIndex: 20,
              boxShadow: `0 16px 40px ${T.bg}cc, 0 2px 8px ${T.bg}88`,
              minWidth: 168,
              backdropFilter: "blur(8px)",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", marginBottom: 6 }}>
                {d.date ? fmtDate(d.date) : `Trade #${pt.i + 1}`}
              </div>
              {d.pair && (
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>{d.pair}</div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 9, color: T.muted, marginBottom: 2 }}>THIS TRADE</div>
                  <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 800, color: r >= 0 ? T.green : T.red }}>
                    {fmtStat(r)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: T.muted, marginBottom: 2 }}>CUMULATIVE</div>
                  <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 800, color: d.r >= 0 ? T.green : T.red }}>
                    {fmtStat(d.r)}
                  </div>
                </div>
              </div>
              {d.result && (
                <div style={{
                  marginTop: 8, display: "inline-block",
                  padding: "2px 9px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                  background: d.result === "WIN" ? `${T.green}20` : d.result === "LOSS" ? `${T.red}20` : `${T.amber || "#f59e0b"}20`,
                  color:      d.result === "WIN" ? T.green         : d.result === "LOSS" ? T.red        : (T.amber || "#f59e0b"),
                }}>
                  {d.result}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Selected trade panel ── */}
      {selectedTrade && (() => {
        const d = selectedTrade;
        const r = d.rr || 0;
        const resultColor = d.result === "WIN" ? T.green : d.result === "LOSS" ? T.red : (T.amber || "#f59e0b");
        return (
          <div style={{
            margin: "0 0 0 0",
            borderTop: `1px solid ${T.border}`,
            background: `linear-gradient(135deg,${T.surface2},${T.surface})`,
            padding: "14px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize: 17, fontWeight: 800, color: T.accentBright }}>{d.pair || "Trade"}</span>
                {d.direction && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 8,
                    background: d.direction === "LONG" ? `${T.green}20` : `${T.red}20`,
                    color: d.direction === "LONG" ? T.green : T.red,
                  }}>{d.direction}</span>
                )}
                {d.date && <span style={{ fontSize: 11, color: T.muted }}>{fmtDate(d.date)}</span>}
                {d.session && <span style={{ fontSize: 11, color: T.textDim, background: T.surface, border: `1px solid ${T.border}`, padding: "2px 8px", borderRadius: 999 }}>{d.session}</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {d.result && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8,
                    background: `${resultColor}20`, color: resultColor,
                  }}>{d.result}</span>
                )}
                <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize: 18, fontWeight: 800, color: r >= 0 ? T.green : T.red }}>
                  {fmtStat(r)}
                </span>
                <button onClick={() => setSel(null)} style={{
                  background: "none", border: `1px solid ${T.border}`, color: T.muted,
                  width: 26, height: 26, borderRadius: 8, cursor: "pointer", fontSize: 14,
                  display: "grid", placeItems: "center", fontFamily: "Inter,sans-serif",
                }}>×</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(90px,1fr))", gap: 8 }}>
              {[
                { l: "Setup",   v: d.setup },
                { l: "Emotion", v: d.emotion },
                { l: "Pips",    v: d.pips ? `${d.pips >= 0 ? "+" : ""}${d.pips}` : null },
                { l: "Entry",   v: d.entry || null },
              ].filter(x => x.v).map(x => (
                <div key={x.l} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>{x.l}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{x.v}</div>
                </div>
              ))}
            </div>
            {d.notes && (
              <div style={{ marginTop: 10, fontSize: 12, color: T.textDim, lineHeight: 1.6,
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 12px",
              }}>
                {d.notes}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Footer ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: w < 440 ? "6px 12px" : "7px 16px", borderTop: `1px solid ${T.border}`,
        flexWrap: "wrap", gap: 6,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.08em" }}>
          {filtered.length} trade{filtered.length !== 1 ? "s" : ""}
        </div>
        <div style={{ display: "flex", gap: w < 440 ? 10 : 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: T.textDim }}>
            <span style={{ width: 18, height: 2.5, background: `linear-gradient(90deg,${T.accentBright || "#8b5cf6"},${lineColor})`, borderRadius: 2, display: "inline-block" }}/>
            Cumul. R
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: T.textDim }}>
            <span style={{ width: 18, height: 0, border: `1px dashed ${T.border}`, display: "inline-block" }}/>
            Breakeven
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: T.textDim }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: `${T.red}44`, display: "inline-block" }}/>
            Drawdown
          </div>
        </div>
      </div>
    </div>
  );
}
