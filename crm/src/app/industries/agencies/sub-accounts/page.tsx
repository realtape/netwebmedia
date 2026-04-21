"use client";

import { Briefcase } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

type AccountStatus = "Active" | "Trial" | "Paused" | "Churned";

const statusColors: Record<AccountStatus, string> = {
  Active: "bg-green/15 text-green",
  Trial: "bg-cyan/15 text-cyan",
  Paused: "bg-orange/15 text-orange",
  Churned: "bg-red/15 text-red",
};

interface SubAccount {
  brand: string;
  industry: string;
  users: number;
  mrr: number;
  status: AccountStatus;
  whiteLabel: boolean;
}

const accounts: SubAccount[] = [
  { brand: "Ridgeline Digital", industry: "Home Services", users: 18, mrr: 2400, status: "Active", whiteLabel: true },
  { brand: "Peak Growth Co", industry: "E-commerce", users: 24, mrr: 3200, status: "Active", whiteLabel: true },
  { brand: "Westbrook Media", industry: "Real Estate", users: 12, mrr: 1800, status: "Active", whiteLabel: true },
  { brand: "Harbor Lab", industry: "SaaS", users: 8, mrr: 1200, status: "Trial", whiteLabel: false },
  { brand: "Nova Reach", industry: "Healthcare", users: 22, mrr: 2900, status: "Active", whiteLabel: true },
  { brand: "BrightLoop Studio", industry: "Fitness", users: 6, mrr: 800, status: "Active", whiteLabel: false },
  { brand: "Catalyst Ops", industry: "Legal", users: 15, mrr: 2200, status: "Active", whiteLabel: true },
  { brand: "Fieldstone Partners", industry: "Finance", users: 30, mrr: 4200, status: "Active", whiteLabel: true },
  { brand: "Solstice Media", industry: "Education", users: 10, mrr: 1400, status: "Paused", whiteLabel: true },
  { brand: "Tidewater Growth", industry: "Restaurants", users: 14, mrr: 1900, status: "Active", whiteLabel: true },
  { brand: "Vantage Creative", industry: "B2B", users: 7, mrr: 1000, status: "Trial", whiteLabel: false },
  { brand: "Redthread Digital", industry: "Automotive", users: 20, mrr: 2800, status: "Active", whiteLabel: true },
  { brand: "Prairieline Agency", industry: "Non-Profit", users: 5, mrr: 0, status: "Churned", whiteLabel: false },
];

export default function SubAccountsPage() {
  const active = accounts.filter((a) => a.status === "Active").length;
  const totalMRR = accounts.filter((a) => a.status !== "Churned").reduce((a, c) => a + c.mrr, 0);
  const whiteLabeled = accounts.filter((a) => a.whiteLabel).length;
  const totalUsers = accounts.reduce((a, c) => a + c.users, 0);

  return (
    <ModuleShell
      icon={Briefcase}
      hub="Agency Partner Hub"
      title="Sub-Accounts"
      description="Agency-managed client workspaces with users, MRR contribution, and white-label status."
      primaryAction={{ label: "Add Sub-Account" }}
      searchPlaceholder="Search sub-accounts by brand or industry..."
      stats={[
        { label: "Sub-Accounts", value: accounts.length },
        { label: "Active", value: active },
        { label: "Agency MRR", value: `$${totalMRR.toLocaleString()}` },
        { label: "White-Labeled", value: whiteLabeled },
      ]}
    >
      <ModuleTable
        columns={["Brand", "Industry", "Users", "MRR", "Status", "White-Label"]}
        rows={accounts.map((a) => [
          <span key="b" className="font-semibold text-text">{a.brand}</span>,
          <span key="i" className="text-text-dim">{a.industry}</span>,
          <span key="u" className="font-semibold text-text">{a.users}</span>,
          <span key="m" className="font-semibold text-green">${a.mrr.toLocaleString()}</span>,
          <span key="s" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[a.status]}`}>{a.status}</span>,
          <span key="w" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${a.whiteLabel ? "bg-purple-500/15 text-purple-400" : "bg-text-dim/15 text-text-dim"}`}>
            {a.whiteLabel ? "Enabled" : "Off"}
          </span>,
        ])}
      />
      <div className="text-[11px] text-text-dim mt-3">{totalUsers.toLocaleString()} total seats across portfolio.</div>
    </ModuleShell>
  );
}
