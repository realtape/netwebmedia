"use client";

import { useState } from "react";
import { Megaphone, X } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { showToast } from "@/lib/toast";
import { campaigns } from "@/lib/mock-data-extended";

const statusColors: Record<string, string> = {
  active:    "bg-green/15 text-green",
  scheduled: "bg-cyan/15 text-cyan",
  completed: "bg-accent/15 text-accent",
  paused:    "bg-orange/15 text-orange",
  draft:     "bg-bg-hover text-text-dim",
};

const typeColors: Record<string, string> = {
  Email:           "bg-accent/15 text-accent",
  SMS:             "bg-cyan/15 text-cyan",
  Social:          "bg-purple-500/15 text-purple-400",
  "Multi-channel": "bg-orange/15 text-orange",
  Ads:             "bg-red/15 text-red",
};

const CAMPAIGN_TYPES = ["Email", "SMS", "Social", "Multi-channel", "Ads"] as const;

export default function CampaignsPage() {
  const [showModal, setShowModal] = useState(false);
  const [name, setName]           = useState("");
  const [type, setType]           = useState("Email");
  const [subject, setSubject]     = useState("");
  const [audience, setAudience]   = useState("");
  const [launchDate, setLaunchDate] = useState("");

  const active  = campaigns.filter((c) => c.status === "active").length;
  const sent    = campaigns.reduce((a, c) => a + c.sent, 0);
  const revenue = campaigns.reduce((a, c) => a + c.revenue, 0);
  const running = campaigns.filter((c) => c.conversionRate > 0);
  const avgConv = running.length > 0
    ? (running.reduce((a, c) => a + c.conversionRate, 0) / running.length).toFixed(1)
    : "0";

  function handleCreate() {
    if (!name.trim()) {
      showToast("Campaign name is required", "error");
      return;
    }
    setShowModal(false);
    setName(""); setType("Email"); setSubject(""); setAudience(""); setLaunchDate("");
    showToast(`Campaign "${name}" created as draft`, "success");
  }

  const inputCls =
    "w-full px-3 py-2 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:border-accent";
  const labelCls = "block text-[11px] font-bold uppercase tracking-widest text-text-dim mb-1.5";

  return (
    <>
      <ModuleShell
        icon={Megaphone}
        hub="Marketing Hub"
        title="Campaigns"
        description="Multi-channel campaigns (email, SMS, social, ads) with attribution and revenue tracking."
        primaryAction={{ label: "New Campaign", onClick: () => setShowModal(true) }}
        searchPlaceholder="Search campaigns..."
        stats={[
          { label: "Active",              value: active },
          { label: "Total Sent",          value: sent.toLocaleString() },
          { label: "Avg Conversion",      value: `${avgConv}%` },
          { label: "Attributed Revenue",  value: `$${revenue.toLocaleString()}` },
        ]}
      >
        <ModuleTable
          columns={["Name", "Type", "Status", "Audience", "Open %", "Click %", "Conv %", "Revenue", "Launch"]}
          rows={campaigns.map((c) => [
            <span key="n" className="font-semibold text-text">{c.name}</span>,
            <span key="t" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${typeColors[c.type]}`}>{c.type}</span>,
            <span key="s" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>{c.status}</span>,
            <span key="a" className="text-text-dim">{c.audience.toLocaleString()}</span>,
            <span key="o" className="text-cyan">{c.openRate}%</span>,
            <span key="cl" className="text-accent">{c.clickRate}%</span>,
            <span key="cv" className="text-green">{c.conversionRate}%</span>,
            <span key="r" className="font-semibold text-green">${c.revenue.toLocaleString()}</span>,
            <span key="l" className="text-text-dim">{c.launchDate}</span>,
          ])}
        />
      </ModuleShell>

      {/* New Campaign Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9998] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="text-base font-extrabold tracking-tight">New Campaign</h2>
                <p className="text-[11px] text-text-dim mt-0.5">Create a new marketing campaign</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-hover text-text-dim transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={labelCls}>Campaign Name *</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Spring Promo Launch"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className={labelCls}>Type</label>
                <select
                  className={inputCls}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {CAMPAIGN_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Subject / Description</label>
                <input
                  className={inputCls}
                  placeholder="Campaign subject or goal"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Audience Size</label>
                  <input
                    className={inputCls}
                    placeholder="e.g. 5,000"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Launch Date</label>
                  <input
                    className={inputCls}
                    type="date"
                    value={launchDate}
                    onChange={(e) => setLaunchDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-semibold text-text-dim hover:text-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-5 py-2 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent-light transition-colors"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
