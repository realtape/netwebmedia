"use client";

import { Wallet } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Retainer {
  id: string;
  client: string;
  matter: string;
  opening: number;
  used: number;
  remaining: number;
  renewalDate: string;
  status: "Active" | "Low Balance" | "Renewing" | "Expired";
}

const retainers: Retainer[] = [
  { id: "RET-2024-011", client: "Harborline Logistics", matter: "MTR-24-0118", opening: 250_000, used: 168_400, remaining: 81_600, renewalDate: "2026-07-15", status: "Active" },
  { id: "RET-2024-012", client: "Meridian Biotech", matter: "MTR-24-0119", opening: 80_000, used: 38_200, remaining: 41_800, renewalDate: "2026-09-01", status: "Active" },
  { id: "RET-2024-013", client: "Sable Insurance", matter: "MTR-24-0120", opening: 400_000, used: 242_800, remaining: 157_200, renewalDate: "2026-08-30", status: "Active" },
  { id: "RET-2024-014", client: "Northwind Energy", matter: "MTR-24-0121", opening: 150_000, used: 142_600, remaining: 7_400, renewalDate: "2026-05-10", status: "Low Balance" },
  { id: "RET-2024-015", client: "Cascade Fintech", matter: "MTR-24-0122", opening: 90_000, used: 32_400, remaining: 57_600, renewalDate: "2026-10-12", status: "Active" },
  { id: "RET-2024-016", client: "Clarendon Legal Co-Counsel", matter: "MTR-24-0123", opening: 180_000, used: 86_200, remaining: 93_800, renewalDate: "2026-06-22", status: "Active" },
  { id: "RET-2024-017", client: "Fjord Robotics", matter: "MTR-24-0124", opening: 320_000, used: 124_800, remaining: 195_200, renewalDate: "2026-11-04", status: "Active" },
  { id: "RET-2024-018", client: "Brightpath Schools", matter: "MTR-24-0125", opening: 40_000, used: 19_600, remaining: 20_400, renewalDate: "2026-05-02", status: "Renewing" },
  { id: "RET-2024-019", client: "Stanton Marketing", matter: "MTR-24-0126", opening: 220_000, used: 198_400, remaining: 21_600, renewalDate: "2026-04-28", status: "Low Balance" },
  { id: "RET-2024-020", client: "Orbital Mobility", matter: "MTR-24-0127", opening: 60_000, used: 24_200, remaining: 35_800, renewalDate: "2026-08-18", status: "Active" },
  { id: "RET-2023-044", client: "Lumen Analytics", matter: "MTR-23-0094", opening: 100_000, used: 98_400, remaining: 1_600, renewalDate: "2026-02-28", status: "Expired" },
  { id: "RET-2023-045", client: "Redwood HR Partners", matter: "MTR-23-0087", opening: 65_000, used: 62_800, remaining: 2_200, renewalDate: "2026-03-15", status: "Expired" },
];

const statusColors: Record<Retainer["status"], string> = {
  Active: "bg-green-500/15 text-green",
  "Low Balance": "bg-orange-500/15 text-orange",
  Renewing: "bg-accent/15 text-accent",
  Expired: "bg-red-500/15 text-red",
};

export default function ProfessionalServicesRetainersPage() {
  const totalRemaining = retainers.reduce((a, r) => a + r.remaining, 0);
  const totalOpening = retainers.reduce((a, r) => a + r.opening, 0);
  const utilization = Math.round(((totalOpening - totalRemaining) / totalOpening) * 100);
  const lowBalance = retainers.filter((r) => r.status === "Low Balance" || r.status === "Renewing").length;

  return (
    <ModuleShell
      icon={Wallet}
      hub="Professional Services Hub"
      title="Retainers"
      description="Client retainer balances with usage depletion, renewal dates, and low-balance alerts for accounts receivable."
      primaryAction={{ label: "New Retainer" }}
      searchPlaceholder="Search retainers by client or matter..."
      stats={[
        { label: "Retainers", value: retainers.length },
        { label: "On Deposit", value: `$${(totalRemaining / 1_000_000).toFixed(2)}M` },
        { label: "Utilization", value: `${utilization}%` },
        { label: "Needs Attention", value: lowBalance },
      ]}
    >
      <ModuleTable
        columns={["ID", "Client", "Matter", "Opening", "Used", "Remaining", "Renewal", "Status"]}
        rows={retainers.map((r) => [
          <span key="id" className="font-mono text-[10px] text-text-dim">{r.id}</span>,
          <span key="c" className="font-semibold text-text">{r.client}</span>,
          <span key="m" className="font-mono text-[10px] text-text-dim">{r.matter}</span>,
          <span key="o" className="text-text-dim">${r.opening.toLocaleString()}</span>,
          <span key="u" className="text-text">${r.used.toLocaleString()}</span>,
          <span key="re" className={`font-semibold ${r.remaining < 10_000 ? "text-red" : r.remaining < 25_000 ? "text-orange" : "text-green"}`}>${r.remaining.toLocaleString()}</span>,
          <span key="rd" className="text-text-dim">{r.renewalDate}</span>,
          <span key="st" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[r.status]}`}>
            {r.status}
          </span>,
        ])}
      />
    </ModuleShell>
  );
}
