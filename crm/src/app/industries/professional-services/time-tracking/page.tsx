"use client";

import { Clock } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface TimeEntry {
  id: string;
  date: string;
  timekeeper: string;
  matter: string;
  description: string;
  hours: number;
  rate: number;
  status: "Draft" | "Submitted" | "Approved" | "Invoiced";
}

const entries: TimeEntry[] = [
  { id: "TE-50841", date: "Apr 19", timekeeper: "J. Ashford (Partner)", matter: "MTR-24-0118", description: "Board approval memo drafting", hours: 3.2, rate: 950, status: "Approved" },
  { id: "TE-50842", date: "Apr 19", timekeeper: "A. Park (Senior Assoc)", matter: "MTR-24-0118", description: "Due diligence schedule review", hours: 6.8, rate: 620, status: "Submitted" },
  { id: "TE-50843", date: "Apr 19", timekeeper: "M. Cordero (Partner)", matter: "MTR-24-0120", description: "Deposition prep", hours: 4.5, rate: 920, status: "Approved" },
  { id: "TE-50844", date: "Apr 19", timekeeper: "R. Solomon (Partner)", matter: "MTR-24-0119", description: "SOX control narrative", hours: 2.4, rate: 880, status: "Approved" },
  { id: "TE-50845", date: "Apr 18", timekeeper: "P. Iyer (Partner)", matter: "MTR-24-0121", description: "Audit closing meeting", hours: 1.8, rate: 910, status: "Invoiced" },
  { id: "TE-50846", date: "Apr 18", timekeeper: "E. Quintana (Assoc)", matter: "MTR-24-0120", description: "Witness interview notes", hours: 5.0, rate: 420, status: "Submitted" },
  { id: "TE-50847", date: "Apr 18", timekeeper: "T. Okafor (Senior Assoc)", matter: "MTR-24-0122", description: "Fintech regulatory memo", hours: 4.2, rate: 640, status: "Draft" },
  { id: "TE-50848", date: "Apr 18", timekeeper: "J. Ashford (Partner)", matter: "MTR-24-0124", description: "Term sheet negotiation", hours: 2.8, rate: 950, status: "Approved" },
  { id: "TE-50849", date: "Apr 17", timekeeper: "N. Singh (Paralegal)", matter: "MTR-24-0120", description: "Exhibit indexing", hours: 6.5, rate: 240, status: "Invoiced" },
  { id: "TE-50850", date: "Apr 17", timekeeper: "M. Cordero (Partner)", matter: "MTR-24-0126", description: "Settlement strategy call", hours: 1.5, rate: 920, status: "Approved" },
  { id: "TE-50851", date: "Apr 17", timekeeper: "P. Iyer (Partner)", matter: "MTR-24-0125", description: "Strategic advisory workshop", hours: 3.0, rate: 910, status: "Submitted" },
  { id: "TE-50852", date: "Apr 17", timekeeper: "A. Park (Senior Assoc)", matter: "MTR-24-0127", description: "Mobility sector research", hours: 4.8, rate: 620, status: "Draft" },
  { id: "TE-50853", date: "Apr 16", timekeeper: "R. Solomon (Partner)", matter: "MTR-24-0119", description: "Audit committee briefing", hours: 2.0, rate: 880, status: "Invoiced" },
  { id: "TE-50854", date: "Apr 16", timekeeper: "E. Quintana (Assoc)", matter: "MTR-24-0118", description: "M&A data room setup", hours: 7.2, rate: 420, status: "Approved" },
];

const statusColors: Record<TimeEntry["status"], string> = {
  Draft: "bg-orange-500/15 text-orange",
  Submitted: "bg-accent/15 text-accent",
  Approved: "bg-green-500/15 text-green",
  Invoiced: "bg-cyan-500/15 text-cyan",
};

export default function ProfessionalServicesTimePage() {
  const totalHoursNum = entries.reduce((a, e) => a + e.hours, 0);
  const totalHours = totalHoursNum.toFixed(1);
  const totalBillable = entries.reduce((a, e) => a + e.hours * e.rate, 0);
  const avgRate = Math.round(totalBillable / totalHoursNum);

  return (
    <ModuleShell
      icon={Clock}
      hub="Professional Services Hub"
      title="Time Tracking"
      description="Timekeeper entries by matter with billable amounts, approval workflow, and invoice readiness tracking."
      primaryAction={{ label: "Log Time" }}
      searchPlaceholder="Search entries by timekeeper or matter..."
      stats={[
        { label: "Entries", value: entries.length },
        { label: "Hours Logged", value: totalHours },
        { label: "Billable $", value: `$${totalBillable.toLocaleString()}` },
        { label: "Avg Rate", value: `$${avgRate}/hr` },
      ]}
    >
      <ModuleTable
        columns={["Entry", "Date", "Timekeeper", "Matter", "Description", "Hours", "Rate", "Status"]}
        rows={entries.map((e) => [
          <span key="id" className="font-mono text-[10px] text-text-dim">{e.id}</span>,
          <span key="d" className="font-semibold text-text">{e.date}</span>,
          <span key="tk" className="text-text">{e.timekeeper}</span>,
          <span key="mt" className="font-mono text-[10px] text-text-dim">{e.matter}</span>,
          <span key="de" className="text-text-dim">{e.description}</span>,
          <span key="h" className="font-semibold text-text">{e.hours.toFixed(1)}</span>,
          <span key="r" className="text-text-dim">${e.rate}</span>,
          <span key="st" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[e.status]}`}>
            {e.status}
          </span>,
        ])}
      />
    </ModuleShell>
  );
}
