"use client";

import { GraduationCap, Star as StarIcon } from "lucide-react";
import { ModuleShell, ModuleCards, ModuleCard } from "@/components/module-shell";
import { courses } from "@/lib/mock-data-extended";

export default function CoursesPage() {
  const published = courses.filter((c) => c.status === "published");
  const enrolled = courses.reduce((a, c) => a + c.enrolled, 0);
  const avgCompletion = Math.round(courses.reduce((a, c) => a + c.completion, 0) / courses.length);
  const avgRating = (courses.reduce((a, c) => a + c.rating, 0) / courses.length).toFixed(1);

  return (
    <ModuleShell
      icon={GraduationCap}
      hub="CMS & Sites"
      title="Courses (LMS)"
      description="Full LMS with video lessons, quizzes, certifications, drip content and AI-generated curriculum."
      aiFeature="AI Curriculum"
      primaryAction={{ label: "New Course" }}
      searchPlaceholder="Search courses..."
      stats={[
        { label: "Published", value: published.length },
        { label: "Total Enrolled", value: enrolled.toLocaleString() },
        { label: "Avg Completion", value: `${avgCompletion}%` },
        { label: "Avg Rating", value: avgRating },
      ]}
    >
      <ModuleCards>
        {courses.map((c) => (
          <ModuleCard
            key={c.id}
            title={c.title}
            subtitle={`Instructor: ${c.instructor}`}
            badge={c.status}
            badgeColor={c.status === "published" ? "green" : "orange"}
          >
            <div className="grid grid-cols-3 gap-2 mt-2 text-center">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Modules</div>
                <div className="text-sm font-extrabold text-text">{c.modules}</div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Enrolled</div>
                <div className="text-sm font-extrabold text-accent">{c.enrolled.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Completion</div>
                <div className="text-sm font-extrabold text-green">{c.completion}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="flex items-center gap-1 text-[11px]">
                <StarIcon size={12} className="text-orange fill-orange" />
                <span className="font-semibold text-text">{c.rating}</span>
              </span>
              <span className="text-[11px] font-bold text-green">
                {c.price === 0 ? "FREE" : `$${c.price}`}
              </span>
            </div>
          </ModuleCard>
        ))}
      </ModuleCards>
    </ModuleShell>
  );
}
