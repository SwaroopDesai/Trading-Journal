# Prompt: Add Confluence Tracking (HIGH PRIORITY)

Read `AGENTS.md` first.

## Task
Add confluence tracking — the single biggest feature gap vs competitors like TradingsFX. This lets traders track which conditions (HTF bias, liquidity sweep, kill zone etc) actually predict their winning trades.

## Why this matters
- TradingsFX has it. You don't.
- It's the most actionable analytics feature for ICT traders.
- Shows users "which combinations of conditions = your edge"
- Will be a major selling point on X/marketing

## Step 1: Database

Run in Supabase SQL editor:
```sql
ALTER TABLE trades 
  ADD COLUMN IF NOT EXISTS confluences jsonb DEFAULT '[]'::jsonb;
```

## Step 2: Constants

Add to `src/lib/constants.js`:
```js
export const CONFLUENCES = [
  { id: "htf_bias",       label: "HTF Bias Confirmed",     icon: "🧭" },
  { id: "liq_sweep",      label: "Liquidity Swept",        icon: "💧" },
  { id: "kz_active",      label: "Kill Zone Active",       icon: "⏰" },
  { id: "manip_done",     label: "Manipulation Confirmed", icon: "🎯" },
  { id: "poi_respect",    label: "POI Respected",          icon: "📍" },
  { id: "session_overlap",label: "Session Overlap",        icon: "🔄" },
  { id: "news_clear",     label: "No High Impact News",    icon: "📰" },
  { id: "htf_structure",  label: "HTF Structure Aligned",  icon: "📊" },
  { id: "fvg_imbalance",  label: "FVG / Imbalance Present",icon: "⚡" },
  { id: "rr_3plus",       label: "RR ≥ 3:1",               icon: "💰" },
];
```

Also update `TRADE_BOOT_FIELDS` to include `confluences`:
```js
export const TRADE_BOOT_FIELDS = "..., confluences"
// (add it to the existing string)
```

## Step 3: TradeModal

In `src/components/TradeModal.jsx`:

1. Import `CONFLUENCES` from constants
2. Add `confluences: []` to the initial trade state
3. Add a new section in the modal between "Setup" and "Notes":

```jsx
{/* Confluences Section */}
<div>
  <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
    Confluences <span style={{ color: T.textDim, fontWeight: 400 }}>({(form.confluences || []).length} of {CONFLUENCES.length})</span>
  </div>
  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
    {CONFLUENCES.map(conf => {
      const checked = (form.confluences || []).includes(conf.id);
      return (
        <button
          key={conf.id}
          type="button"
          onClick={() => {
            const current = form.confluences || [];
            const next = checked
              ? current.filter(c => c !== conf.id)
              : [...current, conf.id];
            update("confluences", next);
          }}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px",
            background: checked ? `${T.green}15` : T.surface2,
            border: `1.5px solid ${checked ? T.green : T.border}`,
            borderRadius: 10,
            cursor: "pointer", textAlign: "left",
            transition: "all 0.15s",
          }}
        >
          <span style={{ fontSize: 18 }}>{conf.icon}</span>
          <span style={{ flex: 1, fontSize: 12, color: checked ? T.green : T.text, fontWeight: checked ? 600 : 400 }}>{conf.label}</span>
          {checked && <span style={{ color: T.green, fontWeight: 700 }}>✓</span>}
        </button>
      );
    })}
  </div>
</div>
```

4. Save: confluences will save as part of the trade payload via existing flow.

## Step 4: Analytics — New Confluence Tab

Create `src/components/tabs/Confluences.jsx`:

```jsx
"use client"
import { useMemo } from "react";
import { CONFLUENCES } from "@/lib/constants";

export default function Confluences({ T, trades }) {
  const stats = useMemo(() => {
    return CONFLUENCES.map(conf => {
      const withConf = trades.filter(t => (t.confluences || []).includes(conf.id));
      const withoutConf = trades.filter(t => !(t.confluences || []).includes(conf.id));
      
      const wrWith = withConf.length 
        ? (withConf.filter(t => t.result === "WIN").length / withConf.length) * 100 
        : 0;
      const wrWithout = withoutConf.length 
        ? (withoutConf.filter(t => t.result === "WIN").length / withoutConf.length) * 100 
        : 0;
      const totalRWith = withConf.reduce((s, t) => s + (t.rr || 0), 0);
      const impact = wrWith - wrWithout;
      
      return {
        ...conf,
        countWith: withConf.length,
        countWithout: withoutConf.length,
        wrWith,
        wrWithout,
        totalRWith,
        impact,
      };
    }).sort((a, b) => b.impact - a.impact);
  }, [trades]);

  if (trades.length < 5) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: T.muted }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 700, color: T.textDim, marginBottom: 8 }}>Need more trades</div>
        <div style={{ fontSize: 13 }}>Log at least 5 trades with confluences to see analysis</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 6 }}>Confluence Edge Analysis</div>
      <div style={{ fontSize: 13, color: T.textDim, marginBottom: 20 }}>Which conditions actually predict your winning trades.</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {stats.map(s => {
          const hasData = s.countWith >= 3;
          return (
            <div key={s.id} style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              padding: "16px 18px",
              opacity: hasData ? 1 : 0.5,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, fontWeight: 700, color: T.text }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>
                    {s.countWith} trades with · {s.countWithout} trades without
                  </div>
                </div>
                {hasData && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 18, fontWeight: 800, color: s.impact > 0 ? T.green : s.impact < 0 ? T.red : T.muted }}>
                      {s.impact > 0 ? "+" : ""}{s.impact.toFixed(0)}%
                    </div>
                    <div style={{ fontSize: 10, color: T.muted }}>WR impact</div>
                  </div>
                )}
              </div>

              {hasData ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.green, letterSpacing: "0.1em", marginBottom: 4 }}>WITH CONFLUENCE</div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 800, color: T.green }}>{s.wrWith.toFixed(0)}%</div>
                    <div style={{ fontSize: 11, color: T.textDim }}>{s.totalRWith >= 0 ? "+" : ""}{s.totalRWith.toFixed(1)}R total</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: "0.1em", marginBottom: 4 }}>WITHOUT</div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 800, color: T.textDim }}>{s.wrWithout.toFixed(0)}%</div>
                    <div style={{ fontSize: 11, color: T.muted }}>{s.countWithout} trades</div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: T.muted, padding: "8px 0" }}>
                  Need at least 3 trades with this confluence to analyze
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24, padding: "14px 16px", background: T.surface2, borderRadius: 10, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
        💡 <b style={{ color: T.textDim }}>How to read this:</b> "WR Impact" shows how much your win rate improves when this confluence is present vs when it's not. Higher = bigger edge.
      </div>
    </div>
  );
}
```

## Step 5: Wire up the new tab

In `src/app/page.jsx`:

1. Import: `import Confluences from "@/components/tabs/Confluences"`
2. Add to TABS array: `{ id: "confluences", icon: "⚡", label: "Confluences" }`
3. Add render: `{tab === "confluences" && <Confluences T={T} trades={trades} />}`
4. Add to mobile MoreMenu

## Step 6: Update Dashboard

Add a "Top Confluence" widget on the dashboard showing the user's most impactful confluence:

In `src/components/tabs/Dashboard.jsx`, add a new card:
```jsx
{stats.topConfluence && (
  <Card>
    <div style={{ fontSize: 11, fontWeight: 700, color: T.muted }}>TOP CONFLUENCE</div>
    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 18, fontWeight: 800 }}>
      {stats.topConfluence.icon} {stats.topConfluence.label}
    </div>
    <div style={{ color: T.green, fontWeight: 700 }}>+{stats.topConfluence.impact.toFixed(0)}% WR boost</div>
  </Card>
)}
```

Compute `topConfluence` in the stats memo in `page.jsx`.

## Verification

1. Log a new trade — confirm Confluences section appears
2. Tick 3-4 confluences, save
3. Edit the trade — confluences should be checked
4. Open Confluences tab — should show data
5. Confirm mobile works (collapses to 1 column)

## Commit message
```
feat: confluence tracking - which conditions predict winning trades
```
