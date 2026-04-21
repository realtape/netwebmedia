"use client";

import { Mic } from "lucide-react";
import { ModuleShell, ModuleCards, ModuleCard } from "@/components/module-shell";
import { aiAgents } from "@/lib/mock-data-extended";

export default function VoiceAIPage() {
  const voice = aiAgents.filter((a) => a.type === "Voice");
  const active = voice.filter((v) => v.status === "active");
  const calls = voice.reduce((a, v) => a + v.tasksCompleted, 0);
  const avgAccuracy = voice.length > 0 ? Math.round(voice.reduce((a, v) => a + v.accuracy, 0) / voice.length) : 0;
  const cost = voice.reduce((a, v) => a + v.costMonth, 0);

  return (
    <ModuleShell
      icon={Mic}
      hub="AI Agents"
      title="Voice AI"
      description="Human-like voice agents that answer inbound calls, qualify leads, book meetings and escalate to humans seamlessly."
      aiFeature="ElevenLabs Voice"
      primaryAction={{ label: "New Voice Agent" }}
      stats={[
        { label: "Active Agents", value: active.length },
        { label: "Calls Handled", value: calls.toLocaleString() },
        { label: "Avg Duration", value: "4m 28s" },
        { label: "Monthly Cost", value: `$${cost.toLocaleString()}` },
      ]}
    >
      <ModuleCards>
        {voice.map((v) => (
          <ModuleCard
            key={v.id}
            title={v.name}
            subtitle={v.model}
            badge={v.status}
            badgeColor={v.status === "active" ? "green" : "orange"}
          >
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Calls</div>
                <div className="text-lg font-extrabold text-text">{v.tasksCompleted.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Accuracy</div>
                <div className="text-lg font-extrabold text-green">{v.accuracy}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-[11px]">
              <span className="text-text-dim">Last: {v.lastActive}</span>
              <span className="font-semibold text-accent">${v.costMonth}/mo</span>
            </div>
          </ModuleCard>
        ))}
      </ModuleCards>
    </ModuleShell>
  );
}
