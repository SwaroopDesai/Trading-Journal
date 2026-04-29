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
function smoothPath(pts) {
  if (pts.length < 2) return pts.length === 1 ? `M ${pts[0].x},${pts[0].y}` : "";
  const n = pts.length;
  const dx = [], dy = [], slope = [], alpha = [], beta = [];

  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i+1].x - pts[i].x;
    dy[i] = pts[i+1].y - pts[i].y;
    slope[i] = dy[i] / dx[i];
  }

  const m = new Array(n);
  m[0] = slope[0];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i-1] * slope[i] <= 0) { m[i] = 0; }
    else { m[i] = (slope[i-1] + slope[i]) / 2; }
  }
  m[n-1] = slope[n-2];

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

const fmtStat = fmtRR;

// ── Main component ─────────────────────────────────────────────────────────
export default function EquityCurve({ T, data = [] }) {
  const [range, setRange]       = useState("all");
  const [tooltip, setTip]       = useState(null);
  const [selectedTrade, setSel] = useState(null);
  const [size, setSize]         = useState({ w: 0, h: 0 });
  const wrapRef = useRef(null);
  const svgRef  = useRef(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setSize({ w: Math.max(w, 200), h: Math.round(Math.max(w * 0.26, 180)) });
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
    { label:"Net P&L",   val: fmtStat(netPL), color: netPL  >= 0 ? T.green : T.red,    icon: netPL >= 0 ? "↑" : "↓" },
    { label:"Peak",      val: fmtStat(peak),  color: T.green,                            icon: "◈" },
    { label:"Trough",    val: fmtStat(trough),color: trough < 0 ? T.red : T.textDim,    icon: "◇" },
    { label:"Max DD",    val: fmtStat(maxDD), color: maxDD  < 0 ? T.red : T.textDim,    icon: "▾" },
  ];

  // ── Layout ────────────────────────────────────────────────────────────────
  const { w, h } = size;
  const PL = 24, PR = 24, PT = 20, PB = 34;
  const cW = w - PL - PR;
  const cH = h - PT - PB;

  const allR  = filtered.map(d => d.r);
  const minR  = filtered.length ? Math.min(0, ...allR) : 0;
  const maxR  = filtered.length ? Math.max(0, ...allR) : 1;
  const rng   = maxR - minR || 1;

  const px  = i => PL + (i / Math.max(filtered.length - 1, 1)) * cW;
  const py  = v => PT + cH - ((v - minR) / rng) * cH;
  const z0  = py(0);

  const pts = filtered.map((d, i) => ({ x: px(i), y: py(d.r), d, i }));
  const line  = smoothPath(pts);
  const area  = pts.length > 1
    ? `${line} L ${pts[pts.length-1].x},${z0} L ${pts[0].x},${z0} Z`
    : "";

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

  const last      = pts[pts.length - 1];
  const lineColor = netPL >= 0 ? T.green : T.red;
  const gridYs    = [0.25, 0.5, 0.75].map(f => PT + cH * f);

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
        borderRadius: 20, padding: "56px 28px", textAlign: "center",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, margin: "0 auto 18px",
          background: `${T.accentBright}15`, border: `1px solid ${T.accentBright}30`,
          display: "grid", placeItems: "center",
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <polyline points="2,17 7,10 12,13 20,4" stroke={T.accentBright} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ fontFamily:"'Cabinet Grotesk','Satoshi',sans-serif", fontSize: 18, fontWeight: 900, color: T.text, marginBottom: 8, letterSpacing: "-0.03em" }}>
          No equity data yet
        </div>
        <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.6 }}>
          Log your first trade and watch your R-growth curve build in real time.
        </div>
      </div>
    );
  }

  const FSIZE = Math.max(10, Math.min(12, w / 80));

  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 20,
      overflow: "hidden",
      // Premium top accent line in the P&L color
      boxShadow: `inset 0 2px 0 0 ${lineColor}60`,
    }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: w < 440 ? "14px 14px 10px" : "16px 20px 12px",
        gap: 8, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11,
            background: `${lineColor}18`,
            border: `1px solid ${lineColor}30`,
            display: "grid", placeItems: "center", flexShrink: 0,
          }}>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <polyline points="1,13 5.5,7.5 9.5,10 16,3" stroke={lineColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily:"'Cabinet Grotesk','Satoshi',sans-serif", fontSize: 15, fontWeight: 900, color: T.text, letterSpacing: "-0.04em", lineHeight: 1.2 }}>
              Equity Curve
            </div>
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 1 }}>
              Cumulative R-Growth
            </div>
          </div>
        </div>

        {/* Range pills */}
        <div style={{
          display: "flex", gap: 2,
          background: T.surface2,
          border: `1px solid ${T.border}`,
          borderRadius: 10, padding: 3,
        }}>
          {RANGES.map(r => (
            <button key={r.id} onClick={() => setRange(r.id)} style={{
              background: range === r.id ? lineColor : "transparent",
              color: range === r.id ? "#fff" : T.textDim,
              border: "none", borderRadius: 7,
              padding: w < 440 ? "4px 8px" : "5px 12px",
              fontSize: w < 440 ? 10 : 11, fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Cabinet Grotesk','Satoshi',sans-serif",
              transition: "background .15s, color .15s",
              letterSpacing: "0.02em",
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
            borderTop: `1px solid ${T.border}`,
            borderBottom: `1px solid ${T.border}`,
          }}>
            {statCards.map((s, i) => {
              const borderRight = cols2
                ? (i % 2 === 0 ? `1px solid ${T.border}` : "none")
                : (i < 3 ? `1px solid ${T.border}` : "none");
              const borderBottom = cols2 && i < 2 ? `1px solid ${T.border}` : "none";
              return (
                <div key={s.label} style={{
                  padding: cols2 ? "12px 14px" : "14px 20px",
                  borderRight, borderBottom,
                  background: i === 0 ? `${s.color}08` : "transparent",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 5,
                    marginBottom: 7,
                  }}>
                    <span style={{ fontSize: 10, color: s.color, fontWeight: 800, lineHeight: 1 }}>{s.icon}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>{s.label}</span>
                  </div>
                  <div style={{
                    fontFamily: "'Cabinet Grotesk','Satoshi',sans-serif",
                    fontSize: cols2 ? 19 : "clamp(19px,2.6vw,28px)",
                    fontWeight: 900,
                    color: s.color,
                    letterSpacing: "-0.05em",
                    lineHeight: 1,
                  }}>{s.val}</div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── Chart ── */}
      <div ref={wrapRef} style={{ position: "relative", minHeight: w > 0 ? h : 120 }}>
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
            <linearGradient id="ec-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={lineColor} stopOpacity="0.28"/>
              <stop offset="50%"  stopColor={lineColor} stopOpacity="0.08"/>
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.00"/>
            </linearGradient>
            <linearGradient id="ec-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={T.accentBright || "#8b5cf6"}/>
              <stop offset="100%" stopColor={lineColor}/>
            </linearGradient>
            <filter id="ec-glow" x="-40%" y="-80%" width="180%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1"/>
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2"/>
              <feColorMatrix in="blur2" type="saturate" values="2.5" result="sat"/>
              <feMerge>
                <feMergeNode in="sat"/>
                <feMergeNode in="blur1"/>
                <feMergeNode in="blur1"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
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
              stroke={T.border} strokeWidth="1" strokeDasharray="3 8" opacity="0.5"/>
          ))}

          {/* Zero baseline */}
          {z0 > PT && z0 < PT + cH && (
            <line x1={PL} y1={z0} x2={w - PR} y2={z0}
              stroke={T.border} strokeWidth="1.5" strokeDasharray="5 9" opacity="0.85"/>
          )}

          {/* Drawdown band */}
          {ddPath && <path d={ddPath} fill={`${T.red}1e`} stroke="none"/>}

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

          {/* Trade dots */}
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
                opacity={isSel ? 1 : 0.75}
              />
            );
          })}

          {/* Hover crosshair */}
          {tooltip && (() => {
            const p = tooltip.pt;
            return (
              <>
                <line x1={p.x} y1={PT} x2={p.x} y2={PT + cH}
                  stroke={lineColor} strokeWidth="1" strokeDasharray="4 4" opacity="0.45"/>
                <circle cx={p.x} cy={p.y} r="5"
                  fill={lineColor} stroke={T.surface} strokeWidth="2.5"/>
              </>
            );
          })()}

          {/* Animated endpoint */}
          {last && !tooltip && (
            <>
              <circle cx={last.x} cy={last.y} r="12" fill={lineColor} opacity="0.10" filter="url(#ec-dot-glow)">
                <animate attributeName="r" values="10;20;10" dur="2.8s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.10;0;0.10" dur="2.8s" repeatCount="indefinite"/>
              </circle>
              <circle cx={last.x} cy={last.y} r="5" fill={lineColor} stroke={T.surface} strokeWidth="2.5"/>
            </>
          )}

          {/* Date labels */}
          {filtered.length > 0 && (
            <>
              <text x={PL + 2} y={h - 10} fill={T.muted}
                fontSize={FSIZE} fontWeight="600" fontFamily="'Satoshi',sans-serif">
                {filtered[0].date ? fmtDate(filtered[0].date) : "First"}
              </text>
              <text x={w - PR - 2} y={h - 10} fill={T.muted} textAnchor="end"
                fontSize={FSIZE} fontWeight="600" fontFamily="'Satoshi',sans-serif">
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
          const left = Math.min(Math.max(screenX - 80, 8), w - 180);
          const above = pt.y / h > 0.55;
          return (
            <div style={{
              position: "absolute",
              left, top: above ? pt.y - 108 : pt.y + 18,
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 14, padding: "12px 16px",
              pointerEvents: "none", zIndex: 20,
              boxShadow: `0 20px 48px ${T.bg}cc, 0 2px 8px ${T.bg}66`,
              minWidth: 172,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.08em", marginBottom: 7 }}>
                {d.date ? fmtDate(d.date) : `Trade #${pt.i + 1}`}
              </div>
              {d.pair && (
                <div style={{ fontFamily:"'Cabinet Grotesk','Satoshi',sans-serif", fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 8, letterSpacing: "-0.02em" }}>{d.pair}</div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 9, color: T.muted, letterSpacing: "0.08em", marginBottom: 3 }}>THIS TRADE</div>
                  <div style={{ fontFamily:"'Cabinet Grotesk','Satoshi',sans-serif", fontSize: 17, fontWeight: 900, color: r >= 0 ? T.green : T.red, letterSpacing: "-0.04em" }}>
                    {fmtStat(r)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: T.muted, letterSpacing: "0.08em", marginBottom: 3 }}>CUMULATIVE</div>
                  <div style={{ fontFamily:"'Cabinet Grotesk','Satoshi',sans-serif", fontSize: 17, fontWeight: 900, color: d.r >= 0 ? T.green : T.red, letterSpacing: "-0.04em" }}>
                    {fmtStat(d.r)}
                  </div>
                </div>
              </div>
              {d.result && (
                <div style={{
                  marginTop: 9, display: "inline-block",
                  padding: "3px 9px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                  background: d.result === "WIN" ? `${T.green}22` : d.result === "LOSS" ? `${T.red}22` : `${T.amber || "#f59e0b"}22`,
                  color:      d.result === "WIN" ? T.green          : d.result === "LOSS" ? T.red        : (T.amber || "#f59e0b"),
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
            borderTop: `1px solid ${T.border}`,
            background: T.surface2,
            padding: "14px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily:"'Cabinet Grotesk','Satoshi',sans-serif", fontSize: 18, fontWeight: 900, color: T.accentBright, letterSpacing: "-0.04em" }}>{d.pair || "Trade"}</span>
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
                <span style={{ fontFamily:"'Cabinet Grotesk','Satoshi',sans-serif", fontSize: 20, fontWeight: 900, color: r >= 0 ? T.green : T.red, letterSpacing: "-0.05em" }}>
                  {fmtStat(r)}
                </span>
                <button onClick={() => setSel(null)} style={{
                  background: "none", border: `1px solid ${T.border}`, color: T.muted,
                  width: 28, height: 28, borderRadius: 8, cursor: "pointer", fontSize: 16,
                  display: "grid", placeItems: "center",
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
                <div key={x.l} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 12px" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{x.l}</div>
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
        padding: w < 440 ? "8px 14px" : "9px 20px",
        borderTop: `1px solid ${T.border}`,
        flexWrap: "wrap", gap: 6,
      }}>
        <div style={{ fontFamily:"'Satoshi',sans-serif", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.06em" }}>
          {filtered.length} trade{filtered.length !== 1 ? "s" : ""}
        </div>
        <div style={{ display: "flex", gap: w < 440 ? 10 : 18, alignItems: "center", flexWrap: "wrap" }}>
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
