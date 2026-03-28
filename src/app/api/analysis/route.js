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

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return new Response(JSON.stringify({
        error: "Missing ANTHROPIC_API_KEY. Add it to your local env and Vercel project settings.",
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      })
    }

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
      cache: "no-store",
    })

    const data = await upstream.json()

    if (!upstream.ok) {
      const message = data?.error?.message || "Anthropic request failed."
      return new Response(JSON.stringify({ error: message }), {
        status: upstream.status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      })
    }

    const text = data?.content?.map(block => block?.text || "").join("\n").trim()

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
