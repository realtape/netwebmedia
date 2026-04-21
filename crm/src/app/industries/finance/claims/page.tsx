"use client";

import { FileWarning } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

type ClaimStatus = "Open" | "Investigating" | "Approved" | "Paid" | "Denied";

const statusColors: Record<ClaimStatus, string> = {
  Open: "bg-cyan/15 text-cyan",
  Investigating: "bg-orange/15 text-orange",
  Approved: "bg-accent/15 text-accent",
  Paid: "bg-green/15 text-green",
  Denied: "bg-red/15 text-red",
};

interface Claim {
  id: string;
  policy: string;
  filed: string;
  amount: number;
  status: ClaimStatus;
  adjuster: string;
}

const claims: Claim[] = [
  { id: "CLM-20241", policy: "POL-44120", filed: "2026-04-02", amount: 4820, status: "Paid", adjuster: "Hector Balestrini" },
  { id: "CLM-20242", policy: "POL-44124", filed: "2026-04-05", amount: 12400, status: "Investigating", adjuster: "Nadia Krauss" },
  { id: "CLM-20243", policy: "POL-44126", filed: "2026-04-07", amount: 38000, status: "Approved", adjuster: "Hector Balestrini" },
  { id: "CLM-20244", policy: "POL-44121", filed: "2026-04-08", amount: 9150, status: "Open", adjuster: "Reginald Pfaff" },
  { id: "CLM-20245", policy: "POL-44128", filed: "2026-04-10", amount: 2640, status: "Paid", adjuster: "Nadia Krauss" },
  { id: "CLM-20246", policy: "POL-44132", filed: "2026-04-11", amount: 1820, status: "Denied", adjuster: "Hector Balestrini" },
  { id: "CLM-20247", policy: "POL-44125", filed: "2026-04-12", amount: 16700, status: "Investigating", adjuster: "Reginald Pfaff" },
  { id: "CLM-20248", policy: "POL-44123", filed: "2026-04-14", amount: 3120, status: "Open", adjuster: "Nadia Krauss" },
  { id: "CLM-20249", policy: "POL-44130", filed: "2026-04-15", amount: 7890, status: "Approved", adjuster: "Hector Balestrini" },
  { id: "CLM-20250", policy: "POL-44129", filed: "2026-04-16", amount: 2410, status: "Paid", adjuster: "Reginald Pfaff" },
  { id: "CLM-20251", policy: "POL-44122", filed: "2026-04-17", amount: 58400, status: "Investigating", adjuster: "Nadia Krauss" },
  { id: "CLM-20252", policy: "POL-44120", filed: "2026-04-18", amount: 1940, status: "Open", adjuster: "Hector Balestrini" },
];

export default function ClaimsPage() {
  const totalAmount = claims.reduce((a, c) => a + c.amount, 0);
  const paid = claims.filter((c) => c.status === "Paid").reduce((a, c) => a + c.amount, 0);
  const openCount = claims.filter((c) => c.status === "Open" || c.status === "Investigating").length;

  return (
    <ModuleShell
      icon={FileWarning}
      hub="Finance & Insurance Hub"
      title="Claims"
      description="Claims pipeline from first notice of loss through adjudication and payment."
      primaryAction={{ label: "Add Claim" }}
      searchPlaceholder="Search claims by #, policy, or adjuster..."
      stats={[
        { label: "Claims", value: claims.length },
        { label: "Open / Investigating", value: openCount },
        { label: "Total Exposure", value: `$${totalAmount.toLocaleString()}` },
        { label: "Paid Out", value: `$${paid.toLocaleString()}` },
      ]}
    >
      <ModuleTable
        columns={["Claim #", "Policy", "Date Filed", "Amount", "Status", "Adjuster"]}
        rows={claims.map((c) => [
          <span key="id" className="font-semibold text-text">{c.id}</span>,
          <span key="p" className="text-text-dim">{c.policy}</span>,
          <span key="f" className="text-text-dim">{c.filed}</span>,
          <span key="a" className="font-semibold text-green">${c.amount.toLocaleString()}</span>,
          <span key="s" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[c.status]}`}>{c.status}</span>,
          <span key="ad" className="text-text-dim">{c.adjuster}</span>,
        ])}
      />
    </ModuleShell>
  );
}
