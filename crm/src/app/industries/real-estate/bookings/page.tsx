"use client";

import { CalendarCheck } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Showing {
  id: string;
  date: string;
  time: string;
  property: string;
  buyer: string;
  agent: string;
  type: "In-Person" | "Virtual" | "Open House";
  status: "Confirmed" | "Pending" | "Completed" | "Cancelled";
}

const showings: Showing[] = [
  { id: "SHW-9041", date: "Apr 21", time: "10:00 AM", property: "1482 Coral Ridge Dr", buyer: "Jordan & Alicia Perez", agent: "Elena Ruiz", type: "In-Person", status: "Confirmed" },
  { id: "SHW-9042", date: "Apr 21", time: "1:30 PM", property: "618 Brookline Ave", buyer: "Raj Mehta", agent: "Sarah Nakamura", type: "Virtual", status: "Confirmed" },
  { id: "SHW-9043", date: "Apr 21", time: "3:00 PM", property: "312 Maplewood Ln", buyer: "Emily Hoffman", agent: "David Chen", type: "In-Person", status: "Completed" },
  { id: "SHW-9044", date: "Apr 22", time: "9:00 AM", property: "88 Camelback Rd", buyer: "The Nguyen Family", agent: "David Chen", type: "In-Person", status: "Pending" },
  { id: "SHW-9045", date: "Apr 22", time: "11:30 AM", property: "14 Aspen Grove", buyer: "Marcus & Tina Adler", agent: "Elena Ruiz", type: "In-Person", status: "Confirmed" },
  { id: "SHW-9046", date: "Apr 22", time: "2:00 PM", property: "450 Buckhead Ridge", buyer: "Chloe Beaumont", agent: "Tasha Williams", type: "Virtual", status: "Confirmed" },
  { id: "SHW-9047", date: "Apr 23", time: "10:30 AM", property: "1201 Lakeshore Dr", buyer: "Dr. Kevin Park", agent: "Sarah Nakamura", type: "In-Person", status: "Confirmed" },
  { id: "SHW-9048", date: "Apr 23", time: "4:00 PM", property: "9 Pacific Dunes Ct", buyer: "Open House", agent: "Elena Ruiz", type: "Open House", status: "Confirmed" },
  { id: "SHW-9049", date: "Apr 24", time: "11:00 AM", property: "27 Laurel Canyon Way", buyer: "Omar Hassan", agent: "Marcus Patel", type: "In-Person", status: "Cancelled" },
  { id: "SHW-9050", date: "Apr 24", time: "2:30 PM", property: "525 Mercer St", buyer: "Priya & Sam Desai", agent: "Tasha Williams", type: "In-Person", status: "Confirmed" },
  { id: "SHW-9051", date: "Apr 25", time: "9:30 AM", property: "309 Kiawah Island Pkwy", buyer: "The Callahans", agent: "Marcus Patel", type: "In-Person", status: "Pending" },
  { id: "SHW-9052", date: "Apr 25", time: "3:00 PM", property: "77 Harbor Point", buyer: "Isabella Romano", agent: "Marcus Patel", type: "Virtual", status: "Confirmed" },
];

const statusColors: Record<Showing["status"], string> = {
  Confirmed: "bg-green-500/15 text-green",
  Pending: "bg-orange-500/15 text-orange",
  Completed: "bg-accent/15 text-accent",
  Cancelled: "bg-red-500/15 text-red",
};

export default function RealEstateBookingsPage() {
  const confirmed = showings.filter((s) => s.status === "Confirmed").length;
  const virtual = showings.filter((s) => s.type === "Virtual").length;

  return (
    <ModuleShell
      icon={CalendarCheck}
      hub="Real Estate Hub"
      title="Showing Bookings"
      description="Buyer and agent showing calendar with confirmations, virtual tours, and open house scheduling."
      primaryAction={{ label: "Book Showing" }}
      searchPlaceholder="Search by property, buyer, or agent..."
      stats={[
        { label: "Total Bookings", value: showings.length },
        { label: "Confirmed", value: confirmed },
        { label: "Virtual Tours", value: virtual },
        { label: "Completed", value: showings.filter((s) => s.status === "Completed").length },
      ]}
    >
      <ModuleTable
        columns={["ID", "Date", "Time", "Property", "Buyer", "Agent", "Type", "Status"]}
        rows={showings.map((s) => [
          <span key="id" className="font-mono text-[10px] text-text-dim">{s.id}</span>,
          <span key="d" className="font-semibold text-text">{s.date}</span>,
          <span key="t" className="text-text-dim">{s.time}</span>,
          <span key="p" className="text-text">{s.property}</span>,
          <span key="b" className="text-text">{s.buyer}</span>,
          <span key="a" className="text-text-dim">{s.agent}</span>,
          <span key="ty" className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">{s.type}</span>,
          <span key="st" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[s.status]}`}>
            {s.status}
          </span>,
        ])}
      />
    </ModuleShell>
  );
}
