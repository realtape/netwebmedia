"use client";

import { Sparkles, Send } from "lucide-react";
import { ModuleShell } from "@/components/module-shell";
import { aiAgents } from "@/lib/mock-data-extended";

const suggestedPrompts = [
  "Summarize my Q2 pipeline",
  "Draft a follow-up to Sarah Johnson",
  "Find at-risk customers",
  "Write a SMS to abandoned quotes",
  "Build a re-engagement automation",
  "Analyze last month's CAC",
];

export default function AICopilotPage() {
  const copilot = aiAgents.find((a) => a.type === "Copilot");

  return (
    <ModuleShell
      icon={Sparkles}
      hub="AI Agents"
      title="NWM Copilot"
      description="Your always-on AI assistant across every module. Drafts emails, summarizes deals, builds automations, answers questions — with full CRM context."
      aiFeature="Claude 4.6 / GPT-4"
      stats={[
        { label: "Tasks Completed", value: copilot?.tasksCompleted.toLocaleString() ?? "0" },
        { label: "Accuracy", value: `${copilot?.accuracy ?? 0}%` },
        { label: "Model", value: copilot?.model.split(" ")[0] ?? "—" },
        { label: "Monthly Cost", value: `$${copilot?.costMonth ?? 0}` },
      ]}
    >
      <div className="bg-bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="text-sm font-bold text-text">Ask Copilot anything</div>
            <div className="text-[11px] text-text-dim">Context-aware across contacts, deals, automations, tickets.</div>
          </div>
        </div>

        <div className="relative mb-4">
          <textarea
            placeholder="e.g., Draft a proposal for Acme Corp based on their recent activity..."
            rows={3}
            className="w-full p-4 pr-14 text-sm bg-bg-hover border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:border-accent resize-none"
          />
          <button className="absolute bottom-3 right-3 w-9 h-9 rounded-lg bg-accent hover:bg-accent-light text-white flex items-center justify-center transition-colors">
            <Send size={14} />
          </button>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-2">Suggested</div>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((p) => (
              <button
                key={p}
                className="text-[11px] px-3 py-1.5 bg-bg-hover border border-border rounded-full text-text hover:border-accent hover:text-accent transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-1">Recent Conversations</div>
          <div className="text-2xl font-extrabold text-text">284</div>
          <div className="text-[11px] text-text-dim mt-1">Today</div>
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-1">Top Use-case</div>
          <div className="text-sm font-bold text-text">Email Drafting</div>
          <div className="text-[11px] text-text-dim mt-1">42% of calls</div>
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-1">Avg Response</div>
          <div className="text-2xl font-extrabold text-accent">1.2s</div>
          <div className="text-[11px] text-text-dim mt-1">Streaming</div>
        </div>
      </div>
    </ModuleShell>
  );
}
