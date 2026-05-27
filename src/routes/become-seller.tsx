import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Store, Upload, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import {
  initSellerRegistrationPayment,
  getSellerRegistrationStatus,
} from "@/lib/seller-registration.functions";

export const Route = createFileRoute("/become-seller")({
  head: () => ({ meta: [{ title: "Become a Seller · Sammy Store" }] }),
  component: BecomeSeller,
});

function BecomeSeller() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const getStatus = useServerFn(getSellerRegistrationStatus);
  const initPay = useServerFn(initSellerRegistrationPayment);

  const statusQuery = useQuery({
    queryKey: ["seller-registration-status", user?.id],
    queryFn: () => getStatus(),
    enabled: Boolean(user),
    refetchInterval: (q) => (q.state.data?.paid ? false : 8000),
  });

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  // Already a seller (active/pending) → bounce to seller dashboard
  useEffect(() => {
    const s = statusQuery.data?.status;
    if (s && s !== "declined" && statusQuery.data?.businessName) {
      navigate({ to: "/seller" });
    }
  }, [statusQuery.data, navigate]);

  if (loading || statusQuery.isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Gate: if fee not paid, show payment screen
  if (!statusQuery.data?.paid) {
    return <PaymentGate fee={statusQuery.data?.feeNgn ?? 3000} onStart={async (cur) => {
      try {
        const r = await initPay({ data: { payCurrency: cur } });
        window.location.href = r.checkoutUrl;
      } catch (e: any) {
        toast.error(e?.message ?? "Could not start payment");
      }
    }} />;
  }

  // Paid → show business details form
  return <BusinessForm onDone={() => navigate({ to: "/dashboard/seller" })} userId={user!.id} />;
}

function PaymentGate({ fee, onStart }: { fee: number; onStart: (cur: string) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [currency, setCurrency] = useState("usdttrc20");
  return (
    <div className="min-h-screen bg-muted/30 grid place-items-center p-4">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary mx-auto">
          <CreditCard className="h-6 w-6" />
        </div>
        <h1 className="mt-3 text-center text-2xl font-extrabold tracking-tight">Seller Registration Fee</h1>
        <p className="text-center text-sm text-muted-foreground mt-1">
          A one-time, non-refundable fee unlocks your seller account.
        </p>

        <div className="mt-6 rounded-xl border bg-muted/40 p-4 text-center">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Amount due</div>
          <div className="mt-1 text-3xl font-extrabold">₦{fee.toLocaleString()}</div>
          <div className="mt-1 text-xs text-muted-foreground">Paid in crypto via NOWPayments</div>
        </div>

        <ul className="mt-6 space-y-2 text-sm">
          <li className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 mt-0.5 text-primary shrink-0" /> Verified seller badge once admin approves</li>
          <li className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 mt-0.5 text-primary shrink-0" /> List unlimited products on Sammy Store</li>
          <li className="flex items-start gap-2"><ShieldCheck className="h-4 w-4 mt-0.5 text-primary shrink-0" /> Withdraw earnings to your bank account</li>
        </ul>

        <label className="mt-6 block">
          <span className="text-xs font-medium text-muted-foreground">Pay with</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="usdttrc20">USDT (TRC20)</option>
            <option value="usdterc20">USDT (ERC20)</option>
            <option value="btc">Bitcoin (BTC)</option>
            <option value="eth">Ethereum (ETH)</option>
            <option value="bnbbsc">BNB (BSC)</option>
          </select>
        </label>

        <button
          disabled={busy}
          onClick={async () => { setBusy(true); await onStart(currency); setBusy(false); }}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Pay ₦{fee.toLocaleString()} & Continue
        </button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          You'll be redirected to NOWPayments. Your seller account activates automatically once the payment confirms on-chain.
        </p>
      </div>
    </div>
  );
}

function BusinessForm({ onDone, userId }: { onDone: () => void; userId: string }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${userId}/${Date.now()}_${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("seller_logos").upload(path, file);
    if (error) toast.error(error.message);
    else {
      const { data } = supabase.storage.from("seller_logos").getPublicUrl(path);
      setLogoUrl(data.publicUrl);
      toast.success("Logo uploaded");
    }
    setUploading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error("Business name required");
    setSaving(true);
    const { error } = await supabase.rpc("register_seller", {
      _business_name: name.trim(),
      _business_description: desc.trim(),
      _logo_url: logoUrl || "",
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Request sent! Awaiting admin approval.");
      onDone();
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 grid place-items-center p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 mx-auto">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h1 className="mt-3 text-center text-2xl font-extrabold tracking-tight">Payment Confirmed</h1>
        <p className="text-center text-sm text-muted-foreground mt-1">Now tell us about your business.</p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Business name</span>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Business description</span>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" />
          </label>
          <div>
            <span className="text-xs font-medium text-muted-foreground">Business logo</span>
            <div className="mt-1 flex items-center gap-3">
              <div className="h-16 w-16 shrink-0 rounded-md border bg-muted overflow-hidden grid place-items-center">
                {logoUrl ? <img src={logoUrl} alt="" className="h-full w-full object-cover" /> : <Store className="h-5 w-5 text-muted-foreground" />}
              </div>
              <label className="cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-muted inline-flex items-center gap-2">
                <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload logo"}
                <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <button disabled={saving} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-50">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit for Review
        </button>
      </form>
    </div>
  );
}
