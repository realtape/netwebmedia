"use client";

import { useState } from "react";
import { Plus, MoreVertical, DollarSign } from "lucide-react";
import { deals, pipelineStages } from "@/lib/mock-data";

const stageColors: Record<string, string> = {
  "New Lead": "border-t-text-dim",
  "Contacted": "border-t-cyan",
  "Qualified": "border-t-accent",
  "Proposal Sent": "border-t-orange",
  "Negotiation": "border-t-pink",
  "Closed Won": "border-t-green",
  "Closed Lost": "border-t-red",
};

export default function PipelinePage() {
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);
  const [dealsList, setDealsList] = useState(deals);

  const handleDragStart = (dealId: string) => {
    setDraggedDeal(dealId);
  };

  const handleDrop = (stage: string) => {
    if (!draggedDeal) return;
    setDealsList((prev) =>
      prev.map((d) => (d.id === draggedDeal ? { ...d, stage } : d))
    );
    setDraggedDeal(null);
  };

  const stageValue = (stage: string) =>
    dealsList.filter((d) => d.stage === stage).reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Pipeline</h1>
          <p className="text-sm text-text-dim mt-1">
            {dealsList.length} deals · ${dealsList.reduce((s, d) => s + d.value, 0).toLocaleString()} total value
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent-light transition-colors">
          <Plus size={14} /> Add Deal
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
        {pipelineStages.map((stage) => {
          const stageDeals = dealsList.filter((d) => d.stage === stage);
          return (
            <div
              key={stage}
              className="min-w-[260px] w-[260px] flex flex-col shrink-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(stage)}
            >
              {/* Stage Header */}
              <div className={`bg-bg-card border border-border rounded-t-xl border-t-2 ${stageColors[stage] || "border-t-accent"} p-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold">{stage}</h3>
                    <span className="text-[10px] text-text-dim bg-bg-hover px-1.5 py-0.5 rounded-full">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-text-dim">
                    ${stageValue(stage).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Deal Cards */}
              <div className="flex-1 bg-bg/50 border-x border-b border-border rounded-b-xl p-2 space-y-2 overflow-y-auto">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal.id)}
                    className="bg-bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-xs font-semibold leading-tight">{deal.title}</div>
                      <button className="text-text-dim hover:text-text p-0.5">
                        <MoreVertical size={12} />
                      </button>
                    </div>
                    <div className="text-[10px] text-text-dim mb-3">{deal.contactName}</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-green text-xs font-bold">
                        <DollarSign size={12} />
                        {deal.value.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-bg-hover rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full"
                            style={{ width: `${deal.probability}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-text-dim">{deal.probability}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                      <span className="text-[10px] text-text-dim">Close: {deal.expectedClose}</span>
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent-light text-[8px] font-bold">
                        {deal.assignedTo.split(" ").map((n) => n[0]).join("")}
                      </div>
                    </div>
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="text-center py-8 text-text-dim text-xs">
                    Drop deals here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
