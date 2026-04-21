"use client";

import { Webhook } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { webhooks } from "@/lib/mock-data-extended";

const statusColors: Record<string, string> = {
  active: "bg-green/15 text-green",
  disabled: "bg-bg-hover text-text-dim",
  error: "bg-red/15 text-red",
};

function rateColor(rate: number) {
  if (rate >= 99) return "text-green";
  if (rate >= 95) return "text-orange";
  return "text-red";
}

export default function WebhooksPage() {
  const active = webhooks.filter((w) => w.status === "active").length;
  const deliveries = webhooks.reduce((a, w) => a + w.deliveries, 0);
  const avgRate = (webhooks.reduce((a, w) => a + w.successRate, 0) / webhooks.length).toFixed(1);
  const errors = webhooks.filter((w) => w.status === "error").length;

  return (
    <ModuleShell
      icon={Webhook}
      hub="Operations"
      title="Webhooks"
      description="Outbound webhooks for real-time event delivery. Retry policies, HMAC signing, delivery logs."
      primaryAction={{ label: "New Webhook" }}
      searchPlaceholder="Search webhooks..."
      stats={[
        { label: "Active", value: active },
        { label: "Deliveries", value: deliveries.toLocaleString() },
        { label: "Avg Success", value: `${avgRate}%` },
        { label: "Errors", value: errors, delta: errors > 0 ? "needs attention" : undefined },
      ]}
    >
      <ModuleTable
        columns={["Name", "URL", "Events", "Deliveries", "Success %", "Status", "Last Delivery"]}
        rows={webhooks.map((w) => [
          <span key="n" className="font-semibold text-text">{w.name}</span>,
          <span key="u" className="font-mono text-[11px] text-text-dim truncate max-w-[200px] inline-block">{w.url}</span>,
          <div key="e" className="flex flex-wrap gap-1">
            {w.events.slice(0, 2).map((ev) => (
              <span key={ev} className="text-[9px] px-1.5 py-0.5 bg-bg-hover border border-border rounded text-text-dim font-mono">{ev}</span>
            ))}
            {w.events.length > 2 && <span className="text-[9px] text-text-dim">+{w.events.length - 2}</span>}
          </div>,
          <span key="d" className="text-text-dim">{w.deliveries.toLocaleString()}</span>,
          <span key="s" className={`font-bold ${rateColor(w.successRate)}`}>{w.successRate}%</span>,
          <span key="st" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[w.status]}`}>{w.status}</span>,
          <span key="ld" className="text-text-dim text-[11px]">{w.lastDelivery}</span>,
        ])}
      />
    </ModuleShell>
  );
}
