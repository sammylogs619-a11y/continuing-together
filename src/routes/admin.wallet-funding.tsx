import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, EmptyState } from "@/components/admin-page";
import { Wallet, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Intent = {
  id: string; provider: string; provider_reference: string;
  amount_paid: number; credit_amount: number; currency: string;
  status: string; created_at: string; user_id: string;
};

export const Route = createFileRoute("/admin/wallet-funding")({ component: Page });

function Page() {
  const [items, setItems] = useState<Intent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "failed">("all");

  async function load() {
    setLoading(true);
    let q = supabase.from("payment_intents").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setItems((data as Intent[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  return (
    <AdminPage title="Wallet Funding" description="All crypto payment sessions from NOWPayments.">
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "paid", "failed"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize ${filter === s ? "bg-primary text-primary-foreground" : "border hover:bg-muted"}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        : items.length === 0
          ? <EmptyState icon={Wallet} title="No funding requests" description="Real payment sessions will appear here." />
          : (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Reference</th>
                      <th className="text-left p-3 hidden sm:table-cell">Provider</th>
                      <th className="text-right p-3">Paid</th>
                      <th className="text-right p-3">Credited</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3 hidden md:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => (
                      <tr key={i.id} className="border-t">
                        <td className="p-3 font-mono text-xs">{i.provider_reference}</td>
                        <td className="p-3 hidden sm:table-cell capitalize">{i.provider.replace("_", " ")}</td>
                        <td className="p-3 text-right">₦{Number(i.amount_paid).toLocaleString()}</td>
                        <td className="p-3 text-right font-semibold">₦{Number(i.credit_amount).toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                            i.status === "paid" ? "bg-emerald-100 text-emerald-700"
                              : i.status === "pending" ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                          }`}>{i.status}</span>
                        </td>
                        <td className="p-3 hidden md:table-cell text-xs text-muted-foreground">
                          {new Date(i.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
    </AdminPage>
  );
}
