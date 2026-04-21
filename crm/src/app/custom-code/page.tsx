"use client";

import { Code2 } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { customCode } from "@/lib/mock-data-extended";

const langColors: Record<string, string> = {
  JavaScript: "bg-orange/15 text-orange",
  TypeScript: "bg-cyan/15 text-cyan",
  Python: "bg-green/15 text-green",
};

const statusColors: Record<string, string> = {
  active: "bg-green/15 text-green",
  disabled: "bg-bg-hover text-text-dim",
  error: "bg-red/15 text-red",
};

export default function CustomCodePage() {
  const active = customCode.filter((c) => c.status === "active").length;
  const runs = customCode.reduce((a, c) => a + c.runs, 0);
  const errors = customCode.filter((c) => c.status === "error").length;

  return (
    <ModuleShell
      icon={Code2}
      hub="Operations"
      title="Custom Code"
      description="Serverless functions inside automations — run JS, TS or Python on any trigger. Isolated sandboxes, versioning, test runs."
      aiFeature="AI Code Gen"
      primaryAction={{ label: "New Function" }}
      searchPlaceholder="Search functions..."
      stats={[
        { label: "Active", value: active },
        { label: "Total Runs", value: runs.toLocaleString() },
        { label: "Avg Runtime", value: "248ms" },
        { label: "Errors", value: errors, delta: errors > 0 ? "review" : undefined },
      ]}
    >
      <ModuleTable
        columns={["Name", "Language", "Trigger", "Runs", "Last Run", "Status", "Author"]}
        rows={customCode.map((c) => [
          <span key="n" className="font-semibold text-text">{c.name}</span>,
          <span key="l" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${langColors[c.language]}`}>{c.language}</span>,
          <span key="t" className="font-mono text-[11px] text-text-dim">{c.trigger}</span>,
          <span key="r" className="text-text-dim">{c.runs.toLocaleString()}</span>,
          <span key="lr" className="text-text-dim text-[11px]">{c.lastRun}</span>,
          <span key="s" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>{c.status}</span>,
          <span key="a" className="text-text-dim">{c.author}</span>,
        ])}
      />
    </ModuleShell>
  );
}
