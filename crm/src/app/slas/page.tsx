"use client";

import { ClipboardList } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { slas } from "@/lib/mock-data-extended";

const priorityColors: Record<string, string> = {
  urgent: "bg-red/15 text-red",
  high: "bg-orange/15 text-orange",
  medium: "bg-cyan/15 text-cyan",
  low: "bg-bg-hover text-text-dim",
};

function complianceColor(pct: number) {
  if (pct >= 90) return "text-green";
  if (pct >= 80) return "text-orange";
  return "text-red";
}

export default function SLAsPage() {
  const active = slas.filter((s) => s.active);
  const avgCompliance = Math.round(slas.reduce((a, s) => a + s.compliance, 0) / slas.length);
  const totalTickets = slas.reduce((a, s) => a + s.ticketsCovered, 0);
  const breaches = slas.reduce((a, s) => a + Math.round((s.ticketsCovered * (100 - s.compliance)) / 100), 0);

  return (
    <ModuleShell
      icon={ClipboardList}
      hub="Service Hub"
      title="SLAs"
      description="Service-level agreements with first-response and resolution tracking across priority tiers."
      primaryAction={{ label: "New SLA" }}
      searchPlaceholder="Search SLAs..."
      stats={[
        { label: "Active SLAs", value: active.length },
        { label: "Avg Compliance", value: `${avgCompliance}%` },
        { label: "Tickets Covered", value: totalTickets.toLocaleString() },
        { label: "Breaches / Month", value: breaches },
      ]}
    >
      <ModuleTable
        columns={["Name", "Priority", "First Response", "Resolution", "Compliance", "Tickets", "Active"]}
        rows={slas.map((s) => [
          <span key="n" className="font-semibold text-text">{s.name}</span>,
          <span key="p" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityColors[s.priority]}`}>{s.priority}</span>,
          <span key="f" className="text-text-dim">{s.firstResponse}</span>,
          <span key="r" className="text-text-dim">{s.resolution}</span>,
          <div key="c" className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-bg-hover rounded-full overflow-hidden max-w-24">
              <div className="h-full bg-accent rounded-full" style={{ width: `${s.compliance}%` }} />
            </div>
            <span className={`font-bold ${complianceColor(s.compliance)}`}>{s.compliance}%</span>
          </div>,
          <span key="t" className="text-text-dim">{s.ticketsCovered}</span>,
          <span key="a" className={`w-2 h-2 rounded-full inline-block ${s.active ? "bg-green" : "bg-text-dim"}`}></span>,
        ])}
      />
    </ModuleShell>
  );
}
