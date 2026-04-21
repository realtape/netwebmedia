"use client";

import { Users } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Subscriber {
  id: string;
  org: string;
  plan: "Starter" | "Growth" | "Scale" | "Enterprise";
  mrr: number;
  seats: number;
  activation: "Activated" | "Onboarding" | "At Risk" | "Churned";
  csm: string;
}

const subscribers: Subscriber[] = [
  { id: "ORG-10021", org: "Meridian Biotech", plan: "Enterprise", mrr: 14_800, seats: 180, activation: "Activated", csm: "Priya Shah" },
  { id: "ORG-10022", org: "Lumen Analytics", plan: "Scale", mrr: 4_900, seats: 45, activation: "Activated", csm: "Dante Rivera" },
  { id: "ORG-10023", org: "Harborline Logistics", plan: "Enterprise", mrr: 22_400, seats: 310, activation: "At Risk", csm: "Priya Shah" },
  { id: "ORG-10024", org: "Stanton Marketing", plan: "Growth", mrr: 1_490, seats: 14, activation: "Activated", csm: "Kelsey Moreno" },
  { id: "ORG-10025", org: "Cascade Fintech", plan: "Scale", mrr: 6_800, seats: 62, activation: "Onboarding", csm: "Dante Rivera" },
  { id: "ORG-10026", org: "Brightpath Schools", plan: "Growth", mrr: 1_180, seats: 22, activation: "Activated", csm: "Kelsey Moreno" },
  { id: "ORG-10027", org: "Northwind Energy", plan: "Enterprise", mrr: 18_200, seats: 240, activation: "Activated", csm: "Priya Shah" },
  { id: "ORG-10028", org: "Redwood HR Partners", plan: "Scale", mrr: 3_600, seats: 38, activation: "At Risk", csm: "Dante Rivera" },
  { id: "ORG-10029", org: "Clarendon Legal", plan: "Growth", mrr: 990, seats: 8, activation: "Churned", csm: "Kelsey Moreno" },
  { id: "ORG-10030", org: "Orbital Mobility", plan: "Starter", mrr: 290, seats: 4, activation: "Onboarding", csm: "Unassigned" },
  { id: "ORG-10031", org: "Fjord Robotics", plan: "Enterprise", mrr: 26_500, seats: 420, activation: "Activated", csm: "Priya Shah" },
  { id: "ORG-10032", org: "Sable Insurance", plan: "Scale", mrr: 5_400, seats: 58, activation: "Activated", csm: "Dante Rivera" },
];

const planColors: Record<Subscriber["plan"], string> = {
  Starter: "bg-cyan-500/15 text-cyan",
  Growth: "bg-green-500/15 text-green",
  Scale: "bg-accent/15 text-accent",
  Enterprise: "bg-purple-500/15 text-purple-400",
};

const activationColors: Record<Subscriber["activation"], string> = {
  Activated: "bg-green-500/15 text-green",
  Onboarding: "bg-cyan-500/15 text-cyan",
  "At Risk": "bg-orange-500/15 text-orange",
  Churned: "bg-red-500/15 text-red",
};

export default function SaasSubscribersPage() {
  const totalMrr = subscribers.reduce((a, s) => a + s.mrr, 0);
  const totalSeats = subscribers.reduce((a, s) => a + s.seats, 0);
  const activated = subscribers.filter((s) => s.activation === "Activated").length;

  return (
    <ModuleShell
      icon={Users}
      hub="SaaS Hub"
      title="Subscribers"
      description="Paid accounts with plan, MRR contribution, seat utilization, and success-owner assignments."
      primaryAction={{ label: "Add Subscriber" }}
      searchPlaceholder="Search organizations..."
      stats={[
        { label: "Accounts", value: subscribers.length },
        { label: "Total MRR", value: `$${totalMrr.toLocaleString()}` },
        { label: "Total Seats", value: totalSeats },
        { label: "Activated", value: `${Math.round((activated / subscribers.length) * 100)}%` },
      ]}
    >
      <ModuleTable
        columns={["Org ID", "Organization", "Plan", "MRR", "Seats", "Activation", "CSM"]}
        rows={subscribers.map((s) => [
          <span key="id" className="font-mono text-[10px] text-text-dim">{s.id}</span>,
          <span key="o" className="font-semibold text-text">{s.org}</span>,
          <span key="p" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${planColors[s.plan]}`}>
            {s.plan}
          </span>,
          <span key="m" className="font-semibold text-green">${s.mrr.toLocaleString()}</span>,
          <span key="se" className="text-text-dim">{s.seats}</span>,
          <span key="a" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${activationColors[s.activation]}`}>
            {s.activation}
          </span>,
          <span key="c" className="text-text-dim">{s.csm}</span>,
        ])}
      />
    </ModuleShell>
  );
}
