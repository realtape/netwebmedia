"use client";

import { Phone, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { ModuleShell, ModuleCards, ModuleCard } from "@/components/module-shell";
import { callsLog } from "@/lib/mock-data-extended";

const outcomeColors: Record<string, "green" | "cyan" | "orange" | "red"> = {
  connected: "green",
  voicemail: "cyan",
  "no-answer": "orange",
  busy: "red",
};

function durationToMin(d: string) {
  const [m] = d.split(":");
  return parseInt(m) || 0;
}

export default function CallsPage() {
  const connected = callsLog.filter((c) => c.outcome === "connected");
  const voicemails = callsLog.filter((c) => c.outcome === "voicemail").length;
  const totalMin = connected.reduce((a, c) => a + durationToMin(c.duration), 0);
  const avgDuration = connected.length > 0 ? (totalMin / connected.length).toFixed(1) : "0";

  return (
    <ModuleShell
      icon={Phone}
      hub="Service Hub"
      title="Calls"
      description="Twilio-powered voice with call recording, AI summaries, CRM logging and number provisioning."
      aiFeature="AI Summary"
      primaryAction={{ label: "New Call" }}
      searchPlaceholder="Search calls..."
      stats={[
        { label: "Total Calls", value: callsLog.length },
        { label: "Connected", value: connected.length },
        { label: "Avg Duration", value: `${avgDuration} min` },
        { label: "Voicemails", value: voicemails },
      ]}
    >
      <ModuleCards>
        {callsLog.map((c) => (
          <ModuleCard
            key={c.id}
            title={c.contactName}
            subtitle={`${c.agent} · ${c.timestamp}`}
            badge={c.outcome}
            badgeColor={outcomeColors[c.outcome]}
          >
            <div className="flex items-center gap-2 mb-3">
              {c.direction === "inbound" ? (
                <ArrowDownLeft size={14} className="text-green" />
              ) : (
                <ArrowUpRight size={14} className="text-accent" />
              )}
              <span className="text-[11px] text-text-dim capitalize">{c.direction}</span>
              {c.duration !== "00:00" && (
                <span className="text-[11px] font-semibold text-text ml-auto">{c.duration}</span>
              )}
              {c.recorded && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-red/15 text-red rounded">REC</span>
              )}
            </div>
            {c.aiSummary && (
              <div className="text-[11px] text-text-dim leading-relaxed pt-3 border-t border-border">
                <span className="text-[9px] font-bold uppercase tracking-widest text-purple-400">AI Summary:</span>{" "}
                {c.aiSummary}
              </div>
            )}
          </ModuleCard>
        ))}
      </ModuleCards>
    </ModuleShell>
  );
}
