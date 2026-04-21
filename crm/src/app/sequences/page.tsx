"use client";

import { Mail } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { sequencesList } from "@/lib/mock-data-extended";

const statusColors: Record<string, string> = {
  active: "bg-green/15 text-green",
  paused: "bg-orange/15 text-orange",
  draft: "bg-bg-hover text-text-dim",
};

export default function SequencesPage() {
  const active = sequencesList.filter((s) => s.status === "active");
  const totalEnrolled = sequencesList.reduce((a, s) => a + s.enrolled, 0);
  const avgOpen = Math.round(sequencesList.reduce((a, s) => a + s.openRate, 0) / sequencesList.length);
  const avgReply = Math.round(sequencesList.reduce((a, s) => a + s.replyRate, 0) / sequencesList.length);

  return (
    <ModuleShell
      icon={Mail}
      hub="Sales Hub"
      title="Sequences"
      description="Multi-step outreach cadences across email, LinkedIn, SMS and in-app. Auto-pause on reply."
      primaryAction={{ label: "New Sequence" }}
      searchPlaceholder="Search sequences..."
      stats={[
        { label: "Active", value: active.length },
        { label: "Total Enrolled", value: totalEnrolled.toLocaleString() },
        { label: "Avg Open Rate", value: `${avgOpen}%` },
        { label: "Avg Reply Rate", value: `${avgReply}%` },
      ]}
    >
      <ModuleTable
        columns={["Name", "Steps", "Channels", "Enrolled", "Open", "Reply", "Status"]}
        rows={sequencesList.map((s) => [
          <span key="n" className="font-semibold text-text">{s.name}</span>,
          <span key="s" className="text-text-dim">{s.steps}</span>,
          <div key="c" className="flex gap-1">
            {s.channels.map((ch) => (
              <span key={ch} className="text-[10px] px-1.5 py-0.5 bg-bg-hover border border-border rounded text-text-dim">
                {ch}
              </span>
            ))}
          </div>,
          <span key="e" className="font-semibold text-text">{s.enrolled}</span>,
          <span key="o" className="text-cyan">{s.openRate}%</span>,
          <span key="r" className="text-green">{s.replyRate}%</span>,
          <span key="st" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[s.status]}`}>
            {s.status}
          </span>,
        ])}
      />
    </ModuleShell>
  );
}
