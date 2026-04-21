"use client";

import { Megaphone } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { campaigns } from "@/lib/mock-data-extended";

const statusColors: Record<string, string> = {
  active: "bg-green/15 text-green",
  scheduled: "bg-cyan/15 text-cyan",
  completed: "bg-accent/15 text-accent",
  paused: "bg-orange/15 text-orange",
  draft: "bg-bg-hover text-text-dim",
};

const typeColors: Record<string, string> = {
  Email: "bg-accent/15 text-accent",
  SMS: "bg-cyan/15 text-cyan",
  Social: "bg-purple-500/15 text-purple-400",
  "Multi-channel": "bg-orange/15 text-orange",
  Ads: "bg-red/15 text-red",
};

export default function CampaignsPage() {
  const active = campaigns.filter((c) => c.status === "active").length;
  const sent = campaigns.reduce((a, c) => a + c.sent, 0);
  const revenue = campaigns.reduce((a, c) => a + c.revenue, 0);
  const running = campaigns.filter((c) => c.conversionRate > 0);
  const avgConv = running.length > 0 ? (running.reduce((a, c) => a + c.conversionRate, 0) / running.length).toFixed(1) : "0";

  return (
    <ModuleShell
      icon={Megaphone}
      hub="Marketing Hub"
      title="Campaigns"
      description="Multi-channel campaigns (email, SMS, social, ads) with attribution and revenue tracking."
      primaryAction={{ label: "New Campaign" }}
      searchPlaceholder="Search campaigns..."
      stats={[
        { label: "Active", value: active },
        { label: "Total Sent", value: sent.toLocaleString() },
        { label: "Avg Conversion", value: `${avgConv}%` },
        { label: "Attributed Revenue", value: `$${revenue.toLocaleString()}` },
      ]}
    >
      <ModuleTable
        columns={["Name", "Type", "Status", "Audience", "Open %", "Click %", "Conv %", "Revenue", "Launch"]}
        rows={campaigns.map((c) => [
          <span key="n" className="font-semibold text-text">{c.name}</span>,
          <span key="t" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${typeColors[c.type]}`}>{c.type}</span>,
          <span key="s" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>{c.status}</span>,
          <span key="a" className="text-text-dim">{c.audience.toLocaleString()}</span>,
          <span key="o" className="text-cyan">{c.openRate}%</span>,
          <span key="cl" className="text-accent">{c.clickRate}%</span>,
          <span key="cv" className="text-green">{c.conversionRate}%</span>,
          <span key="r" className="font-semibold text-green">${c.revenue.toLocaleString()}</span>,
          <span key="l" className="text-text-dim">{c.launchDate}</span>,
        ])}
      />
    </ModuleShell>
  );
}
