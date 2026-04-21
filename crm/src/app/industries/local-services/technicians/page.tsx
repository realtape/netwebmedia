"use client";

import { HardHat } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Technician {
  name: string;
  crew: string;
  jobsToday: number;
  rating: number;
  skills: string[];
  onCall: boolean;
}

const techs: Technician[] = [
  { name: "Darnell Price", crew: "Alpha", jobsToday: 5, rating: 4.9, skills: ["HVAC", "Refrigeration"], onCall: true },
  { name: "Sasha Pereira", crew: "Alpha", jobsToday: 4, rating: 4.8, skills: ["Plumbing", "Gas"], onCall: false },
  { name: "Luis Fontanez", crew: "Bravo", jobsToday: 6, rating: 4.7, skills: ["Drain", "Sewer"], onCall: true },
  { name: "Marcus Clay", crew: "Bravo", jobsToday: 3, rating: 4.6, skills: ["Electrical", "Panel"], onCall: false },
  { name: "Rosa Alvarado", crew: "Charlie", jobsToday: 4, rating: 4.9, skills: ["HVAC", "Ducts"], onCall: true },
  { name: "Travis McKenna", crew: "Charlie", jobsToday: 2, rating: 4.5, skills: ["Appliance", "Install"], onCall: false },
  { name: "Fatima Okonkwo", crew: "Delta", jobsToday: 5, rating: 4.8, skills: ["Plumbing", "Leak"], onCall: true },
  { name: "Jasper Liu", crew: "Delta", jobsToday: 3, rating: 4.7, skills: ["HVAC", "Thermostat"], onCall: false },
  { name: "Anya Petrova", crew: "Echo", jobsToday: 4, rating: 4.9, skills: ["Electrical", "Solar"], onCall: true },
  { name: "Cole Jameson", crew: "Echo", jobsToday: 3, rating: 4.4, skills: ["Gas", "Water Heater"], onCall: false },
  { name: "Mei Xiang", crew: "Foxtrot", jobsToday: 5, rating: 4.8, skills: ["HVAC", "Install"], onCall: true },
  { name: "Roland Decker", crew: "Foxtrot", jobsToday: 2, rating: 4.3, skills: ["Drain", "Rooter"], onCall: false },
];

export default function TechniciansPage() {
  const totalJobs = techs.reduce((a, t) => a + t.jobsToday, 0);
  const avgRating = (techs.reduce((a, t) => a + t.rating, 0) / techs.length).toFixed(2);
  const onCall = techs.filter((t) => t.onCall).length;

  return (
    <ModuleShell
      icon={HardHat}
      hub="Local Services Hub"
      title="Technicians"
      description="Crew roster with capacity, ratings, certifications, and on-call rotation."
      primaryAction={{ label: "Add Tech" }}
      searchPlaceholder="Search technicians by name, crew, or skill..."
      stats={[
        { label: "Active Techs", value: techs.length },
        { label: "Jobs Today", value: totalJobs },
        { label: "Avg Rating", value: avgRating },
        { label: "On Call", value: onCall },
      ]}
    >
      <ModuleTable
        columns={["Technician", "Crew", "Jobs Today", "Rating", "Skills", "On Call"]}
        rows={techs.map((t) => [
          <span key="n" className="font-semibold text-text">{t.name}</span>,
          <span key="c" className="text-text-dim">{t.crew}</span>,
          <span key="j" className="font-semibold text-text">{t.jobsToday}</span>,
          <span key="r" className="font-bold text-green">{t.rating.toFixed(1)}</span>,
          <div key="s" className="flex flex-wrap gap-1">
            {t.skills.map((sk) => (
              <span key={sk} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-accent/15 text-accent">{sk}</span>
            ))}
          </div>,
          <span key="o" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${t.onCall ? "bg-green/15 text-green" : "bg-orange/15 text-orange"}`}>
            {t.onCall ? "On Call" : "Off"}
          </span>,
        ])}
      />
    </ModuleShell>
  );
}
