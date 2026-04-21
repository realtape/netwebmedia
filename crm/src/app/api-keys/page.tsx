"use client";

import { Code2, Eye, Trash2 } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { apiKeys } from "@/lib/mock-data-extended";

const statusColors: Record<string, string> = {
  active: "bg-green/15 text-green",
  revoked: "bg-red/15 text-red",
};

export default function APIKeysPage() {
  const active = apiKeys.filter((k) => k.status === "active");
  const revoked = apiKeys.filter((k) => k.status === "revoked").length;

  return (
    <ModuleShell
      icon={Code2}
      hub="Operations"
      title="API Keys"
      description="Scoped API keys for backend integrations, Zapier, mobile apps. Audit logs, per-key rate limits, rotation reminders."
      primaryAction={{ label: "Generate Key" }}
      searchPlaceholder="Search keys..."
      stats={[
        { label: "Active Keys", value: active.length },
        { label: "Revoked", value: revoked },
        { label: "Total Requests", value: "4.2M" },
        { label: "Last 24h", value: "184K" },
      ]}
    >
      <ModuleTable
        columns={["Label", "Key", "Scopes", "Last Used", "Created", "Status", "Created By", ""]}
        rows={apiKeys.map((k) => [
          <span key="l" className="font-semibold text-text">{k.label}</span>,
          <span key="p" className="font-mono text-[11px] text-text-dim">{k.prefix}</span>,
          <div key="s" className="flex flex-wrap gap-1">
            {k.scopes.slice(0, 2).map((sc) => (
              <span key={sc} className="text-[9px] px-1.5 py-0.5 bg-bg-hover border border-border rounded text-text-dim font-mono">{sc}</span>
            ))}
            {k.scopes.length > 2 && <span className="text-[9px] text-text-dim">+{k.scopes.length - 2}</span>}
          </div>,
          <span key="lu" className="text-text-dim">{k.lastUsed}</span>,
          <span key="c" className="text-text-dim">{k.createdAt}</span>,
          <span key="st" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[k.status]}`}>{k.status}</span>,
          <span key="b" className="text-text-dim">{k.createdBy}</span>,
          <div key="a" className="flex gap-1 justify-end">
            <button className="p-1.5 rounded hover:bg-bg-hover text-text-dim"><Eye size={12} /></button>
            <button className="p-1.5 rounded hover:bg-bg-hover text-text-dim hover:text-red"><Trash2 size={12} /></button>
          </div>,
        ])}
      />
    </ModuleShell>
  );
}
