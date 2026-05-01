"use client"

import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtDate, fmtRR } from "@/lib/utils";

const RANGES = [
  { id:"all", label:"All" },
  { id:"7d",  label:"7D"  },
  { id:"30d", label:"30D" },
  { id:"90d", label:"90D" },
  { id:"6m",  label:"6M"  },
  { id:"1y",  label:"1Y"  },
];

const MODES = [
  { id: "curve", label: "Curve" },
  { id: "trades", label: "Trades" },
  { id: "daily", label: "Daily" },
  { id: "drawdown", label: "DD" },
];

function filterByRange(data, range) {
  if (range === "all" || !data.length) return data;
  const now = new Date();
  const cutoff = new Date(now);
  if (range === "7d") cutoff.setDate(now.getDate() - 7);
  if (range === "30d") cutoff.setDate(now.getDate() - 30);
  if (range === "90d") cutoff.setDate(now.getDate() - 90);
  if (range === "6m") cutoff.setMonth(now.getMonth() - 6);
  if (range === "1y") cutoff.setFullYear(now.getFullYear() - 1);
  const filtered = data.filter(d => d.date && new Date(d.date) >= cutoff);
  if (!filtered.length) return data;
  let cum = 0;
  return filtered.map((d, idx) => {
    const rr = Number(d.rr) || 0;
    cum += rr;
    return normalizePoint(d, idx, cum);
  });
}

function normalizePoint(d, idx, cumulativeR) {
  const rr = Number(d.rr) || 0;
  return {
    ...d,
    idx,
    rr,
    r: Number(cumulativeR) || 0,
    dateLabel: d.date ? fmtDate(d.date) : `#${idx + 1}`,
    tradeLabel: `${idx + 1}`,
  };
}

function buildChartData(data) {
  let cum = 0;
  return [...data]
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      if (da !== db) return da - db;
      return String(a._dbid || a.id || "").localeCompare(String(b._dbid || b.id || ""));
    })
    .map((d, idx) => {
      const rr = Number(d.rr) || 0;
      cum += rr;
      return normalizePoint(d, idx, cum);
    });
}

function buildDrawdown(data) {
  let peak = -Infinity;
  return data.map(point => {
    peak = Math.max(peak, point.r);
    return { ...point, drawdown: point.r - peak };
  });
}

function buildDailyData(data) {
  let cumulative = 0;
  const days = new Map();
  data.forEach(point => {
    const key = point.date || point.dateLabel;
    const current = days.get(key) || { ...point, rr: 0, count: 0, wins: 0, losses: 0 };
    current.rr += point.rr;
    current.count += 1;
    if (point.result === "WIN") current.wins += 1;
    if (point.result === "LOSS") current.losses += 1;
    days.set(key, current);
  });
  return [...days.values()].map((day, idx) => {
    cumulative += day.rr;
    return {
      ...day,
      idx,
      r: cumulative,
      dateLabel: day.date ? fmtDate(day.date) : day.dateLabel,
      tradeLabel: `${idx + 1}`,
      isDaily: true,
    };
  });
}

function clampDomain(min, max) {
  const low = Math.min(0, min);
  const high = Math.max(1, max);
  const pad = Math.max((high - low) * 0.12, 0.5);
  return [Number((low - pad).toFixed(2)), Number((high + pad).toFixed(2))];
}

function CustomTooltip({ active, payload, T }) {
  if (!active || !payload?.length) return null;
  const point = payload.find(item => item?.payload)?.payload;
  if (!point) return null;
  const rr = Number(point.rr) || 0;
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: 10,
      padding: "10px 12px",
      boxShadow: `0 16px 40px ${T.bg}cc`,
      minWidth: 150,
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 7,
      }}>
        <span style={{ fontSize: 13, fontWeight: 850, color: T.text }}>{point.isDaily ? "Daily Net" : point.pair || "Trade"}</span>
        <span style={{ fontSize: 10, color: T.textDim }}>{point.dateLabel}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <TooltipMetric T={T} label={point.isDaily ? "Day" : "Trade"} value={fmtRR(rr)} color={rr >= 0 ? T.green : T.red} />
        <TooltipMetric T={T} label="Total" value={fmtRR(point.r)} color={point.r >= 0 ? T.green : T.red} />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        {point.count > 1 && <TooltipPill T={T} value={`${point.count} trades`} color={T.accentBright} />}
        {point.result && <TooltipPill T={T} value={point.result} color={point.result === "WIN" ? T.green : point.result === "LOSS" ? T.red : T.amber} />}
        {point.session && <TooltipPill T={T} value={point.session} color={T.textDim} />}
        {point.setup && <TooltipPill T={T} value={point.setup} color={T.accentBright} />}
        {point.emotion && <TooltipPill T={T} value={point.emotion} color={T.textDim} />}
      </div>
    </div>
  );
}

function TooltipMetric({ T, label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
      <div style={{
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        fontSize: 15,
        fontWeight: 850,
        color,
        letterSpacing: "-0.04em",
      }}>{value}</div>
    </div>
  );
}

function TooltipPill({ T, value, color }) {
  return (
    <span style={{
      background: `${color}18`,
      border: `1px solid ${color}40`,
      color,
      borderRadius: 999,
      padding: "2px 7px",
      fontSize: 9,
      fontWeight: 800,
    }}>{value}</span>
  );
}

export default function EquityCurve({ T, data = [] }) {
  const [range, setRange] = useState("all");
  const [mode, setMode] = useState("curve");
  const [pair, setPair] = useState("all");
  const isVoid = T.isDark && !T.hardShadow;
  const source = useMemo(() => buildChartData(data), [data]);
  const pairOptions = useMemo(() => {
    const pairs = [...new Set(source.map(point => point.pair).filter(Boolean))].sort();
    return ["all", ...pairs];
  }, [source]);
  const pairFiltered = useMemo(() => pair === "all" ? source : source.filter(point => point.pair === pair), [source, pair]);
  const filtered = useMemo(() => filterByRange(pairFiltered, range), [pairFiltered, range]);
  const drawdown = useMemo(() => buildDrawdown(filtered), [filtered]);
  const daily = useMemo(() => buildDailyData(filtered), [filtered]);
  const activeData = mode === "daily" ? daily : mode === "drawdown" ? drawdown : filtered;
  const allR = filtered.map(d => d.r);
  const allTradeR = filtered.map(d => d.rr);
  const netR = filtered.length ? filtered[filtered.length - 1].r : 0;
  const peak = filtered.length ? Math.max(0, ...allR) : 0;
  const minR = filtered.length ? Math.min(0, ...allR) : 0;
  const maxR = filtered.length ? Math.max(0, ...allR) : 1;
  const maxDD = drawdown.length ? Math.min(0, ...drawdown.map(d => d.drawdown)) : 0;
  const domain = clampDomain(minR, maxR);
  const tradeDomain = clampDomain(Math.min(0, ...allTradeR), Math.max(0, ...allTradeR));
  const ddDomain = clampDomain(maxDD, 0);
  const dailyDomain = clampDomain(Math.min(0, ...daily.map(d => d.rr)), Math.max(0, ...daily.map(d => d.rr)));

  if (!data.length) {
    return (
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: "48px 24px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 16, fontWeight: 850, color: T.text, marginBottom: 6 }}>No equity data yet</div>
        <div style={{ fontSize: 12, color: T.textDim }}>Log your first trade to start building your curve.</div>
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
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        flexWrap: "wrap",
        padding: "12px 14px 10px",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div aria-hidden="true" style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            display: "grid",
            placeItems: "center",
            color: T.accentBright,
            background: isVoid ? "linear-gradient(135deg, rgba(99,102,241,0.24), rgba(52,211,153,0.12))" : T.surface2,
            border: `1px solid ${T.border}`,
            fontSize: 12,
            fontWeight: 900,
          }}>EQ</div>
          <div style={{ minWidth: 118 }}>
            <div style={{ fontSize: 13, fontWeight: 850, color: T.text, letterSpacing: "-0.02em" }}>Equity Curve</div>
            <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>{pair === "all" ? "All pairs" : pair} - {mode}</div>
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            color: netR >= 0 ? T.green : T.red,
            fontSize: 20,
            fontWeight: 900,
            letterSpacing: "-0.05em",
            lineHeight: 1,
          }}>{fmtRR(netR)}</span>
          <span style={{ fontSize: 10, color: T.muted }}>pk <b style={{ color: T.green }}>{fmtRR(peak)}</b></span>
          {maxDD < 0 && <span style={{ fontSize: 10, color: T.muted }}>dd <b style={{ color: T.red }}>{fmtRR(maxDD)}</b></span>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <select
            aria-label="Filter equity chart by pair"
            value={pair}
            onChange={event => setPair(event.target.value)}
            style={{
              background: T.surface2,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              color: T.text,
              cursor: "pointer",
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: 10,
              fontWeight: 850,
              minHeight: 30,
              padding: "0 24px 0 9px",
              textTransform: "uppercase",
            }}
          >
            {pairOptions.map(item => <option key={item} value={item}>{item === "all" ? "All Pairs" : item}</option>)}
          </select>
          <div style={{
            display: "flex",
            gap: 2,
            background: T.surface2,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            padding: 2,
          }}>
            {MODES.map(item => (
              <button key={item.id} onClick={() => setMode(item.id)} style={{
                background: mode === item.id ? T.accent : "transparent",
                border: "none",
                borderRadius: 6,
                color: mode === item.id ? "#fff" : T.textDim,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: 10,
                fontWeight: 850,
                letterSpacing: "0.03em",
                minHeight: 24,
                padding: "2px 9px",
              }}>{item.label}</button>
            ))}
          </div>
          <div style={{
            display: "flex",
            gap: 2,
            background: T.surface2,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            padding: 2,
          }}>
            {RANGES.map(r => (
              <button key={r.id} onClick={() => setRange(r.id)} style={{
                background: range === r.id ? T.accent : "transparent",
                border: "none",
                borderRadius: 6,
                color: range === r.id ? "#fff" : T.textDim,
                cursor: "pointer",
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.03em",
                minHeight: 24,
                padding: "2px 8px",
              }}>{r.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 250, padding: "8px 8px 0 0" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={activeData} margin={{ top: 12, right: 18, bottom: 8, left: 2 }}>
            <defs>
              <linearGradient id="fx-equity-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={netR >= 0 ? T.green : T.red} stopOpacity="0.28" />
                <stop offset="100%" stopColor={netR >= 0 ? T.green : T.red} stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="fx-dd-main-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.red} stopOpacity="0.34" />
                <stop offset="100%" stopColor={T.red} stopOpacity="0.04" />
              </linearGradient>
              <linearGradient id="fx-equity-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={T.border} strokeDasharray="2 10" vertical={false} opacity={0.36} />
            <XAxis
              dataKey="dateLabel"
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
              tick={{ fill: T.muted, fontSize: 10, fontFamily: "var(--font-geist-sans)" }}
            />
            <YAxis
              yAxisId="equity"
              width={46}
              domain={mode === "drawdown" ? ddDomain : domain}
              axisLine={false}
              tickLine={false}
              tickFormatter={value => value >= 0 ? `+${value}` : value}
              tick={{ fill: T.textDim, fontSize: 10, fontFamily: "'JetBrains Mono','Fira Code',monospace" }}
            />
            {(mode === "trades" || mode === "daily") && (
              <YAxis
                yAxisId="trade"
                orientation="right"
                width={36}
                domain={mode === "daily" ? dailyDomain : tradeDomain}
                axisLine={false}
                tickLine={false}
                tickFormatter={value => value >= 0 ? `+${value}` : value}
                tick={{ fill: T.muted, fontSize: 9, fontFamily: "'JetBrains Mono','Fira Code',monospace" }}
              />
            )}
            <ReferenceLine yAxisId="equity" y={0} stroke={T.border} strokeDasharray="5 8" strokeOpacity={0.9} />
            {(mode === "trades" || mode === "daily") && (
              <ReferenceLine yAxisId="trade" y={0} stroke={T.border} strokeDasharray="3 7" strokeOpacity={0.45} />
            )}
            <Tooltip
              cursor={{ stroke: T.border, strokeWidth: 1, strokeDasharray: "3 5" }}
              content={<CustomTooltip T={T} />}
            />
            {mode === "curve" && (
              <Area
                yAxisId="equity"
                type="monotone"
                dataKey="r"
                fill="url(#fx-equity-fill)"
                stroke="none"
                isAnimationActive
                animationDuration={650}
              />
            )}
            {mode === "drawdown" && (
              <Area
                yAxisId="equity"
                type="linear"
                dataKey="drawdown"
                fill="url(#fx-dd-main-fill)"
                stroke={T.red}
                strokeWidth={2}
                isAnimationActive
                animationDuration={550}
              />
            )}
            {(mode === "trades" || mode === "daily") && (
              <Bar
                yAxisId="trade"
                dataKey="rr"
                radius={[4, 4, 4, 4]}
                barSize={filtered.length > 30 ? 5 : 10}
                isAnimationActive
                animationDuration={500}
              >
                {activeData.map(point => (
                  <Cell
                    key={`trade-bar-${point.idx}`}
                    fill={point.rr >= 0 ? T.green : T.red}
                    fillOpacity={point.rr >= 0 ? 0.34 : 0.42}
                    stroke={point.rr >= 0 ? T.green : T.red}
                    strokeOpacity={0.8}
                  />
                ))}
              </Bar>
            )}
            {mode !== "drawdown" && (
              <Line
                yAxisId="equity"
                type={mode === "trades" ? "stepAfter" : "monotone"}
                dataKey="r"
                stroke={isVoid ? "url(#fx-equity-line)" : (netR >= 0 ? T.green : T.red)}
                strokeWidth={isVoid ? 2.5 : 3}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={point => {
                  const payload = point.payload;
                  const color = payload.result === "LOSS" ? T.red : payload.result === "WIN" ? T.green : T.amber;
                  const isLast = isVoid && point.index === activeData.length - 1;
                  if (isLast) {
                    return (
                      <g key={`equity-dot-${payload.idx}`}>
                        <circle cx={point.cx} cy={point.cy} r={13} fill={color} opacity="0.15" />
                        <circle cx={point.cx} cy={point.cy} r={9} fill={color} opacity="0.30" />
                        <circle cx={point.cx} cy={point.cy} r={5} fill={color} stroke={T.surface} strokeWidth={2} />
                      </g>
                    );
                  }
                  return <circle key={`equity-dot-${payload.idx}`} cx={point.cx} cy={point.cy} r={3.5} fill={color} stroke={T.surface} strokeWidth={2} />;
                }}
                activeDot={isVoid ? { r: 7, stroke: "#34d399", strokeWidth: 2, fill: T.surface } : { r: 6, stroke: T.surface, strokeWidth: 3 }}
                isAnimationActive
                animationDuration={650}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {maxDD < 0 && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "6px 8px 8px 0" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0 14px 4px",
            color: T.muted,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            <span>Drawdown</span>
            <span style={{ color: T.red, fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>{fmtRR(maxDD)}</span>
          </div>
          <div style={{ height: 70 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={drawdown} margin={{ top: 2, right: 18, bottom: 0, left: 2 }}>
                <defs>
                  <linearGradient id="fx-dd-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.red} stopOpacity="0.34" />
                    <stop offset="100%" stopColor={T.red} stopOpacity="0.04" />
                  </linearGradient>
                </defs>
                <YAxis hide domain={[maxDD, 0]} />
                <XAxis hide dataKey="dateLabel" />
                <ReferenceLine y={0} stroke={T.border} strokeOpacity={0.65} />
                <Area type="linear" dataKey="drawdown" fill="url(#fx-dd-fill)" stroke={T.red} strokeWidth={1.6} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
