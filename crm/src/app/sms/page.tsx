"use client";

import { MessagesSquare } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { smsCampaigns } from "@/lib/mock-data-extended";

const statusColors: Record<string, string> = {
  active: "bg-green/15 text-green",
  scheduled: "bg-cyan/15 text-cyan",
  completed: "bg-accent/15 text-accent",
  paused: "bg-orange/15 text-orange",
};

export default function SMSPage() {
  const active = smsCampaigns.filter((s) => s.status === "active").length;
  const sent = smsCampaigns.reduce((a, s) => a + s.sent, 0);
  const delivered = smsCampaigns.reduce((a, s) => a + s.delivered, 0);
  const deliveryRate = sent > 0 ? ((delivered / sent) * 100).toFixed(1) : "0";
  const cost = smsCampaigns.reduce((a, s) => a + s.cost, 0);

  return (
    <ModuleShell
      icon={MessagesSquare}
      hub="Marketing Hub"
      title="SMS Marketing"
      description="A2P 10DLC compliant SMS campaigns with opt-in management, delivery tracking, and cost reporting."
      primaryAction={{ label: "New SMS Campaign" }}
      searchPlaceholder="Search campaigns..."
      stats={[
        { label: "Active", value: active },
        { label: "SMS Sent", value: sent.toLocaleString() },
        { label: "Delivery Rate", value: `${deliveryRate}%` },
        { label: "Total Cost", value: `$${cost.toFixed(2)}` },
      ]}
    >
      <ModuleTable
        columns={["Name", "Audience", "Sent", "Delivered", "Clicks", "Opt-outs", "Status", "Compliance", "Cost"]}
        rows={smsCampaigns.map((s) => [
          <span key="n" className="font-semibold text-text">{s.name}</span>,
          <span key="a" className="text-text-dim">{s.audience.toLocaleString()}</span>,
          <span key="se" className="text-text-dim">{s.sent.toLocaleString()}</span>,
          <span key="d" className="text-accent">{s.delivered.toLocaleString()}</span>,
          <span key="c" className="text-green">{s.clicks.toLocaleString()}</span>,
          <span key="o" className={s.optOuts > 5 ? "text-red" : "text-text-dim"}>{s.optOuts}</span>,
          <span key="st" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[s.status]}`}>{s.status}</span>,
          <span key="co" className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan/15 text-cyan">{s.compliance}</span>,
          <span key="cs" className="font-semibold text-text">${s.cost.toFixed(2)}</span>,
        ])}
      />
    </ModuleShell>
  );
}
