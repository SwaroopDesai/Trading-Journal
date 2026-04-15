"use client"
import { useMemo } from "react";
import { fmtRR } from "@/lib/utils";

const DAYS    = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const SESSIONS = ["Asian","London","London/NY Overlap","New York"];
const SES_SHORT = ["Asian","London","LN/NY","NY"];

// ── helpers ──────────────────────────────────────────────────────────────────
function pf(trades) {
  let gw = 0, gl = 0;
  trades.forEach(t => { if(t.rr > 0) gw += t.rr; else if(t.rr < 0) gl += Math.abs(t.rr); });
  return gl === 0 ? (gw > 0 ? 99 : 0) : +(gw / gl).toFixed(2);
}

function expectancy(trades) {
  if(!trades.length) return 0;
  const wins   = trades.filter(t => t.result === "WIN");
  const losses = trades.filter(t => t.result === "LOSS");
  const wr = wins.length / trades.length;
  const lr = losses.length / trades.length;
  const aw = wins.length   ? wins.reduce((s,t)   => s + Math.abs(t.rr), 0) / wins.length   : 0;
  const al = losses.length ? losses.reduce((s,t) => s + Math.abs(t.rr), 0) / losses.length : 0;
  return +((wr * aw) - (lr * al)).toFixed(2);
}

function streaks(trades) {
  const sorted = [...trades].sort((a,b) => new Date(a.date) - new Date(b.date));
  let maxW = 0, maxL = 0, curW = 0, curL = 0, cur = 0, curType = null;
  sorted.forEach(t => {
    if(t.result === "WIN")  { curW++; curL = 0; if(curW > maxW) maxW = curW; cur = curW; curType = "WIN"; }
    else if(t.result === "LOSS") { curL++; curW = 0; if(curL > maxL) maxL = curL; cur = curL; curType = "LOSS"; }
    else { curW = 0; curL = 0; cur = 0; curType = "BE"; }
  });
  return { maxW, maxL, cur, curType };
}

function dirSplit(trades) {
  const long  = trades.filter(t => t.direction === "LONG");
  const short = trades.filter(t => t.direction === "SHORT");
  const s = arr => {
    const wins = arr.filter(t => t.result === "WIN").length;
    const r    = arr.reduce((s,t) => s + (t.rr||0), 0);
    return { n: arr.length, wins, wr: arr.length ? Math.round(wins/arr.length*100) : 0, r: +r.toFixed(2) };
  };
  return { long: s(long), short: s(short) };
}

function byDay(trades) {
  const map = {};
  DAYS.forEach(d => { map[d] = { r: 0, n: 0, wins: 0 }; });
  trades.forEach(t => {
    if(!t.date) return;
    const d = new Date(t.date);
    // getDay: 0=Sun,1=Mon..6=Sat → map to Mon-Sun index
    const idx = (d.getDay() + 6) % 7;
    const key = DAYS[idx];
    map[key].r    += t.rr || 0;
    map[key].n    += 1;
    if(t.result === "WIN") map[key].wins += 1;
  });
  return DAYS.map(d => ({ day: d, ...map[d], r: +map[d].r.toFixed(2) }));
}

function daySessionGrid(trades) {
  // grid[dayIdx][sessionIdx] = { n, wins }
  const grid = Array.from({length:7}, () => Array.from({length:4}, () => ({n:0,wins:0})));
  trades.forEach(t => {
    if(!t.date) return;
    const dayIdx = (new Date(t.date).getDay() + 6) % 7;
    const sesIdx = SESSIONS.indexOf(t.session);
    if(sesIdx === -1) return;
    grid[dayIdx][sesIdx].n++;
    if(t.result === "WIN") grid[dayIdx][sesIdx].wins++;
  });
  return grid;
}

// ── sub-components ───────────────────────────────────────────────────────────
function StatCard({ T, label, value, sub, color }) {
  return (
    <div style={{
      background: T.surface2, border: `1px solid ${T.border}`,
      borderRadius: 14, padding: "14px 16px", minWidth: 0,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 800, color: color || T.text, lineHeight: 1, letterSpacing: "-0.03em" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionCard({ T, title, children }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px 12px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.accentBright, letterSpacing: "0.1em", textTransform: "uppercase" }}>{title}</div>
      </div>
      <div style={{ padding: "16px 18px" }}>{children}</div>
    </div>
  );
}

function DayBarChart({ T, data }) {
  const vals  = data.map(d => d.r);
  const maxAbs = Math.max(Math.abs(Math.min(...vals)), Math.abs(Math.max(...vals)), 0.1);
  const H = 80, barW = 28, gap = 10;
  const totalW = data.length * (barW + gap) - gap;
  const midY = H / 2;
  const scale = (H / 2 - 6) / maxAbs;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={totalW} height={H + 24} style={{ display: "block", minWidth: "100%" }}>
        {/* zero line */}
        <line x1={0} y1={midY} x2={totalW} y2={midY} stroke={T.border} strokeWidth="1" strokeDasharray="4 6"/>
        {data.map((d, i) => {
          const x   = i * (barW + gap);
          const pos = d.r >= 0;
          const bH  = Math.max(3, Math.abs(d.r) * scale);
          const y   = pos ? midY - bH : midY;
          const col = d.r > 0 ? T.green : d.r < 0 ? T.red : T.border;
          return (
            <g key={d.day}>
              <rect x={x} y={y} width={barW} height={bH} rx={4}
                fill={col} opacity="0.85"/>
              {/* R label above/below bar */}
              <text x={x + barW/2} y={pos ? y - 3 : y + bH + 11}
                textAnchor="middle" fontSize="9" fontWeight="700"
                fill={col} fontFamily="Inter,sans-serif">
                {d.r > 0 ? `+${d.r}` : d.r !== 0 ? d.r : ""}
              </text>
              {/* day label */}
              <text x={x + barW/2} y={H + 16}
                textAnchor="middle" fontSize="10" fontWeight="600"
                fill={T.textDim} fontFamily="Inter,sans-serif">
                {d.day}
              </text>
              {/* trade count dot */}
              {d.n > 0 && (
                <text x={x + barW/2} y={H + 8}
                  textAnchor="middle" fontSize="8"
                  fill={T.muted} fontFamily="Inter,sans-serif">
                  {d.n}t
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DaySessionHeatmap({ T, grid }) {
  const allN = grid.flat().map(c => c.n);
  const hasData = allN.some(n => n > 0);
  if(!hasData) return <div style={{ color: T.muted, fontSize: 12, textAlign: "center", padding: "20px 0" }}>No session data yet</div>;

  const cellColor = (n, wins) => {
    if(n === 0) return T.surface2;
    const wr = wins / n;
    if(wr >= 0.7) return `${T.green}cc`;
    if(wr >= 0.5) return `${T.green}55`;
    if(wr >= 0.35) return `${T.amber || "#f59e0b"}55`;
    return `${T.red}88`;
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: `60px repeat(4, 1fr)`, gap: 4, minWidth: 300 }}>
        {/* header row */}
        <div/>
        {SES_SHORT.map(s => (
          <div key={s} style={{ fontSize: 9, fontWeight: 700, color: T.muted, textAlign: "center", letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 0" }}>{s}</div>
        ))}
        {/* data rows — Mon–Fri only (indices 0–4) */}
        {DAYS.slice(0,5).map((day, di) => (
          <>
            <div key={day} style={{ fontSize: 11, fontWeight: 600, color: T.textDim, display: "flex", alignItems: "center" }}>{day}</div>
            {SESSIONS.map((_, si) => {
              const { n, wins } = grid[di][si];
              const wr = n ? Math.round(wins/n*100) : null;
              return (
                <div key={si} title={n ? `${n} trades · ${wr}% WR` : "No trades"} style={{
                  background: cellColor(n, wins),
                  borderRadius: 8, height: 40,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  border: `1px solid ${T.border}`, cursor: n ? "default" : "default",
                  transition: "opacity .15s",
                }}>
                  {n > 0 ? (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{wr}%</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{n}t</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 9, color: T.muted }}>—</div>
                  )}
                </div>
              );
            })}
          </>
        ))}
      </div>
      {/* legend */}
      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        {[
          { col: `${T.green}cc`, label: "≥70% WR" },
          { col: `${T.green}55`, label: "50–69%" },
          { col: `${T.amber || "#f59e0b"}55`, label: "35–49%" },
          { col: `${T.red}88`, label: "<35%" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: T.textDim }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: l.col, display: "inline-block" }}/>
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function AdvancedStats({ T, trades }) {
  const t = trades.filter(x => x.result !== "BREAKEVEN" || x.rr !== 0); // exclude pure BE

  const profitFactor  = useMemo(() => pf(t), [t]);
  const exp           = useMemo(() => expectancy(t), [t]);
  const { maxW, maxL, cur, curType } = useMemo(() => streaks(t), [t]);
  const { long, short } = useMemo(() => dirSplit(trades), [trades]);
  const dayData       = useMemo(() => byDay(trades), [trades]);
  const grid          = useMemo(() => daySessionGrid(trades), [trades]);

  if(!trades.length) return null;

  const streakColor = curType === "WIN" ? T.green : curType === "LOSS" ? T.red : T.textDim;
  const streakLabel = curType === "WIN" ? `${cur}W streak` : curType === "LOSS" ? `${cur}L streak` : "No streak";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Row 1: Key metrics ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10 }}>
        <StatCard T={T} label="Profit Factor"
          value={profitFactor >= 99 ? "∞" : profitFactor}
          sub="Gross wins ÷ losses"
          color={profitFactor >= 1.5 ? T.green : profitFactor >= 1 ? T.amber || "#f59e0b" : T.red}/>
        <StatCard T={T} label="Expectancy"
          value={`${exp >= 0 ? "+" : ""}${exp}R`}
          sub="Per trade edge"
          color={exp >= 0 ? T.green : T.red}/>
        <StatCard T={T} label="Max Win Streak"
          value={maxW} sub="Consecutive wins" color={T.green}/>
        <StatCard T={T} label="Max Loss Streak"
          value={maxL} sub="Consecutive losses" color={T.red}/>
        <StatCard T={T} label="Current Streak"
          value={cur || "—"} sub={streakLabel} color={streakColor}/>
      </div>

      {/* ── Row 2: Long vs Short ── */}
      <SectionCard T={T} title="Long vs Short">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[{ label: "LONG 📈", d: long, col: T.green }, { label: "SHORT 📉", d: short, col: T.red }].map(({ label, d, col }) => (
            <div key={label} style={{ background: T.surface2, borderRadius: 12, padding: "14px 16px", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: col, marginBottom: 10 }}>{label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { l: "Trades", v: d.n },
                  { l: "Win Rate", v: `${d.wr}%` },
                  { l: "Net R", v: `${d.r >= 0 ? "+" : ""}${d.r}R` },
                  { l: "Wins", v: d.wins },
                ].map(({ l, v }) => (
                  <div key={l}>
                    <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: T.text, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Row 3: P&L by Day ── */}
      <SectionCard T={T} title="P&L by Day of Week">
        <DayBarChart T={T} data={dayData}/>
      </SectionCard>

      {/* ── Row 4: Day × Session heatmap ── */}
      <SectionCard T={T} title="Win Rate — Day × Session">
        <DaySessionHeatmap T={T} grid={grid}/>
      </SectionCard>

    </div>
  );
}
