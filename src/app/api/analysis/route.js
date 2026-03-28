export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request) {
  try {
    const { prompt } = await request.json()

    if (!prompt || !String(prompt).trim()) {
      return new Response(JSON.stringify({ error: "Prompt is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      })
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return new Response(JSON.stringify({
        error: "Missing GEMINI_API_KEY. Add it to your local env and Vercel project settings.",
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      })
    }

    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" + encodeURIComponent(apiKey), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      }),
      cache: "no-store",
    })

    const data = await upstream.json()

    if (!upstream.ok) {
      const message = data?.error?.message || "Gemini request failed."
      return new Response(JSON.stringify({ error: message }), {
        status: upstream.status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      })
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map(part => part?.text || "")
      .join("\n")
      .trim()

    return new Response(JSON.stringify({ text: text || "No response" }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || "Unexpected server error." }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    })
  }
}
