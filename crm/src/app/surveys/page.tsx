"use client";

import { Star } from "lucide-react";
import { ModuleShell, ModuleCards, ModuleCard } from "@/components/module-shell";
import { surveys } from "@/lib/mock-data-extended";

export default function SurveysPage() {
  const active = surveys.filter((s) => s.status === "active");
  const responses = surveys.reduce((a, s) => a + s.responses, 0);
  const nps = surveys.find((s) => s.type === "NPS");
  const csat = surveys.find((s) => s.type === "CSAT");

  return (
    <ModuleShell
      icon={Star}
      hub="Service Hub"
      title="Surveys / NPS"
      description="NPS, CSAT, CES, and custom surveys with automated triggers, AI sentiment analysis and benchmarking."
      aiFeature="AI Analysis"
      primaryAction={{ label: "New Survey" }}
      searchPlaceholder="Search surveys..."
      stats={[
        { label: "Active Surveys", value: active.length },
        { label: "Total Responses", value: responses.toLocaleString() },
        { label: "NPS Score", value: nps?.avgScore ?? "—" },
        { label: "Avg CSAT", value: csat?.avgScore ?? "—" },
      ]}
    >
      <ModuleCards>
        {surveys.map((s) => {
          const responseRate = s.sent > 0 ? Math.round((s.responses / s.sent) * 100) : 0;
          return (
            <ModuleCard
              key={s.id}
              title={s.name}
              subtitle={s.type}
              badge={s.status}
              badgeColor={s.status === "active" ? "green" : s.status === "paused" ? "orange" : "accent"}
            >
              <div className="flex items-baseline gap-2 mb-3">
                <div className="text-3xl font-extrabold text-accent">{s.avgScore || "—"}</div>
                <div className="text-[10px] text-text-dim font-bold uppercase tracking-widest">avg score</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-border">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Responses</div>
                  <div className="text-sm font-extrabold text-text">{s.responses.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Sent</div>
                  <div className="text-sm font-extrabold text-text">{s.sent.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Rate</div>
                  <div className="text-sm font-extrabold text-green">{responseRate}%</div>
                </div>
              </div>
            </ModuleCard>
          );
        })}
      </ModuleCards>
    </ModuleShell>
  );
}
