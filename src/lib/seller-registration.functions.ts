import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const NP_BASE = "https://api.nowpayments.io/v1";
const SELLER_FEE_NGN = 3000;

function need(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured. Add it under Cloud → Secrets.`);
  return v;
}

const Input = z.object({
  payCurrency: z.string().trim().min(2).max(20).default("usdttrc20"),
});

/** Initiate a NOWPayments invoice for the ₦3,000 mandatory seller registration fee. */
export const initSellerRegistrationPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const apiKey = need("NOWPAYMENTS_API_KEY");

    const { data: profile } = await supabase
      .from("profiles").select("email,username,is_suspended").eq("id", userId).single();
    if (!profile) throw new Error("Profile missing");
    if (profile.is_suspended) throw new Error("Account suspended");

    // Already paid? Bail early.
    const { data: existing } = await supabase
      .from("sellers").select("paid_registration_at").eq("id", userId).maybeSingle();
    if (existing?.paid_registration_at) {
      throw new Error("Registration fee already paid");
    }

    const reference = `SAMSR_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
    const origin = new URL(process.env.SUPABASE_URL ?? "https://example.com").origin;

    const res = await fetch(`${NP_BASE}/invoice`, {
      method: "POST",
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        price_amount: SELLER_FEE_NGN,
        price_currency: "ngn",
        pay_currency: data.payCurrency,
        order_id: reference,
        order_description: `Sammy Store seller registration fee (${profile.username})`,
        ipn_callback_url: `${origin}/api/public/nowpayments-webhook`,
        success_url: `${origin}/become-seller?np_ref=${reference}`,
        cancel_url: `${origin}/become-seller?np_cancel=${reference}`,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json?.invoice_url) {
      throw new Error(`NOWPayments init failed: ${JSON.stringify(json).slice(0, 200)}`);
    }

    // Use admin client to insert with purpose='seller_registration'
    const { error } = await supabaseAdmin.from("payment_intents").insert({
      user_id: userId,
      provider: "nowpayments",
      provider_reference: reference,
      external_id: String(json.id ?? ""),
      amount_paid: SELLER_FEE_NGN,
      credit_amount: SELLER_FEE_NGN,
      currency: "NGN",
      purpose: "seller_registration",
      checkout_url: json.invoice_url,
      raw_payload: json,
    });
    if (error) throw new Error(error.message);

    return { checkoutUrl: json.invoice_url as string, reference, amount: SELLER_FEE_NGN };
  });

/** Check whether the current user has paid the seller registration fee. */
export const getSellerRegistrationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, supabase } = context;
    const { data: seller } = await supabase
      .from("sellers")
      .select("paid_registration_at, status, business_name, registration_payment_ref")
      .eq("id", userId).maybeSingle();
    return {
      paid: Boolean(seller?.paid_registration_at),
      status: seller?.status ?? null,
      businessName: seller?.business_name ?? null,
      paymentRef: seller?.registration_payment_ref ?? null,
      feeNgn: SELLER_FEE_NGN,
    };
  });
