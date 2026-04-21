"use client";

import { Building2 } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { companies } from "@/lib/mock-data-extended";

const tierColors: Record<string, string> = {
  Enterprise: "bg-purple-500/15 text-purple-400",
  "Mid-Market": "bg-accent/15 text-accent",
  SMB: "bg-cyan/15 text-cyan",
  Startup: "bg-green/15 text-green",
};

function healthColor(score: number) {
  if (score >= 80) return "text-green";
  if (score >= 60) return "text-cyan";
  return "text-orange";
}

export default function CompaniesPage() {
  const totalLTV = companies.reduce((a, c) => a + c.lifetimeValue, 0);
  const avgHealth = Math.round(companies.reduce((a, c) => a + c.healthScore, 0) / companies.length);

  return (
    <ModuleShell
      icon={Building2}
      hub="Sales Hub"
      title="Companies"
      description="Enterprise company records with health scoring, deal rollups, and owner assignments."
      primaryAction={{ label: "Add Company" }}
      searchPlaceholder="Search companies..."
      stats={[
        { label: "Total Companies", value: companies.length },
        { label: "Enterprise", value: companies.filter((c) => c.tier === "Enterprise").length },
        { label: "Avg LTV", value: `$${Math.round(totalLTV / companies.length).toLocaleString()}` },
        { label: "Avg Health", value: avgHealth },
      ]}
    >
      <ModuleTable
        columns={["Company", "Industry", "Size", "Owner", "Deals", "LTV", "Health", "Tier"]}
        rows={companies.map((c) => [
          <div key="n">
            <div className="font-semibold text-text">{c.name}</div>
            <div className="text-[10px] text-text-dim">{c.domain}</div>
          </div>,
          <span key="i" className="text-text-dim">{c.industry}</span>,
          <span key="s" className="text-text-dim">{c.size}</span>,
          <span key="o" className="text-text-dim">{c.owner}</span>,
          <span key="d" className="font-semibold text-text">{c.dealsCount}</span>,
          <span key="v" className="font-semibold text-green">${c.lifetimeValue.toLocaleString()}</span>,
          <span key="h" className={`font-bold ${healthColor(c.healthScore)}`}>{c.healthScore}</span>,
          <span key="t" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${tierColors[c.tier]}`}>
            {c.tier}
          </span>,
        ])}
      />
    </ModuleShell>
  );
}
