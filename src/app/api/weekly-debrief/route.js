import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const revalidate = 0

const TIME_ZONE = "Asia/Calcutta"

function getLocalDateString(timeZone = TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  return formatter.format(new Date())
}

function buildPrompt(plan, trades) {
  const wins = trades.filter((trade) => trade.result === "WIN")
  const losses = trades.filter((trade) => trade.result === "LOSS")
  const totalR = trades.reduce((sum, trade) => sum + (trade.rr || 0), 0)
  const winRate = trades.length ? ((wins.length / trades.length) * 100).toFixed(1) : "0.0"

  const pairSummary = Object.entries(
    trades.reduce((acc, trade) => {
      if (!acc[trade.pair]) acc[trade.pair] = { count: 0, wins: 0, totalR: 0 }
      acc[trade.pair].count += 1
      if (trade.result === "WIN") acc[trade.pair].wins += 1
      acc[trade.pair].totalR += trade.rr || 0
      return acc
    }, {})
  )
    .map(([pair, stats]) => {
      const wr = stats.count ? ((stats.wins / stats.count) * 100).toFixed(0) : "0"
      const total = stats.totalR >= 0 ? `+${stats.totalR.toFixed(2)}` : stats.totalR.toFixed(2)
      return `${pair}: ${stats.count} trades, ${wr}% WR, ${total}R`
    })
    .join("\n") || "No pair data"

  const tradeLines = trades
    .map((trade) => {
      const rr = typeof trade.rr === "number" ? `${trade.rr >= 0 ? "+" : ""}${trade.rr.toFixed(2)}R` : "0.00R"
      return `${trade.date} | ${trade.pair} | ${trade.direction} | ${trade.result} | ${rr} | Setup: ${trade.setup || "N/A"} | Emotion: ${trade.emotion || "N/A"} | Mistakes: ${trade.mistakes || "None"} | Notes: ${trade.notes || "None"}`
    })
    .join("\n") || "No trades logged this week."

  return `You are an experienced ICT/SMC trading performance coach.

Create a concise but high-value weekly debrief for this trader.
The tone should feel premium, direct, and practical.
Do not use markdown tables.
Use these exact sections:
1. Weekly Scorecard
2. What Went Well
3. What Hurt Performance
4. Best Opportunity
5. Next Week Focus

WEEK PLAN
Week: ${plan.weekStart} to ${plan.weekEnd}
Weekly Bias: ${plan.overallBias || "Not provided"}
Market Structure: ${plan.marketStructure || "Not provided"}
Key Events: ${plan.keyEvents || "Not provided"}
Targets: ${plan.targets || "Not provided"}
Plan Notes: ${plan.notes || "Not provided"}
Pair Bias: ${JSON.stringify(plan.pairs || {})}

WEEK RESULTS
Trades: ${trades.length}
Wins: ${wins.length}
Losses: ${losses.length}
Win Rate: ${winRate}%
Total R: ${totalR >= 0 ? "+" : ""}${totalR.toFixed(2)}R

PAIR BREAKDOWN
${pairSummary}

TRADE LOG
${tradeLines}

Requirements:
- If there are no trades, still produce a useful debrief based on planning quality.
- Mention one strength, one weakness, and one concrete focus for next week.
- Keep it readable in short paragraphs and bullets.
- Avoid fluff.`
}

async function generateDebrief(prompt, apiKey) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" +
      encodeURIComponent(apiKey),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 900,
          temperature: 0.6,
        },
      }),
      cache: "no-store",
    }
  )

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error?.message || "Gemini request failed.")
  }

  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("\n")
      .trim() || "No response"
  )
}

export async function GET(request) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get("authorization")

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const geminiApiKey = process.env.GEMINI_API_KEY

    if (!supabaseUrl || !serviceRoleKey || !geminiApiKey) {
      return Response.json(
        {
          error:
            "Missing required env vars. Expected NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and GEMINI_API_KEY.",
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const today = getLocalDateString()
    const { data: plans, error: plansError } = await supabase
      .from("weekly_plans")
      .select("id, user_id, weekStart, weekEnd, overallBias, marketStructure, keyEvents, targets, notes, pairs, review")
      .lte("weekEnd", today)
      .order("weekEnd", { ascending: false })

    if (plansError) throw plansError

    const candidates = (plans || []).filter((plan) => !String(plan.review || "").trim())
    const generated = []
    const skipped = []

    for (const plan of candidates) {
      const { data: trades, error: tradesError } = await supabase
        .from("trades")
        .select("date, pair, direction, result, rr, setup, emotion, mistakes, notes")
        .eq("user_id", plan.user_id)
        .gte("date", plan.weekStart)
        .lte("date", plan.weekEnd)
        .order("date", { ascending: true })

      if (tradesError) {
        skipped.push({ weeklyPlanId: plan.id, reason: tradesError.message })
        continue
      }

      try {
        const prompt = buildPrompt(plan, trades || [])
        const text = await generateDebrief(prompt, geminiApiKey)
        const stamped = `AI Weekly Debrief\nGenerated automatically on ${today}\n\n${text}`

        const { error: updateError } = await supabase
          .from("weekly_plans")
          .update({ review: stamped })
          .eq("id", plan.id)
          .eq("user_id", plan.user_id)

        if (updateError) throw updateError

        generated.push({ weeklyPlanId: plan.id, weekStart: plan.weekStart, userId: plan.user_id })
      } catch (error) {
        skipped.push({ weeklyPlanId: plan.id, reason: error.message })
      }
    }

    return Response.json({
      ok: true,
      today,
      checked: candidates.length,
      generated: generated.length,
      skipped,
    })
  } catch (error) {
    return Response.json({ error: error.message || "Unexpected server error." }, { status: 500 })
  }
}
