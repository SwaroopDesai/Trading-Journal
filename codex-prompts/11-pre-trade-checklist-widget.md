# Prompt: Pre-Trade Checklist Widget (Optional, Non-Blocking)

Read `AGENTS.md` first.

## Task
Bring back the pre-trade checklist as a compact, optional widget — NOT a blocking modal. The original blocking version was annoying. This version helps without forcing.

## Key change from old version
- Old: blocked you from logging trades until 7 boxes ticked
- New: small inline widget inside TradeModal — visible but optional
- Tracks discipline score over time without preventing logging

## Step 1: Update CHECKLIST_RULES

In `src/lib/constants.js`, replace old `CHECKLIST_RULES`:

```js
export const CHECKLIST_RULES = [
  { id: "bias",       icon: "🧭", short: "Bias",     full: "Daily bias confirmed" },
  { id: "manip",      icon: "🎯", short: "Manip",    full: "Manipulation happened" },
  { id: "kz",         icon: "⏰", short: "KZ",       full: "In Kill Zone" },
  { id: "poi",        icon: "📍", short: "POI",      full: "Valid POI identified" },
  { id: "risk",       icon: "🛡", short: "Risk",     full: "Risk calculated, SL set" },
  { id: "htf",        icon: "📈", short: "HTF",      full: "HTF structure aligned" },
  { id: "calm",       icon: "🧘", short: "Calm",     full: "Not revenge mode" },
];
```

## Step 2: Add `checklist_score` to trades table

```sql
ALTER TABLE trades 
  ADD COLUMN IF NOT EXISTS checklist_score integer DEFAULT 0;
```

## Step 3: Add the widget to TradeModal

In `src/components/TradeModal.jsx`, add this BEFORE the Result section:

```jsx
{/* Optional Pre-Trade Checklist */}
<div style={{
  background: T.surface2,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  padding: "14px 16px",
  marginBottom: 14,
}}>
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: T.accentBright, letterSpacing: "0.1em" }}>
      ✓ DISCIPLINE CHECK <span style={{ color: T.muted, fontWeight: 400, marginLeft: 6 }}>(optional)</span>
    </div>
    <div style={{ fontSize: 11, color: T.textDim }}>
      {form.checklist_score || 0}/{CHECKLIST_RULES.length}
    </div>
  </div>
  
  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
    {CHECKLIST_RULES.map(rule => {
      const checked = (form.checklist || []).includes(rule.id);
      return (
        <button
          key={rule.id}
          type="button"
          title={rule.full}
          onClick={() => {
            const current = form.checklist || [];
            const next = checked
              ? current.filter(c => c !== rule.id)
              : [...current, rule.id];
            update("checklist", next);
            update("checklist_score", next.length);
          }}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "5px 10px",
            background: checked ? `${T.green}20` : "transparent",
            border: `1px solid ${checked ? T.green : T.border}`,
            borderRadius: 20,
            fontSize: 11,
            color: checked ? T.green : T.textDim,
            fontWeight: checked ? 600 : 400,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <span>{rule.icon}</span>
          <span>{rule.short}</span>
          {checked && <span>✓</span>}
        </button>
      );
    })}
  </div>

  {/* Score visualization */}
  <div style={{
    marginTop: 10,
    height: 4,
    background: T.surface,
    borderRadius: 2,
    overflow: "hidden",
  }}>
    <div style={{
      height: "100%",
      width: `${((form.checklist_score || 0) / CHECKLIST_RULES.length) * 100}%`,
      background: (form.checklist_score || 0) === CHECKLIST_RULES.length 
        ? T.green 
        : (form.checklist_score || 0) >= 5 
        ? T.amber 
        : T.red,
      transition: "width 0.3s",
    }} />
  </div>
</div>
```

## Step 4: Save with the trade

In `saveTrade` in `page.jsx`, ensure `checklist` and `checklist_score` are included in the payload:

```js
const payload = {
  ...clean(t),
  user_id: user.id,
  checklist: t.checklist || [],
  checklist_score: t.checklist_score || 0,
};
```

## Step 5: Show discipline analytics

In `src/components/tabs/Analytics.jsx`, add a new section:

```jsx
{/* Discipline Score Analysis */}
<Card>
  <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: "0.12em", marginBottom: 12 }}>
    DISCIPLINE × PERFORMANCE
  </div>
  
  {[7, 6, 5, 4, 3, 2, 1, 0].map(score => {
    const scoreTrades = trades.filter(t => (t.checklist_score || 0) === score);
    if (scoreTrades.length === 0) return null;
    const wins = scoreTrades.filter(t => t.result === "WIN").length;
    const wr = (wins / scoreTrades.length * 100).toFixed(0);
    const totalR = scoreTrades.reduce((s, t) => s + (t.rr || 0), 0);
    
    return (
      <div key={score} style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 0",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ minWidth: 60, fontSize: 12 }}>
          <span style={{ fontWeight: 700, color: T.text }}>{score}/7</span>
          <span style={{ color: T.muted, marginLeft: 4 }}>({scoreTrades.length})</span>
        </div>
        <div style={{ flex: 1, height: 6, background: T.surface2, borderRadius: 3 }}>
          <div style={{ height: "100%", borderRadius: 3, background: T.green, width: `${wr}%` }} />
        </div>
        <div style={{ fontSize: 11, color: T.textDim, minWidth: 50, textAlign: "right" }}>{wr}% WR</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: totalR >= 0 ? T.green : T.red, minWidth: 50, textAlign: "right" }}>
          {totalR >= 0 ? "+" : ""}{totalR.toFixed(1)}R
        </div>
      </div>
    );
  })}
  
  <div style={{ marginTop: 12, padding: "10px 12px", background: T.surface2, borderRadius: 8, fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
    💡 Trades with higher discipline scores should outperform. If they don't, your rules need refinement.
  </div>
</Card>
```

## Verification
1. Open TradeModal — see Discipline Check widget
2. Click some chips, watch progress bar fill
3. Save trade — checklist + score persist
4. Edit trade — checks come back
5. Open Analytics → Discipline × Performance shows breakdown

## Commit message
```
feat: optional pre-trade discipline checklist with performance correlation
```
