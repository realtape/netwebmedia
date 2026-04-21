"use client";

import { Ticket } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { tickets } from "@/lib/mock-data-extended";

const priorityColors: Record<string, string> = {
  urgent: "bg-red/15 text-red",
  high: "bg-orange/15 text-orange",
  medium: "bg-cyan/15 text-cyan",
  low: "bg-bg-hover text-text-dim",
};

const statusColors: Record<string, string> = {
  open: "bg-accent/15 text-accent",
  "in-progress": "bg-cyan/15 text-cyan",
  waiting: "bg-orange/15 text-orange",
  resolved: "bg-green/15 text-green",
  closed: "bg-bg-hover text-text-dim",
};

const slaColors: Record<string, string> = {
  "on-track": "text-green",
  "at-risk": "text-orange",
  breached: "text-red",
};

export default function TicketsPage() {
  const open = tickets.filter((t) => t.status === "open" || t.status === "in-progress" || t.status === "waiting");
  const urgent = tickets.filter((t) => t.priority === "urgent");
  const onTrack = tickets.filter((t) => t.slaStatus === "on-track").length;
  const compliance = Math.round((onTrack / tickets.length) * 100);

  return (
    <ModuleShell
      icon={Ticket}
      hub="Service Hub"
      title="Tickets"
      description="Support ticketing with SLA tracking, AI triage, auto-routing and omnichannel intake."
      aiFeature="AI Triage"
      primaryAction={{ label: "New Ticket" }}
      searchPlaceholder="Search tickets..."
      stats={[
        { label: "Open", value: open.length },
        { label: "Urgent", value: urgent.length, delta: urgent.length > 0 ? "needs attention" : undefined },
        { label: "Avg Response", value: "18 min" },
        { label: "SLA Compliance", value: `${compliance}%` },
      ]}
    >
      <ModuleTable
        columns={["Number", "Subject", "Contact", "Priority", "Status", "Assigned", "SLA", "Created"]}
        rows={tickets.map((t) => [
          <span key="n" className="font-mono text-[11px] text-text">{t.number}</span>,
          <span key="s" className="font-semibold text-text">{t.subject}</span>,
          <span key="c" className="text-text-dim">{t.contactName}</span>,
          <span key="p" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityColors[t.priority]}`}>{t.priority}</span>,
          <span key="st" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[t.status]}`}>{t.status}</span>,
          <span key="a" className="text-text-dim">{t.assignedTo}</span>,
          <span key="sl" className={`text-[10px] font-bold uppercase tracking-wider ${slaColors[t.slaStatus]}`}>{t.slaStatus}</span>,
          <span key="cr" className="text-text-dim text-[11px]">{t.createdAt}</span>,
        ])}
      />
    </ModuleShell>
  );
}
