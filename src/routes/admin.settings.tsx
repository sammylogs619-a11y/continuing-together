import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "@/components/admin-page";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, KeyRound, CreditCard, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  return (
    <AdminPage title="Settings" description="Configure store, payment provider and admin account.">
      <section className="rounded-xl border bg-card p-5 space-y-2">
        <h2 className="font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> NOWPayments keys</h2>
        <p className="text-sm text-muted-foreground">
          NOWPayments API credentials are stored as encrypted server secrets. To set or rotate them,
          open <strong>Cloud → Secrets</strong> and add these two values:
        </p>
        <ul className="mt-2 text-sm font-mono space-y-1 pl-4 list-disc">
          <li>NOWPAYMENTS_API_KEY</li>
          <li>NOWPAYMENTS_IPN_SECRET</li>
        </ul>
        <p className="text-xs text-muted-foreground pt-2">
          All crypto payments go directly to the NOWPayments account these keys belong to.
          Confirmed payments are auto-credited to the user's wallet via IPN webhook.
        </p>
      </section>

      <ChangePassword />

      <section className="rounded-xl border bg-card divide-y">
        {[
          { label: "Store name", value: "Sammy Store" },
          { label: "Default currency", value: "Nigerian Naira (₦)" },
          { label: "Payment provider", value: "NOWPayments (crypto)" },
          { label: "Webhook URL", value: "/api/public/nowpayments-webhook" },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between p-4 gap-4">
            <div className="text-sm font-medium">{row.label}</div>
            <div className="text-sm text-muted-foreground text-right">{row.value}</div>
          </div>
        ))}
      </section>
    </AdminPage>
  );
}

function ChangePassword() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    if (pw !== confirm) return toast.error("Passwords do not match");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      setPw(""); setConfirm("");
      toast.success("Admin password updated");
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border bg-card p-5 space-y-3">
      <h2 className="font-semibold flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> Change admin password</h2>
      <input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)}
        placeholder="New password" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      <button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50">
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Update password
      </button>
    </form>
  );
}
