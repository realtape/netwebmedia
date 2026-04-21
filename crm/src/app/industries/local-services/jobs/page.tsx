"use client";

import { Wrench } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

type JobStatus = "Scheduled" | "En Route" | "On Site" | "Completed" | "Delayed";

const statusColors: Record<JobStatus, string> = {
  Scheduled: "bg-cyan/15 text-cyan",
  "En Route": "bg-accent/15 text-accent",
  "On Site": "bg-purple-500/15 text-purple-400",
  Completed: "bg-green/15 text-green",
  Delayed: "bg-orange/15 text-orange",
};

interface Job {
  id: string;
  customer: string;
  address: string;
  service: string;
  tech: string;
  status: JobStatus;
  scheduled: string;
}

const jobs: Job[] = [
  { id: "J-4821", customer: "Maria Gomez", address: "8842 Red Oak Ln, Austin TX", service: "HVAC Repair", tech: "Darnell Price", status: "En Route", scheduled: "08:30 AM" },
  { id: "J-4822", customer: "Kevin O'Hara", address: "212 Lakeview Dr, Round Rock TX", service: "Water Heater Swap", tech: "Sasha Pereira", status: "On Site", scheduled: "09:15 AM" },
  { id: "J-4823", customer: "Priya Raman", address: "554 Maple Ridge, Pflugerville TX", service: "Drain Clear", tech: "Luis Fontanez", status: "Scheduled", scheduled: "10:00 AM" },
  { id: "J-4824", customer: "Brandon Hill", address: "77 Cedar Creek, Cedar Park TX", service: "AC Tune-Up", tech: "Darnell Price", status: "Completed", scheduled: "07:45 AM" },
  { id: "J-4825", customer: "Teresa Kowalski", address: "1029 Sunrise Blvd, Austin TX", service: "Electrical Panel", tech: "Marcus Clay", status: "Delayed", scheduled: "10:45 AM" },
  { id: "J-4826", customer: "Evan Woolsey", address: "4411 Pinecrest Way, Leander TX", service: "Gas Line Check", tech: "Luis Fontanez", status: "Scheduled", scheduled: "11:30 AM" },
  { id: "J-4827", customer: "Sophia Nakamura", address: "67 Bluebonnet Rd, Austin TX", service: "Furnace Install", tech: "Sasha Pereira", status: "Scheduled", scheduled: "12:15 PM" },
  { id: "J-4828", customer: "Darius Wheatley", address: "901 Silver Fox, Buda TX", service: "Thermostat Swap", tech: "Marcus Clay", status: "Completed", scheduled: "08:00 AM" },
  { id: "J-4829", customer: "Isabelle Tran", address: "339 Highland Pass, Austin TX", service: "Leak Repair", tech: "Darnell Price", status: "On Site", scheduled: "09:45 AM" },
  { id: "J-4830", customer: "Carl Jeffries", address: "1288 Pecan Grove, Kyle TX", service: "Duct Cleaning", tech: "Rosa Alvarado", status: "Scheduled", scheduled: "01:00 PM" },
  { id: "J-4831", customer: "Hanna Blomberg", address: "5502 Willow Bend, Austin TX", service: "Sump Pump", tech: "Rosa Alvarado", status: "Scheduled", scheduled: "02:00 PM" },
  { id: "J-4832", customer: "Omar Castillo", address: "77 Elm Hollow, Manor TX", service: "AC Compressor", tech: "Marcus Clay", status: "Delayed", scheduled: "02:45 PM" },
];

export default function LocalServicesJobsPage() {
  const scheduled = jobs.filter((j) => j.status === "Scheduled").length;
  const inProgress = jobs.filter((j) => j.status === "En Route" || j.status === "On Site").length;
  const completed = jobs.filter((j) => j.status === "Completed").length;

  return (
    <ModuleShell
      icon={Wrench}
      hub="Local Services Hub"
      title="Service Jobs"
      description="Live job board with dispatch status, tech assignments, and customer service details."
      primaryAction={{ label: "Add Job" }}
      searchPlaceholder="Search jobs by customer, address, or tech..."
      stats={[
        { label: "Jobs Today", value: jobs.length },
        { label: "Scheduled", value: scheduled },
        { label: "In Progress", value: inProgress },
        { label: "Completed", value: completed },
      ]}
    >
      <ModuleTable
        columns={["Job #", "Customer", "Address", "Service", "Tech", "Status", "Scheduled"]}
        rows={jobs.map((j) => [
          <span key="id" className="font-semibold text-text">{j.id}</span>,
          <span key="c" className="text-text">{j.customer}</span>,
          <span key="a" className="text-text-dim">{j.address}</span>,
          <span key="s" className="text-text-dim">{j.service}</span>,
          <span key="t" className="text-text-dim">{j.tech}</span>,
          <span key="st" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[j.status]}`}>{j.status}</span>,
          <span key="sc" className="font-semibold text-text">{j.scheduled}</span>,
        ])}
      />
    </ModuleShell>
  );
}
