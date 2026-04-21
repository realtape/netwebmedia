"use client";

import { Users2, Pin } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { communityPosts } from "@/lib/mock-data-extended";

const categoryColors: Record<string, string> = {
  Announcement: "bg-accent/15 text-accent",
  "Q&A": "bg-cyan/15 text-cyan",
  "Feature Request": "bg-orange/15 text-orange",
  "Tips & Tricks": "bg-green/15 text-green",
  "Show & Tell": "bg-purple-500/15 text-purple-400",
};

export default function CommunityPage() {
  const thisWeek = 4;
  const replies = communityPosts.reduce((a, p) => a + p.replies, 0);

  return (
    <ModuleShell
      icon={Users2}
      hub="CMS & Sites"
      title="Community"
      description="Threaded discussion forums with moderation, AI topic suggestions, gamification and roles."
      primaryAction={{ label: "New Post" }}
      searchPlaceholder="Search community..."
      stats={[
        { label: "Total Posts", value: communityPosts.length },
        { label: "This Week", value: thisWeek },
        { label: "Total Replies", value: replies },
        { label: "Active Members", value: 842 },
      ]}
    >
      <ModuleTable
        columns={["Author", "Title", "Category", "Replies", "Views", "Likes", "Posted"]}
        rows={communityPosts.map((p) => [
          <span key="a" className="font-semibold text-text">{p.author}</span>,
          <div key="t" className="flex items-center gap-2">
            {p.pinned && <Pin size={12} className="text-accent" />}
            <span className="font-semibold text-text">{p.title}</span>
          </div>,
          <span key="c" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${categoryColors[p.category]}`}>{p.category}</span>,
          <span key="r" className="text-text-dim">{p.replies}</span>,
          <span key="v" className="text-text-dim">{p.views.toLocaleString()}</span>,
          <span key="l" className="text-accent">{p.likes}</span>,
          <span key="p" className="text-text-dim">{p.createdAt}</span>,
        ])}
      />
    </ModuleShell>
  );
}
