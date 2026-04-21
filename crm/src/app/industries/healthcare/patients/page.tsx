"use client";

import { Heart } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Patient {
  id: string;
  name: string;
  dob: string;
  age: number;
  insurance: string;
  provider: string;
  lastVisit: string;
  status: "Active" | "Inactive" | "New";
}

const patients: Patient[] = [
  { id: "MRN-10482", name: "Jennifer Castillo", dob: "1984-03-12", age: 42, insurance: "Blue Cross PPO", provider: "Dr. Lin", lastVisit: "2026-03-28", status: "Active" },
  { id: "MRN-10483", name: "Robert O'Brien", dob: "1959-11-04", age: 66, insurance: "Medicare A+B", provider: "Dr. Patel", lastVisit: "2026-04-02", status: "Active" },
  { id: "MRN-10484", name: "Yuki Tanaka", dob: "1991-07-19", age: 34, insurance: "Aetna HMO", provider: "Dr. Lin", lastVisit: "2026-04-15", status: "Active" },
  { id: "MRN-10485", name: "Marcus DeLeon", dob: "1978-01-27", age: 48, insurance: "UnitedHealth", provider: "Dr. Osei", lastVisit: "2026-02-11", status: "Active" },
  { id: "MRN-10486", name: "Amelia Rhodes", dob: "2001-09-08", age: 24, insurance: "Cigna Open Access", provider: "Dr. Patel", lastVisit: "2026-04-18", status: "New" },
  { id: "MRN-10487", name: "Thomas Whitfield", dob: "1951-05-22", age: 74, insurance: "Medicare Advantage", provider: "Dr. Osei", lastVisit: "2026-04-10", status: "Active" },
  { id: "MRN-10488", name: "Priya Venkataraman", dob: "1988-12-14", age: 37, insurance: "Kaiser Permanente", provider: "Dr. Lin", lastVisit: "2025-11-03", status: "Inactive" },
  { id: "MRN-10489", name: "Chris Bellamy", dob: "1995-06-30", age: 30, insurance: "Humana PPO", provider: "Dr. Reyes", lastVisit: "2026-04-08", status: "Active" },
  { id: "MRN-10490", name: "Sofia Moreno", dob: "1972-10-17", age: 53, insurance: "Blue Shield", provider: "Dr. Reyes", lastVisit: "2026-03-20", status: "Active" },
  { id: "MRN-10491", name: "Gerald Washington", dob: "1944-02-09", age: 82, insurance: "Medicare A+B", provider: "Dr. Osei", lastVisit: "2026-04-17", status: "Active" },
  { id: "MRN-10492", name: "Natalie Björk", dob: "1998-08-25", age: 27, insurance: "Self-Pay", provider: "Dr. Patel", lastVisit: "2026-04-19", status: "New" },
  { id: "MRN-10493", name: "Daniel Hoang", dob: "1965-04-03", age: 61, insurance: "Tricare", provider: "Dr. Reyes", lastVisit: "2025-09-15", status: "Inactive" },
];

const statusColors: Record<Patient["status"], string> = {
  Active: "bg-green-500/15 text-green",
  New: "bg-accent/15 text-accent",
  Inactive: "bg-orange-500/15 text-orange",
};

export default function HealthcarePatientsPage() {
  const active = patients.filter((p) => p.status === "Active").length;
  const avgAge = Math.round(patients.reduce((a, p) => a + p.age, 0) / patients.length);

  return (
    <ModuleShell
      icon={Heart}
      hub="Healthcare Hub"
      title="Patients"
      description="HIPAA-compliant patient directory with demographics, insurance, primary provider, and last visit history."
      primaryAction={{ label: "Add Patient" }}
      searchPlaceholder="Search patients by name or MRN..."
      stats={[
        { label: "Total Patients", value: patients.length },
        { label: "Active", value: active },
        { label: "New This Month", value: patients.filter((p) => p.status === "New").length },
        { label: "Avg Age", value: avgAge },
      ]}
    >
      <ModuleTable
        columns={["MRN", "Name", "DOB / Age", "Insurance", "Provider", "Last Visit", "Status"]}
        rows={patients.map((p) => [
          <span key="id" className="font-mono text-[10px] text-text-dim">{p.id}</span>,
          <span key="n" className="font-semibold text-text">{p.name}</span>,
          <div key="d">
            <div className="text-text">{p.dob}</div>
            <div className="text-[10px] text-text-dim">{p.age} yrs</div>
          </div>,
          <span key="i" className="text-text-dim">{p.insurance}</span>,
          <span key="pr" className="text-text">{p.provider}</span>,
          <span key="lv" className="text-text-dim">{p.lastVisit}</span>,
          <span key="st" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[p.status]}`}>
            {p.status}
          </span>,
        ])}
      />
    </ModuleShell>
  );
}
