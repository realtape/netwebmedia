"use client";

import { Percent } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { affiliates } from "@/lib/mock-data-extended";

const tierColors: Record<string, string> = {
  Platinum: "bg-purple-500/15 text-purple-400",
  Gold: "bg-orange/15 text-orange",
  Silver: "bg-cyan/15 text-cyan",
  Bronze: "bg-bg-hover text-text-dim",
};

export default function AffiliatesPage() {
  const earnings = affiliates.reduce((a, af) => a + af.earnings, 0);
  const pending = affiliates.reduce((a, af) => a + af.pending, 0);
  const conversions = affiliates.reduce((a, af) => a + af.conversions, 0);
  const referrals = affiliates.reduce((a, af) => a + af.referrals, 0);

  return (
    <ModuleShell
      icon={Percent}
      hub="Agency / Partner"
      title="Affiliate Manager"
      description="Recruit, track, and pay affiliates. Custom links, cookie windows, tiered commissions, automated payouts via Stripe / PayPal."
      primaryAction={{ label: "Invite Affiliate" }}
      searchPlaceholder="Search affiliates..."
      stats={[
        { label: "Active Affiliates", value: affiliates.length },
        { label: "Total Referrals", value: referrals },
        { label: "Total Paid", value: `$${earnings.toLocaleString()}` },
        { label: "Pending Payouts", value: `$${pending.toLocaleString()}` },
      ]}
    >
      <ModuleTable
        columns={["Name", "Email", "Referrals", "Conversions", "Earnings", "Pending", "Tier", "Joined"]}
        rows={affiliates.map((af) => [
          <span key="n" className="font-semibold text-text">{af.name}</span>,
          <span key="e" className="text-text-dim text-[11px]">{af.email}</span>,
          <span key="r" className="text-text-dim">{af.referrals}</span>,
          <span key="c" className="font-semibold text-accent">{af.conversions}</span>,
          <span key="ea" className="font-semibold text-green">${af.earnings.toLocaleString()}</span>,
          <span key="p" className="text-orange">${af.pending.toLocaleString()}</span>,
          <span key="t" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${tierColors[af.tier]}`}>{af.tier}</span>,
          <span key="j" className="text-text-dim">{af.joinedAt}</span>,
        ])}
      />
    </ModuleShell>
  );
}
