"use client";

import { BookOpen } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

type CourseStatus = "Live" | "Draft" | "Archived";

const statusColors: Record<CourseStatus, string> = {
  Live: "bg-green/15 text-green",
  Draft: "bg-orange/15 text-orange",
  Archived: "bg-text-dim/15 text-text-dim",
};

interface Course {
  title: string;
  instructor: string;
  enrolled: number;
  price: number;
  rating: number;
  status: CourseStatus;
}

const courses: Course[] = [
  { title: "AEO Foundations for Marketers", instructor: "Dalia Quinonez", enrolled: 412, price: 299, rating: 4.8, status: "Live" },
  { title: "Advanced Prompt Engineering", instructor: "Tomas Brenner", enrolled: 896, price: 399, rating: 4.9, status: "Live" },
  { title: "Agentic Workflow Design", instructor: "Saoirse Walsh", enrolled: 248, price: 499, rating: 4.7, status: "Live" },
  { title: "Multimodal SEO Playbook", instructor: "Kenji Ibaraki", enrolled: 631, price: 249, rating: 4.6, status: "Live" },
  { title: "RAG for Enterprise", instructor: "Priti Bhattacharya", enrolled: 187, price: 599, rating: 4.8, status: "Live" },
  { title: "Voice AI in Customer Service", instructor: "Gilberto Rossi", enrolled: 0, price: 349, rating: 0, status: "Draft" },
  { title: "LLM Evaluation & Safety", instructor: "Hilde Johansson", enrolled: 324, price: 449, rating: 4.7, status: "Live" },
  { title: "Fine-Tuning Open Weights", instructor: "Rashida Okafor", enrolled: 142, price: 549, rating: 4.5, status: "Live" },
  { title: "Computer Use for Marketers", instructor: "Jarek Dabrowski", enrolled: 0, price: 299, rating: 0, status: "Draft" },
  { title: "Classic SEO Masterclass", instructor: "Patricia Holbrook", enrolled: 1240, price: 199, rating: 4.4, status: "Archived" },
  { title: "Paid Social 2022 Edition", instructor: "Delvin Chatterjee", enrolled: 2104, price: 149, rating: 4.2, status: "Archived" },
  { title: "Small Language Model Deploys", instructor: "Yelena Protasova", enrolled: 87, price: 399, rating: 4.9, status: "Live" },
];

export default function CoursesPage() {
  const live = courses.filter((c) => c.status === "Live");
  const totalEnrolled = courses.reduce((a, c) => a + c.enrolled, 0);
  const avgRating = (live.reduce((a, c) => a + c.rating, 0) / live.length).toFixed(2);

  return (
    <ModuleShell
      icon={BookOpen}
      hub="Education Hub"
      title="Courses"
      description="Course catalog with enrollment counts, instructor assignments, pricing, and lifecycle status."
      primaryAction={{ label: "Add Course" }}
      searchPlaceholder="Search courses by title or instructor..."
      stats={[
        { label: "Total Courses", value: courses.length },
        { label: "Live", value: live.length },
        { label: "Total Enrolled", value: totalEnrolled.toLocaleString() },
        { label: "Avg Rating (Live)", value: avgRating },
      ]}
    >
      <ModuleTable
        columns={["Course", "Instructor", "Enrolled", "Price", "Rating", "Status"]}
        rows={courses.map((c) => [
          <span key="t" className="font-semibold text-text">{c.title}</span>,
          <span key="i" className="text-text-dim">{c.instructor}</span>,
          <span key="e" className="font-semibold text-text">{c.enrolled.toLocaleString()}</span>,
          <span key="p" className="font-semibold text-green">${c.price}</span>,
          <span key="r" className="font-bold text-cyan">{c.rating > 0 ? c.rating.toFixed(1) : "—"}</span>,
          <span key="s" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[c.status]}`}>{c.status}</span>,
        ])}
      />
    </ModuleShell>
  );
}
