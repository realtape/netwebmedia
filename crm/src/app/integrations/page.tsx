"use client";

import { Link2, Check, AlertCircle } from "lucide-react";
import { ModuleShell, ModuleCards, ModuleCard } from "@/components/module-shell";
import { integrations } from "@/lib/mock-data-extended";

export default function IntegrationsPage() {
  const connected = integrations.filter((i) => i.status === "connected");
  const available = integrations.filter((i) => i.status === "available");
  const errors = integrations.filter((i) => i.status === "error").length;
  const syncs = integrations.reduce((a, i) => a + i.syncs, 0);

  return (
    <ModuleShell
      icon={Link2}
      hub="Operations"
      title="Integrations"
      description="Native integrations for email, calendar, payments, SMS, commerce — plus one-click migration from HubSpot, GHL and Salesforce."
      primaryAction={{ label: "Browse Marketplace" }}
      searchPlaceholder="Search integrations..."
      stats={[
        { label: "Connected", value: connected.length },
        { label: "Available", value: available.length },
        { label: "Total Syncs", value: syncs.toLocaleString() },
        { label: "Errors", value: errors },
      ]}
    >
      <ModuleCards>
        {integrations.map((i) => (
          <ModuleCard
            key={i.id}
            title={i.name}
            subtitle={i.category}
            badge={i.status}
            badgeColor={i.status === "connected" ? "green" : i.status === "error" ? "red" : "cyan"}
          >
            <div className="flex items-center justify-between mt-2">
              <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center text-accent font-extrabold">
                {i.logo}
              </div>
              {i.status === "connected" && (
                <div className="flex items-center gap-1 text-[11px] text-green">
                  <Check size={12} /> Connected
                </div>
              )}
              {i.status === "error" && (
                <div className="flex items-center gap-1 text-[11px] text-red">
                  <AlertCircle size={12} /> Error
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-[11px]">
              <span className="text-text-dim">{i.syncs.toLocaleString()} syncs</span>
              <span className="text-text-dim">{i.lastSync}</span>
            </div>
          </ModuleCard>
        ))}
      </ModuleCards>
    </ModuleShell>
  );
}
