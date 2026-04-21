"use client";

import { BookOpen, ThumbsUp, ThumbsDown } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { knowledgeBase } from "@/lib/mock-data-extended";

const statusColors: Record<string, string> = {
  published: "bg-green/15 text-green",
  draft: "bg-bg-hover text-text-dim",
  archived: "bg-red/15 text-red",
};

export default function KnowledgeBasePage() {
  const published = knowledgeBase.filter((k) => k.status === "published");
  const views = knowledgeBase.reduce((a, k) => a + k.views, 0);
  const totalHelpful = knowledgeBase.reduce((a, k) => a + k.helpful, 0);
  const totalVotes = knowledgeBase.reduce((a, k) => a + k.helpful + k.notHelpful, 0);
  const helpfulRate = totalVotes > 0 ? Math.round((totalHelpful / totalVotes) * 100) : 0;
  const authors = new Set(knowledgeBase.map((k) => k.author)).size;

  return (
    <ModuleShell
      icon={BookOpen}
      hub="Service Hub"
      title="Knowledge Base"
      description="Self-serve articles with AI-generated drafts, search, feedback, and auto-suggested to tickets."
      aiFeature="AI Articles"
      primaryAction={{ label: "New Article" }}
      searchPlaceholder="Search articles..."
      stats={[
        { label: "Published", value: published.length },
        { label: "Total Views", value: views.toLocaleString() },
        { label: "Helpful Rate", value: `${helpfulRate}%` },
        { label: "Contributors", value: authors },
      ]}
    >
      <ModuleTable
        columns={["Title", "Category", "Author", "Views", "Feedback", "Updated", "Status"]}
        rows={knowledgeBase.map((k) => [
          <span key="t" className="font-semibold text-text">{k.title}</span>,
          <span key="c" className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan/15 text-cyan">{k.category}</span>,
          <span key="a" className="text-text-dim">{k.author}</span>,
          <span key="v" className="text-text-dim">{k.views.toLocaleString()}</span>,
          <div key="f" className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-green"><ThumbsUp size={10} />{k.helpful}</span>
            <span className="flex items-center gap-1 text-red"><ThumbsDown size={10} />{k.notHelpful}</span>
          </div>,
          <span key="u" className="text-text-dim">{k.updatedAt}</span>,
          <span key="s" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[k.status]}`}>{k.status}</span>,
        ])}
      />
    </ModuleShell>
  );
}
