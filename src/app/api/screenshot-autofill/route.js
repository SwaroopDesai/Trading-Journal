import { NextResponse } from "next/server";

// Uses Groq — free vision API, no billing required, 14,400 req/day free.
// Get a free key at https://console.groq.com
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"; // Groq's current free vision model

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

export async function POST(request) {
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured — get a free key at console.groq.com" }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { image } = body;
  if (!image || typeof image !== "string") {
    return NextResponse.json({ error: "Missing image (base64 data URL)" }, { status: 400 });
  }

  if (!image.match(/^data:image\//i)) {
    return NextResponse.json({ error: "image must be a base64 data URL" }, { status: 400 });
  }

  // OpenRouter uses OpenAI-compatible API with image_url for base64
  const orBody = {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text",      text: PROMPT },
          { type: "image_url", image_url: { url: image } },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 1024,
  };

  let orRes;
  try {
    orRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(orBody),
    });
  } catch {
    return NextResponse.json({ error: "Failed to reach Groq API" }, { status: 502 });
  }

  if (!orRes.ok) {
    const errText = await orRes.text();
    return NextResponse.json({ error: `Groq error: ${errText}` }, { status: orRes.status });
  }

  const orData  = await orRes.json();
  const rawText = orData?.choices?.[0]?.message?.content || "";

  let extracted;
  try {
    const cleaned = rawText.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
    extracted = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "Model returned unparseable response", raw: rawText }, { status: 422 });
  }

  return NextResponse.json({ data: extracted });
}
