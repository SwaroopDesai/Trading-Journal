# Prompt: Stripe Integration for Paid Tier

Read `AGENTS.md` first.

## Task
Add Stripe payment integration for paid tier. Free tier limited to 30 trades/month, paid tier unlimited + premium features.

## Pricing strategy

### Free tier
- 30 trades/month
- 5 daily plans/month
- 1 weekly plan/month
- All analytics (read-only after limit)
- AI Analysis: 5/month
- No weekly debrief email

### Pro tier ($15/month)
- Unlimited trades
- Unlimited daily/weekly plans
- AI Analysis: 100/month
- Weekly debrief email
- Pattern Detector
- Confluence Tracking
- Export to PDF
- Priority support

## Step 1: Stripe setup

1. Create Stripe account at stripe.com
2. Create Product: "FXEDGE Pro"
3. Add Price: $15/month recurring
4. Copy Product ID and Price ID
5. Get API keys (test + live)

## Step 2: Install Stripe SDK

```bash
npm install stripe @stripe/stripe-js
```

## Step 3: Add subscription table

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  status text NOT NULL, -- active, canceled, past_due, etc.
  tier text NOT NULL DEFAULT 'free', -- free, pro
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own subscription" ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE only via service role from webhook
```

## Step 4: Add env vars

In `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Add same to Vercel.

## Step 5: Create checkout API route

`src/app/api/stripe/checkout/route.js`:
```js
import Stripe from "stripe";
import { createClient } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for existing customer
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  let customerId = existing?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{
      price: process.env.STRIPE_PRICE_ID,
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=canceled`,
  });

  return Response.json({ url: session.url });
}
```

## Step 6: Create webhook handler

`src/app/api/stripe/webhook/route.js`:
```js
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const customer = await stripe.customers.retrieve(sub.customer);
      const userId = customer.metadata.user_id;

      await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: sub.customer,
        stripe_subscription_id: sub.id,
        status: sub.status,
        tier: sub.status === "active" ? "pro" : "free",
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      });
      break;
    }
  }

  return Response.json({ received: true });
}
```

## Step 7: Configure webhook endpoint in Stripe

In Stripe Dashboard → Developers → Webhooks:
- Endpoint URL: `https://fxedge.online/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy webhook secret → add to env

## Step 8: Add Upgrade button + tier check

Create `src/components/UpgradeButton.jsx`:
```jsx
"use client"
export default function UpgradeButton({ T }) {
  const handleUpgrade = async () => {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const { url } = await res.json();
    window.location.href = url;
  };

  return (
    <button onClick={handleUpgrade} style={{
      background: `linear-gradient(135deg, ${T.accentBright}, ${T.pink})`,
      color: "#fff",
      border: "none",
      padding: "10px 18px",
      borderRadius: 10,
      cursor: "pointer",
      fontWeight: 700,
    }}>
      Upgrade to Pro — $15/mo
    </button>
  );
}
```

Add tier check helper in `src/lib/utils.js`:
```js
export async function getUserTier(supabase, userId) {
  const { data } = await supabase
    .from("subscriptions")
    .select("tier, status, current_period_end")
    .eq("user_id", userId)
    .single();
  
  if (!data) return "free";
  if (data.status !== "active") return "free";
  if (new Date(data.current_period_end) < new Date()) return "free";
  return data.tier;
}
```

## Step 9: Enforce limits

In `saveTrade` in `page.jsx`:
```js
const saveTrade = async (t) => {
  const tier = await getUserTier(supabase, user.id);
  
  if (tier === "free" && !t._dbid) {
    // Count trades this month
    const monthStart = new Date();
    monthStart.setDate(1);
    
    const { count } = await supabase
      .from("trades")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("date", monthStart.toISOString().split("T")[0]);
    
    if (count >= 30) {
      toast.error("Free plan limit: 30 trades/month. Upgrade to Pro for unlimited.");
      return;
    }
  }
  
  // ... existing save logic
};
```

## Step 10: Show usage on Dashboard

```jsx
{tier === "free" && (
  <Card>
    <div>Free plan: {tradesThisMonth}/30 trades this month</div>
    <UpgradeButton T={T} />
  </Card>
)}
```

## Verification
1. Test mode: complete checkout with `4242 4242 4242 4242`
2. Webhook fires → subscription row created
3. Tier becomes "pro"
4. Limits removed
5. Cancel subscription → tier becomes "free" again
6. Try to log 31st trade on free → blocked with upgrade prompt

## Commit message
```
feat: Stripe integration with free + Pro tiers
```
