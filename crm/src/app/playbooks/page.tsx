"use client";

import { ClipboardList } from "lucide-react";
import { ModuleShell, ModuleCards, ModuleCard } from "@/components/module-shell";
import { playbooks } from "@/lib/mock-data-extended";

const catColors: Record<string, "accent" | "cyan" | "orange" | "green" | "purple"> = {
  Discovery: "cyan",
  Demo: "accent",
  Objection: "orange",
  Closing: "green",
  Onboarding: "purple",
};

export default function PlaybooksPage() {
  const avgWinRate = Math.round(playbooks.reduce((a, p) => a + p.winRate, 0) / playbooks.length);
  const topPlaybook = [...playbooks].sort((a, b) => b.usage - a.usage)[0];

  return (
    <ModuleShell
      icon={ClipboardList}
      hub="Sales Hub"
      title="Playbooks"
      description="Reusable sales motions for every stage — MEDDIC, demos, objection handling, closing, onboarding."
      aiFeature="AI Coach"
      primaryAction={{ label: "New Playbook" }}
      searchPlaceholder="Search playbooks..."
      stats={[
        { label: "Total Playbooks", value: playbooks.length },
        { label: "Avg Win Rate", value: `${avgWinRate}%` },
        { label: "Most Used", value: topPlaybook.name.split(" ")[0] },
        { label: "Updated 30d", value: playbooks.length },
      ]}
    >
      <ModuleCards>
        {playbooks.map((p) => (
          <ModuleCard
            key={p.id}
            title={p.name}
            subtitle={`${p.steps} steps`}
            badge={p.category}
            badgeColor={catColors[p.category]}
          >
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-0.5">Win Rate</div>
                <div className="text-lg font-extrabold text-green">{p.winRate}%</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-0.5">Used</div>
                <div className="text-lg font-extrabold text-text">{p.usage}x</div>
              </div>
            </div>
            <div className="text-[11px] text-text-dim mt-3 pt-3 border-t border-border">
              By {p.author} · Updated {p.updatedAt}
            </div>
          </ModuleCard>
        ))}
      </ModuleCards>
    </ModuleShell>
  );
}
