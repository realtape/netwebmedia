"use client";

import { Gauge, Download, Play } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { reports } from "@/lib/mock-data-extended";

const formatColors: Record<string, string> = {
  Dashboard: "bg-accent/15 text-accent",
  Email: "bg-cyan/15 text-cyan",
  CSV: "bg-green/15 text-green",
  PDF: "bg-orange/15 text-orange",
};

export default function ReportsPage() {
  return (
    <ModuleShell
      icon={Gauge}
      hub="Overview"
      title="Reports"
      description="Real-time dashboards and scheduled reports across sales, marketing, service and finance. No per-report upcharges."
      aiFeature="AI Insights"
      primaryAction={{ label: "New Report" }}
      searchPlaceholder="Search reports..."
      stats={[
        { label: "Scheduled", value: reports.length, delta: "+3 this month" },
        { label: "Dashboards", value: reports.filter((r) => r.format === "Dashboard").length },
        { label: "Recipients", value: reports.reduce((a, r) => a + r.recipients, 0) },
        { label: "Avg Run Time", value: "1.2s" },
      ]}
    >
      <ModuleTable
        columns={["Report", "Category", "Schedule", "Format", "Recipients", "Last Run", ""]}
        rows={reports.map((r) => [
          <div key="n" className="font-semibold text-text">{r.name}</div>,
          <span key="c" className="text-text-dim">{r.category}</span>,
          <span key="s" className="text-text-dim">{r.schedule}</span>,
          <span key="f" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${formatColors[r.format] || "bg-bg-hover text-text-dim"}`}>
            {r.format}
          </span>,
          <span key="rc" className="text-text-dim">{r.recipients}</span>,
          <span key="l" className="text-text-dim">{r.lastRun}</span>,
          <div key="a" className="flex gap-1 justify-end">
            <button className="p-1.5 rounded hover:bg-bg-hover text-text-dim"><Play size={12} /></button>
            <button className="p-1.5 rounded hover:bg-bg-hover text-text-dim"><Download size={12} /></button>
          </div>,
        ])}
      />
    </ModuleShell>
  );
}
