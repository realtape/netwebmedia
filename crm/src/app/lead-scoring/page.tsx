"use client";

import { Gauge } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { leadScoring } from "@/lib/mock-data-extended";

const tierColors: Record<string, string> = {
  Hot: "bg-red/15 text-red",
  Warm: "bg-orange/15 text-orange",
  Cold: "bg-cyan/15 text-cyan",
};

function scoreColor(score: number) {
  if (score >= 75) return "text-red";
  if (score >= 50) return "text-orange";
  return "text-cyan";
}

export default function LeadScoringPage() {
  const hot = leadScoring.filter((l) => l.tier === "Hot");
  const warm = leadScoring.filter((l) => l.tier === "Warm");
  const avg = Math.round(leadScoring.reduce((a, l) => a + l.score, 0) / leadScoring.length);

  return (
    <ModuleShell
      icon={Gauge}
      hub="Marketing Hub"
      title="Lead Scoring"
      description="AI-powered predictive scoring with behavior-based triggers and auto-assignment to SDRs."
      aiFeature="AI Scoring Model"
      primaryAction={{ label: "Edit Model" }}
      searchPlaceholder="Search leads..."
      stats={[
        { label: "Hot Leads", value: hot.length },
        { label: "Warm Leads", value: warm.length },
        { label: "Avg Score", value: avg },
        { label: "Routed Today", value: hot.length + 2 },
      ]}
    >
      <ModuleTable
        columns={["Contact", "Score", "Tier", "Last Action", "Triggers", "Assigned SDR"]}
        rows={leadScoring.map((l) => [
          <span key="n" className="font-semibold text-text">{l.contactName}</span>,
          <div key="s" className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-bg-hover rounded-full overflow-hidden max-w-20">
              <div className="h-full bg-accent rounded-full" style={{ width: `${l.score}%` }} />
            </div>
            <span className={`font-bold ${scoreColor(l.score)}`}>{l.score}</span>
          </div>,
          <span key="t" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${tierColors[l.tier]}`}>{l.tier}</span>,
          <span key="la" className="text-text-dim text-[11px]">{l.lastAction}</span>,
          <div key="tr" className="flex flex-wrap gap-1">
            {l.triggers.slice(0, 2).map((t) => (
              <span key={t} className="text-[9px] px-1.5 py-0.5 bg-bg-hover border border-border rounded text-text-dim">{t}</span>
            ))}
            {l.triggers.length > 2 && <span className="text-[9px] text-text-dim">+{l.triggers.length - 2}</span>}
          </div>,
          <span key="a" className="text-text-dim">{l.assignedSDR}</span>,
        ])}
      />
    </ModuleShell>
  );
}
