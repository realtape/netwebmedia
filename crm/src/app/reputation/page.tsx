"use client";

import { Trophy, Star } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { reputationReviews } from "@/lib/mock-data-extended";

const platformColors: Record<string, string> = {
  Google: "bg-accent/15 text-accent",
  G2: "bg-red/15 text-red",
  Capterra: "bg-cyan/15 text-cyan",
  Trustpilot: "bg-green/15 text-green",
  Facebook: "bg-purple-500/15 text-purple-400",
};

const statusColors: Record<string, string> = {
  published: "bg-green/15 text-green",
  responded: "bg-accent/15 text-accent",
  flagged: "bg-red/15 text-red",
};

export default function ReputationPage() {
  const avgRating = (reputationReviews.reduce((a, r) => a + r.rating, 0) / reputationReviews.length).toFixed(1);
  const fiveStars = reputationReviews.filter((r) => r.rating === 5).length;
  const flagged = reputationReviews.filter((r) => r.status === "flagged").length;

  return (
    <ModuleShell
      icon={Trophy}
      hub="Agency / Partner"
      title="Reputation"
      description="Monitor and respond to Google, G2, Capterra, Trustpilot reviews from one inbox. AI-generated response suggestions."
      aiFeature="AI Response"
      primaryAction={{ label: "Request Review" }}
      searchPlaceholder="Search reviews..."
      stats={[
        { label: "Avg Rating", value: avgRating },
        { label: "5-Star Reviews", value: fiveStars },
        { label: "Total Reviews", value: reputationReviews.length },
        { label: "Flagged", value: flagged, delta: flagged > 0 ? "needs response" : undefined },
      ]}
    >
      <ModuleTable
        columns={["Customer", "Platform", "Rating", "Excerpt", "Status", "Date"]}
        rows={reputationReviews.map((r) => [
          <span key="c" className="font-semibold text-text">{r.customer}</span>,
          <span key="p" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${platformColors[r.platform]}`}>{r.platform}</span>,
          <div key="r" className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                className={i < r.rating ? "text-orange fill-orange" : "text-border"}
              />
            ))}
          </div>,
          <span key="e" className="text-text-dim text-[11px] italic">{r.excerpt.length > 80 ? `${r.excerpt.substring(0, 80)}...` : r.excerpt}</span>,
          <span key="s" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[r.status]}`}>{r.status}</span>,
          <span key="d" className="text-text-dim">{r.date}</span>,
        ])}
      />
    </ModuleShell>
  );
}
