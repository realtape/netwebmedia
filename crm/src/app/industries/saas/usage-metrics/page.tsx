"use client";

import { Activity } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface UsageRow {
  id: string;
  org: string;
  apiCalls: number;
  activeUsers: number;
  seats: number;
  adoption: number;
  health: "Healthy" | "Watch" | "At Risk";
}

const usage: UsageRow[] = [
  { id: "ORG-10021", org: "Meridian Biotech", apiCalls: 2_842_910, activeUsers: 168, seats: 180, adoption: 93, health: "Healthy" },
  { id: "ORG-10022", org: "Lumen Analytics", apiCalls: 918_432, activeUsers: 42, seats: 45, adoption: 88, health: "Healthy" },
  { id: "ORG-10023", org: "Harborline Logistics", apiCalls: 612_018, activeUsers: 84, seats: 310, adoption: 27, health: "At Risk" },
  { id: "ORG-10024", org: "Stanton Marketing", apiCalls: 104_820, activeUsers: 12, seats: 14, adoption: 78, health: "Healthy" },
  { id: "ORG-10025", org: "Cascade Fintech", apiCalls: 348_912, activeUsers: 24, seats: 62, adoption: 38, health: "Watch" },
  { id: "ORG-10026", org: "Brightpath Schools", apiCalls: 62_184, activeUsers: 18, seats: 22, adoption: 82, health: "Healthy" },
  { id: "ORG-10027", org: "Northwind Energy", apiCalls: 1_928_410, activeUsers: 214, seats: 240, adoption: 89, health: "Healthy" },
  { id: "ORG-10028", org: "Redwood HR Partners", apiCalls: 198_402, activeUsers: 14, seats: 38, adoption: 37, health: "At Risk" },
  { id: "ORG-10029", org: "Clarendon Legal", apiCalls: 18_902, activeUsers: 2, seats: 8, adoption: 25, health: "At Risk" },
  { id: "ORG-10030", org: "Orbital Mobility", apiCalls: 42_108, activeUsers: 3, seats: 4, adoption: 75, health: "Watch" },
  { id: "ORG-10031", org: "Fjord Robotics", apiCalls: 4_128_402, activeUsers: 398, seats: 420, adoption: 95, health: "Healthy" },
  { id: "ORG-10032", org: "Sable Insurance", apiCalls: 488_120, activeUsers: 52, seats: 58, adoption: 90, health: "Healthy" },
];

const healthColors: Record<UsageRow["health"], string> = {
  Healthy: "bg-green-500/15 text-green",
  Watch: "bg-orange-500/15 text-orange",
  "At Risk": "bg-red-500/15 text-red",
};

export default function SaasUsageMetricsPage() {
  const totalCalls = usage.reduce((a, u) => a + u.apiCalls, 0);
  const atRisk = usage.filter((u) => u.health === "At Risk").length;
  const avgAdoption = Math.round(usage.reduce((a, u) => a + u.adoption, 0) / usage.length);

  return (
    <ModuleShell
      icon={Activity}
      hub="SaaS Hub"
      title="Usage Metrics"
      description="Per-account API volume, seat activation, feature adoption, and composite health scoring for product-led growth."
      primaryAction={{ label: "Export Usage" }}
      searchPlaceholder="Search organizations..."
      stats={[
        { label: "Accounts Tracked", value: usage.length },
        { label: "API Calls (30d)", value: `${(totalCalls / 1_000_000).toFixed(1)}M` },
        { label: "Avg Adoption", value: `${avgAdoption}%` },
        { label: "At Risk", value: atRisk },
      ]}
    >
      <ModuleTable
        columns={["Org ID", "Organization", "API Calls", "Active Users", "Seats", "Adoption", "Health"]}
        rows={usage.map((u) => [
          <span key="id" className="font-mono text-[10px] text-text-dim">{u.id}</span>,
          <span key="o" className="font-semibold text-text">{u.org}</span>,
          <span key="a" className="text-text-dim">{u.apiCalls.toLocaleString()}</span>,
          <span key="au" className="font-semibold text-text">{u.activeUsers}</span>,
          <span key="s" className="text-text-dim">{u.seats}</span>,
          <span key="ad" className={`font-bold ${u.adoption >= 75 ? "text-green" : u.adoption >= 50 ? "text-cyan" : "text-orange"}`}>{u.adoption}%</span>,
          <span key="h" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${healthColors[u.health]}`}>
            {u.health}
          </span>,
        ])}
      />
    </ModuleShell>
  );
}
