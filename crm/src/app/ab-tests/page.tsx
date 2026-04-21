"use client";

import { FlaskConical } from "lucide-react";
import { ModuleShell, ModuleCards, ModuleCard } from "@/components/module-shell";
import { abTests } from "@/lib/mock-data-extended";

export default function ABTestsPage() {
  const running = abTests.filter((t) => t.status === "running");
  const completed = abTests.filter((t) => t.status === "completed");
  const avgLift = (abTests.reduce((a, t) => a + t.lift, 0) / abTests.length).toFixed(1);

  return (
    <ModuleShell
      icon={FlaskConical}
      hub="Marketing Hub"
      title="A/B Tests"
      description="Split testing on landing pages, CTAs, forms, and pricing — with Bayesian statistical engine."
      aiFeature="AI Statistical Engine"
      primaryAction={{ label: "New Test" }}
      searchPlaceholder="Search tests..."
      stats={[
        { label: "Running", value: running.length },
        { label: "Completed", value: completed.length },
        { label: "Avg Lift", value: `${avgLift}%` },
        { label: "Winners Deployed", value: completed.filter((t) => t.lift > 0).length },
      ]}
    >
      <ModuleCards>
        {abTests.map((t) => (
          <ModuleCard
            key={t.id}
            title={t.name}
            subtitle={`${t.page} • ${t.traffic.toLocaleString()} visitors`}
            badge={t.status}
            badgeColor={t.status === "running" ? "accent" : t.status === "completed" ? "green" : "orange"}
          >
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Control</div>
                <div className="text-lg font-extrabold text-text">{t.control}%</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Variant</div>
                <div className="text-lg font-extrabold text-accent">{t.variantResult}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Lift</div>
                <div className={`text-sm font-extrabold ${t.lift > 0 ? "text-green" : "text-red"}`}>
                  {t.lift > 0 ? "+" : ""}{t.lift}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Confidence</div>
                <div className="text-sm font-extrabold text-text">{t.confidence}%</div>
              </div>
            </div>
          </ModuleCard>
        ))}
      </ModuleCards>
    </ModuleShell>
  );
}
