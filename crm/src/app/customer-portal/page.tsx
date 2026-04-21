"use client";

import { UserCircle2 } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { customerPortalUsers } from "@/lib/mock-data-extended";

export default function CustomerPortalPage() {
  const activeWeek = customerPortalUsers.filter((u) => u.lastLogin.includes("hour") || u.lastLogin === "Yesterday").length;
  const openTickets = customerPortalUsers.reduce((a, u) => a + u.ticketsOpen, 0);
  const pendingInv = customerPortalUsers.reduce((a, u) => a + u.invoicesPending, 0);

  return (
    <ModuleShell
      icon={UserCircle2}
      hub="Service Hub"
      title="Customer Portal"
      description="Branded self-service portal for customers to view invoices, open tickets, manage team and download receipts."
      primaryAction={{ label: "Portal Settings" }}
      searchPlaceholder="Search users..."
      stats={[
        { label: "Portal Users", value: customerPortalUsers.length },
        { label: "Active This Week", value: activeWeek },
        { label: "Open Tickets", value: openTickets },
        { label: "Pending Invoices", value: pendingInv },
      ]}
    >
      <ModuleTable
        columns={["Name", "Email", "Company", "Last Login", "Tickets", "Invoices", "MRR"]}
        rows={customerPortalUsers.map((u) => [
          <span key="n" className="font-semibold text-text">{u.name}</span>,
          <span key="e" className="text-text-dim text-[11px]">{u.email}</span>,
          <span key="c" className="text-text-dim">{u.company}</span>,
          <span key="l" className="text-text-dim">{u.lastLogin}</span>,
          <span key="t" className={u.ticketsOpen > 0 ? "font-semibold text-orange" : "text-text-dim"}>{u.ticketsOpen}</span>,
          <span key="i" className={u.invoicesPending > 0 ? "font-semibold text-red" : "text-text-dim"}>{u.invoicesPending}</span>,
          <span key="m" className="font-semibold text-green">${u.mrr.toLocaleString()}</span>,
        ])}
      />
    </ModuleShell>
  );
}
