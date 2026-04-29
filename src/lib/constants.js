// Trading option arrays
export const PAIRS = ["EURUSD","GBPUSD","USDCAD","GER30","SPX500","NAS100"];
export const SESSIONS = ["London","New York","Asian","London/NY Overlap"];
export const BIASES = ["Bullish","Bearish","Neutral"];
export const SETUPS = ["Manipulation + POI","Liquidity Sweep","Breaker Block","Order Block","Fair Value Gap","CHoCH + BOS","Kill Zone Entry","Other"];
export const MISTAKES = ["Moved SL","FOMO Entry","Ignored Bias","Wrong Session","Over-leveraged","No Confirmation","Revenge Trade","None"];
export const EMOTIONS = ["Calm & Focused","Confident","Anxious","Impatient","Revenge Mode","Bored","Overconfident","Fearful"];
export const POI_TYPES = ["Order Block","Breaker Block","FVG","Mitigation Block","Liquidity Pool","Premium/Discount","VWAP","PDHL"];
export const MANI_TYPES = ["Liquidity Sweep High","Liquidity Sweep Low","Stop Hunt","False Break","Judas Swing","None"];
export const HIGH_IMPACT = ["NFP","Non-Farm","CPI","GDP","FOMC","Interest Rate","Fed","Inflation","Unemployment","Retail Sales","PPI","ECB","BOE"];

// Session windows for clock/session tracker
export const SESSION_WINDOWS = [
  { key:"asian",   label:"Asian",    timeZone:"Asia/Tokyo",        start:7*60,  end:16*60 },
  { key:"london",  label:"London",   timeZone:"Europe/London",     start:8*60,  end:17*60 },
  { key:"newyork", label:"New York", timeZone:"America/New_York",  start:8*60,  end:17*60 },
];

// Supabase field select strings
export const TRADE_BOOT_FIELDS  = "id,created_at,pair,date,direction,session,killzone,dailyBias,weeklyBias,marketProfile,manipulation,poi,setup,entry,sl,tp,result,rr,pips,emotion,mistakes,notes,tags";
export const DAILY_BOOT_FIELDS  = "id,created_at,date,pairs,biases,weeklyTheme,keyLevels,manipulation,watchlist,notes";
export const WEEKLY_BOOT_FIELDS = "id,created_at,weekStart,weekEnd,pairs,keyEvents,notes,review,premiumDiscount";
export const MISSED_BOOT_FIELDS = "id,created_at,date,pair,direction,setup,reason,entry,sl,tp,rr,outcome,notes";

export const MISSED_REASONS = ["Hesitation","Fear","Too Late","No Confirmation","Not at Screen","News Event","Risk Too High","Already in Trade","Other"];

// Storage / localStorage keys
export const STORAGE_BUCKET         = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "journal-images";
export const TAB_STORAGE_KEY        = "fxedge_active_tab";
export const DAILY_PAIR_NOTES_MARKER = "__FXEDGE_PAIR_NOTES__::";

// ── Color themes ──────────────────────────────────────────────────────────────

// Dark: "Void" — near-black surfaces, indigo-violet accent (Linear 2025 style)
export const VOID = {
  bg:"#09090d",
  surface:"#111118",
  surface2:"#18181f",
  border:"#24242e",
  text:"#eeeef5",
  textDim:"#70709a",
  muted:"#404058",
  accent:"#5b5bd6",
  accentBright:"#818cf8",
  green:"#22c55e",
  red:"#ef4444",
  amber:"#f59e0b",
  blue:"#60a5fa",
  pink:"#c084fc",
  cardGlow:"rgba(91,91,214,0.09)",
  isDark:true,
  glowRgb:"129,140,248",
};

// Light: "Paper" — warm white, zinc neutrals, emerald accent (Vercel / Notion feel)
export const PAPER = {
  bg:"#f9f9f7",
  surface:"#ffffff",
  surface2:"#f2f2ef",
  border:"#e8e8e5",
  text:"#18181b",
  textDim:"#6b6b72",
  muted:"#a0a0a8",
  accent:"#047857",
  accentBright:"#059669",
  green:"#16a34a",
  red:"#dc2626",
  amber:"#ca8a04",
  blue:"#2563eb",
  pink:"#7c3aed",
  cardGlow:"rgba(5,150,105,0.05)",
  isDark:false,
  glowRgb:"5,150,105",
};

// DIY: "Brutal" — neo-brutalist, keep as-is
export const BRUTALIST = {
  bg:"#f7f5ef", surface:"#ffffff", surface2:"#efece3", border:"#000000",
  text:"#171e19", textDim:"#4a5048", muted:"#7a8a82",
  accent:"#cc9900", accentBright:"#171e19", green:"#059669", red:"#dc2626", amber:"#d97706",
  blue:"#2563eb", pink:"#b7c6c2",
  cardGlow:"transparent", isDark:false,
  hardShadow:"4px 4px 0px 0px #000000",
  sidebarBg:"#ffe17c",
  accentFill:"#ffe17c",
};

// Keep legacy aliases so any existing imports still work
export const DARK       = VOID;
export const DARK_GREEN = VOID;
export const DARK_BLUE  = VOID;
export const DARK_AMBER = VOID;
export const LIGHT      = PAPER;

export const THEMES = {
  "dark":      VOID,
  "light":     PAPER,
  "brutalist": BRUTALIST,
  // legacy keys → map to new themes so saved prefs still resolve
  "dark-green": VOID,
  "dark-blue":  VOID,
  "dark-amber": VOID,
};

export const THEME_META = [
  { id:"dark",      label:"Void",   swatch:"#818cf8", border:false },
  { id:"light",     label:"Paper",  swatch:"#f9f9f7", border:true  },
  { id:"brutalist", label:"DIY",    swatch:"#ffe17c", border:true  },
];

// Pre-trade checklist rules
export const CHECKLIST_RULES = [
  { id:"bias",      icon:"BI", label:"I have confirmed the Daily Bias",         detail:"HTF is aligned with your trade direction" },
  { id:"manip",     icon:"MS", label:"Manipulation / Liquidity Sweep happened", detail:"Judas swing, stop hunt or sweep confirmed" },
  { id:"kz",        icon:"KZ", label:"I am in a Kill Zone",                     detail:"London, NY Open, or valid session window" },
  { id:"poi",       icon:"PO", label:"I have identified a valid POI",           detail:"Order Block, FVG, Breaker or Mitigation" },
  { id:"risk",      icon:"RK", label:"Risk is calculated & SL is set",          detail:"Position size and pip risk confirmed" },
  { id:"higher",    icon:"HT", label:"Higher timeframe structure is aligned",   detail:"H4/Daily agrees with your entry direction" },
  { id:"no_revenge",icon:"NR", label:"I am NOT in revenge mode",                detail:"Calm, focused, and following the plan" },
];
