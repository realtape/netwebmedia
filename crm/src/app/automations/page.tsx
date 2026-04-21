"use client";

import { Workflow } from "lucide-react";
import { ModuleShell, ModuleCards, ModuleCard } from "@/components/module-shell";
import { automations } from "@/lib/mock-data-extended";

export default function AutomationsPage() {
  const active = automations.filter((a) => a.status === "active");
  const enrolled = automations.reduce((a, x) => a + x.enrolled, 0);
  const avgConv = Math.round(automations.reduce((a, x) => a + x.conversionRate, 0) / automations.length);

  return (
    <ModuleShell
      icon={Workflow}
      hub="Marketing Hub"
      title="Automations"
      description="Visual workflow builder with if/then branches, delays, multi-channel actions, and AI-assisted creation."
      aiFeature="AI Builder"
      primaryAction={{ label: "New Automation" }}
      searchPlaceholder="Search automations..."
      stats={[
        { label: "Active", value: active.length },
        { label: "Total Enrolled", value: enrolled.toLocaleString() },
        { label: "Avg Conversion", value: `${avgConv}%` },
        { label: "Total Actions", value: automations.reduce((a, x) => a + x.actions, 0) },
      ]}
    >
      <ModuleCards>
        {automations.map((a) => (
          <ModuleCard
            key={a.id}
            title={a.name}
            subtitle={`Trigger: ${a.trigger}`}
            badge={a.status}
            badgeColor={a.status === "active" ? "green" : a.status === "paused" ? "orange" : "accent"}
          >
            <div className="grid grid-cols-3 gap-2 mt-2 text-center">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Actions</div>
                <div className="text-sm font-extrabold text-text">{a.actions}</div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Enrolled</div>
                <div className="text-sm font-extrabold text-accent">{a.enrolled.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Conv</div>
                <div className="text-sm font-extrabold text-green">{a.conversionRate}%</div>
              </div>
            </div>
            <div className="text-[10px] text-text-dim mt-3 pt-3 border-t border-border">Updated {a.updatedAt}</div>
          </ModuleCard>
        ))}
      </ModuleCards>
    </ModuleShell>
  );
}
