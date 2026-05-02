"use client"

import { useEffect, useMemo, useState } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent } from "framer-motion";
import { EmptyState, Btn, Badge } from "@/components/ui";
import EquityCurve from "@/components/EquityCurve";
import DashboardCharts from "@/components/DashboardCharts";
import InsightCards from "@/components/InsightCards";
import MonthlyReturns from "@/components/MonthlyReturns";
import { fmtDate, fmtRR, getWeeklyPairNotes } from "@/lib/utils";

const FONT_NUM = "'JetBrains Mono','Fira Code',monospace";

function AnimatedNumber({ target, active, format }) {
  const value = useMotionValue(active ? 0 : target);
  const [display, setDisplay] = useState(format(active ? 0 : target));

  useMotionValueEvent(value, "change", latest => {
    setDisplay(format(latest));
  });

  useEffect(() => {
    const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduceMotion || !active) {
      value.set(target);
      return;
    }
    value.set(0);
    const controls = animate(value, target, {
      duration: 0.75,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [active, format, target, value]);

  return (
    <motion.span
      key={target}
      initial={{ opacity: 0.7, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      {display}
    </motion.span>
  );
}

function MiniSparkline({ T, data = [], color }) {
  const points = data.slice(-7).map(point => Number(point?.r) || 0);
  if (points.length < 2) {
    return <div style={{ height: 28, margin: "1px 0 4px" }} aria-hidden="true" />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 112;
  const height = 28;
  const path = points.map((point, index) => {
    const x = (index / (points.length - 1)) * width;
    const y = height - 5 - ((point - min) / range) * (height - 10);
    return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  return (
    <svg width="100%" height="28" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true" style={{ display: "block", margin: "1px 0 4px", opacity: 0.86 }}>
      <path d={`M 0 ${height - 5} L ${width} ${height - 5}`} stroke={T.border} strokeWidth="1" strokeDasharray="4 6" opacity="0.45" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BentoTile({ T, children, style, compact = false, interactive = true, delay = 0, accent }) {
  const isVoid = T.isDark && !T.hardShadow;
  const glow = accent || T.accentBright;

  function handlePointerMove(event) {
    if (!isVoid || !interactive) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={interactive ? { y: -2 } : undefined}
      onPointerMove={handlePointerMove}
      style={{
        position: "relative",
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
        borderRadius: T.hardShadow ? 4 : 16,
        border: `1px solid ${T.border}`,
        background: isVoid
          ? `radial-gradient(360px circle at var(--mx, 70%) var(--my, 30%), ${glow}20, transparent 62%), linear-gradient(135deg, rgba(255,255,255,0.038), rgba(255,255,255,0.010)), ${T.surface}`
          : T.surface,
        boxShadow: isVoid ? `0 18px 52px ${T.bg}55, inset 0 1px 0 rgba(255,255,255,0.045)` : T.hardShadow || "none",
        backdropFilter: isVoid ? "blur(18px)" : undefined,
        WebkitBackdropFilter: isVoid ? "blur(18px)" : undefined,
        padding: compact ? "12px 14px" : "14px 16px",
        ...style,
      }}
    >
      {isVoid && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            borderRadius: "inherit",
            boxShadow: `inset 0 0 0 1px ${glow}22`,
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 1, height: "100%", minWidth: 0 }}>{children}</div>
    </motion.div>
  );
}

function SectionTitle({ T, title, meta }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, minHeight: 18, marginBottom: 10 }}>
      <div style={{ color: T.muted, fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", lineHeight: 1.1 }}>{title}</div>
      {meta && <div style={{ color: T.textDim, fontSize: 10, fontFamily: FONT_NUM, whiteSpace: "nowrap" }}>{meta}</div>}
    </div>
  );
}

function Dashboard({ T, stats, trades, dailyPlans, weeklyPlans, onNewTrade, onNewDaily, onNewWeekly, viewportWidth, active }) {
  const today = new Date().toISOString().split("T")[0];
  const todayTrades = trades.filter(trade => trade.date === today);
  const latestDaily = [...dailyPlans].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const latestWeekly = [...weeklyPlans].sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart))[0];
  const bestPair = [...stats.byPair].sort((a, b) => b.totalR - a.totalR)[0];
  const isMobile = viewportWidth < 768;
  const gridTemplate = isMobile ? "1fr" : "repeat(12,minmax(0,1fr))";
  const todayR = todayTrades.reduce((sum, trade) => sum + (Number(trade.rr) || 0), 0);
  const activePairs = stats.byPair.filter(pair => pair.count > 0).sort((a, b) => b.totalR - a.totalR);

  const kpis = [
    {
      label: "Total R",
      value: <AnimatedNumber target={stats.totalR} active={active} format={value => `${value >= 0 ? "+" : ""}${value.toFixed(2)}R`} />,
      color: stats.totalR >= 0 ? T.green : T.red,
      sub: `${stats.total} trades`,
      barWidth: `${Math.min(Math.abs(stats.totalR) / 20 * 100, 100)}%`,
      sparkline: stats.equityCurve,
    },
    {
      label: "Win Rate",
      value: <AnimatedNumber target={stats.winRate} active={active} format={value => `${value.toFixed(1)}%`} />,
      color: stats.winRate >= 55 ? T.green : stats.winRate >= 45 ? T.amber : T.red,
      sub: `${stats.wins}W / ${stats.losses}L / ${stats.be}BE`,
      barWidth: `${Math.min(stats.winRate, 100)}%`,
      sparkline: stats.equityCurve,
    },
    {
      label: "Avg RR",
      value: <AnimatedNumber target={stats.avgRR} active={active} format={value => `${value.toFixed(2)}R`} />,
      color: stats.avgRR >= 2 ? T.green : stats.avgRR >= 1 ? T.amber : T.red,
      sub: "on winning trades",
      barWidth: `${Math.min(stats.avgRR / 3 * 100, 100)}%`,
      sparkline: stats.equityCurve,
    },
    {
      label: "Best Pair",
      value: bestPair?.pair || "None",
      color: T.accentBright,
      sub: `${(bestPair?.totalR || 0) >= 0 ? "+" : ""}${(bestPair?.totalR || 0).toFixed(1)}R total`,
      barWidth: `${Math.min(Math.abs(bestPair?.totalR || 0) / 20 * 100, 100)}%`,
      sparkline: stats.equityCurve,
    },
  ];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 12,
      width: "100%",
      maxWidth: "none",
      margin: 0,
      padding: isMobile ? "0 0 72px" : "0 24px 32px",
    }}>
      <InsightCards T={T} trades={trades} flush />

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12 }}>
        {kpis.map((kpi, index) => (
          <BentoTile key={kpi.label} T={T} delay={0.04 + index * 0.03} accent={kpi.color} compact style={{ padding: "15px 16px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: kpi.color, boxShadow: T.isDark && !T.hardShadow ? `0 0 14px ${kpi.color}66` : "none" }} />
              <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: "0.13em", textTransform: "uppercase" }}>{kpi.label}</div>
            </div>
            <div style={{ fontFamily: FONT_NUM, fontSize: isMobile ? 19 : 21, fontWeight: 700, color: kpi.color, lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 5, wordBreak: "break-word" }}>{kpi.value}</div>
            <MiniSparkline T={T} data={kpi.sparkline} color={kpi.color} />
            <div style={{ fontSize: 10, color: T.textDim, lineHeight: 1.3 }}>{kpi.sub}</div>
          </BentoTile>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: gridTemplate, gap: 12, alignItems: "stretch" }}>
        <div style={{ gridColumn: isMobile ? "auto" : "span 8", minWidth: 0 }}>
          <EquityCurve T={T} data={stats.equityCurve} />
        </div>
        <div style={{ gridColumn: isMobile ? "auto" : "span 4", minWidth: 0, height: "100%" }}>
          <MonthlyReturns T={T} trades={trades} compact={!isMobile} fill={!isMobile} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: gridTemplate, gap: 12, alignItems: "stretch" }}>
        <BentoTile T={T} delay={0.14} accent={todayR >= 0 ? T.green : T.red} style={{ gridColumn: isMobile ? "auto" : "span 5", minHeight: 172 }}>
          <SectionTitle T={T} title="Today's Trades" meta={<span style={{ color: todayR >= 0 ? T.green : T.red }}>{todayR >= 0 ? "+" : ""}{todayR.toFixed(2)}R</span>} />
          {todayTrades.length === 0 ? (
            <EmptyState T={T} icon="Trade" compact title="No trades today" copy="Log the first execution of the session." action={<Btn onClick={onNewTrade}>+ Log Trade</Btn>} />
          ) : todayTrades.map((trade, index) => (
            <div key={trade._dbid} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: index === todayTrades.length - 1 ? "none" : `1px solid ${T.border}` }}>
              <span style={{ width: 5, height: 5, flexShrink: 0, borderRadius: 1, background: trade.result === "WIN" ? T.green : trade.result === "LOSS" ? T.red : T.amber }} />
              <span style={{ fontFamily: FONT_NUM, fontWeight: 700, color: T.accentBright, minWidth: 58, fontSize: 12, letterSpacing: "0.04em" }}>{trade.pair}</span>
              <Badge color={trade.direction === "LONG" ? T.green : T.red}>{trade.direction}</Badge>
              <Badge color={trade.result === "WIN" ? T.green : trade.result === "LOSS" ? T.red : T.amber}>{trade.result}</Badge>
              <span style={{ fontSize: 11, color: T.textDim, minWidth: 58 }}>{trade.session || "Session"}</span>
              <span style={{ marginLeft: "auto", fontFamily: FONT_NUM, fontWeight: 700, fontSize: 12, color: trade.rr >= 0 ? T.green : T.red }}>{fmtRR(trade.rr || 0)}</span>
            </div>
          ))}
        </BentoTile>

        <BentoTile T={T} delay={0.18} accent={T.accentBright} style={{ gridColumn: isMobile ? "auto" : "span 3", minHeight: 172 }}>
          <SectionTitle T={T} title="Daily Bias" meta={latestDaily ? fmtDate(latestDaily.date) : null} />
          {latestDaily ? (
            <div>
              {latestDaily.pairs?.map(pair => (
                <div key={pair} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontWeight: 600, color: T.text, fontSize: 12 }}>{pair}</span>
                  <Badge color={latestDaily.biases?.[pair] === "Bullish" ? T.green : latestDaily.biases?.[pair] === "Bearish" ? T.red : T.amber}>{latestDaily.biases?.[pair]}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState T={T} icon="Plan" compact title="No daily plan" copy="Set the bias before session opens." action={<Btn onClick={onNewDaily}>+ Add Plan</Btn>} />
          )}
        </BentoTile>

        <BentoTile T={T} delay={0.22} accent={T.green} style={{ gridColumn: isMobile ? "auto" : "span 4", minHeight: 172 }}>
          <SectionTitle T={T} title="Pair Edge" meta="Top performers" />
          {activePairs.length === 0 ? (
            <div style={{ color: T.muted, fontSize: 12, textAlign: "center", padding: "16px 0" }}>Log trades to see pair performance</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {activePairs.slice(0, 5).map((pair, index) => {
                const topColor = pair.totalR > 0 ? T.green : pair.totalR < 0 ? T.red : T.muted;
                const winPct = pair.count > 0 ? (pair.wins / pair.count * 100).toFixed(0) : 0;
                const maxAbs = Math.max(...activePairs.map(item => Math.abs(item.totalR)), 1);
                const barWidth = `${Math.max(Math.abs(pair.totalR) / maxAbs * 100, 4)}%`;
                return (
                  <div key={pair.pair} style={{ display: "grid", gridTemplateColumns: "74px minmax(0,1fr) 60px", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: index === Math.min(activePairs.length, 5) - 1 ? "none" : `1px solid ${T.border}` }}>
                    <div>
                      <div style={{ fontFamily: FONT_NUM, fontSize: 12, fontWeight: 850, color: T.text, letterSpacing: "0.03em" }}>{pair.pair}</div>
                      <div style={{ fontSize: 9, color: T.textDim, marginTop: 2 }}>{pair.count}t - {winPct}% WR</div>
                    </div>
                    <div style={{ height: 5, background: T.surface2, borderRadius: 999, overflow: "hidden", border: `1px solid ${T.border}` }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: barWidth }} transition={{ duration: 0.5, delay: index * 0.04 }} style={{ height: "100%", background: topColor, opacity: 0.82, borderRadius: 999 }} />
                    </div>
                    <div style={{ textAlign: "right", fontFamily: FONT_NUM, fontSize: 12, fontWeight: 850, color: topColor }}>{pair.totalR >= 0 ? "+" : ""}{pair.totalR.toFixed(1)}R</div>
                  </div>
                );
              })}
            </div>
          )}
        </BentoTile>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: gridTemplate, gap: 12, alignItems: "stretch" }}>
        <BentoTile T={T} delay={0.26} accent={T.amber} style={{ gridColumn: isMobile ? "auto" : "span 5", minHeight: 150 }}>
          <SectionTitle T={T} title="Weekly Theme" meta={latestWeekly?.weekStart} />
          {latestWeekly ? (
            <div>
              {Object.entries(getWeeklyPairNotes(latestWeekly)).filter(([, note]) => String(note || "").trim()).slice(0, 3).length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                  {Object.entries(getWeeklyPairNotes(latestWeekly)).filter(([, note]) => String(note || "").trim()).slice(0, 3).map(([pair]) => (
                    <span key={pair} style={{ fontSize: 10, fontWeight: 700, color: T.textDim, background: T.surface2, border: `1px solid ${T.border}`, padding: "3px 8px", borderRadius: 999 }}>{pair}</span>
                  ))}
                </div>
              )}
              {latestWeekly.keyEvents && (
                <>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>Key Events</div>
                  <div style={{ fontSize: 12, color: T.amber, lineHeight: 1.5, marginBottom: 6 }}>{latestWeekly.keyEvents}</div>
                </>
              )}
              {latestWeekly.notes && <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.5 }}>{latestWeekly.notes}</div>}
            </div>
          ) : (
            <EmptyState T={T} icon="WK" compact title="No weekly plan" copy="Map the week before sessions open." action={<Btn T={T} onClick={onNewWeekly}>+ Weekly Plan</Btn>} />
          )}
        </BentoTile>

        <div style={{ gridColumn: isMobile ? "auto" : "span 7", minWidth: 0, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(12,minmax(0,1fr))", gap: 12 }}>
          <DashboardCharts T={T} trades={trades} isMobile={isMobile} isUltraWide={false} />
        </div>
      </div>

    </div>
  );
}

export default Dashboard;
