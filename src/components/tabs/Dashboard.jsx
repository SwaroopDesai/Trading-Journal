"use client"
import { useState, useEffect } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent } from "framer-motion";
import { EmptyState, Btn, Badge } from "@/components/ui";
import EquityCurve from "@/components/EquityCurve";
import DashboardCharts from "@/components/DashboardCharts";
import InsightCards from "@/components/InsightCards";
import MonthlyReturns from "@/components/MonthlyReturns";
import { fmtDate, fmtRR, getWeeklyPairNotes } from "@/lib/utils";

function AnimatedNumber({ target, active, format }) {
  const value = useMotionValue(active ? 0 : target)
  const [display, setDisplay] = useState(format(active ? 0 : target))

  useMotionValueEvent(value, "change", latest => {
    setDisplay(format(latest))
  })

  useEffect(()=>{
    const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    if(reduceMotion || !active){
      value.set(target)
      setDisplay(format(target))
      return
    }
    value.set(0)
    const controls = animate(value, target, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    })
    return controls.stop
  }, [active, format, target, value])

  return (
    <motion.span
      key={target}
      initial={{ opacity: 0.7, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      {display}
    </motion.span>
  )
}


function Dashboard({ T, stats, trades, dailyPlans, weeklyPlans, onNewTrade, onNewDaily, onNewWeekly, viewportWidth, active }) {
  const today        = new Date().toISOString().split("T")[0]
  const todayTrades  = trades.filter(t => t.date === today)
  const latestDaily  = [...dailyPlans].sort((a,b) => new Date(b.date) - new Date(a.date))[0]
  const latestWeekly = [...weeklyPlans].sort((a,b) => new Date(b.weekStart) - new Date(a.weekStart))[0]
  const bestPair     = [...stats.byPair].sort((a,b) => b.totalR - a.totalR)[0]
  const isMobile     = viewportWidth < 768
  const todayR        = todayTrades.reduce((sum, t) => sum + (Number(t.rr) || 0), 0)
  const activePairs   = stats.byPair
    .filter(p => p.count > 0)
    .sort((a, b) => b.totalR - a.totalR)

  const kpis = [
    {
      label:    "Total R",
      value:    <AnimatedNumber target={stats.totalR} active={active} format={v=>`${v >= 0 ? "+" : ""}${v.toFixed(2)}R`} />,
      color:    stats.totalR >= 0 ? T.green : T.red,
      sub:      `${stats.total} trades`,
      barWidth: `${Math.min(Math.abs(stats.totalR) / 20 * 100, 100)}%`,
    },
    {
      label:    "Win Rate",
      value:    <AnimatedNumber target={stats.winRate} active={active} format={v=>`${v.toFixed(1)}%`} />,
      color:    stats.winRate >= 55 ? T.green : stats.winRate >= 45 ? T.amber : T.red,
      sub:      `${stats.wins}W / ${stats.losses}L / ${stats.be}BE`,
      barWidth: `${Math.min(stats.winRate, 100)}%`,
    },
    {
      label:    "Avg RR",
      value:    <AnimatedNumber target={stats.avgRR} active={active} format={v=>`${v.toFixed(2)}R`} />,
      color:    stats.avgRR >= 2 ? T.green : stats.avgRR >= 1 ? T.amber : T.red,
      sub:      "on winning trades",
      barWidth: `${Math.min(stats.avgRR / 3 * 100, 100)}%`,
    },
    {
      label:    "Best Pair",
      value:    bestPair?.pair || "None",
      color:    T.accentBright,
      sub:      `${(bestPair?.totalR || 0) >= 0 ? "+" : ""}${(bestPair?.totalR || 0).toFixed(1)}R total`,
      barWidth: `${Math.min(Math.abs(bestPair?.totalR || 0) / 20 * 100, 100)}%`,
    },
  ]

  // ── secondary card shared style ────────────────────────────────────────────
  const secondCard = {
    borderRadius: 14,
    border: `1px solid ${T.border}`,
    background: T.surface,
    padding: "12px 14px",
    overflow: "hidden",
    minHeight: 136,
  }
  const secTitle = {
    fontSize: 11,
    fontWeight: 700,
    color: T.muted,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 10,
  }

  return (
    <div style={{
      display:"flex",
      flexDirection:"column",
      gap: 10,
      width: "100%",
      maxWidth: 1800,
      margin: 0,
    }}>

      {/* ── KPI strip — one surface, four cells ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        overflow: "hidden",
      }}>
        {kpis.map((k, idx) => {
          const isLastCol  = isMobile ? idx % 2 === 1 : idx === 3
          const isLastRow  = isMobile ? idx >= 2 : true
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: idx * 0.04 }}
              whileHover={{ y: -2 }}
              style={{
              position: "relative",
              padding: "12px 14px 0",
              minWidth: 0,
              borderRight:  !isLastCol ? `1px solid ${T.border}` : "none",
              borderBottom: !isLastRow ? `1px solid ${T.border}` : "none",
            }}>
              {/* Per-cell color bar — 3px, full width, flush to top */}
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                height: 3,
                background: k.color,
                opacity: 0.9,
              }}/>

              {/* Label */}
              <div style={{
                fontSize: 9, fontWeight: 700,
                color: T.muted, letterSpacing: "0.13em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}>
                {k.label}
              </div>

              {/* Value */}
              <div style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: isMobile ? 19 : 21,
                fontWeight: 700,
                color: k.color,
                lineHeight: 1,
                letterSpacing: "-0.03em",
                marginBottom: 5,
                wordBreak: "break-word",
              }}>
                {k.value}
              </div>

              {/* Sub */}
              <div style={{
                fontSize: 10, color: T.textDim,
                marginBottom: 10, lineHeight: 1.3,
              }}>
                {k.sub}
              </div>

              {/* Scale bar — 8px, breaks out of padding, reads as a real gauge */}
              <div style={{
                height: 8,
                margin: "0 -14px",
                background: T.surface2,
                position: "relative",
                overflow: "hidden",
              }}>
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: k.barWidth }}
                  transition={{ duration: 0.65, delay: 0.12 + idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                  position: "absolute",
                  left: 0, top: 0, bottom: 0,
                  background: k.color,
                  opacity: 0.72,
                  borderRadius: "0 2px 2px 0",
                }}/>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── Bento dashboard grid ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(12,minmax(0,1fr))",
        gap: 10,
        alignItems: "stretch",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.06 }}
          style={{ gridColumn: isMobile ? "auto" : "span 8", minWidth: 0 }}
        >
          <EquityCurve T={T} data={stats.equityCurve} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.1 }}
          style={{ gridColumn: isMobile ? "auto" : "span 4", minWidth: 0, height: "100%" }}
        >
          <MonthlyReturns T={T} trades={trades} compact={!isMobile} fill={!isMobile} />
        </motion.div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2,minmax(0,1fr))",
        gap: 10,
        alignItems: "start",
      }}>
        <div style={{display:"flex",flexDirection:"column",gap:10,minWidth:0}}>
        {/* Today's Trades */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.14 }}
          whileHover={{ y: -2 }}
          style={{ ...secondCard }}
        >
          <div style={{ ...secTitle, display:"flex", justifyContent:"space-between", gap:10 }}>
            <span>Today&apos;s Trades</span>
            <span style={{
              color: todayR >= 0 ? T.green : T.red,
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              letterSpacing: "-0.02em",
            }}>{todayR >= 0 ? "+" : ""}{todayR.toFixed(2)}R</span>
          </div>
          {todayTrades.length === 0
            ? <EmptyState T={T} icon="TRD" compact
                title="No trades today"
                copy="Log the first execution of the session."
                action={<Btn T={T} onClick={onNewTrade}>+ Log Trade</Btn>}
              />
            : todayTrades.map((t, idx) => (
                <div key={t._dbid} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 0",
                  borderBottom: idx === todayTrades.length - 1 ? "none" : `1px solid ${T.border}`,
                }}>
                  <span style={{
                    width: 5, height: 5, flexShrink: 0, borderRadius: 1,
                    background: t.result === "WIN" ? T.green : t.result === "LOSS" ? T.red : T.amber,
                  }}/>
                  <span style={{
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                    fontWeight: 700, color: T.accentBright,
                    minWidth: 58, fontSize: 12, letterSpacing: "0.04em",
                  }}>{t.pair}</span>
                  <Badge color={t.direction === "LONG" ? T.green : T.red}>{t.direction}</Badge>
                  <Badge color={t.result === "WIN" ? T.green : t.result === "LOSS" ? T.red : T.amber}>{t.result}</Badge>
                  <span style={{ fontSize: 11, color: T.textDim, minWidth: 58 }}>{t.session || "Session"}</span>
                  <span style={{
                    marginLeft: "auto",
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                    fontWeight: 700, fontSize: 12,
                    color: t.rr >= 0 ? T.green : T.red,
                  }}>{fmtRR(t.rr || 0)}</span>
                </div>
              ))
          }
        </motion.div>

        {/* Weekly Theme */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.22 }}
          whileHover={{ y: -2 }}
          style={{ ...secondCard }}
        >
          <div style={{ ...secTitle, display:"flex", justifyContent:"space-between" }}>
            <span>Weekly Theme</span>
            {latestWeekly && <span style={{ color: T.accent, fontWeight: 600, letterSpacing: 0, textTransform:"none", fontSize:11 }}>{latestWeekly.weekStart}</span>}
          </div>
          {latestWeekly
            ? <div>
                {Object.entries(getWeeklyPairNotes(latestWeekly))
                  .filter(([, note]) => String(note || "").trim())
                  .slice(0, 3).length > 0 && (
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
                    {Object.entries(getWeeklyPairNotes(latestWeekly))
                      .filter(([, note]) => String(note || "").trim())
                      .slice(0, 3).map(([pair]) => (
                        <span key={pair} style={{
                          fontSize: 10, fontWeight: 700, color: T.textDim,
                          background: T.surface2, border: `1px solid ${T.border}`,
                          padding: "3px 8px", borderRadius: 999,
                        }}>{pair}</span>
                      ))}
                  </div>
                )}
                {latestWeekly.keyEvents && (
                  <>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", textTransform:"uppercase", marginBottom: 3 }}>Key Events</div>
                    <div style={{ fontSize: 12, color: T.amber, lineHeight: 1.5, marginBottom: 6 }}>{latestWeekly.keyEvents}</div>
                  </>
                )}
                {latestWeekly.notes && (
                  <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.5 }}>{latestWeekly.notes}</div>
                )}
              </div>
            : <EmptyState T={T} icon="WK" compact
                title="No weekly plan"
                copy="Map the week before sessions open."
                action={<Btn T={T} onClick={onNewWeekly}>+ Weekly Plan</Btn>}
              />
          }
        </motion.div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:10,minWidth:0}}>
        {/* Daily Bias */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.18 }}
          whileHover={{ y: -2 }}
          style={{ ...secondCard }}
        >
          <div style={{ ...secTitle, display:"flex", justifyContent:"space-between" }}>
            <span>Daily Bias</span>
            {latestDaily && <span style={{ color: T.accent, fontWeight: 600, letterSpacing: 0, textTransform:"none", fontSize:11 }}>{fmtDate(latestDaily.date)}</span>}
          </div>
          {latestDaily
            ? <div>
                {latestDaily.pairs?.map(p => (
                  <div key={p} style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    borderBottom: `1px solid ${T.border}`,
                  }}>
                    <span style={{ fontWeight: 600, color: T.text, fontSize: 12 }}>{p}</span>
                    <Badge color={
                      latestDaily.biases?.[p] === "Bullish" ? T.green :
                      latestDaily.biases?.[p] === "Bearish" ? T.red : T.amber
                    }>{latestDaily.biases?.[p]}</Badge>
                  </div>
                ))}
                {latestDaily.notes && (
                  <div style={{
                    fontSize: 12,
                    color: T.textDim,
                    marginTop: 8,
                    lineHeight: 1.5,
                    borderTop: `1px solid ${T.border}`,
                    paddingTop: 8,
                  }}>
                    {latestDaily.notes}
                  </div>
                )}
              </div>
            : <EmptyState T={T} icon="DAY" compact
                title="No daily plan"
                copy="Set the bias and levels before the session opens."
                action={<Btn T={T} onClick={onNewDaily}>+ Add Plan</Btn>}
              />
          }
        </motion.div>

        {/* Asset Efficiency Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.26 }}
          whileHover={{ y: -2 }}
          style={{ ...secondCard }}
        >
          <div style={secTitle}>Pair Performance</div>
          {activePairs.length === 0
            ? <div style={{ color: T.muted, fontSize: 12, textAlign:"center", padding: "16px 0" }}>Log trades to see pair performance</div>
            : <div style={{
                display: "flex",
                flexDirection: "column",
                gap: 7,
              }}>
                {activePairs.map((p, idx) => {
                  const topColor = p.totalR > 0 ? T.green : p.totalR < 0 ? T.red : T.muted
                  const winPct   = p.count > 0 ? (p.wins / p.count * 100).toFixed(0) : 0
                  const maxAbs    = Math.max(...activePairs.map(x => Math.abs(x.totalR)), 1)
                  const barWidth  = `${Math.max(Math.abs(p.totalR) / maxAbs * 100, 4)}%`
                  return (
                    <div key={p.pair} style={{
                      background: T.surface2,
                      border: `1px solid ${T.border}`,
                      borderRadius: 9,
                      padding: "8px 9px",
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{
                          width: 18,
                          color: T.muted,
                          fontFamily: "'JetBrains Mono','Fira Code',monospace",
                          fontSize: 10,
                          fontWeight: 700,
                        }}>{idx + 1}</span>
                        <span style={{
                          fontFamily: "'JetBrains Mono','Fira Code',monospace",
                          fontSize: 12,
                          fontWeight: 700,
                          color: T.text,
                          minWidth: 62,
                          letterSpacing: "0.03em",
                        }}>{p.pair}</span>
                        <span style={{ fontSize: 10, color: T.textDim }}>{p.count}t</span>
                        <span style={{ fontSize: 10, color: T.textDim }}>{winPct}% WR</span>
                        <span style={{
                          marginLeft: "auto",
                          fontFamily: "'JetBrains Mono','Fira Code',monospace",
                          fontSize: 12,
                          fontWeight: 700,
                          color: topColor,
                        }}>{p.totalR >= 0 ? "+" : ""}{p.totalR.toFixed(1)}R</span>
                      </div>
                      <div style={{ height: 3, background: T.surface, borderRadius: 999, marginTop: 7, overflow:"hidden" }}>
                        <div style={{ height:"100%", width: barWidth, background: topColor, opacity: 0.75, borderRadius: 999 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
          }
        </motion.div>
        </div>

      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(12,minmax(0,1fr))",
        gap: 10,
        alignItems: "start",
      }}>
        <DashboardCharts T={T} trades={trades} isMobile={isMobile} />

      </div>

      <InsightCards T={T} trades={trades} collapseEmpty />
    </div>
  )
}

export default Dashboard;
