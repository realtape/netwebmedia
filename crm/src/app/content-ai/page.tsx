"use client";

import { Sparkles, Wand2 } from "lucide-react";
import { ModuleShell, ModuleCards, ModuleCard } from "@/components/module-shell";
import { aiAgents } from "@/lib/mock-data-extended";

const contentTypes = [
  { label: "Blog Post", tokens: "800-2000 words" },
  { label: "Email", tokens: "100-250 words" },
  { label: "LinkedIn Post", tokens: "60-150 words" },
  { label: "Landing Page", tokens: "400-800 words" },
  { label: "Ad Copy", tokens: "30-80 words" },
  { label: "SMS", tokens: "160 chars" },
];

export default function ContentAIPage() {
  const content = aiAgents.filter((a) => a.type === "Content");
  const words = content.reduce((a, c) => a + c.tasksCompleted * 500, 0);
  const cost = content.reduce((a, c) => a + c.costMonth, 0);

  return (
    <ModuleShell
      icon={Sparkles}
      hub="AI Agents"
      title="Content AI"
      description="Generate SEO-optimized blog posts, emails, social copy, ads and landing page content — with brand voice training and plagiarism checks."
      aiFeature="Claude 4.6"
      primaryAction={{ label: "New Generation" }}
      stats={[
        { label: "Words Generated", value: words.toLocaleString() },
        { label: "Posts Published", value: 284 },
        { label: "Approval Rate", value: "87%" },
        { label: "Monthly Cost", value: `$${cost.toLocaleString()}` },
      ]}
    >
      <div className="mb-6 bg-bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wand2 size={16} className="text-purple-400" />
          <div className="text-sm font-bold text-text">Quick Generator</div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {contentTypes.map((t) => (
            <button
              key={t.label}
              className="text-left p-3 bg-bg-hover border border-border rounded-lg hover:border-accent transition-colors"
            >
              <div className="text-xs font-semibold text-text">{t.label}</div>
              <div className="text-[10px] text-text-dim mt-0.5">{t.tokens}</div>
            </button>
          ))}
        </div>
        <textarea
          placeholder="Describe what you want to create..."
          rows={3}
          className="w-full p-3 text-sm bg-bg-hover border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:border-accent resize-none mb-3"
        />
        <div className="flex items-center justify-between">
          <div className="text-[11px] text-text-dim">Brand voice: <span className="text-text font-semibold">NetWebMedia</span></div>
          <button className="px-4 py-2 text-xs font-semibold bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
            Generate
          </button>
        </div>
      </div>

      <ModuleCards>
        {content.map((c) => (
          <ModuleCard
            key={c.id}
            title={c.name}
            subtitle={c.model}
            badge={c.status}
            badgeColor={c.status === "active" ? "green" : "orange"}
          >
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Pieces</div>
                <div className="text-lg font-extrabold text-text">{c.tasksCompleted.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Accuracy</div>
                <div className="text-lg font-extrabold text-green">{c.accuracy}%</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-[11px]">
              <span className="text-text-dim">Last: {c.lastActive}</span>
              <span className="font-semibold text-accent">${c.costMonth}/mo</span>
            </div>
          </ModuleCard>
        ))}
      </ModuleCards>
    </ModuleShell>
  );
}
