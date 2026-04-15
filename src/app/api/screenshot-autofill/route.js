import { NextResponse } from "next/server";

// Uses Groq — free vision API, no billing required, 14,400 req/day free.
// Get a free key at https://console.groq.com
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"; // Groq's current free vision model

const PROMPT = `You are analyzing a trading chart screenshot. Extract any visible trade data and return ONLY a valid JSON object with these fields (use null for fields you cannot determine):

{
  "pair": "currency pair or instrument symbol (e.g. EURUSD, NAS100)",
  "direction": "Long or Short",
  "entry": "entry price as a number",
  "sl": "stop loss price as a number",
  "tp": "take profit price as a number",
  "result": "WIN, LOSS, or BE (breakeven) — only if trade is closed",
  "rr": "risk:reward ratio as a number (e.g. 2.5)",
  "pips": "pips gained or lost as a number",
  "setup": "setup type if identifiable (e.g. Order Block, FVG, Liquidity Sweep)",
  "notes": "brief description of what you see"
}

Return ONLY the JSON object, no markdown, no explanation.`;

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
    max_tokens: 512,
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
