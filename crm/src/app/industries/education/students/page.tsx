"use client";

import { GraduationCap } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Student {
  id: string;
  name: string;
  enrolled: number;
  progress: number;
  completionRate: number;
  lastActive: string;
}

const students: Student[] = [
  { id: "STU-10342", name: "Noor Alavi", enrolled: 4, progress: 68, completionRate: 75, lastActive: "2h ago" },
  { id: "STU-10343", name: "Bastian Frei", enrolled: 2, progress: 92, completionRate: 100, lastActive: "35m ago" },
  { id: "STU-10344", name: "Coralie Lemaitre", enrolled: 6, progress: 41, completionRate: 50, lastActive: "1d ago" },
  { id: "STU-10345", name: "Dominic Kozlowski", enrolled: 3, progress: 78, completionRate: 67, lastActive: "4h ago" },
  { id: "STU-10346", name: "Estelita Moreno", enrolled: 5, progress: 55, completionRate: 60, lastActive: "3d ago" },
  { id: "STU-10347", name: "Frederick Oyeyemi", enrolled: 1, progress: 33, completionRate: 0, lastActive: "6h ago" },
  { id: "STU-10348", name: "Gretchen Haverford", enrolled: 4, progress: 88, completionRate: 75, lastActive: "1h ago" },
  { id: "STU-10349", name: "Harish Venkatraman", enrolled: 7, progress: 72, completionRate: 71, lastActive: "2d ago" },
  { id: "STU-10350", name: "Ingrid Sorenson", enrolled: 2, progress: 95, completionRate: 100, lastActive: "12m ago" },
  { id: "STU-10351", name: "Julio Esparza", enrolled: 3, progress: 49, completionRate: 33, lastActive: "5d ago" },
  { id: "STU-10352", name: "Katrina Mwangi", enrolled: 5, progress: 81, completionRate: 80, lastActive: "20m ago" },
  { id: "STU-10353", name: "Leopold Vinter", enrolled: 2, progress: 60, completionRate: 50, lastActive: "8h ago" },
];

function progressColor(p: number) {
  if (p >= 80) return "text-green";
  if (p >= 50) return "text-cyan";
  return "text-orange";
}

export default function StudentsPage() {
  const avgProgress = Math.round(students.reduce((a, s) => a + s.progress, 0) / students.length);
  const avgCompletion = Math.round(students.reduce((a, s) => a + s.completionRate, 0) / students.length);
  const totalEnrollments = students.reduce((a, s) => a + s.enrolled, 0);

  return (
    <ModuleShell
      icon={GraduationCap}
      hub="Education Hub"
      title="Students"
      description="Learner profiles with enrollment, progress, completion, and engagement signals."
      primaryAction={{ label: "Add Student" }}
      searchPlaceholder="Search students by ID or name..."
      stats={[
        { label: "Active Students", value: students.length },
        { label: "Enrollments", value: totalEnrollments },
        { label: "Avg Progress", value: `${avgProgress}%` },
        { label: "Avg Completion", value: `${avgCompletion}%` },
      ]}
    >
      <ModuleTable
        columns={["ID", "Name", "Enrolled Courses", "Progress", "Completion Rate", "Last Active"]}
        rows={students.map((s) => [
          <span key="id" className="font-semibold text-text">{s.id}</span>,
          <span key="n" className="text-text">{s.name}</span>,
          <span key="e" className="font-semibold text-text">{s.enrolled}</span>,
          <span key="p" className={`font-bold ${progressColor(s.progress)}`}>{s.progress}%</span>,
          <span key="c" className={`font-bold ${progressColor(s.completionRate)}`}>{s.completionRate}%</span>,
          <span key="la" className="text-text-dim">{s.lastActive}</span>,
        ])}
      />
    </ModuleShell>
  );
}
