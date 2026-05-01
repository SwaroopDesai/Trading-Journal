# Prompt: Add CSV Import (MT4/MT5/Generic)

Read `AGENTS.md` first.

## Task
Allow users to import their trade history from CSV. Critical for onboarding new users from Tradezella, MT4/MT5, or other platforms.

## Why this matters
- New users have months of historical trades elsewhere
- Manually re-entering 100s of trades is a dealbreaker
- Removes biggest friction to switching to FXEDGE

## Step 1: Add Import section to ExportTab

In `src/components/tabs/ExportTab.jsx`, add a new "Import" section above existing exports:

```jsx
<div style={{ marginBottom: 24 }}>
  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 12 }}>
    Import Trades
  </div>
  
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <span style={{ fontSize: 32 }}>📥</span>
      <div>
        <div style={{ fontWeight: 700, color: T.text }}>Import from CSV</div>
        <div style={{ fontSize: 12, color: T.textDim }}>Bring your trade history from MT4, MT5, Tradezella, or any CSV</div>
      </div>
    </div>
    
    <input 
      type="file"
      accept=".csv"
      onChange={handleFileSelect}
      style={{ display: "none" }}
      id="csv-input"
    />
    <label htmlFor="csv-input" style={{
      display: "inline-block",
      background: `linear-gradient(135deg, ${T.accentBright}, ${T.pink})`,
      color: "#fff",
      padding: "10px 20px",
      borderRadius: 10,
      cursor: "pointer",
      fontWeight: 700,
      fontSize: 13,
    }}>
      Choose CSV File
    </label>
    
    {previewData && <PreviewMapper data={previewData} onConfirm={handleImport} T={T} />}
  </div>
</div>
```

## Step 2: CSV parsing logic

```jsx
import Papa from "papaparse";

// Install: npm install papaparse

const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      setPreviewData({
        headers: Object.keys(results.data[0] || {}),
        rows: results.data.slice(0, 100), // first 100 for preview
        total: results.data.length,
      });
    },
    error: (err) => toast.error("Failed to parse CSV: " + err.message),
  });
};
```

## Step 3: Column mapper component

```jsx
function PreviewMapper({ data, onConfirm, T }) {
  const FXEDGE_FIELDS = [
    { key: "date", label: "Date", required: true },
    { key: "pair", label: "Pair", required: true },
    { key: "direction", label: "Direction (LONG/SHORT)", required: true },
    { key: "result", label: "Result (WIN/LOSS/BREAKEVEN)", required: true },
    { key: "rr", label: "R:R", required: false },
    { key: "pips", label: "Pips", required: false },
    { key: "entry", label: "Entry Price", required: false },
    { key: "sl", label: "Stop Loss", required: false },
    { key: "tp", label: "Take Profit", required: false },
    { key: "session", label: "Session", required: false },
    { key: "setup", label: "Setup", required: false },
    { key: "notes", label: "Notes", required: false },
  ];

  const [mapping, setMapping] = useState({});

  // Auto-suggest mappings based on header similarity
  useEffect(() => {
    const auto = {};
    FXEDGE_FIELDS.forEach(field => {
      const match = data.headers.find(h => 
        h.toLowerCase().includes(field.key.toLowerCase()) ||
        h.toLowerCase().replace(/[^a-z]/g, "") === field.key.toLowerCase()
      );
      if (match) auto[field.key] = match;
    });
    setMapping(auto);
  }, [data]);

  const isValid = FXEDGE_FIELDS.filter(f => f.required).every(f => mapping[f.key]);

  return (
    <div style={{ marginTop: 16, padding: 16, background: T.surface2, borderRadius: 10 }}>
      <div style={{ fontWeight: 700, marginBottom: 12, color: T.text }}>
        Map Columns ({data.total} rows found)
      </div>

      {FXEDGE_FIELDS.map(field => (
        <div key={field.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ minWidth: 160, fontSize: 12, color: T.textDim }}>
            {field.label} {field.required && <span style={{ color: T.red }}>*</span>}
          </div>
          <select 
            value={mapping[field.key] || ""}
            onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value }))}
            style={{
              flex: 1,
              background: T.surface,
              border: `1px solid ${T.border}`,
              color: T.text,
              padding: "6px 10px",
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            <option value="">— skip —</option>
            {data.headers.map(h => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
      ))}

      <button
        disabled={!isValid}
        onClick={() => onConfirm(mapping, data)}
        style={{
          marginTop: 12,
          background: isValid ? `linear-gradient(135deg, ${T.accentBright}, ${T.pink})` : T.surface,
          color: isValid ? "#fff" : T.muted,
          border: "none",
          padding: "10px 20px",
          borderRadius: 10,
          cursor: isValid ? "pointer" : "not-allowed",
          fontWeight: 700,
        }}
      >
        {isValid ? `Import ${data.total} Trades` : "Map required fields"}
      </button>
    </div>
  );
}
```

## Step 4: Import handler

```jsx
const handleImport = async (mapping, data) => {
  if (!user) return;

  // Re-parse full file (we only kept 100 rows for preview)
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      const trades = results.data.map(row => {
        const trade = { user_id: user.id };
        Object.entries(mapping).forEach(([fxField, csvField]) => {
          if (csvField && row[csvField] !== undefined) {
            trade[fxField] = row[csvField];
          }
        });

        // Normalize values
        if (trade.direction) {
          const d = trade.direction.toUpperCase();
          trade.direction = d.includes("LONG") || d.includes("BUY") ? "LONG" : "SHORT";
        }
        if (trade.result) {
          const r = trade.result.toUpperCase();
          if (r.includes("WIN") || r.includes("PROFIT")) trade.result = "WIN";
          else if (r.includes("LOSS") || r.includes("LOSE")) trade.result = "LOSS";
          else trade.result = "BREAKEVEN";
        }
        if (trade.rr) trade.rr = parseFloat(trade.rr) || 0;
        if (trade.pips) trade.pips = parseFloat(trade.pips) || 0;
        if (trade.entry) trade.entry = parseFloat(trade.entry) || 0;
        if (trade.sl) trade.sl = parseFloat(trade.sl) || 0;
        if (trade.tp) trade.tp = parseFloat(trade.tp) || 0;

        // Normalize date
        if (trade.date) {
          const d = new Date(trade.date);
          if (!isNaN(d)) trade.date = d.toISOString().split("T")[0];
        }

        return trade;
      });

      // Filter out rows missing required fields
      const valid = trades.filter(t => t.date && t.pair && t.direction && t.result);
      
      // Batch insert (100 at a time)
      let success = 0;
      let failed = 0;
      
      for (let i = 0; i < valid.length; i += 100) {
        const batch = valid.slice(i, i + 100);
        const { error } = await supabase.from("trades").insert(batch);
        if (error) failed += batch.length;
        else success += batch.length;
      }

      toast.success(`Imported ${success} trades. ${failed > 0 ? `${failed} failed.` : ""}`);
      loadAll(); // refresh
    },
  });
};
```

## Step 5: Add MT4/MT5 specific parser

MT4/MT5 export CSVs have specific headers. Add a preset:

```jsx
const PRESETS = {
  mt4: {
    name: "MetaTrader 4",
    mappings: {
      date: "Open Time",
      pair: "Symbol",
      direction: "Type",
      result: "Profit", // numeric — convert to WIN/LOSS
      pips: "Pips",
      entry: "Open Price",
      sl: "S/L",
      tp: "T/P",
    }
  },
  mt5: { ... },
  tradezella: { ... },
};

// Show preset buttons:
<div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
  {Object.entries(PRESETS).map(([key, preset]) => (
    <button onClick={() => setMapping(preset.mappings)}>
      {preset.name}
    </button>
  ))}
</div>
```

## Step 6: Show import progress

For large imports (1000+ rows), show a progress bar.

## Verification
1. Export sample CSV from MT4
2. Import into FXEDGE
3. Confirm all trades appear
4. Confirm dates parsed correctly
5. Confirm directions normalized
6. Confirm RR/Pips numeric

## Commit message
```
feat: CSV import with column mapper - MT4/MT5/Tradezella support
```
