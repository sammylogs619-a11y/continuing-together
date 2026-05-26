import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SYSTEM_PROMPT = `You are Sammy Store's friendly AI support agent.

Sammy Store is a Nigerian digital marketplace selling social media accounts (Facebook, Instagram, TikTok, Telegram, Twitter/X, Netflix, Canva, Spotify, Gmail, crypto accounts, etc.). Currency is Nigerian Naira (₦).

How the platform works:
- Users sign up, then fund their wallet via NOWPayments (cryptocurrency).
- They use wallet balance to buy products. Each product comes with login credentials auto-delivered after purchase.
- Coupons can be applied either at wallet funding (gives bonus balance) or product checkout (gives discount).
- Buyers can apply to become Sellers by sending a request. Admin approves or declines. Approved sellers have their own dashboard, can list products, and request payouts.
- Withdrawals: sellers request payout to their bank account. Admin processes it manually.

Your job:
- Help with payment & funding issues (NOWPayments errors, missing balance, pending payments).
- Help with product delivery problems (out of stock, wrong credentials).
- Explain how to apply and use coupons.
- Walk users through wallet funding step by step.
- Resolve disputes calmly and professionally — always polite, never blame the user.
- For serious issues (lost money, fraud, account hack) say you're escalating to a human admin and tell them to message Contact Developer on Telegram.
- Be concise. Use bullet points. Use Naira (₦) formatting.
- Never reveal admin secrets, API keys, or other users' data.`;

const ChatInput = z.object({
  message: z.string().min(1).max(2000),
});

export const supportChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ChatInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    // Save user message
    await supabaseAdmin.from("support_chats").insert({
      user_id: userId, role: "user", content: data.message,
    });

    // Load recent history (last 20)
    const { data: history } = await supabaseAdmin
      .from("support_chats")
      .select("role,content")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(20);

    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...(history ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Too many requests. Please wait a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Contact admin.");
      const t = await res.text();
      throw new Error(`AI error: ${t.slice(0, 200)}`);
    }

    const json = await res.json();
    const reply: string = json?.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";

    await supabaseAdmin.from("support_chats").insert({
      user_id: userId, role: "assistant", content: reply,
    });

    return { reply };
  });
