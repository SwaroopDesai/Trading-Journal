# Prompt: Add Hour × Day Heatmap View

Read `AGENTS.md` first.

## Task
Upgrade the Heatmap tab to include a Day × Hour heatmap — a grid showing performance by hour of day vs day of week. This is what TradingsFX has and gives traders very specific timing edge.

## Step 1: Add hour to trade data

Check if `trades.entry_time` or similar exists. If trades only have `date` (no time):

### Option A: Add time column to trades
```sql
ALTER TABLE trades 
  ADD COLUMN IF NOT EXISTS entry_time text;
  -- format: "HH:MM" 24h
```

Update TradeModal to capture entry time:
```jsx
<FL label="Entry Time (HH:MM)" T={T}>
  <Inp 
    T={T} 
    type="time" 
    value={form.entry_time || ""} 
    onChange={e => update("entry_time", e.target.value)}
  />
</FL>
```

### Option B: Derive from session (simpler, less accurate)
Map session to a representative hour:
```js
const SESSION_HOURS = {
  "Asian": 22, // 22:00 UTC
  "London": 8,  
  "London/NY Overlap": 13,
  "New York": 14,
};
```

**Recommended: Option A** — actual trade time is more useful long-term.

## Step 2: Add Hour Heatmap view to existing Heatmap tab

In `src/components/tabs/Heatmap.jsx`, add a new view alongside Calendar/Day of Week/Session Grid/Streaks/Drawdown:

```jsx
const VIEWS = [
  { id: "calendar", label: "📅 Calendar" },
  { id: "weekday", label: "📊 Day of Week" },
  { id: "session", label: "🕐 Session Grid" },
  { id: "hour",     label: "⏱ Hour × Day" }, // NEW
  { id: "streak",   label: "🔥 Streaks" },
  { id: "drawdown", label: "📉 Drawdown" },
];
```

## Step 3: Build the Hour × Day grid

```jsx
{activeView === "hour" && (
  <HourHeatmap T={T} trades={trades} />
)}
```

Component:

```jsx
function HourHeatmap({ T, trades }) {
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  // Build grid: hour x day
  const grid = useMemo(() => {
    const result = {};
    DAYS.forEach((d, di) => {
      result[di + 1] = {};
      HOURS.forEach(h => {
        result[di + 1][h] = { count: 0, wins: 0, totalR: 0 };
      });
    });

    trades.forEach(t => {
      if (!t.date || !t.entry_time) return;
      const dow = new Date(t.date).getDay();
      if (dow < 1 || dow > 5) return;
      const hour = parseInt(t.entry_time.split(":")[0], 10);
      if (isNaN(hour)) return;

      const cell = result[dow]?.[hour];
      if (!cell) return;
      cell.count++;
      cell.totalR += (t.rr || 0);
      if (t.result === "WIN") cell.wins++;
    });

    return result;
  }, [trades]);

  // Find max R for color scaling
  const allR = Object.values(grid).flatMap(d => Object.values(d).map(c => c.totalR));
  const maxAbsR = Math.max(1, ...allR.map(Math.abs));

  const getCellColor = (cell) => {
    if (cell.count === 0) return T.surface2;
    const intensity = Math.min(1, Math.abs(cell.totalR) / maxAbsR);
    if (cell.totalR > 0) {
      const lightness = T.isDark ? 30 - intensity * 15 : 80 - intensity * 30;
      return `hsl(140, 50%, ${lightness}%)`;
    } else {
      const lightness = T.isDark ? 30 - intensity * 15 : 80 - intensity * 30;
      return `hsl(0, 60%, ${lightness}%)`;
    }
  };

  if (trades.length === 0) {
    return (
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 40, textAlign: "center", color: T.muted }}>
        Log trades with entry times to see hour analysis
      </div>
    );
  }

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 6 }}>Hour × Day Performance</div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>
        Find your best trading hours. Cell color shows P&L intensity.
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: `60px repeat(24, minmax(28px, 1fr))`, gap: 2, minWidth: 720 }}>
          {/* Header row: hours */}
          <div />
          {HOURS.map(h => (
            <div key={h} style={{ fontSize: 9, color: T.muted, textAlign: "center", paddingTop: 4 }}>
              {h.toString().padStart(2, "0")}
            </div>
          ))}

          {/* Grid rows */}
          {DAYS.map((day, di) => (
            <React.Fragment key={day}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, display: "flex", alignItems: "center" }}>
                {day}
              </div>
              {HOURS.map(h => {
                const cell = grid[di + 1][h];
                return (
                  <div
                    key={h}
                    title={cell.count > 0 ? `${day} ${h.toString().padStart(2,"0")}:00\n${cell.count} trades, ${cell.wins}W, ${cell.totalR.toFixed(1)}R` : ""}
                    style={{
                      aspectRatio: "1",
                      background: getCellColor(cell),
                      border: `1px solid ${T.border}`,
                      borderRadius: 4,
                      cursor: cell.count > 0 ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      color: cell.count > 0 ? "#fff" : T.muted,
                      fontWeight: 700,
                    }}
                  >
                    {cell.count > 0 ? cell.count : ""}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 16, alignItems: "center", fontSize: 11, color: T.muted }}>
        <span>Legend:</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: T.green }} />
          <span>Profitable</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: T.red }} />
          <span>Loss</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: T.surface2, border: `1px solid ${T.border}` }} />
          <span>No trades</span>
        </div>
      </div>
    </div>
  );
}
```

## Step 4: Add timezone awareness

Times will be stored in user's local timezone. Show timezone label clearly:

```jsx
<div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>
  Times shown in {Intl.DateTimeFormat().resolvedOptions().timeZone}
</div>
```

## Verification
1. Log a few trades with entry times
2. Open Heatmap → Hour × Day view
3. Confirm cells light up green/red based on R
4. Confirm scrolling works on mobile
5. Confirm tooltip on hover shows trade count

## Commit message
```
feat: hour × day heatmap view for finding best trading hours
```
