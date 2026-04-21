"use client";

import { Target } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { adsCampaigns } from "@/lib/mock-data-extended";

const platformColors: Record<string, string> = {
  Google: "bg-accent/15 text-accent",
  Meta: "bg-cyan/15 text-cyan",
  LinkedIn: "bg-purple-500/15 text-purple-400",
  TikTok: "bg-red/15 text-red",
};

const statusColors: Record<string, string> = {
  active: "bg-green/15 text-green",
  paused: "bg-orange/15 text-orange",
  ended: "bg-bg-hover text-text-dim",
};

function roasColor(roas: number) {
  if (roas >= 4) return "text-green";
  if (roas >= 2) return "text-orange";
  return "text-red";
}

export default function AdsPage() {
  const active = adsCampaigns.filter((a) => a.status === "active");
  const spent = adsCampaigns.reduce((a, c) => a + c.spent, 0);
  const avgROAS = (adsCampaigns.reduce((a, c) => a + c.roas, 0) / adsCampaigns.length).toFixed(1);
  const conv = adsCampaigns.reduce((a, c) => a + c.conversions, 0);

  return (
    <ModuleShell
      icon={Target}
      hub="Marketing Hub"
      title="Ads Manager"
      description="Unified Google, Meta, LinkedIn, TikTok ad management with ROAS, attribution and budget automation."
      primaryAction={{ label: "New Campaign" }}
      searchPlaceholder="Search campaigns..."
      stats={[
        { label: "Active", value: active.length },
        { label: "Total Spent", value: `$${spent.toLocaleString()}` },
        { label: "Avg ROAS", value: `${avgROAS}x` },
        { label: "Conversions", value: conv.toLocaleString() },
      ]}
    >
      <ModuleTable
        columns={["Name", "Platform", "Status", "Budget", "Spent", "Impressions", "CTR", "CPC", "Conv", "ROAS"]}
        rows={adsCampaigns.map((c) => [
          <span key="n" className="font-semibold text-text">{c.name}</span>,
          <span key="p" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${platformColors[c.platform]}`}>{c.platform}</span>,
          <span key="s" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>{c.status}</span>,
          <span key="b" className="text-text-dim">${c.budget.toLocaleString()}</span>,
          <span key="sp" className="text-text">${c.spent.toLocaleString()}</span>,
          <span key="im" className="text-text-dim">{c.impressions.toLocaleString()}</span>,
          <span key="ct" className="text-accent">{c.ctr}%</span>,
          <span key="cp" className="text-text-dim">${c.cpc}</span>,
          <span key="co" className="text-green font-semibold">{c.conversions}</span>,
          <span key="r" className={`font-bold ${roasColor(c.roas)}`}>{c.roas}x</span>,
        ])}
      />
    </ModuleShell>
  );
}
