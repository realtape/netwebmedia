"use client";

import { FileText } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { landingPages } from "@/lib/mock-data-extended";

const statusColors: Record<string, string> = {
  published: "bg-green/15 text-green",
  draft: "bg-bg-hover text-text-dim",
  archived: "bg-red/15 text-red",
};

export default function LandingPagesPage() {
  const published = landingPages.filter((l) => l.status === "published");
  const visits = landingPages.reduce((a, l) => a + l.visits, 0);
  const conversions = landingPages.reduce((a, l) => a + l.conversions, 0);
  const avgCR = visits > 0 ? ((conversions / visits) * 100).toFixed(1) : "0";

  return (
    <ModuleShell
      icon={FileText}
      hub="Marketing Hub"
      title="Landing Pages"
      description="Drag-and-drop landing pages with A/B testing, form capture, and conversion tracking."
      primaryAction={{ label: "New Landing Page" }}
      searchPlaceholder="Search pages..."
      stats={[
        { label: "Published", value: published.length },
        { label: "Total Visits", value: visits.toLocaleString() },
        { label: "Conversions", value: conversions.toLocaleString() },
        { label: "Avg CR", value: `${avgCR}%` },
      ]}
    >
      <ModuleTable
        columns={["Name", "Slug", "Template", "Visits", "Conversions", "CR %", "Status", "Published"]}
        rows={landingPages.map((l) => [
          <span key="n" className="font-semibold text-text">{l.name}</span>,
          <span key="s" className="font-mono text-[11px] text-text-dim">/{l.slug}</span>,
          <span key="t" className="text-text-dim">{l.template}</span>,
          <span key="v" className="text-text-dim">{l.visits.toLocaleString()}</span>,
          <span key="c" className="font-semibold text-accent">{l.conversions.toLocaleString()}</span>,
          <span key="cr" className="font-bold text-green">{l.conversionRate}%</span>,
          <span key="st" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[l.status]}`}>{l.status}</span>,
          <span key="p" className="text-text-dim">{l.publishedAt}</span>,
        ])}
      />
    </ModuleShell>
  );
}
