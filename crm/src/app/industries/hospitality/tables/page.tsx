"use client";

import { LayoutGrid } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Table {
  id: string;
  section: string;
  capacity: number;
  status: "Available" | "Seated" | "Reserved" | "Turning" | "Out of Service";
  server: string;
  covers: number;
  seatedAt: string;
}

const tables: Table[] = [
  { id: "T-01", section: "Patio", capacity: 2, status: "Seated", server: "Marisol", covers: 2, seatedAt: "6:15 PM" },
  { id: "T-03", section: "Window", capacity: 2, status: "Available", server: "—", covers: 0, seatedAt: "—" },
  { id: "T-04", section: "Window", capacity: 2, status: "Reserved", server: "Dev", covers: 0, seatedAt: "6:30 PM" },
  { id: "T-05", section: "Main", capacity: 2, status: "Seated", server: "Marisol", covers: 2, seatedAt: "7:15 PM" },
  { id: "T-06", section: "Main", capacity: 2, status: "Available", server: "—", covers: 0, seatedAt: "—" },
  { id: "T-08", section: "Main", capacity: 4, status: "Seated", server: "Dev", covers: 4, seatedAt: "6:32 PM" },
  { id: "T-11", section: "Back", capacity: 4, status: "Turning", server: "Jonas", covers: 0, seatedAt: "—" },
  { id: "T-12", section: "Window", capacity: 2, status: "Reserved", server: "Marisol", covers: 0, seatedAt: "6:00 PM" },
  { id: "T-14", section: "Main", capacity: 4, status: "Reserved", server: "Jonas", covers: 0, seatedAt: "7:30 PM" },
  { id: "T-17", section: "Back", capacity: 6, status: "Available", server: "—", covers: 0, seatedAt: "—" },
  { id: "T-21", section: "Main", capacity: 6, status: "Reserved", server: "Dev", covers: 0, seatedAt: "7:00 PM" },
  { id: "T-22", section: "Back", capacity: 8, status: "Reserved", server: "Jonas", covers: 0, seatedAt: "8:00 PM" },
  { id: "T-24", section: "Patio", capacity: 4, status: "Out of Service", server: "—", covers: 0, seatedAt: "—" },
  { id: "T-PR1", section: "Private Room", capacity: 12, status: "Reserved", server: "Amira", covers: 0, seatedAt: "8:00 PM" },
];

const statusColors: Record<Table["status"], string> = {
  Available: "bg-green-500/15 text-green",
  Seated: "bg-accent/15 text-accent",
  Reserved: "bg-cyan-500/15 text-cyan",
  Turning: "bg-orange-500/15 text-orange",
  "Out of Service": "bg-red-500/15 text-red",
};

export default function HospitalityTablesPage() {
  const totalCapacity = tables.filter((t) => t.status !== "Out of Service").reduce((a, t) => a + t.capacity, 0);
  const seated = tables.filter((t) => t.status === "Seated").length;
  const currentCovers = tables.reduce((a, t) => a + t.covers, 0);

  return (
    <ModuleShell
      icon={LayoutGrid}
      hub="Hospitality Hub"
      title="Floor Map"
      description="Real-time table and room status across every section with server assignments and turn-time tracking."
      primaryAction={{ label: "Add Table" }}
      searchPlaceholder="Search by table or server..."
      stats={[
        { label: "Tables", value: tables.length },
        { label: "Max Capacity", value: totalCapacity },
        { label: "Seated Now", value: seated },
        { label: "Live Covers", value: currentCovers },
      ]}
    >
      <ModuleTable
        columns={["Table", "Section", "Capacity", "Status", "Server", "Covers", "Seated At"]}
        rows={tables.map((t) => [
          <span key="id" className="font-semibold text-text">{t.id}</span>,
          <span key="se" className="text-text-dim">{t.section}</span>,
          <span key="c" className="text-text-dim">{t.capacity}</span>,
          <span key="st" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[t.status]}`}>
            {t.status}
          </span>,
          <span key="sv" className="text-text">{t.server}</span>,
          <span key="co" className="font-semibold text-text">{t.covers}</span>,
          <span key="sa" className="text-text-dim">{t.seatedAt}</span>,
        ])}
      />
    </ModuleShell>
  );
}
