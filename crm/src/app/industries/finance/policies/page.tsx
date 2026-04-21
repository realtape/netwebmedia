"use client";

import { Shield } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

type PolicyType = "Auto" | "Home" | "Life" | "Umbrella";
type PolicyStatus = "Active" | "Pending Renewal" | "Lapsed" | "Cancelled";

const typeColors: Record<PolicyType, string> = {
  Auto: "bg-accent/15 text-accent",
  Home: "bg-green/15 text-green",
  Life: "bg-purple-500/15 text-purple-400",
  Umbrella: "bg-cyan/15 text-cyan",
};

const statusColors: Record<PolicyStatus, string> = {
  Active: "bg-green/15 text-green",
  "Pending Renewal": "bg-orange/15 text-orange",
  Lapsed: "bg-red/15 text-red",
  Cancelled: "bg-red/15 text-red",
};

interface Policy {
  id: string;
  holder: string;
  type: PolicyType;
  premium: number;
  renewal: string;
  status: PolicyStatus;
}

const policies: Policy[] = [
  { id: "POL-44120", holder: "Marlon Pritchard", type: "Auto", premium: 1840, renewal: "2026-06-12", status: "Active" },
  { id: "POL-44121", holder: "Giselle Obregon", type: "Home", premium: 2240, renewal: "2026-05-03", status: "Pending Renewal" },
  { id: "POL-44122", holder: "Thaddeus Shin", type: "Life", premium: 3620, renewal: "2027-01-18", status: "Active" },
  { id: "POL-44123", holder: "Bridget Kowalczyk", type: "Auto", premium: 1530, renewal: "2026-04-29", status: "Pending Renewal" },
  { id: "POL-44124", holder: "Amadou Sow", type: "Umbrella", premium: 980, renewal: "2026-11-04", status: "Active" },
  { id: "POL-44125", holder: "Rebekah Lindgren", type: "Home", premium: 2710, renewal: "2026-08-22", status: "Active" },
  { id: "POL-44126", holder: "Chidi Ikedi", type: "Life", premium: 4120, renewal: "2026-09-15", status: "Active" },
  { id: "POL-44127", holder: "Stellamaris Yuen", type: "Auto", premium: 1690, renewal: "2026-03-30", status: "Lapsed" },
  { id: "POL-44128", holder: "Jonas Fitzgerald", type: "Home", premium: 1980, renewal: "2026-07-08", status: "Active" },
  { id: "POL-44129", holder: "Priya Balasubramanian", type: "Auto", premium: 1320, renewal: "2026-05-19", status: "Pending Renewal" },
  { id: "POL-44130", holder: "Dietrich Vogel", type: "Umbrella", premium: 1150, renewal: "2026-10-27", status: "Active" },
  { id: "POL-44131", holder: "Celeste Armitage", type: "Life", premium: 2890, renewal: "2025-12-14", status: "Cancelled" },
  { id: "POL-44132", holder: "Rashid Farouk", type: "Auto", premium: 1620, renewal: "2026-06-02", status: "Active" },
];

export default function PoliciesPage() {
  const totalPremium = policies.reduce((a, p) => a + p.premium, 0);
  const active = policies.filter((p) => p.status === "Active").length;
  const renewing = policies.filter((p) => p.status === "Pending Renewal").length;

  return (
    <ModuleShell
      icon={Shield}
      hub="Finance & Insurance Hub"
      title="Insurance Policies"
      description="Book of policies across auto, home, life, and umbrella lines with renewal tracking."
      primaryAction={{ label: "Add Policy" }}
      searchPlaceholder="Search policies by #, holder, or type..."
      stats={[
        { label: "Policies", value: policies.length },
        { label: "Active", value: active },
        { label: "Pending Renewal", value: renewing },
        { label: "Premium Written", value: `$${totalPremium.toLocaleString()}` },
      ]}
    >
      <ModuleTable
        columns={["Policy #", "Holder", "Type", "Premium", "Renewal", "Status"]}
        rows={policies.map((p) => [
          <span key="id" className="font-semibold text-text">{p.id}</span>,
          <span key="h" className="text-text">{p.holder}</span>,
          <span key="t" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${typeColors[p.type]}`}>{p.type}</span>,
          <span key="pr" className="font-semibold text-green">${p.premium.toLocaleString()}</span>,
          <span key="r" className="text-text-dim">{p.renewal}</span>,
          <span key="st" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[p.status]}`}>{p.status}</span>,
        ])}
      />
    </ModuleShell>
  );
}
