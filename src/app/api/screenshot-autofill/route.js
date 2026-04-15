import { NextResponse } from "next/server";

// Uses Groq — free vision API, no billing required, 14,400 req/day free.
// Get a free key at https://console.groq.com
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"; // Groq's current free vision model

const PROMPT = `You are an expert trading chart analyst. Study this chart screenshot carefully and extract every piece of trade information you can see.

WHAT TO LOOK FOR:

1. INSTRUMENT/PAIR — Check top-left corner of the chart, the tab title, or any label. Examples: EURUSD, GBPUSD, XAUUSD, NAS100, US30, BTCUSD, GER40. Output in uppercase with no slash (e.g. "EURUSD" not "EUR/USD").

2. DIRECTION — Look for:
   - Buy/Long: upward arrow, green entry line, "BUY" label, price going up from entry
   - Sell/Short: downward arrow, red entry line, "SELL" label, price going down from entry

3. PRICE LEVELS — Look for horizontal lines with price labels on the right axis:
   - Entry: the line where the trade was opened (often labeled "Entry", "Open", or just a price)
   - Stop Loss: the line labeled "SL", "Stop", usually in red, on the losing side
   - Take Profit: the line labeled "TP", "Target", usually in green, on the winning side
   - Read the exact price numbers from the right-side axis labels or inline labels

4. RESULT — Only fill if the trade is clearly closed:
   - WIN: price reached TP, green P&L shown, "profit" text visible
   - LOSS: price reached SL, red P&L shown, "loss" text visible
   - BREAKEVEN: closed at entry level

5. R:R RATIO — May be shown as "RR: 2.5", "1:2.5", or calculate from SL/TP distances if visible.

6. PIPS — May be shown as "+45 pips", "45.0 pips", or a P&L number. Use positive for profit, negative for loss.

7. SETUP TYPE — Identify any visible patterns or labels:
   - Order Block (OB), Fair Value Gap (FVG), Liquidity Sweep, Breaker Block
   - BOS (Break of Structure), CHoCH (Change of Character)
   - Supply/Demand zone, Support/Resistance
   - If labeled on chart, use exact label text

8. NOTES — Brief 1-2 sentence description of what the chart shows.

IMPORTANT RULES:
- Read price numbers carefully from axis labels — do not guess or approximate
- Use null for any field you are not confident about — do not fabricate data
- "result" should be null if the trade appears still open
- Output the pair without slashes: "EURUSD" not "EUR/USD"

Return ONLY this JSON object, no markdown fences, no explanation, no extra text:
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
