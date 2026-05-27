import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Sort object keys recursively (matches NOWPayments IPN signing spec). */
function sortObject(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj && typeof obj === "object") {
    return Object.keys(obj).sort().reduce((acc: Record<string, any>, k) => {
      acc[k] = sortObject(obj[k]);
      return acc;
    }, {});
  }
  return obj;
}

export const Route = createFileRoute("/api/public/nowpayments-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.NOWPAYMENTS_IPN_SECRET;
        if (!secret) return new Response("not configured", { status: 500 });

        const sigHeader = request.headers.get("x-nowpayments-sig") ?? "";
        const body = await request.text();
        let payload: any;
        try { payload = JSON.parse(body); } catch { return new Response("bad json", { status: 400 }); }

        // NOWPayments signs HMAC-SHA512 of sorted-by-key JSON string
        const sortedJson = JSON.stringify(sortObject(payload));
        const expected = createHmac("sha512", secret).update(sortedJson).digest("hex");
        try {
          const a = Buffer.from(sigHeader, "hex");
          const b = Buffer.from(expected, "hex");
          if (a.length !== b.length || !timingSafeEqual(a, b))
            return new Response("invalid signature", { status: 401 });
        } catch {
          return new Response("invalid signature", { status: 401 });
        }

        const status = String(payload?.payment_status ?? "");
        const reference = payload?.order_id;
        if (!reference) return new Response("missing order_id", { status: 400 });

        // Only act on confirmed/finished states
        if (status === "finished" || status === "confirmed") {
          // Look up the intent to route by purpose
          const { data: intent, error: lookupErr } = await supabaseAdmin
            .from("payment_intents")
            .select("purpose")
            .eq("provider", "nowpayments")
            .eq("provider_reference", reference)
            .maybeSingle();
          if (lookupErr || !intent) {
            console.error("NOWPayments webhook: unknown reference", reference, lookupErr);
            return new Response("unknown reference", { status: 404 });
          }

          const rpc = intent.purpose === "seller_registration"
            ? "confirm_seller_registration_payment"
            : "credit_wallet_from_payment";
          const args = intent.purpose === "seller_registration"
            ? {
                _provider_reference: reference,
                _external_id: String(payload?.payment_id ?? ""),
                _raw: payload,
              }
            : {
                _provider: "nowpayments" as const,
                _provider_reference: reference,
                _external_id: String(payload?.payment_id ?? ""),
                _raw: payload,
              };

          const { error } = await (supabaseAdmin.rpc as any)(rpc, args);
          if (error) {
            console.error(`NOWPayments ${rpc} error:`, error);
            return new Response(error.message, { status: 500 });
          }
        }
        return new Response("ok");
      },
    },
  },
});
