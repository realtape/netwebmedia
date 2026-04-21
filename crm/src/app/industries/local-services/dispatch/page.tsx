"use client";

import { Radio } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

type Priority = "P1" | "P2" | "P3";

const priorityColors: Record<Priority, string> = {
  P1: "bg-red/15 text-red",
  P2: "bg-orange/15 text-orange",
  P3: "bg-cyan/15 text-cyan",
};

interface DispatchEntry {
  slot: string;
  tech: string;
  job: string;
  customer: string;
  distance: number;
  priority: Priority;
}

const board: DispatchEntry[] = [
  { slot: "08:00 AM", tech: "Darnell Price", job: "HVAC Repair", customer: "Gomez", distance: 4.2, priority: "P2" },
  { slot: "08:30 AM", tech: "Sasha Pereira", job: "Water Heater", customer: "O'Hara", distance: 7.1, priority: "P1" },
  { slot: "09:00 AM", tech: "Luis Fontanez", job: "Drain Clear", customer: "Raman", distance: 2.5, priority: "P3" },
  { slot: "09:30 AM", tech: "Marcus Clay", job: "Panel Swap", customer: "Kowalski", distance: 9.8, priority: "P1" },
  { slot: "10:00 AM", tech: "Rosa Alvarado", job: "AC Tune-Up", customer: "Hill", distance: 3.3, priority: "P3" },
  { slot: "10:30 AM", tech: "Fatima Okonkwo", job: "Leak Repair", customer: "Tran", distance: 5.6, priority: "P2" },
  { slot: "11:00 AM", tech: "Travis McKenna", job: "Appliance Install", customer: "Jeffries", distance: 8.2, priority: "P3" },
  { slot: "11:30 AM", tech: "Jasper Liu", job: "Thermostat", customer: "Wheatley", distance: 1.9, priority: "P3" },
  { slot: "12:00 PM", tech: "Anya Petrova", job: "Panel Inspect", customer: "Nakamura", distance: 6.4, priority: "P2" },
  { slot: "12:30 PM", tech: "Cole Jameson", job: "Gas Line", customer: "Woolsey", distance: 11.3, priority: "P1" },
  { slot: "01:00 PM", tech: "Mei Xiang", job: "Furnace Install", customer: "Blomberg", distance: 4.8, priority: "P2" },
  { slot: "01:30 PM", tech: "Roland Decker", job: "Rooter Service", customer: "Castillo", distance: 7.7, priority: "P3" },
];

export default function DispatchPage() {
  const p1 = board.filter((b) => b.priority === "P1").length;
  const avgDistance = (board.reduce((a, b) => a + b.distance, 0) / board.length).toFixed(1);
  const uniqueTechs = new Set(board.map((b) => b.tech)).size;

  return (
    <ModuleShell
      icon={Radio}
      hub="Local Services Hub"
      title="Dispatch Board"
      description="Minute-by-minute dispatch view with tech routing, priority flags, and travel distances."
      primaryAction={{ label: "Add Slot" }}
      searchPlaceholder="Search dispatch by tech, customer, or slot..."
      stats={[
        { label: "Slots Today", value: board.length },
        { label: "P1 Priority", value: p1 },
        { label: "Techs Deployed", value: uniqueTechs },
        { label: "Avg Distance", value: `${avgDistance} mi` },
      ]}
    >
      <ModuleTable
        columns={["Time Slot", "Tech", "Job", "Customer", "Distance", "Priority"]}
        rows={board.map((b) => [
          <span key="s" className="font-semibold text-text">{b.slot}</span>,
          <span key="t" className="text-text">{b.tech}</span>,
          <span key="j" className="text-text-dim">{b.job}</span>,
          <span key="c" className="text-text-dim">{b.customer}</span>,
          <span key="d" className="font-semibold text-text">{b.distance.toFixed(1)} mi</span>,
          <span key="p" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${priorityColors[b.priority]}`}>{b.priority}</span>,
        ])}
      />
    </ModuleShell>
  );
}
