"use client";

import { Share2 } from "lucide-react";
import { ModuleShell, ModuleCards, ModuleCard } from "@/components/module-shell";
import { socialPosts } from "@/lib/mock-data-extended";

export default function SocialPage() {
  const scheduled = socialPosts.filter((p) => p.status === "scheduled").length;
  const published = socialPosts.filter((p) => p.status === "published");
  const impressions = socialPosts.reduce((a, p) => a + p.impressions, 0);
  const avgEngagement = published.length > 0 ? Math.round(published.reduce((a, p) => a + p.engagement, 0) / published.length) : 0;

  return (
    <ModuleShell
      icon={Share2}
      hub="Marketing Hub"
      title="Social Planner"
      description="Cross-channel scheduling for LinkedIn, Twitter, Facebook, Instagram with AI-generated content suggestions."
      aiFeature="AI Content"
      primaryAction={{ label: "New Post" }}
      searchPlaceholder="Search posts..."
      stats={[
        { label: "Scheduled", value: scheduled },
        { label: "Published", value: published.length },
        { label: "Impressions", value: impressions.toLocaleString() },
        { label: "Avg Engagement", value: avgEngagement },
      ]}
    >
      <ModuleCards>
        {socialPosts.map((p) => (
          <ModuleCard
            key={p.id}
            title={p.content.length > 60 ? `${p.content.substring(0, 60)}...` : p.content}
            subtitle={p.channels.join(" · ")}
            badge={p.status}
            badgeColor={p.status === "published" ? "green" : p.status === "scheduled" ? "accent" : "orange"}
          >
            <div className="text-[11px] text-text-dim mb-3">Scheduled: {p.scheduledFor}</div>
            <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-border">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Impressions</div>
                <div className="text-sm font-extrabold text-text">{p.impressions.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Clicks</div>
                <div className="text-sm font-extrabold text-accent">{p.clicks}</div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Engage</div>
                <div className="text-sm font-extrabold text-green">{p.engagement}</div>
              </div>
            </div>
          </ModuleCard>
        ))}
      </ModuleCards>
    </ModuleShell>
  );
}
