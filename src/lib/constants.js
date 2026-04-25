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

// Color themes
export const DARK_GREEN = {
  bg:"#0b0f0e", surface:"#131a18", surface2:"#1a2420", border:"#243330",
  text:"#e8f5f0", textDim:"#7aa898", muted:"#4a6b60",
  accent:"#059669", accentBright:"#10b981", green:"#22c55e", red:"#ef4444", amber:"#f59e0b",
  blue:"#3b82f6", pink:"#06b6d4",
  cardGlow:"rgba(16,185,129,0.07)", isDark:true,
};
export const DARK_BLUE = {
  bg:"#080c14", surface:"#0f1623", surface2:"#151e30", border:"#1e2d47",
  text:"#e8f0ff", textDim:"#7090b8", muted:"#3d5070",
  accent:"#0369a1", accentBright:"#0ea5e9", green:"#22c55e", red:"#ef4444", amber:"#f59e0b",
  blue:"#38bdf8", pink:"#818cf8",
  cardGlow:"rgba(14,165,233,0.07)", isDark:true,
};
export const DARK_AMBER = {
  bg:"#0f0d07", surface:"#1a1608", surface2:"#231f0d", border:"#352e10",
  text:"#fdf8e8", textDim:"#b89860", muted:"#7a6438",
  accent:"#b45309", accentBright:"#f59e0b", green:"#22c55e", red:"#ef4444", amber:"#fbbf24",
  blue:"#38bdf8", pink:"#fb923c",
  cardGlow:"rgba(245,158,11,0.07)", isDark:true,
};
export const LIGHT = {
  bg:"#f8fafc", surface:"#ffffff", surface2:"#f1f5f9", border:"#e2e8f0",
  text:"#0f172a", textDim:"#64748b", muted:"#94a3b8",
  accent:"#0369a1", accentBright:"#0ea5e9", green:"#16a34a", red:"#dc2626", amber:"#d97706",
  blue:"#2563eb", pink:"#7c3aed",
  cardGlow:"rgba(14,165,233,0.04)", isDark:false,
};

// Keep DARK as alias so any existing imports still work
export const DARK = DARK_GREEN;

export const THEMES = {
  "dark-green": DARK_GREEN,
  "dark-blue":  DARK_BLUE,
  "dark-amber": DARK_AMBER,
  "light":      LIGHT,
};

export const THEME_META = [
  { id:"dark-green", label:"Forest", swatch:"#10b981", border:false },
  { id:"dark-blue",  label:"Ocean",  swatch:"#0ea5e9", border:false },
  { id:"dark-amber", label:"Ember",  swatch:"#f59e0b", border:false },
  { id:"light",      label:"Light",  swatch:"#f8fafc", border:true  },
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
