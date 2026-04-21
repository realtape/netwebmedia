"use client";

import { Stethoscope } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Provider {
  id: string;
  name: string;
  specialty: string;
  npi: string;
  weeklyAppts: number;
  rating: number;
  patients: number;
  status: "Accepting" | "Waitlist" | "Closed";
}

const providers: Provider[] = [
  { id: "PRV-001", name: "Dr. Wei Lin", specialty: "Internal Medicine", npi: "1902384756", weeklyAppts: 38, rating: 4.9, patients: 842, status: "Accepting" },
  { id: "PRV-002", name: "Dr. Anjali Patel", specialty: "Family Medicine", npi: "1774293801", weeklyAppts: 44, rating: 4.8, patients: 1018, status: "Waitlist" },
  { id: "PRV-003", name: "Dr. Kwame Osei", specialty: "Cardiology", npi: "1658472091", weeklyAppts: 26, rating: 4.9, patients: 562, status: "Accepting" },
  { id: "PRV-004", name: "Dr. Camila Reyes", specialty: "Endocrinology", npi: "1548392017", weeklyAppts: 31, rating: 4.7, patients: 694, status: "Accepting" },
  { id: "PRV-005", name: "Dr. Henrik Larsen", specialty: "Orthopedics", npi: "1439285110", weeklyAppts: 29, rating: 4.6, patients: 508, status: "Accepting" },
  { id: "PRV-006", name: "Dr. Leah Abramson", specialty: "Dermatology", npi: "1328471902", weeklyAppts: 47, rating: 4.9, patients: 1183, status: "Waitlist" },
  { id: "PRV-007", name: "Dr. Marcus Boateng", specialty: "Pediatrics", npi: "1219384065", weeklyAppts: 52, rating: 4.9, patients: 1402, status: "Closed" },
  { id: "PRV-008", name: "Dr. Rina Shah", specialty: "OB-GYN", npi: "1109283746", weeklyAppts: 36, rating: 4.8, patients: 786, status: "Accepting" },
  { id: "PRV-009", name: "Dr. Benjamin Okafor", specialty: "Psychiatry", npi: "1000192837", weeklyAppts: 22, rating: 4.7, patients: 312, status: "Waitlist" },
  { id: "PRV-010", name: "Dr. Sunita Rao", specialty: "Neurology", npi: "1891827465", weeklyAppts: 19, rating: 4.8, patients: 274, status: "Accepting" },
];

const statusColors: Record<Provider["status"], string> = {
  Accepting: "bg-green-500/15 text-green",
  Waitlist: "bg-orange-500/15 text-orange",
  Closed: "bg-red-500/15 text-red",
};

export default function HealthcareProvidersPage() {
  const avgRating = (providers.reduce((a, p) => a + p.rating, 0) / providers.length).toFixed(2);
  const totalAppts = providers.reduce((a, p) => a + p.weeklyAppts, 0);
  const totalPatients = providers.reduce((a, p) => a + p.patients, 0);

  return (
    <ModuleShell
      icon={Stethoscope}
      hub="Healthcare Hub"
      title="Providers"
      description="Credentialed clinicians with NPI, weekly volume, patient panel size, and satisfaction ratings."
      primaryAction={{ label: "Add Provider" }}
      searchPlaceholder="Search providers by name or specialty..."
      stats={[
        { label: "Providers", value: providers.length },
        { label: "Avg Rating", value: avgRating },
        { label: "Weekly Appts", value: totalAppts },
        { label: "Patient Panel", value: totalPatients.toLocaleString() },
      ]}
    >
      <ModuleTable
        columns={["ID", "Name", "Specialty", "NPI", "Appts/Wk", "Panel", "Rating", "Status"]}
        rows={providers.map((p) => [
          <span key="id" className="font-mono text-[10px] text-text-dim">{p.id}</span>,
          <span key="n" className="font-semibold text-text">{p.name}</span>,
          <span key="sp" className="text-text-dim">{p.specialty}</span>,
          <span key="np" className="font-mono text-[10px] text-text-dim">{p.npi}</span>,
          <span key="w" className="font-semibold text-text">{p.weeklyAppts}</span>,
          <span key="pa" className="text-text-dim">{p.patients.toLocaleString()}</span>,
          <span key="r" className="font-bold text-green">{p.rating.toFixed(1)}</span>,
          <span key="st" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[p.status]}`}>
            {p.status}
          </span>,
        ])}
      />
    </ModuleShell>
  );
}
