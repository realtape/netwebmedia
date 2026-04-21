"use client";

import { BookOpen } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Reservation {
  id: string;
  date: string;
  time: string;
  party: number;
  table: string;
  guest: string;
  notes: string;
  status: "Confirmed" | "Seated" | "Completed" | "No Show" | "Cancelled";
}

const reservations: Reservation[] = [
  { id: "RES-8821", date: "Apr 20", time: "6:00 PM", party: 2, table: "T-12", guest: "Ana & Diego Herrera", notes: "Anniversary", status: "Confirmed" },
  { id: "RES-8822", date: "Apr 20", time: "6:30 PM", party: 4, table: "T-08", guest: "Mitchell Party", notes: "Birthday cake ordered", status: "Seated" },
  { id: "RES-8823", date: "Apr 20", time: "7:00 PM", party: 6, table: "T-21", guest: "Kaplan Wedding Rehearsal", notes: "Private menu", status: "Confirmed" },
  { id: "RES-8824", date: "Apr 20", time: "7:15 PM", party: 2, table: "T-05", guest: "Soren Lindqvist", notes: "GF pasta", status: "Seated" },
  { id: "RES-8825", date: "Apr 20", time: "7:30 PM", party: 3, table: "T-14", guest: "Yamato Family", notes: "", status: "Confirmed" },
  { id: "RES-8826", date: "Apr 20", time: "8:00 PM", party: 8, table: "T-22", guest: "Oakland Tech Offsite", notes: "Chef's tasting", status: "Confirmed" },
  { id: "RES-8827", date: "Apr 20", time: "8:30 PM", party: 2, table: "T-03", guest: "Whitney Porter", notes: "Window seat", status: "Completed" },
  { id: "RES-8828", date: "Apr 20", time: "8:45 PM", party: 4, table: "T-11", guest: "Kasra Ahmadi +3", notes: "", status: "No Show" },
  { id: "RES-8829", date: "Apr 21", time: "12:30 PM", party: 2, table: "T-06", guest: "Maggie O'Shea", notes: "Lunch meeting", status: "Confirmed" },
  { id: "RES-8830", date: "Apr 21", time: "1:00 PM", party: 5, table: "T-17", guest: "Nguyen Family", notes: "Highchair", status: "Confirmed" },
  { id: "RES-8831", date: "Apr 21", time: "6:30 PM", party: 2, table: "T-04", guest: "Henrik Bauer", notes: "Quiet corner", status: "Cancelled" },
  { id: "RES-8832", date: "Apr 21", time: "8:00 PM", party: 10, table: "Private Room", guest: "Veridian Ventures", notes: "Wine pairing", status: "Confirmed" },
];

const statusColors: Record<Reservation["status"], string> = {
  Confirmed: "bg-accent/15 text-accent",
  Seated: "bg-green-500/15 text-green",
  Completed: "bg-cyan-500/15 text-cyan",
  "No Show": "bg-red-500/15 text-red",
  Cancelled: "bg-orange-500/15 text-orange",
};

export default function HospitalityReservationsPage() {
  const totalCovers = reservations.filter((r) => r.status !== "Cancelled" && r.status !== "No Show").reduce((a, r) => a + r.party, 0);
  const confirmed = reservations.filter((r) => r.status === "Confirmed").length;

  return (
    <ModuleShell
      icon={BookOpen}
      hub="Hospitality Hub"
      title="Reservations"
      description="Front-of-house booking ledger with party size, table assignments, and guest notes for service planning."
      primaryAction={{ label: "New Reservation" }}
      searchPlaceholder="Search by guest name or reservation ID..."
      stats={[
        { label: "Reservations", value: reservations.length },
        { label: "Covers Booked", value: totalCovers },
        { label: "Confirmed", value: confirmed },
        { label: "No Shows", value: reservations.filter((r) => r.status === "No Show").length },
      ]}
    >
      <ModuleTable
        columns={["ID", "Date", "Time", "Party", "Table", "Guest", "Notes", "Status"]}
        rows={reservations.map((r) => [
          <span key="id" className="font-mono text-[10px] text-text-dim">{r.id}</span>,
          <span key="d" className="font-semibold text-text">{r.date}</span>,
          <span key="t" className="text-text-dim">{r.time}</span>,
          <span key="p" className="font-semibold text-text">{r.party}</span>,
          <span key="tb" className="text-text">{r.table}</span>,
          <span key="g" className="text-text">{r.guest}</span>,
          <span key="n" className="text-text-dim text-[11px]">{r.notes || "—"}</span>,
          <span key="st" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[r.status]}`}>
            {r.status}
          </span>,
        ])}
      />
    </ModuleShell>
  );
}
