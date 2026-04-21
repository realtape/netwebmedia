"use client";

import { Building2, Check } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { subAccounts } from "@/lib/mock-data-extended";

const statusColors: Record<string, string> = {
  active: "bg-green/15 text-green",
  trialing: "bg-cyan/15 text-cyan",
  "past-due": "bg-orange/15 text-orange",
  cancelled: "bg-red/15 text-red",
};

export default function SubAccountsPage() {
  const active = subAccounts.filter((s) => s.status === "active");
  const totalMRR = subAccounts.reduce((a, s) => a + s.mrr, 0);
  const whiteLabel = subAccounts.filter((s) => s.whiteLabel).length;
  const users = subAccounts.reduce((a, s) => a + s.users, 0);

  return (
    <ModuleShell
      icon={Building2}
      hub="Agency / Partner"
      title="Sub-accounts"
      description="Unlimited client sub-accounts with isolated data, custom branding per account, and one-click snapshot cloning."
      primaryAction={{ label: "New Sub-account" }}
      searchPlaceholder="Search sub-accounts..."
      stats={[
        { label: "Active Accounts", value: active.length },
        { label: "Total MRR", value: `$${totalMRR.toLocaleString()}` },
        { label: "White-label", value: whiteLabel },
        { label: "Total Users", value: users },
      ]}
    >
      <ModuleTable
        columns={["Name", "Plan", "Users", "MRR", "White-label", "Status", "Created"]}
        rows={subAccounts.map((s) => [
          <span key="n" className="font-semibold text-text">{s.name}</span>,
          <span key="p" className="text-text-dim">{s.plan}</span>,
          <span key="u" className="text-text-dim">{s.users}</span>,
          <span key="m" className="font-semibold text-green">${s.mrr.toLocaleString()}</span>,
          <span key="w">{s.whiteLabel && <Check size={14} className="text-accent" />}</span>,
          <span key="st" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[s.status]}`}>{s.status}</span>,
          <span key="c" className="text-text-dim">{s.createdAt}</span>,
        ])}
      />
    </ModuleShell>
  );
}
