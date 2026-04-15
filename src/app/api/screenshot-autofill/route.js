import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
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

  // Strip data URL prefix to get raw base64
  const base64Match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i);
  if (!base64Match) {
    return NextResponse.json({ error: "image must be a base64 data URL" }, { status: 400 });
  }
  const mimeType   = base64Match[1];
  const base64Data = base64Match[2];

  const geminiBody = {
    contents: [{
      parts: [
        { text: PROMPT },
        { inline_data: { mime_type: mimeType, data: base64Data } },
      ],
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 512,
    },
  };

  let geminiRes;
  try {
    geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to reach Gemini API" }, { status: 502 });
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    return NextResponse.json({ error: `Gemini error: ${errText}` }, { status: geminiRes.status });
  }

  const geminiData = await geminiRes.json();
  const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  let extracted;
  try {
    // Gemini may wrap in markdown code blocks — strip them
    const cleaned = rawText.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
    extracted = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "Gemini returned unparseable response", raw: rawText }, { status: 422 });
  }

  return NextResponse.json({ data: extracted });
}
