# Prompt: Add Breakeven Win Rate Display

Read `AGENTS.md` first.

## Task
Add a "Breakeven Win Rate" calculation that shows traders the minimum win rate they need at their current risk:reward ratio to be profitable. Quick win, very useful stat.

## Why this matters
This is one of the most important math concepts most traders ignore:
- At 1:1 RR, you need 50% WR to break even
- At 1:2 RR, you need 33.3%
- At 1:3 RR, you need 25%

Showing this contextualized to the user's actual stats gives them clarity on their edge.

## Step 1: Add to stats memo in page.jsx

In `src/app/page.jsx` `stats` useMemo, add:

```js
const stats = useMemo(() => {
  // ... existing stats
  
  // Average RR on wins (you probably already have this)
  const avgWinRR = wins.length 
    ? wins.reduce((s, t) => s + (t.rr || 0), 0) / wins.length 
    : 0;
  
  // Average loss in R (typically -1 for SL-based, but compute actual)
  const avgLossR = losses.length
    ? Math.abs(losses.reduce((s, t) => s + (t.rr || 0), 0) / losses.length)
    : 1;
  
  // Breakeven WR: % needed to break even at current RR
  const breakevenWR = avgWinRR > 0 
    ? (avgLossR / (avgWinRR + avgLossR)) * 100 
    : 50;
  
  // User's actual WR
  const winRate = trades.length 
    ? (wins.length / trades.length) * 100 
    : 0;
  
  // Edge: how much WR above breakeven
  const edge = winRate - breakevenWR;
  
  return {
    // ... existing
    avgWinRR,
    avgLossR,
    breakevenWR,
    edge,
    winRate,
  };
}, [trades]);
```

## Step 2: Add to Dashboard

In `src/components/tabs/Dashboard.jsx`, add a new card to the analytics section:

```jsx
<Card>
  <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
    YOUR EDGE
  </div>
  
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
    <div>
      <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>YOUR WIN RATE</div>
      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 800, color: T.text }}>
        {stats.winRate.toFixed(1)}%
      </div>
    </div>
    <div>
      <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>BREAKEVEN AT YOUR RR</div>
      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 800, color: T.textDim }}>
        {stats.breakevenWR.toFixed(1)}%
      </div>
    </div>
  </div>

  {/* Edge bar */}
  <div style={{
    background: T.surface2,
    height: 8,
    borderRadius: 4,
    position: "relative",
    overflow: "hidden",
    marginBottom: 8,
  }}>
    {/* Breakeven marker */}
    <div style={{
      position: "absolute",
      left: `${stats.breakevenWR}%`,
      top: 0, bottom: 0,
      width: 2,
      background: T.muted,
    }} />
    {/* Win rate bar */}
    <div style={{
      height: "100%",
      width: `${stats.winRate}%`,
      background: stats.edge > 0 
        ? `linear-gradient(90deg, ${T.green}, ${T.green})` 
        : T.red,
      borderRadius: 4,
    }} />
  </div>

  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <div style={{ fontSize: 12 }}>
      <span style={{ color: T.muted }}>Edge: </span>
      <span style={{ 
        fontWeight: 700, 
        color: stats.edge > 0 ? T.green : stats.edge < 0 ? T.red : T.muted 
      }}>
        {stats.edge > 0 ? "+" : ""}{stats.edge.toFixed(1)}%
      </span>
    </div>
    <div style={{ fontSize: 11, color: T.muted }}>
      Avg RR: {stats.avgWinRR.toFixed(2)}:1
    </div>
  </div>

  {/* Insight */}
  <div style={{
    marginTop: 12,
    padding: "8px 12px",
    background: stats.edge > 5 ? `${T.green}15` : stats.edge < -5 ? `${T.red}15` : T.surface2,
    borderRadius: 8,
    fontSize: 12,
    color: stats.edge > 5 ? T.green : stats.edge < -5 ? T.red : T.textDim,
    lineHeight: 1.5,
  }}>
    {stats.edge > 10 && "🎯 Strong edge. Keep doing what you're doing."}
    {stats.edge > 5 && stats.edge <= 10 && "✅ Profitable edge. Stay disciplined."}
    {stats.edge >= -5 && stats.edge <= 5 && "⚠️ Borderline. Either improve WR or take higher RR setups."}
    {stats.edge < -5 && "🔴 Losing edge. Review setups — increase RR or improve selectivity."}
  </div>
</Card>
```

## Step 3: Add per-setup breakeven analysis

In `src/components/tabs/Analytics.jsx`, for each setup row, show breakeven WR alongside actual WR:

```jsx
{/* Per setup row */}
<div>
  <div>{setup.name}</div>
  <div>WR: {setup.wr.toFixed(0)}%</div>
  <div>Breakeven: {setup.breakevenWR.toFixed(0)}%</div>
  <div style={{ color: setup.wr > setup.breakevenWR ? T.green : T.red }}>
    Edge: {(setup.wr - setup.breakevenWR).toFixed(0)}%
  </div>
</div>
```

Compute per-setup breakeven from per-setup avg RR.

## Verification
1. Open dashboard
2. Confirm "Your Edge" card shows
3. With 5 wins at 2R and 5 losses at -1R, breakeven should be 33.3%
4. WR bar should fill correctly
5. Edge insight should match the math

## Commit message
```
feat: breakeven win rate analysis - show edge vs your RR
```
