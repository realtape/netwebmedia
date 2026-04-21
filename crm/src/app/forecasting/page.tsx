"use client";

import { TrendingUp } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { forecastingData } from "@/lib/mock-data-extended";

function attainmentColor(pct: number) {
  if (pct >= 90) return "text-green";
  if (pct >= 70) return "text-accent";
  return "text-orange";
}

export default function ForecastingPage() {
  const totalPipeline = forecastingData.reduce((a, r) => a + r.pipeline, 0);
  const totalCommit = forecastingData.reduce((a, r) => a + r.commit, 0);
  const avgAttain = Math.round(forecastingData.reduce((a, r) => a + r.attainment, 0) / forecastingData.length);

  return (
    <ModuleShell
      icon={TrendingUp}
      hub="Sales Hub"
      title="Forecasting"
      description="AI-powered quota attainment with pipeline, commit, and best-case rollups across your sales org."
      aiFeature="AI Forecast"
      primaryAction={{ label: "Export" }}
      stats={[
        { label: "Total Pipeline", value: `$${(totalPipeline / 1000).toFixed(0)}K` },
        { label: "Weighted Commit", value: `$${(totalCommit / 1000).toFixed(0)}K` },
        { label: "Avg Attainment", value: `${avgAttain}%` },
        { label: "Reps at Risk", value: forecastingData.filter((r) => r.attainment < 70).length, delta: "needs coaching" },
      ]}
    >
      <ModuleTable
        columns={["Rep", "Pipeline", "Commit", "Best Case", "Quota", "Attainment", "Deals"]}
        rows={forecastingData.map((r) => [
          <span key="r" className="font-semibold text-text">{r.owner}</span>,
          <span key="p" className="text-text-dim">${r.pipeline.toLocaleString()}</span>,
          <span key="c" className="font-semibold text-accent">${r.commit.toLocaleString()}</span>,
          <span key="b" className="text-text-dim">${r.best.toLocaleString()}</span>,
          <span key="q" className="text-text-dim">${r.quota.toLocaleString()}</span>,
          <div key="a" className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-bg-hover rounded-full overflow-hidden max-w-24">
              <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(r.attainment, 100)}%` }} />
            </div>
            <span className={`font-bold ${attainmentColor(r.attainment)}`}>{r.attainment}%</span>
          </div>,
          <span key="d" className="font-semibold text-text">{r.deals}</span>,
        ])}
      />
    </ModuleShell>
  );
}
