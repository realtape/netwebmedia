"use client";

import { Bot } from "lucide-react";
import { ModuleShell, ModuleCards, ModuleCard } from "@/components/module-shell";
import { aiAgents } from "@/lib/mock-data-extended";

export default function AISDRPage() {
  const sdrs = aiAgents.filter((a) => a.type === "SDR");
  const active = sdrs.filter((s) => s.status === "active");
  const tasks = sdrs.reduce((a, s) => a + s.tasksCompleted, 0);
  const avgAccuracy = sdrs.length > 0 ? Math.round(sdrs.reduce((a, s) => a + s.accuracy, 0) / sdrs.length) : 0;
  const cost = sdrs.reduce((a, s) => a + s.costMonth, 0);

  return (
    <ModuleShell
      icon={Bot}
      hub="AI Agents"
      title="AI SDR"
      description="Autonomous sales development reps that research leads, send personalized outreach, handle replies and book meetings — 24/7."
      aiFeature="Autonomous"
      primaryAction={{ label: "Deploy Agent" }}
      stats={[
        { label: "Active Agents", value: active.length },
        { label: "Messages Sent", value: tasks.toLocaleString() },
        { label: "Avg Accuracy", value: `${avgAccuracy}%` },
        { label: "Monthly Cost", value: `$${cost.toLocaleString()}` },
      ]}
    >
      <ModuleCards>
        {sdrs.map((s) => (
          <ModuleCard
            key={s.id}
            title={s.name}
            subtitle={s.model}
            badge={s.status}
            badgeColor={s.status === "active" ? "green" : s.status === "training" ? "cyan" : "orange"}
          >
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Tasks</div>
                <div className="text-lg font-extrabold text-text">{s.tasksCompleted.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Accuracy</div>
                <div className="text-lg font-extrabold text-green">{s.accuracy}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-[11px]">
              <span className="text-text-dim">Last: {s.lastActive}</span>
              <span className="font-semibold text-accent">${s.costMonth}/mo</span>
            </div>
          </ModuleCard>
        ))}
      </ModuleCards>
    </ModuleShell>
  );
}
