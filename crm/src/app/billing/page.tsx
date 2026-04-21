"use client";

import { Receipt, TrendingUp, CreditCard } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { subAccounts } from "@/lib/mock-data-extended";

const statusColors: Record<string, string> = {
  active: "bg-green/15 text-green",
  trialing: "bg-cyan/15 text-cyan",
  "past-due": "bg-orange/15 text-orange",
  cancelled: "bg-red/15 text-red",
};

export default function BillingPage() {
  const activeMRR = subAccounts.filter((s) => s.status === "active").reduce((a, s) => a + s.mrr, 0);
  const arr = activeMRR * 12;
  const pastDue = subAccounts.filter((s) => s.status === "past-due");
  const churn = subAccounts.filter((s) => s.status === "cancelled").length;

  return (
    <ModuleShell
      icon={Receipt}
      hub="Agency / Partner"
      title="Billing / SaaS"
      description="Rebill your clients at any markup. Stripe Connect, auto-invoicing, dunning, proration, failed payment recovery."
      primaryAction={{ label: "Configure Pricing" }}
      stats={[
        { label: "MRR", value: `$${activeMRR.toLocaleString()}` },
        { label: "ARR", value: `$${(arr / 1000).toFixed(0)}K` },
        { label: "Past Due", value: pastDue.length, delta: pastDue.length > 0 ? "recovery active" : undefined },
        { label: "Churn (30d)", value: churn },
      ]}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={14} className="text-accent" />
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Payment Processor</div>
          </div>
          <div className="text-sm font-bold text-text">Stripe Connect</div>
          <div className="text-[11px] text-green mt-1">✓ Active · Payouts Daily</div>
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-accent" />
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Your Margin</div>
          </div>
          <div className="text-sm font-bold text-text">+$18,420/mo</div>
          <div className="text-[11px] text-text-dim mt-1">Avg markup: 2.3x</div>
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Receipt size={14} className="text-accent" />
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Invoices This Month</div>
          </div>
          <div className="text-sm font-bold text-text">142</div>
          <div className="text-[11px] text-text-dim mt-1">98% collected</div>
        </div>
      </div>

      <ModuleTable
        columns={["Sub-account", "Plan", "MRR", "Status", "Next Invoice"]}
        rows={subAccounts.map((s) => [
          <span key="n" className="font-semibold text-text">{s.name}</span>,
          <span key="p" className="text-text-dim">{s.plan}</span>,
          <span key="m" className="font-semibold text-green">${s.mrr.toLocaleString()}</span>,
          <span key="st" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[s.status]}`}>{s.status}</span>,
          <span key="ni" className="text-text-dim">
            {s.status === "active" ? "2026-05-01" : s.status === "trialing" ? "2026-05-10" : s.status === "past-due" ? "Overdue" : "—"}
          </span>,
        ])}
      />
    </ModuleShell>
  );
}
