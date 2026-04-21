"use client";

import { FileSignature } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { quotes } from "@/lib/mock-data-extended";

const statusColors: Record<string, string> = {
  accepted: "bg-green/15 text-green",
  sent: "bg-cyan/15 text-cyan",
  viewed: "bg-accent/15 text-accent",
  draft: "bg-bg-hover text-text-dim",
  rejected: "bg-red/15 text-red",
  expired: "bg-red/15 text-red",
};

export default function QuotesPage() {
  const totalQuoted = quotes.reduce((a, q) => a + q.total, 0);
  const accepted = quotes.filter((q) => q.status === "accepted");
  const closed = quotes.filter((q) => q.status === "accepted" || q.status === "rejected").length;
  const winRate = closed > 0 ? Math.round((accepted.length / closed) * 100) : 0;
  const avgQuote = Math.round(totalQuoted / quotes.length);

  return (
    <ModuleShell
      icon={FileSignature}
      hub="Sales Hub"
      title="Quotes"
      description="Branded quotes with e-signature, Stripe checkout, and automated follow-up."
      primaryAction={{ label: "New Quote" }}
      searchPlaceholder="Search quotes..."
      stats={[
        { label: "Total Quoted", value: `$${totalQuoted.toLocaleString()}` },
        { label: "Accepted", value: accepted.length },
        { label: "Win Rate", value: `${winRate}%` },
        { label: "Avg Quote", value: `$${avgQuote.toLocaleString()}` },
      ]}
    >
      <ModuleTable
        columns={["Number", "Contact", "Company", "Total", "Status", "Expires", "Items"]}
        rows={quotes.map((q) => [
          <span key="n" className="font-mono text-xs text-text">{q.number}</span>,
          <span key="c" className="font-semibold text-text">{q.contactName}</span>,
          <span key="co" className="text-text-dim">{q.companyName}</span>,
          <span key="t" className="font-semibold text-green">${q.total.toLocaleString()}</span>,
          <span key="s" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[q.status]}`}>
            {q.status}
          </span>,
          <span key="e" className="text-text-dim">{q.expiresAt}</span>,
          <span key="i" className="text-text-dim">{q.lineItems}</span>,
        ])}
      />
    </ModuleShell>
  );
}
