"use client";

import { ClipboardList } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { forms } from "@/lib/mock-data-extended";

const typeColors: Record<string, string> = {
  lead: "bg-accent/15 text-accent",
  contact: "bg-cyan/15 text-cyan",
  survey: "bg-purple-500/15 text-purple-400",
  registration: "bg-green/15 text-green",
};

const statusColors: Record<string, string> = {
  active: "bg-green/15 text-green",
  paused: "bg-orange/15 text-orange",
  draft: "bg-bg-hover text-text-dim",
};

export default function FormsPage() {
  const active = forms.filter((f) => f.status === "active");
  const submissions = forms.reduce((a, f) => a + f.submissions, 0);
  const avgCR = (forms.reduce((a, f) => a + f.conversionRate, 0) / forms.length).toFixed(1);
  const embeds = forms.reduce((a, f) => a + f.embedLocations, 0);

  return (
    <ModuleShell
      icon={ClipboardList}
      hub="Marketing Hub"
      title="Forms"
      description="Embeddable forms with conditional logic, progressive profiling, and native CRM integration."
      primaryAction={{ label: "New Form" }}
      searchPlaceholder="Search forms..."
      stats={[
        { label: "Active Forms", value: active.length },
        { label: "Submissions", value: submissions.toLocaleString() },
        { label: "Avg CR", value: `${avgCR}%` },
        { label: "Embeds", value: embeds },
      ]}
    >
      <ModuleTable
        columns={["Name", "Type", "Fields", "Submissions", "CR %", "Embeds", "Status"]}
        rows={forms.map((f) => [
          <span key="n" className="font-semibold text-text">{f.name}</span>,
          <span key="t" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${typeColors[f.type]}`}>{f.type}</span>,
          <span key="fi" className="text-text-dim">{f.fields}</span>,
          <span key="s" className="font-semibold text-accent">{f.submissions.toLocaleString()}</span>,
          <span key="cr" className="font-bold text-green">{f.conversionRate}%</span>,
          <span key="e" className="text-text-dim">{f.embedLocations}</span>,
          <span key="st" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[f.status]}`}>{f.status}</span>,
        ])}
      />
    </ModuleShell>
  );
}
