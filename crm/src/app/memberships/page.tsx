"use client";

import { Users2 } from "lucide-react";
import { ModuleShell, ModuleCards, ModuleCard } from "@/components/module-shell";
import { memberships } from "@/lib/mock-data-extended";

export default function MembershipsPage() {
  const active = memberships.filter((m) => m.status === "active");
  const members = memberships.reduce((a, m) => a + m.members, 0);
  const mrr = memberships.reduce((a, m) => a + m.revenue, 0);
  const paid = memberships.filter((m) => m.revenue > 0);
  const avgRenewal = paid.length > 0 ? Math.round(paid.reduce((a, m) => a + m.renewalRate, 0) / paid.length) : 0;

  return (
    <ModuleShell
      icon={Users2}
      hub="CMS & Sites"
      title="Memberships"
      description="Gated content, paid communities, tiered benefits with recurring billing via Stripe."
      primaryAction={{ label: "New Membership" }}
      searchPlaceholder="Search memberships..."
      stats={[
        { label: "Active", value: active.length },
        { label: "Total Members", value: members.toLocaleString() },
        { label: "Total MRR", value: `$${mrr.toLocaleString()}` },
        { label: "Avg Renewal", value: `${avgRenewal}%` },
      ]}
    >
      <ModuleCards>
        {memberships.map((m) => (
          <ModuleCard
            key={m.id}
            title={m.name}
            subtitle={m.tier}
            badge={m.status}
            badgeColor={m.status === "active" ? "green" : m.status === "paused" ? "orange" : "accent"}
          >
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Members</div>
                <div className="text-lg font-extrabold text-text">{m.members.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">MRR</div>
                <div className="text-lg font-extrabold text-green">${m.revenue.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-[11px]">
              <span className="text-text-dim">{m.benefits} benefits</span>
              {m.renewalRate > 0 && <span className="text-green font-semibold">{m.renewalRate}% renewal</span>}
            </div>
          </ModuleCard>
        ))}
      </ModuleCards>
    </ModuleShell>
  );
}
