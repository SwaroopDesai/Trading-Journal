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

// Storage / localStorage keys
export const STORAGE_BUCKET         = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "journal-images";
export const TAB_STORAGE_KEY        = "fxedge_active_tab";
export const DAILY_PAIR_NOTES_MARKER = "__FXEDGE_PAIR_NOTES__::";

// Color themes
export const DARK = {
  bg:"#0b0f0e", surface:"#131a18", surface2:"#1a2420", border:"#243330",
  text:"#e8f5f0", textDim:"#7aa898", muted:"#4a6b60",
  accent:"#059669", accentBright:"#10b981", green:"#22c55e", red:"#ef4444", amber:"#f59e0b",
  blue:"#3b82f6", pink:"#06b6d4",
  cardGlow:"rgba(16,185,129,0.07)", isDark: true
};
export const LIGHT = {
  bg:"#f0f7f5", surface:"#ffffff", surface2:"#e8f5f0", border:"#c8e6dc",
  text:"#0a1f1a", textDim:"#3d6b5e", muted:"#7aaa98",
  accent:"#047857", accentBright:"#059669", green:"#16a34a", red:"#dc2626", amber:"#d97706",
  blue:"#2563eb", pink:"#0891b2",
  cardGlow:"rgba(5,150,105,0.05)", isDark: false
};

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
