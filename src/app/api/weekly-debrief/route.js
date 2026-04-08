import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const revalidate = 0

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://trading-journal-ecru-ten.vercel.app"
const GEMINI_MODEL = "gemini-2.5-flash-lite"

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  })
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRole) {
    throw new Error("Missing Supabase server env. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
  }

  return createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function getWeekTrades(trades, plan) {
  return trades.filter((trade) => {
    if (!trade?.date) return false
    return trade.date >= plan.weekStart && trade.date <= plan.weekEnd
  })
}

function buildWeekSummary(trades) {
  const wins = trades.filter((trade) => trade.result === "WIN")
  const losses = trades.filter((trade) => trade.result === "LOSS")
  const totalR = trades.reduce((sum, trade) => sum + Number(trade.rr || 0), 0)
  const byPair = {}
  const bySetup = {}
  const byEmotion = {}
  const byMistake = {}

  trades.forEach((trade) => {
    if (trade.pair) {
      if (!byPair[trade.pair]) byPair[trade.pair] = { count: 0, wins: 0, r: 0 }
      byPair[trade.pair].count += 1
      byPair[trade.pair].r += Number(trade.rr || 0)
      if (trade.result === "WIN") byPair[trade.pair].wins += 1
    }
    if (trade.setup) {
      if (!bySetup[trade.setup]) bySetup[trade.setup] = { count: 0, wins: 0, r: 0 }
      bySetup[trade.setup].count += 1
      bySetup[trade.setup].r += Number(trade.rr || 0)
      if (trade.result === "WIN") bySetup[trade.setup].wins += 1
    }
    if (trade.emotion) byEmotion[trade.emotion] = (byEmotion[trade.emotion] || 0) + 1
    if (trade.mistakes && trade.mistakes !== "None") byMistake[trade.mistakes] = (byMistake[trade.mistakes] || 0) + 1
  })

  const bestPair = Object.entries(byPair).sort((a, b) => b[1].r - a[1].r)[0] || null
  const bestSetup = Object.entries(bySetup).sort((a, b) => b[1].r - a[1].r)[0] || null
  const topEmotion = Object.entries(byEmotion).sort((a, b) => b[1] - a[1])[0] || null
  const topMistake = Object.entries(byMistake).sort((a, b) => b[1] - a[1])[0] || null

  return {
    wins,
    losses,
    totalR,
    byPair,
    bySetup,
    byEmotion,
    byMistake,
    bestPair,
    bestSetup,
    topEmotion,
    topMistake,
    winRate: trades.length ? ((wins.length / trades.length) * 100).toFixed(1) : "0",
  }
}

function buildWeeklyPrompt(plan, trades) {
  const summary = buildWeekSummary(trades)
  const recentTrades = trades.slice(0, 12).map((trade) => [
    `${trade.date} ${trade.pair || "Unknown"} ${trade.direction || ""}`.trim(),
    `Result: ${trade.result || "-"}`,
    `R: ${Number(trade.rr || 0).toFixed(2)}`,
    `Setup: ${trade.setup || "-"}`,
    `Emotion: ${trade.emotion || "-"}`,
    `Mistake: ${trade.mistakes || "-"}`,
    `Notes: ${trade.notes || "none"}`,
  ].join(" | "))

  return `
You are an elite ICT/SMC trading coach writing a weekly debrief email for a trader.
Write like a real mentor: clear, honest, encouraging, and actionable.

WEEKLY PLAN
- Week: ${plan.weekStart} to ${plan.weekEnd}
- Overall Bias: ${plan.overallBias || "Not specified"}
- Weekly Notes: ${plan.notes || "None"}
- Market Structure: ${plan.marketStructure || "None"}
- Key Events: ${plan.keyEvents || "None"}
- Weekly Targets: ${plan.targets || "None"}

WEEKLY PERFORMANCE
- Total Trades: ${trades.length}
- Wins: ${summary.wins.length}
- Losses: ${summary.losses.length}
- Win Rate: ${summary.winRate}%
- Total R: ${summary.totalR >= 0 ? "+" : ""}${summary.totalR.toFixed(2)}R

PAIR BREAKDOWN
${Object.entries(summary.byPair).map(([pair, data]) => `${pair}: ${data.count} trades, ${data.wins} wins, ${data.r >= 0 ? "+" : ""}${data.r.toFixed(2)}R`).join("\n") || "No pair data"}

SETUP BREAKDOWN
${Object.entries(summary.bySetup).map(([setup, data]) => `${setup}: ${data.count} trades, ${data.wins} wins, ${data.r >= 0 ? "+" : ""}${data.r.toFixed(2)}R`).join("\n") || "No setup data"}

EMOTIONAL STATES
${Object.entries(summary.byEmotion).map(([emotion, count]) => `${emotion}: ${count}x`).join("\n") || "None logged"}

RECURRING MISTAKES
${Object.entries(summary.byMistake).map(([mistake, count]) => `${mistake}: ${count}x`).join("\n") || "No mistakes logged"}

TRADES
${recentTrades.join("\n") || "No trades logged for this week."}

Write the debrief with these exact sections:
1. Weekly Scorecard
2. What You Did Well
3. Biggest Leaks
4. Psychological Read
5. Best Opportunity From The Week
6. Focus For Next Week
7. Monday Reset

Rules:
- Be specific to the data.
- Mention concrete pairs, setups, emotions, or mistakes when possible.
- Keep it readable in email.
- Do not use markdown tables.
- Do not write a subject line.
- Do not write "Hey", "Hi", or any greeting.
- Do not use placeholders like [Trader's Name].
- Do not include an email intro or email sign-off.
- Output only the 7 report sections and their content.
  `.trim()
}

async function generateDebrief(prompt) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY.")

  const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 1600,
        temperature: 0.7,
      },
    }),
    cache: "no-store",
  })

  const data = await upstream.json()
  if (!upstream.ok) {
    throw new Error(data?.error?.message || "Gemini weekly debrief request failed.")
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("\n").trim()
  if (!text) throw new Error("Gemini returned an empty weekly debrief.")
  return text
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function sectionizeDebrief(text) {
  return text
    .split(/\n(?=\d+\.\s)/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean)
      const heading = lines.shift() || ""
      return { heading, body: lines.join("<br/>") }
    })
}

function cleanDebriefText(text) {
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => {
      const normalized = line.trim()
      if (!normalized) return true
      if (/^subject\s*:/i.test(normalized)) return false
      if (/^(hey|hi|hello)\b/i.test(normalized)) return false
      if (/\[trader'?s name\]/i.test(normalized)) return false
      if (/^dear\b/i.test(normalized)) return false
      return true
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function formatEmailHtml(plan, text, trades) {
  const summary = buildWeekSummary(trades)
  const sections = sectionizeDebrief(escapeHtml(text))
  const statCards = [
    { label: "Trades", value: String(trades.length), tone: "#ffffff" },
    { label: "Win Rate", value: `${summary.winRate}%`, tone: "#56d37e" },
    { label: "Total R", value: `${summary.totalR >= 0 ? "+" : ""}${summary.totalR.toFixed(2)}R`, tone: summary.totalR >= 0 ? "#56d37e" : "#ff6b7d" },
    { label: "Best Pair", value: summary.bestPair?.[0] || "-", tone: "#f4f5fb" },
  ].map((card) => `
    <div style="flex:1;min-width:132px;padding:14px 16px;border-radius:16px;background:#191a25;border:1px solid #2a2b38;">
      <div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#8d92b2;font-weight:700;margin-bottom:8px;">${card.label}</div>
      <div style="font-size:22px;font-weight:800;color:${card.tone};line-height:1.2;">${escapeHtml(card.value)}</div>
    </div>
  `).join("")

  const summaryStrip = `
    <div style="margin:0 0 22px;padding:16px 18px;border-radius:16px;background:#151827;border:1px solid #2a2b38;">
      <div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#b961ff;font-weight:700;margin-bottom:10px;">Week Context</div>
      <div style="font-size:14px;color:#d7d8e2;line-height:1.8;">
        <div><b style="color:#ffffff;">Bias:</b> ${escapeHtml(plan.overallBias || "Not specified")}</div>
        <div><b style="color:#ffffff;">Top setup:</b> ${escapeHtml(summary.bestSetup?.[0] || "No clear setup edge yet")}</div>
        <div><b style="color:#ffffff;">Dominant state:</b> ${escapeHtml(summary.topEmotion?.[0] || "Not enough emotion data")}</div>
        <div><b style="color:#ffffff;">Recurring mistake:</b> ${escapeHtml(summary.topMistake?.[0] || "No repeated mistake logged")}</div>
      </div>
    </div>
  `

  const body = sections.map((section) => `
    <div style="margin:0 0 16px;padding:18px 18px 16px;border-radius:18px;background:#171923;border:1px solid #2a2b38;">
      <div style="margin:0 0 10px;color:#ffffff;font-weight:800;font-size:15px;line-height:1.4;">${section.heading}</div>
      <div style="margin:0;color:#d7d8e2;line-height:1.8;font-size:14px;">${section.body || "No notes."}</div>
    </div>
  `).join("")

  return `
  <div style="background:#0b0b10;padding:32px 16px;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:680px;margin:0 auto;background:#14141d;border:1px solid #2a2b38;border-radius:20px;overflow:hidden;">
      <div style="padding:30px 28px 20px;background:radial-gradient(circle at top left,#27143b 0%,#181a27 48%,#13131a 100%);border-bottom:1px solid #2a2b38;">
        <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#b961ff;font-weight:700;margin-bottom:10px;">FXEDGE Weekly Debrief</div>
        <div style="font-size:30px;font-weight:800;color:#ffffff;line-height:1.15;margin-bottom:10px;">Your Sunday Coaching Report</div>
        <div style="font-size:14px;color:#a1a6c5;line-height:1.7;margin-bottom:18px;">Week reviewed: ${escapeHtml(plan.weekStart)} to ${escapeHtml(plan.weekEnd)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:10;">${statCards}</div>
      </div>
      <div style="padding:24px 28px;">
        ${summaryStrip}
        ${body}
        <div style="margin-top:24px;padding:16px 18px;border-radius:14px;background:#1c1d29;border:1px solid #2a2b38;">
          <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#b961ff;font-weight:700;margin-bottom:8px;">Open FXEDGE</div>
          <div style="font-size:14px;color:#d7d8e2;line-height:1.7;margin-bottom:14px;">Your debrief has also been saved in the Review tab so you can revisit it inside the journal.</div>
          <a href="${APP_URL}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:linear-gradient(135deg,#b961ff,#ff4fb0);color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;">Open Journal</a>
        </div>
      </div>
    </div>
  </div>
  `.trim()
}

async function sendEmail(to, subject, html) {
  const apiKey = process.env.BREVO_API_KEY
  const fromEmail = process.env.BREVO_FROM_EMAIL
  const fromName = process.env.BREVO_FROM_NAME || "FXEDGE"

  if (!apiKey || !fromEmail) {
    throw new Error("Missing BREVO_API_KEY or BREVO_FROM_EMAIL.")
  }

  const upstream = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    cache: "no-store",
  })

  if (!upstream.ok) {
    const data = await upstream.json().catch(() => ({}))
    throw new Error(data?.message || "Brevo email send failed.")
  }
}

async function processDebriefs() {
  const supabase = getSupabaseAdmin()
  const today = new Date().toISOString().slice(0, 10)

  const { data: plans, error: plansError } = await supabase
    .from("weekly_plans")
    .select("id,user_id,weekStart,weekEnd,overallBias,pairs,marketStructure,keyEvents,targets,notes,review,premiumDiscount")
    .lte("weekEnd", today)
    .or("review.is.null,review.eq.")
    .order("weekStart", { ascending: false })

  if (plansError) throw plansError

  const pendingPlans = plans || []
  const results = []

  for (const plan of pendingPlans) {
    try {
      const { data: authUser, error: userError } = await supabase.auth.admin.getUserById(plan.user_id)
      if (userError) throw userError
      const email = authUser?.user?.email
      if (!email) throw new Error("User email not found.")

      const { data: trades, error: tradesError } = await supabase
        .from("trades")
        .select("id,date,pair,direction,result,rr,setup,emotion,mistakes,notes,session,killzone")
        .eq("user_id", plan.user_id)
        .gte("date", plan.weekStart)
        .lte("date", plan.weekEnd)
        .order("date", { ascending: false })

      if (tradesError) throw tradesError

      const weekTrades = getWeekTrades(trades || [], plan)
      const prompt = buildWeeklyPrompt(plan, weekTrades)
      const debrief = cleanDebriefText(await generateDebrief(prompt))
      const review = `AI Weekly Debrief\n\n${debrief}`

      const { error: updateError } = await supabase
        .from("weekly_plans")
        .update({ review })
        .eq("id", plan.id)

      if (updateError) throw updateError

      const subject = `Your FXEDGE Weekly Debrief: ${plan.weekStart} to ${plan.weekEnd}`
      const html = formatEmailHtml(plan, debrief, weekTrades)
      await sendEmail(email, subject, html)

      results.push({ planId: plan.id, email, status: "sent" })
    } catch (error) {
      results.push({ planId: plan.id, status: "failed", error: error.message || "Unknown error" })
    }
  }

  return results
}

async function handleRequest(request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization") || ""
  const expected = cronSecret ? `Bearer ${cronSecret}` : null

  if (expected && authHeader !== expected) {
    return json({ error: "Unauthorized" }, 401)
  }

  try {
    const results = await processDebriefs()
    return json({
      ok: true,
      processed: results.length,
      sent: results.filter((item) => item.status === "sent").length,
      failed: results.filter((item) => item.status === "failed").length,
      results,
    })
  } catch (error) {
    return json({ error: error.message || "Weekly debrief failed." }, 500)
  }
}

export async function GET(request) {
  return handleRequest(request)
}

export async function POST(request) {
  return handleRequest(request)
}
