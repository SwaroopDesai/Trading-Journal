"use client"
import { useState, useEffect } from "react";
import { Card, CardTitle, EmptyState, Btn, Badge } from "@/components/ui";
import EquityCurve from "@/components/EquityCurve";
import InsightCards from "@/components/InsightCards";
import MonthlyReturns from "@/components/MonthlyReturns";
import { fmtDate, fmtRR, getWeeklyPairNotes } from "@/lib/utils";

function useCountUp(target, active, duration=1100) {
  const [val, setVal] = useState(0)
  useEffect(()=>{
    if(!active) return
    setVal(0)
    if(target === 0) return
    let step = 0
    const steps = 55
    const id = setInterval(()=>{
      step++
      const e = 1 - Math.pow(1 - step/steps, 3)
      setVal(target * e)
      if(step >= steps){ clearInterval(id); setVal(target) }
    }, duration / steps)
    return ()=>clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[active, target])
  return val
}

// HUD corners — kept as a lightweight accent, 8px arms
function HudCorners({ color }) {
  const corners = [
    { top:4, left:4,  transform:"none"         },
    { top:4, right:4, transform:"rotate(90deg)" },
    { bottom:4, right:4, transform:"rotate(180deg)" },
    { bottom:4, left:4,  transform:"rotate(270deg)" },
  ]
  return corners.map((s, i) => (
    <svg key={i} width="8" height="8" viewBox="0 0 8 8"
      style={{ position:"absolute", ...s, pointerEvents:"none" }} aria-hidden="true">
      <path d="M 0 8 L 0 0 L 8 0" stroke={color} strokeWidth="1.5"
        fill="none" strokeLinecap="square" opacity="0.5"/>
    </svg>
  ))
}

function Dashboard({ T, stats, trades, dailyPlans, weeklyPlans, onNewTrade, onNewDaily, onNewWeekly, viewportWidth, active }) {
  const today        = new Date().toISOString().split("T")[0]
  const todayTrades  = trades.filter(t => t.date === today)
  const latestDaily  = [...dailyPlans].sort((a,b) => new Date(b.date) - new Date(a.date))[0]
  const latestWeekly = [...weeklyPlans].sort((a,b) => new Date(b.weekStart) - new Date(a.weekStart))[0]
  const bestPair     = [...stats.byPair].sort((a,b) => b.totalR - a.totalR)[0]
  const isMobile     = viewportWidth < 768

  const animTotalR  = useCountUp(stats.totalR,        active)
  const animWinRate = useCountUp(stats.winRate,        active)
  const animAvgRR   = useCountUp(stats.avgRR,          active)
  const animBestR   = useCountUp(bestPair?.totalR || 0, active)

  const kpis = [
    {
      label:    "Total R",
      value:    `${animTotalR >= 0 ? "+" : ""}${animTotalR.toFixed(2)}R`,
      color:    stats.totalR >= 0 ? T.green : T.red,
      sub:      `${stats.total} trades`,
      barWidth: `${Math.min(Math.abs(stats.totalR) / 20 * 100, 100)}%`,
    },
    {
      label:    "Win Rate",
      value:    `${animWinRate.toFixed(1)}%`,
      color:    stats.winRate >= 55 ? T.green : stats.winRate >= 45 ? T.amber : T.red,
      sub:      `${stats.wins}W · ${stats.losses}L · ${stats.be}BE`,
      barWidth: `${Math.min(stats.winRate, 100)}%`,
    },
    {
      label:    "Avg RR",
      value:    `${animAvgRR.toFixed(2)}R`,
      color:    stats.avgRR >= 2 ? T.green : stats.avgRR >= 1 ? T.amber : T.red,
      sub:      "on winning trades",
      barWidth: `${Math.min(stats.avgRR / 3 * 100, 100)}%`,
    },
    {
      label:    "Best Pair",
      value:    bestPair?.pair || "—",
      color:    T.accentBright,
      sub:      `${animBestR >= 0 ? "+" : ""}${animBestR.toFixed(1)}R total`,
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
    <div style={{ display:"flex", flexDirection:"column", gap: 10 }}>

      {/* ── Insight strip (only when insights exist) ── */}
      <InsightCards T={T} trades={trades} />

      {/* ── KPI row ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
        gap: isMobile ? 8 : 10,
      }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            position: "relative",
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            padding: "10px 12px 0",
            overflow: "hidden",
            minWidth: 0,
          }}>
            <HudCorners color={k.color} />

            {/* label + value in one visual block */}
            <div style={{
              fontSize: 9, fontWeight: 700,
              color: k.color, letterSpacing: "0.16em",
              textTransform: "uppercase",
              display: "flex", alignItems: "center", gap: 5,
              marginBottom: 5,
            }}>
              <span style={{
                width: 4, height: 4,
                background: k.color,
                display: "inline-block", flexShrink: 0,
                boxShadow: `0 0 5px ${k.color}`,
              }}/>
              {k.label}
            </div>

            <div style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: isMobile ? 18 : 20,
              fontWeight: 700,
              color: k.color,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              wordBreak: "break-word",
              marginBottom: 4,
            }}>
              {k.value}
            </div>

            <div style={{
              fontSize: 10, color: T.textDim,
              marginBottom: 10, lineHeight: 1.3,
            }}>
              {k.sub}
            </div>

            {/* Progress bar flush to card bottom */}
            <div style={{ height: 2, background: T.surface2, margin: "0 -12px" }}>
              <div style={{
                width: k.barWidth, height: "100%",
                background: `linear-gradient(90deg,${k.color},${T.pink})`,
                boxShadow: `0 0 6px ${k.color}80`,
                transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)",
              }}/>
            </div>
          </div>
        ))}
      </div>

      {/* ── Equity curve + drawdown ── */}
      <EquityCurve T={T} data={stats.equityCurve} />

      {/* ── Monthly returns heatmap ── */}
      <MonthlyReturns T={T} trades={trades} />

      {/* ── Secondary 2-col grid ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2,minmax(0,1fr))",
        gap: 10,
      }}>

        {/* Today's Trades */}
        <div style={secondCard}>
          <div style={secTitle}>Today&apos;s Trades</div>
          {todayTrades.length === 0
            ? <EmptyState T={T} icon="🎯" compact
                title="No trades today"
                copy="Log the first execution of the session."
                action={<Btn T={T} onClick={onNewTrade}>+ Log Trade</Btn>}
              />
            : todayTrades.map(t => (
                <div key={t._dbid} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 0",
                  borderBottom: `1px solid ${T.border}`,
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
                  <span style={{
                    marginLeft: "auto",
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                    fontWeight: 700, fontSize: 12,
                    color: t.rr >= 0 ? T.green : T.red,
                  }}>{fmtRR(t.rr || 0)}</span>
                </div>
              ))
          }
        </div>

        {/* Daily Bias */}
        <div style={secondCard}>
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
                  <div style={{ fontSize: 12, color: T.textDim, marginTop: 8, lineHeight: 1.5 }}>
                    {latestDaily.notes}
                  </div>
                )}
              </div>
            : <EmptyState T={T} icon="📅" compact
                title="No daily plan"
                copy="Set the bias and levels before the session opens."
                action={<Btn T={T} onClick={onNewDaily}>+ Add Plan</Btn>}
              />
          }
        </div>

        {/* Weekly Theme */}
        <div style={secondCard}>
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
            : <EmptyState T={T} icon="🗓" compact
                title="No weekly plan"
                copy="Map the week before sessions open."
                action={<Btn T={T} onClick={onNewWeekly}>+ Weekly Plan</Btn>}
              />
          }
        </div>

        {/* Asset Efficiency Matrix */}
        <div style={{ ...secondCard, gridColumn: isMobile ? "auto" : "auto" }}>
          <div style={secTitle}>Pair Performance</div>
          {stats.byPair.filter(p => p.count > 0).length === 0
            ? <div style={{ color: T.muted, fontSize: 12, textAlign:"center", padding: "16px 0" }}>Log trades to see pair performance</div>
            : <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))",
                gap: 8,
              }}>
                {stats.byPair.filter(p => p.count > 0).map(p => {
                  const topColor = p.totalR > 0 ? T.green : p.totalR < 0 ? T.red : T.muted
                  const winPct   = p.count > 0 ? (p.wins / p.count * 100).toFixed(0) : 0
                  return (
                    <div key={p.pair} style={{
                      background: T.surface2,
                      border: `1px solid ${T.border}`,
                      borderTop: `2px solid ${topColor}`,
                      borderRadius: 10,
                      padding: "10px 10px 8px",
                    }}>
                      <div style={{
                        fontFamily: "'JetBrains Mono','Fira Code',monospace",
                        fontSize: 11, fontWeight: 700, color: T.textDim,
                        marginBottom: 4, letterSpacing: "0.04em",
                      }}>{p.pair}</div>
                      <div style={{
                        fontFamily: "'JetBrains Mono','Fira Code',monospace",
                        fontSize: 17, fontWeight: 700, color: topColor, lineHeight: 1,
                      }}>{p.totalR >= 0 ? "+" : ""}{p.totalR.toFixed(1)}R</div>
                      <div style={{
                        fontSize: 9, color: T.muted, marginTop: 6,
                        letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700,
                      }}>{winPct}% WR</div>
                    </div>
                  )
                })}
              </div>
          }
        </div>

      </div>
    </div>
  )
}

export default Dashboard;
