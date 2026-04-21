"use client";

import { Video, Play } from "lucide-react";
import { ModuleShell, ModuleCards, ModuleCard } from "@/components/module-shell";
import { aiAgents } from "@/lib/mock-data-extended";

export default function VideoFactoryPage() {
  const video = aiAgents.filter((a) => a.type === "Video");
  const videos = video.reduce((a, v) => a + v.tasksCompleted, 0);
  const cost = video.reduce((a, v) => a + v.costMonth, 0);

  return (
    <ModuleShell
      icon={Video}
      hub="AI Agents"
      title="Video Factory"
      description="Personalized AI avatar videos at scale. Each lead gets their own video with name, company and tailored pitch — deliverable inside emails and landing pages."
      aiFeature="HeyGen + Claude"
      primaryAction={{ label: "New Campaign" }}
      stats={[
        { label: "Videos / Month", value: videos.toLocaleString() },
        { label: "Avg Watch Rate", value: "68%" },
        { label: "Top Template", value: "Cold Intro" },
        { label: "Monthly Cost", value: `$${cost.toLocaleString()}` },
      ]}
    >
      <div className="mb-6 bg-gradient-to-br from-purple-500/10 to-accent/10 border border-purple-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
            <Play size={24} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-text mb-1">Launch a personalized video campaign</div>
            <div className="text-[11px] text-text-dim mb-4">
              Upload your list, pick an avatar, write a template with {`{{firstName}}`}, {`{{company}}`} placeholders — each recipient gets a unique video.
            </div>
            <button className="px-4 py-2 text-xs font-semibold bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
              Create Campaign
            </button>
          </div>
        </div>
      </div>

      <ModuleCards>
        {video.map((v) => (
          <ModuleCard
            key={v.id}
            title={v.name}
            subtitle={v.model}
            badge={v.status}
            badgeColor={v.status === "active" ? "green" : "orange"}
          >
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Generated</div>
                <div className="text-lg font-extrabold text-text">{v.tasksCompleted.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Accuracy</div>
                <div className="text-lg font-extrabold text-green">{v.accuracy}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-[11px]">
              <span className="text-text-dim">Last: {v.lastActive}</span>
              <span className="font-semibold text-accent">${v.costMonth}/mo</span>
            </div>
          </ModuleCard>
        ))}
      </ModuleCards>
    </ModuleShell>
  );
}
