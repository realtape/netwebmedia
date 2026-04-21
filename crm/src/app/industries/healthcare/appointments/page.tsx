"use client";

import { Calendar } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Appointment {
  id: string;
  date: string;
  time: string;
  patient: string;
  provider: string;
  type: string;
  room: string;
  status: "Scheduled" | "Checked In" | "In Progress" | "Completed" | "No Show";
}

const appointments: Appointment[] = [
  { id: "APT-33021", date: "Apr 21", time: "8:30 AM", patient: "Jennifer Castillo", provider: "Dr. Lin", type: "Annual Physical", room: "Exam 2", status: "Scheduled" },
  { id: "APT-33022", date: "Apr 21", time: "9:15 AM", patient: "Robert O'Brien", provider: "Dr. Patel", type: "Follow-up", room: "Exam 4", status: "Checked In" },
  { id: "APT-33023", date: "Apr 21", time: "10:00 AM", patient: "Yuki Tanaka", provider: "Dr. Lin", type: "Lab Review", room: "Exam 1", status: "In Progress" },
  { id: "APT-33024", date: "Apr 21", time: "11:30 AM", patient: "Marcus DeLeon", provider: "Dr. Osei", type: "Cardiology Consult", room: "Exam 5", status: "Scheduled" },
  { id: "APT-33025", date: "Apr 21", time: "1:00 PM", patient: "Amelia Rhodes", provider: "Dr. Patel", type: "New Patient Intake", room: "Exam 3", status: "Scheduled" },
  { id: "APT-33026", date: "Apr 21", time: "2:15 PM", patient: "Thomas Whitfield", provider: "Dr. Osei", type: "Chronic Care", room: "Exam 5", status: "Scheduled" },
  { id: "APT-33027", date: "Apr 21", time: "3:30 PM", patient: "Chris Bellamy", provider: "Dr. Reyes", type: "Telehealth", room: "Virtual", status: "Completed" },
  { id: "APT-33028", date: "Apr 22", time: "8:45 AM", patient: "Sofia Moreno", provider: "Dr. Reyes", type: "Annual Physical", room: "Exam 2", status: "Scheduled" },
  { id: "APT-33029", date: "Apr 22", time: "10:30 AM", patient: "Gerald Washington", provider: "Dr. Osei", type: "Blood Pressure", room: "Exam 1", status: "Scheduled" },
  { id: "APT-33030", date: "Apr 22", time: "11:45 AM", patient: "Natalie Björk", provider: "Dr. Patel", type: "Vaccination", room: "Exam 4", status: "Scheduled" },
  { id: "APT-33031", date: "Apr 22", time: "2:00 PM", patient: "Priya Venkataraman", provider: "Dr. Lin", type: "Wellness Visit", room: "Exam 3", status: "No Show" },
  { id: "APT-33032", date: "Apr 22", time: "4:00 PM", patient: "Daniel Hoang", provider: "Dr. Reyes", type: "Consultation", room: "Exam 2", status: "Scheduled" },
];

const statusColors: Record<Appointment["status"], string> = {
  Scheduled: "bg-accent/15 text-accent",
  "Checked In": "bg-cyan-500/15 text-cyan",
  "In Progress": "bg-purple-500/15 text-purple-400",
  Completed: "bg-green-500/15 text-green",
  "No Show": "bg-red-500/15 text-red",
};

export default function HealthcareAppointmentsPage() {
  const today = appointments.filter((a) => a.date === "Apr 21").length;
  const completed = appointments.filter((a) => a.status === "Completed").length;
  const noShow = appointments.filter((a) => a.status === "No Show").length;

  return (
    <ModuleShell
      icon={Calendar}
      hub="Healthcare Hub"
      title="Appointments"
      description="Clinic schedule across providers and exam rooms with real-time check-in, telehealth, and no-show tracking."
      primaryAction={{ label: "Schedule Appointment" }}
      searchPlaceholder="Search by patient or provider..."
      stats={[
        { label: "Total Today", value: today },
        { label: "This Week", value: appointments.length },
        { label: "Completed", value: completed },
        { label: "No Shows", value: noShow },
      ]}
    >
      <ModuleTable
        columns={["ID", "Date", "Time", "Patient", "Provider", "Type", "Room", "Status"]}
        rows={appointments.map((a) => [
          <span key="id" className="font-mono text-[10px] text-text-dim">{a.id}</span>,
          <span key="d" className="font-semibold text-text">{a.date}</span>,
          <span key="t" className="text-text-dim">{a.time}</span>,
          <span key="p" className="text-text">{a.patient}</span>,
          <span key="pr" className="text-text">{a.provider}</span>,
          <span key="ty" className="text-text-dim">{a.type}</span>,
          <span key="r" className="text-text-dim">{a.room}</span>,
          <span key="st" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[a.status]}`}>
            {a.status}
          </span>,
        ])}
      />
    </ModuleShell>
  );
}
