"use client";

import { ClipboardList } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

type CertStatus = "Issued" | "Eligible" | "In Progress" | "Not Started";

const certColors: Record<CertStatus, string> = {
  Issued: "bg-green/15 text-green",
  Eligible: "bg-accent/15 text-accent",
  "In Progress": "bg-cyan/15 text-cyan",
  "Not Started": "bg-text-dim/15 text-text-dim",
};

interface Enrollment {
  student: string;
  course: string;
  enrolled: string;
  progress: number;
  cert: CertStatus;
}

const enrollments: Enrollment[] = [
  { student: "Noor Alavi", course: "AEO Foundations for Marketers", enrolled: "2026-02-14", progress: 68, cert: "In Progress" },
  { student: "Bastian Frei", course: "Advanced Prompt Engineering", enrolled: "2026-01-07", progress: 100, cert: "Issued" },
  { student: "Coralie Lemaitre", course: "Agentic Workflow Design", enrolled: "2026-03-02", progress: 41, cert: "In Progress" },
  { student: "Dominic Kozlowski", course: "RAG for Enterprise", enrolled: "2026-02-28", progress: 78, cert: "Eligible" },
  { student: "Estelita Moreno", course: "Multimodal SEO Playbook", enrolled: "2026-01-24", progress: 55, cert: "In Progress" },
  { student: "Frederick Oyeyemi", course: "LLM Evaluation & Safety", enrolled: "2026-04-01", progress: 33, cert: "In Progress" },
  { student: "Gretchen Haverford", course: "Advanced Prompt Engineering", enrolled: "2026-02-10", progress: 88, cert: "Eligible" },
  { student: "Harish Venkatraman", course: "Fine-Tuning Open Weights", enrolled: "2026-01-18", progress: 72, cert: "In Progress" },
  { student: "Ingrid Sorenson", course: "Small Language Model Deploys", enrolled: "2026-03-11", progress: 100, cert: "Issued" },
  { student: "Julio Esparza", course: "AEO Foundations for Marketers", enrolled: "2026-03-22", progress: 49, cert: "In Progress" },
  { student: "Katrina Mwangi", course: "Agentic Workflow Design", enrolled: "2026-02-19", progress: 81, cert: "Eligible" },
  { student: "Leopold Vinter", course: "Multimodal SEO Playbook", enrolled: "2026-04-03", progress: 0, cert: "Not Started" },
  { student: "Katrina Mwangi", course: "RAG for Enterprise", enrolled: "2026-03-08", progress: 64, cert: "In Progress" },
  { student: "Ingrid Sorenson", course: "LLM Evaluation & Safety", enrolled: "2026-02-02", progress: 100, cert: "Issued" },
];

function progressColor(p: number) {
  if (p >= 80) return "text-green";
  if (p >= 50) return "text-cyan";
  if (p > 0) return "text-orange";
  return "text-text-dim";
}

export default function EnrollmentsPage() {
  const issued = enrollments.filter((e) => e.cert === "Issued").length;
  const avgProgress = Math.round(enrollments.reduce((a, e) => a + e.progress, 0) / enrollments.length);
  const inProgress = enrollments.filter((e) => e.cert === "In Progress").length;

  return (
    <ModuleShell
      icon={ClipboardList}
      hub="Education Hub"
      title="Enrollments"
      description="Student-to-course mappings with progress tracking and certificate issuance status."
      primaryAction={{ label: "Add Enrollment" }}
      searchPlaceholder="Search enrollments by student or course..."
      stats={[
        { label: "Enrollments", value: enrollments.length },
        { label: "Certificates Issued", value: issued },
        { label: "In Progress", value: inProgress },
        { label: "Avg Progress", value: `${avgProgress}%` },
      ]}
    >
      <ModuleTable
        columns={["Student", "Course", "Enrolled Date", "Progress", "Certificate"]}
        rows={enrollments.map((e) => [
          <span key="s" className="font-semibold text-text">{e.student}</span>,
          <span key="c" className="text-text-dim">{e.course}</span>,
          <span key="d" className="text-text-dim">{e.enrolled}</span>,
          <span key="p" className={`font-bold ${progressColor(e.progress)}`}>{e.progress}%</span>,
          <span key="ce" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${certColors[e.cert]}`}>{e.cert}</span>,
        ])}
      />
    </ModuleShell>
  );
}
