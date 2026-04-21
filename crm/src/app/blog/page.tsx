"use client";

import { FileText } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { blogPosts } from "@/lib/mock-data-extended";

const statusColors: Record<string, string> = {
  published: "bg-green/15 text-green",
  scheduled: "bg-cyan/15 text-cyan",
  draft: "bg-bg-hover text-text-dim",
};

export default function BlogPage() {
  const published = blogPosts.filter((p) => p.status === "published");
  const drafts = blogPosts.filter((p) => p.status === "draft");
  const views = blogPosts.reduce((a, p) => a + p.views, 0);
  const avgRead = Math.round(blogPosts.reduce((a, p) => a + p.readTime, 0) / blogPosts.length);

  return (
    <ModuleShell
      icon={FileText}
      hub="Marketing Hub"
      title="Blog"
      description="SEO-optimized blog with AI writer, topic clusters, content calendar, and native CMS integration."
      aiFeature="AI Writer"
      primaryAction={{ label: "New Post" }}
      searchPlaceholder="Search posts..."
      stats={[
        { label: "Published", value: published.length },
        { label: "Drafts", value: drafts.length },
        { label: "Total Views", value: views.toLocaleString() },
        { label: "Avg Read Time", value: `${avgRead} min` },
      ]}
    >
      <ModuleTable
        columns={["Title", "Author", "Category", "Status", "Views", "Comments", "Read", "Published"]}
        rows={blogPosts.map((p) => [
          <span key="t" className="font-semibold text-text">{p.title}</span>,
          <span key="a" className="text-text-dim">{p.author}</span>,
          <span key="c" className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-accent/15 text-accent">{p.category}</span>,
          <span key="s" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[p.status]}`}>{p.status}</span>,
          <span key="v" className="text-text-dim">{p.views.toLocaleString()}</span>,
          <span key="co" className="text-text-dim">{p.comments}</span>,
          <span key="r" className="text-text-dim">{p.readTime} min</span>,
          <span key="p" className="text-text-dim">{p.publishedAt}</span>,
        ])}
      />
    </ModuleShell>
  );
}
