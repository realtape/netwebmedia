"use client";

import { CreditCard } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Plan {
  id: string;
  name: string;
  interval: "Monthly" | "Annual";
  price: number;
  subscribers: number;
  mrr: number;
  churn: number;
  status: "Active" | "Grandfathered" | "Legacy";
}

const plans: Plan[] = [
  { id: "PLN-001", name: "Starter", interval: "Monthly", price: 29, subscribers: 1_482, mrr: 42_978, churn: 5.2, status: "Active" },
  { id: "PLN-002", name: "Starter Annual", interval: "Annual", price: 290, subscribers: 612, mrr: 14_790, churn: 2.1, status: "Active" },
  { id: "PLN-003", name: "Growth", interval: "Monthly", price: 99, subscribers: 842, mrr: 83_358, churn: 3.8, status: "Active" },
  { id: "PLN-004", name: "Growth Annual", interval: "Annual", price: 990, subscribers: 318, mrr: 26_235, churn: 1.6, status: "Active" },
  { id: "PLN-005", name: "Scale", interval: "Monthly", price: 349, subscribers: 218, mrr: 76_082, churn: 2.4, status: "Active" },
  { id: "PLN-006", name: "Scale Annual", interval: "Annual", price: 3_490, subscribers: 94, mrr: 27_343, churn: 1.1, status: "Active" },
  { id: "PLN-007", name: "Enterprise", interval: "Annual", price: 24_000, subscribers: 42, mrr: 84_000, churn: 0.8, status: "Active" },
  { id: "PLN-008", name: "Enterprise Plus", interval: "Annual", price: 60_000, subscribers: 11, mrr: 55_000, churn: 0.0, status: "Active" },
  { id: "PLN-009", name: "Legacy Pro", interval: "Monthly", price: 79, subscribers: 146, mrr: 11_534, churn: 4.9, status: "Grandfathered" },
  { id: "PLN-010", name: "Launch 2021", interval: "Monthly", price: 19, subscribers: 38, mrr: 722, churn: 7.8, status: "Legacy" },
];

const statusColors: Record<Plan["status"], string> = {
  Active: "bg-green-500/15 text-green",
  Grandfathered: "bg-cyan-500/15 text-cyan",
  Legacy: "bg-orange-500/15 text-orange",
};

export default function SaasPlansPage() {
  const totalMrr = plans.reduce((a, p) => a + p.mrr, 0);
  const totalSubs = plans.reduce((a, p) => a + p.subscribers, 0);
  const avgChurn = (plans.reduce((a, p) => a + p.churn, 0) / plans.length).toFixed(1);

  return (
    <ModuleShell
      icon={CreditCard}
      hub="SaaS Hub"
      title="Plans & Pricing"
      description="Price book and subscription tiers with per-plan MRR, subscriber counts, and churn diagnostics."
      primaryAction={{ label: "Add Plan" }}
      searchPlaceholder="Search plans..."
      stats={[
        { label: "Plans", value: plans.length },
        { label: "Total MRR", value: `$${totalMrr.toLocaleString()}` },
        { label: "Subscribers", value: totalSubs.toLocaleString() },
        { label: "Avg Churn", value: `${avgChurn}%` },
      ]}
    >
      <ModuleTable
        columns={["ID", "Plan", "Interval", "Price", "Subscribers", "MRR", "Churn", "Status"]}
        rows={plans.map((p) => [
          <span key="id" className="font-mono text-[10px] text-text-dim">{p.id}</span>,
          <span key="n" className="font-semibold text-text">{p.name}</span>,
          <span key="i" className="text-text-dim">{p.interval}</span>,
          <span key="pr" className="font-semibold text-text">${p.price.toLocaleString()}</span>,
          <span key="s" className="text-text-dim">{p.subscribers.toLocaleString()}</span>,
          <span key="m" className="font-semibold text-green">${p.mrr.toLocaleString()}</span>,
          <span key="c" className={`font-bold ${p.churn > 5 ? "text-red" : p.churn > 3 ? "text-orange" : "text-green"}`}>{p.churn.toFixed(1)}%</span>,
          <span key="st" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[p.status]}`}>
            {p.status}
          </span>,
        ])}
      />
    </ModuleShell>
  );
}
