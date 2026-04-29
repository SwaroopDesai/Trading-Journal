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
    m[i] = slope[i-1] * slope[i] <= 0 ? 0 : (slope[i-1] + slope[i]) / 2;
  }
  m[n-1] = slope[n-2];
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(slope[i]) < 1e-12) { m[i] = m[i+1] = 0; continue; }
    alpha[i] = m[i] / slope[i]; beta[i] = m[i+1] / slope[i];
    const h = Math.hypot(alpha[i], beta[i]);
    if (h > 3) { const t = 3/h; m[i] = t*alpha[i]*slope[i]; m[i+1] = t*beta[i]*slope[i]; }
  }
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const x1 = pts[i].x + dx[i]/3, y1 = pts[i].y + (dx[i]/3)*m[i];
    const x2 = pts[i+1].x - dx[i]/3, y2 = pts[i+1].y - (dx[i]/3)*m[i+1];
    d += ` C ${x1},${y1} ${x2},${y2} ${pts[i+1].x},${pts[i+1].y}`;
  }
  return d;
}

const fmtStat = fmtRR;

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
      setSize({ w: Math.max(w, 200), h: Math.round(Math.max(w * 0.10, 80)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const filtered = filterByRange(data, range);

  const netPL  = filtered.length ? filtered[filtered.length - 1].r : 0;
  const peak   = filtered.length ? Math.max(0, ...filtered.map(d => d.r)) : 0;
  const trough = filtered.length ? Math.min(0, ...filtered.map(d => d.r)) : 0;
  let peakSoFar = -Infinity, maxDD = 0;
  filtered.forEach(d => {
    if (d.r > peakSoFar) peakSoFar = d.r;
    const dd = d.r - peakSoFar;
    if (dd < maxDD) maxDD = dd;
  });

  const { w, h } = size;
  const PL = 0, PR = 0, PT = 8, PB = 8;
  const cW = w - PL - PR;
  const cH = h - PT - PB;

  const allR = filtered.map(d => d.r);
  const minR = filtered.length ? Math.min(0, ...allR) : 0;
  const maxR = filtered.length ? Math.max(0, ...allR) : 1;
  const rng  = maxR - minR || 1;

  const px = i => PL + (i / Math.max(filtered.length - 1, 1)) * cW;
  const py = v => PT + cH - ((v - minR) / rng) * cH;

  const pts  = filtered.map((d, i) => ({ x: px(i), y: py(d.r), d, i }));
  const line = smoothPath(pts);
  const last = pts[pts.length - 1];
  const lineColor = netPL >= 0 ? T.green : T.red;

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
        borderRadius: 16, padding: "32px 24px",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: `${T.accentBright}15`, border: `1px solid ${T.accentBright}25`,
          display: "grid", placeItems: "center",
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <polyline points="2,14 6,9 10,11 16,4" stroke={T.accentBright} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div style={{ fontFamily:"'Cabinet Grotesk','Satoshi',sans-serif", fontSize: 14, fontWeight: 800, color: T.text, letterSpacing:"-0.02em" }}>No trades yet</div>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>Log a trade to see your equity curve.</div>
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

      {/* ── Top row: title + P&L + range pills ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px 10px",
        gap: 12, flexWrap: "wrap",
      }}>
        {/* Left: title + live P&L */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{
            fontFamily: "'Cabinet Grotesk','Satoshi',sans-serif",
            fontSize: 13, fontWeight: 700,
            color: T.textDim, letterSpacing: "0.01em",
          }}>
            Equity Curve
          </span>
          <span style={{
            fontFamily: "'Cabinet Grotesk','Satoshi',sans-serif",
            fontSize: 22, fontWeight: 900,
            color: lineColor, letterSpacing: "-0.05em", lineHeight: 1,
          }}>
            {fmtStat(netPL)}
          </span>
          <span style={{ fontSize: 11, color: T.muted }}>R cumulative</span>
        </div>

        {/* Right: range pills */}
        <div style={{
          display: "flex", gap: 2,
          background: T.surface2, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: 2,
        }}>
          {RANGES.map(r => (
            <button key={r.id} onClick={() => setRange(r.id)} style={{
              background: range === r.id ? T.accent : "transparent",
              color: range === r.id ? "#fff" : T.textDim,
              border: "none", borderRadius: 6,
              padding: "3px 9px",
              fontSize: 10, fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Cabinet Grotesk','Satoshi',sans-serif",
              transition: "background .12s, color .12s",
              letterSpacing: "0.03em",
            }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Inline mini stats ── */}
      <div style={{
        display: "flex", gap: 0,
        padding: "0 16px 12px",
        flexWrap: "wrap",
      }}>
        {[
          { label: "Peak",    val: fmtStat(peak),   color: T.green },
          { label: "Trough",  val: fmtStat(trough), color: trough < 0 ? T.red : T.muted },
          { label: "Max DD",  val: fmtStat(maxDD),  color: maxDD < 0 ? T.red : T.muted },
          { label: "Trades",  val: filtered.length, color: T.textDim },
        ].map((s, i) => (
          <div key={s.label} style={{
            paddingRight: 16, marginRight: 16,
            borderRight: i < 3 ? `1px solid ${T.border}` : "none",
            lineHeight: 1,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 3 }}>{s.label}</div>
            <div style={{
              fontFamily: "'Cabinet Grotesk','Satoshi',sans-serif",
              fontSize: 13, fontWeight: 800,
              color: s.color, letterSpacing: "-0.03em",
            }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* ── Spark chart ── */}
      <div ref={wrapRef} style={{ position: "relative", minHeight: w > 0 ? h : 80 }}>
        {w > 0 && <svg
          ref={svgRef}
          width={w} height={h}
          viewBox={`0 0 ${w} ${h}`}
          style={{ display: "block", width: "100%", height: "auto", cursor: "crosshair" }}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          onClick={() => { if (tooltip) setSel(s => s?.i === tooltip.idx ? null : { ...tooltip.pt.d, i: tooltip.idx }); }}
        >
          <defs>
            <filter id="ec-glow" x="-20%" y="-80%" width="140%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur"/>
              <feColorMatrix in="blur" type="saturate" values="2" result="sat"/>
              <feMerge>
                <feMergeNode in="sat"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="ec-dot-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Zero baseline — only if in view */}
          {(() => { const z0 = py(0); return z0 > PT && z0 < PT + cH ? (
            <line x1={0} y1={z0} x2={w} y2={z0}
              stroke={T.border} strokeWidth="1" strokeDasharray="4 8" opacity="0.7"/>
          ) : null; })()}

          {/* Spark line */}
          {line && (
            <path
              d={line} fill="none"
              stroke={lineColor} strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              filter="url(#ec-glow)"
            />
          )}

          {/* Hover crosshair */}
          {tooltip && (() => {
            const p = tooltip.pt;
            return (
              <>
                <line x1={p.x} y1={PT} x2={p.x} y2={PT + cH}
                  stroke={lineColor} strokeWidth="1" strokeDasharray="3 4" opacity="0.35"/>
                <circle cx={p.x} cy={p.y} r="4"
                  fill={lineColor} stroke={T.surface} strokeWidth="2"/>
              </>
            );
          })()}

          {/* Animated endpoint */}
          {last && !tooltip && (
            <>
              <circle cx={last.x} cy={last.y} r="10" fill={lineColor} opacity="0.10" filter="url(#ec-dot-glow)">
                <animate attributeName="r" values="8;16;8" dur="2.6s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.10;0;0.10" dur="2.6s" repeatCount="indefinite"/>
              </circle>
              <circle cx={last.x} cy={last.y} r="4" fill={lineColor} stroke={T.surface} strokeWidth="2"/>
            </>
          )}
        </svg>}

        {/* Tooltip */}
        {tooltip && (() => {
          const { pt, screenX } = tooltip;
          const d = pt.d;
          const r = d.rr || 0;
          const left = Math.min(Math.max(screenX - 72, 8), w - 160);
          const above = pt.y / h > 0.5;
          return (
            <div style={{
              position: "absolute",
              left, top: above ? 4 : h + 4,
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 10, padding: "9px 12px",
              pointerEvents: "none", zIndex: 20,
              boxShadow: `0 12px 32px ${T.bg}bb`,
              minWidth: 148,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: "0.08em", marginBottom: 6 }}>
                {d.date ? fmtDate(d.date) : `Trade #${pt.i + 1}`}
              </div>
              {d.pair && <div style={{ fontFamily:"'Cabinet Grotesk','Satoshi',sans-serif", fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 6, letterSpacing:"-0.02em" }}>{d.pair}</div>}
              <div style={{ display: "flex", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 9, color: T.muted, marginBottom: 2 }}>TRADE</div>
                  <div style={{ fontFamily:"'Cabinet Grotesk','Satoshi',sans-serif", fontSize: 15, fontWeight: 900, color: r >= 0 ? T.green : T.red, letterSpacing:"-0.04em" }}>{fmtStat(r)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: T.muted, marginBottom: 2 }}>TOTAL</div>
                  <div style={{ fontFamily:"'Cabinet Grotesk','Satoshi',sans-serif", fontSize: 15, fontWeight: 900, color: d.r >= 0 ? T.green : T.red, letterSpacing:"-0.04em" }}>{fmtStat(d.r)}</div>
                </div>
              </div>
              {d.result && (
                <div style={{
                  marginTop: 7, display: "inline-block",
                  padding: "2px 8px", borderRadius: 5, fontSize: 9, fontWeight: 700,
                  background: d.result === "WIN" ? `${T.green}20` : d.result === "LOSS" ? `${T.red}20` : `${T.amber}20`,
                  color: d.result === "WIN" ? T.green : d.result === "LOSS" ? T.red : T.amber,
                }}>{d.result}</div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Date range labels */}
      {filtered.length > 1 && (
        <div style={{
          display: "flex", justifyContent: "space-between",
          padding: "6px 14px 10px",
          fontSize: 10, color: T.muted, fontFamily: "'Satoshi',sans-serif", fontWeight: 600,
        }}>
          <span>{filtered[0].date ? fmtDate(filtered[0].date) : "First"}</span>
          <span>{filtered[filtered.length-1].date ? fmtDate(filtered[filtered.length-1].date) : "Latest"}</span>
        </div>
      )}

      {/* ── Selected trade panel ── */}
      {selectedTrade && (() => {
        const d = selectedTrade;
        const r = d.rr || 0;
        const resultColor = d.result === "WIN" ? T.green : d.result === "LOSS" ? T.red : (T.amber || "#f59e0b");
        return (
          <div style={{ borderTop: `1px solid ${T.border}`, background: T.surface2, padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily:"'Cabinet Grotesk','Satoshi',sans-serif", fontSize: 16, fontWeight: 900, color: T.accentBright, letterSpacing:"-0.04em" }}>{d.pair || "Trade"}</span>
                {d.direction && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: d.direction === "LONG" ? `${T.green}20` : `${T.red}20`, color: d.direction === "LONG" ? T.green : T.red }}>{d.direction}</span>}
                {d.date && <span style={{ fontSize: 11, color: T.muted }}>{fmtDate(d.date)}</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {d.result && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 9px", borderRadius: 6, background: `${resultColor}20`, color: resultColor }}>{d.result}</span>}
                <span style={{ fontFamily:"'Cabinet Grotesk','Satoshi',sans-serif", fontSize: 17, fontWeight: 900, color: r >= 0 ? T.green : T.red, letterSpacing:"-0.05em" }}>{fmtStat(r)}</span>
                <button onClick={() => setSel(null)} style={{ background:"none", border:`1px solid ${T.border}`, color:T.muted, width:26, height:26, borderRadius:7, cursor:"pointer", fontSize:15, display:"grid", placeItems:"center" }}>×</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(80px,1fr))", gap: 6 }}>
              {[
                { l:"Setup", v:d.setup }, { l:"Emotion", v:d.emotion },
                { l:"Pips", v:d.pips ? `${d.pips>=0?"+":""}${d.pips}` : null },
                { l:"Entry", v:d.entry||null },
              ].filter(x=>x.v).map(x=>(
                <div key={x.l} style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:"7px 10px" }}>
                  <div style={{ fontSize:9, fontWeight:700, color:T.muted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>{x.l}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{x.v}</div>
                </div>
              ))}
            </div>
            {d.notes && <div style={{ marginTop:8, fontSize:12, color:T.textDim, lineHeight:1.6, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 12px" }}>{d.notes}</div>}
          </div>
        );
      })()}
    </div>
  );
}
