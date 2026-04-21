"use client";

import { Briefcase } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Matter {
  id: string;
  client: string;
  type: "Litigation" | "M&A" | "Audit" | "Advisory" | "Compliance";
  status: "Open" | "On Hold" | "Closing" | "Closed";
  partner: string;
  hours: number;
  budget: number;
  billed: number;
}

const matters: Matter[] = [
  { id: "MTR-24-0118", client: "Harborline Logistics", type: "M&A", status: "Open", partner: "J. Ashford", hours: 184, budget: 250_000, billed: 168_400 },
  { id: "MTR-24-0119", client: "Meridian Biotech", type: "Compliance", status: "Open", partner: "R. Solomon", hours: 62, budget: 80_000, billed: 38_200 },
  { id: "MTR-24-0120", client: "Sable Insurance", type: "Litigation", status: "Open", partner: "M. Cordero", hours: 218, budget: 400_000, billed: 242_800 },
  { id: "MTR-24-0121", client: "Northwind Energy", type: "Audit", status: "Closing", partner: "P. Iyer", hours: 112, budget: 150_000, billed: 142_600 },
  { id: "MTR-24-0122", client: "Cascade Fintech", type: "Advisory", status: "Open", partner: "J. Ashford", hours: 48, budget: 90_000, billed: 32_400 },
  { id: "MTR-24-0123", client: "Clarendon Legal Co-Counsel", type: "Litigation", status: "On Hold", partner: "M. Cordero", hours: 94, budget: 180_000, billed: 86_200 },
  { id: "MTR-23-0087", client: "Redwood HR Partners", type: "Compliance", status: "Closed", partner: "R. Solomon", hours: 72, budget: 65_000, billed: 62_800 },
  { id: "MTR-24-0124", client: "Fjord Robotics", type: "M&A", status: "Open", partner: "J. Ashford", hours: 146, budget: 320_000, billed: 124_800 },
  { id: "MTR-24-0125", client: "Brightpath Schools", type: "Advisory", status: "Open", partner: "P. Iyer", hours: 28, budget: 40_000, billed: 19_600 },
  { id: "MTR-24-0126", client: "Stanton Marketing", type: "Litigation", status: "Closing", partner: "M. Cordero", hours: 156, budget: 220_000, billed: 198_400 },
  { id: "MTR-24-0127", client: "Orbital Mobility", type: "Advisory", status: "Open", partner: "R. Solomon", hours: 38, budget: 60_000, billed: 24_200 },
  { id: "MTR-23-0094", client: "Lumen Analytics", type: "Audit", status: "Closed", partner: "P. Iyer", hours: 88, budget: 100_000, billed: 98_400 },
];

const statusColors: Record<Matter["status"], string> = {
  Open: "bg-green-500/15 text-green",
  "On Hold": "bg-orange-500/15 text-orange",
  Closing: "bg-accent/15 text-accent",
  Closed: "bg-cyan-500/15 text-cyan",
};

const typeColors: Record<Matter["type"], string> = {
  Litigation: "bg-red-500/15 text-red",
  "M&A": "bg-purple-500/15 text-purple-400",
  Audit: "bg-cyan-500/15 text-cyan",
  Advisory: "bg-green-500/15 text-green",
  Compliance: "bg-accent/15 text-accent",
};

export default function ProfessionalServicesMattersPage() {
  const open = matters.filter((m) => m.status === "Open").length;
  const totalBilled = matters.reduce((a, m) => a + m.billed, 0);
  const totalHours = matters.reduce((a, m) => a + m.hours, 0);

  return (
    <ModuleShell
      icon={Briefcase}
      hub="Professional Services Hub"
      title="Matters & Engagements"
      description="Active client matters with responsible partner, hours billed, budget consumption, and lifecycle status."
      primaryAction={{ label: "Open Matter" }}
      searchPlaceholder="Search matters by ID or client..."
      stats={[
        { label: "Matters", value: matters.length },
        { label: "Open", value: open },
        { label: "Total Billed", value: `$${(totalBilled / 1_000_000).toFixed(2)}M` },
        { label: "Hours Logged", value: totalHours.toLocaleString() },
      ]}
    >
      <ModuleTable
        columns={["Matter #", "Client", "Type", "Status", "Partner", "Hours", "Budget", "Billed"]}
        rows={matters.map((m) => [
          <span key="id" className="font-mono text-[10px] text-text-dim">{m.id}</span>,
          <span key="c" className="font-semibold text-text">{m.client}</span>,
          <span key="ty" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${typeColors[m.type]}`}>
            {m.type}
          </span>,
          <span key="st" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[m.status]}`}>
            {m.status}
          </span>,
          <span key="p" className="text-text">{m.partner}</span>,
          <span key="h" className="text-text-dim">{m.hours}</span>,
          <span key="bu" className="text-text-dim">${m.budget.toLocaleString()}</span>,
          <span key="bi" className="font-semibold text-green">${m.billed.toLocaleString()}</span>,
        ])}
      />
    </ModuleShell>
  );
}
