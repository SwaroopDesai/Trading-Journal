import { NextResponse } from "next/server";

// Primary: Gemini 2.0 Flash (most accurate for chart reading)
// Fallback: Groq Llama 4 Scout (free, used when Gemini quota runs out)
//
// Keys:
//   GEMINI_API_KEY  — from aistudio.google.com (free tier, resets daily)
//   GROQ_API_KEY    — from console.groq.com    (free, 14,400 req/day)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY   = process.env.GROQ_API_KEY;

const PROMPT = `You are an expert trading chart analyst. Study this chart screenshot carefully and extract every piece of trade information you can see.

STEP 1 — IDENTIFY INSTRUMENT/PAIR:
- Look at the very top-left of the chart for the instrument name (e.g. "British Pound / U.S. Dollar", "EURUSD", "XAUUSD", "NAS100")
- Convert to uppercase symbol without slash: "British Pound / U.S. Dollar" → "GBPUSD", "Gold" → "XAUUSD"

STEP 2 — IDENTIFY THE TRADE BOX PATTERN (very common on TradingView):
This is the most important pattern. Look for two colored rectangles stacked vertically:
  PATTERN A — SHORT trade:
    - PINK or RED rectangle on TOP  → this is the RISK zone (stop loss area)
    - TEAL or GREEN rectangle on BOTTOM → this is the REWARD zone (take profit area)
    - The BOUNDARY LINE between the two boxes = ENTRY PRICE
    - TOP edge of the pink/red box = STOP LOSS price
    - BOTTOM edge of the teal/green box = TAKE PROFIT price
    - Direction = "Short" (SL is above entry)

  PATTERN B — LONG trade:
    - TEAL or GREEN rectangle on TOP → this is the REWARD zone
    - PINK or RED rectangle on BOTTOM → this is the RISK zone
    - The BOUNDARY LINE between the two boxes = ENTRY PRICE
    - BOTTOM edge of the red/pink box = STOP LOSS price
    - TOP edge of the teal/green box = TAKE PROFIT price
    - Direction = "Long" (SL is below entry)

  To read the prices: look at the RIGHT-SIDE price axis (vertical numbers on right edge of chart).
  Find the price level that aligns horizontally with each box edge.

STEP 3 — ALTERNATIVE TRADE MARKERS (if no colored boxes):
- Horizontal lines labeled "SL", "TP", "Entry", "Open", "Stop", "Target"
- Buy/Sell arrows on the chart
- Trade panel showing open price, SL, TP values

STEP 4 — RESULT (only if trade is clearly closed):
- WIN: price reached the TP level, green P&L shown
- LOSS: price reached the SL level, red P&L shown
- BREAKEVEN: closed at entry
- null if trade appears still open

STEP 5 — CALCULATE R:R if not shown:
- R:R = distance(entry to TP) / distance(entry to SL)
- Only calculate if you can read all three prices clearly

STEP 6 — SETUP TYPE from visible labels or patterns:
Order Block, FVG, Fair Value Gap, Liquidity Sweep, Breaker Block, BOS, CHoCH, Supply Zone, Demand Zone

RULES:
- Read prices directly from the right-axis labels aligned with each line/box edge
- Use null for anything you cannot determine with confidence — never fabricate
- Pair format: uppercase no slash ("GBPUSD" not "GBP/USD")

Return ONLY this JSON, no markdown, no explanation:
{"pair":null,"direction":null,"entry":null,"sl":null,"tp":null,"result":null,"rr":null,"pips":null,"setup":null,"notes":null}`;

// ── Gemini extractor ────────────────────────────────────────────────────────
async function callGemini(image) {
  const base64Match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i);
  if (!base64Match) throw new Error("Invalid image format");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: PROMPT },
            { inline_data: { mime_type: base64Match[1], data: base64Match[2] } },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // Quota errors → signal fallback needed
    if (res.status === 429 || err?.error?.code === 429) throw Object.assign(new Error("quota"), { quota: true });
    throw new Error(`Gemini ${res.status}: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ── Groq extractor ──────────────────────────────────────────────────────────
async function callGroq(image) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{
        role: "user",
        content: [
          { type: "text",      text: PROMPT },
          { type: "image_url", image_url: { url: image } },
        ],
      }],
      temperature: 0.1,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "";
}

// ── Route handler ───────────────────────────────────────────────────────────
export async function POST(request) {
  if (!GEMINI_API_KEY && !GROQ_API_KEY) {
    return NextResponse.json({
      error: "No API key configured. Add GEMINI_API_KEY (aistudio.google.com) or GROQ_API_KEY (console.groq.com) to your environment variables.",
    }, { status: 500 });
  }

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { image } = body;
  if (!image || typeof image !== "string" || !image.match(/^data:image\//i)) {
    return NextResponse.json({ error: "Missing or invalid image (must be base64 data URL)" }, { status: 400 });
  }

  let rawText = "";
  let usedModel = "";

  // Try Gemini first (most accurate), fall back to Groq on quota error
  if (GEMINI_API_KEY) {
    try {
      rawText   = await callGemini(image);
      usedModel = "gemini-2.0-flash";
    } catch (err) {
      if (!err.quota || !GROQ_API_KEY) {
        return NextResponse.json({ error: err.message }, { status: 502 });
      }
      // Quota exceeded → fall through to Groq
    }
  }

  if (!rawText && GROQ_API_KEY) {
    try {
      rawText   = await callGroq(image);
      usedModel = "llama-4-scout (Gemini quota exceeded)";
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
  }

  if (!rawText) {
    return NextResponse.json({ error: "No response from any model" }, { status: 502 });
  }

  let extracted;
  try {
    const cleaned = rawText.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
    extracted = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "Model returned unparseable response", raw: rawText }, { status: 422 });
  }

  return NextResponse.json({ data: extracted, model: usedModel });
}
