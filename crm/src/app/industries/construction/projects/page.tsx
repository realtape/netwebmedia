"use client";

import { Hammer } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

type Phase = "Planning" | "Foundation" | "Framing" | "MEP" | "Finishing" | "Closeout";

const phaseColors: Record<Phase, string> = {
  Planning: "bg-text-dim/15 text-text-dim",
  Foundation: "bg-orange/15 text-orange",
  Framing: "bg-accent/15 text-accent",
  MEP: "bg-cyan/15 text-cyan",
  Finishing: "bg-purple-500/15 text-purple-400",
  Closeout: "bg-green/15 text-green",
};

interface Project {
  name: string;
  client: string;
  type: string;
  phase: Phase;
  budget: number;
  spent: number;
  completion: number;
  pm: string;
}

const projects: Project[] = [
  { name: "Westlake Residence Remodel", client: "Andersen Family", type: "Residential", phase: "Finishing", budget: 284000, spent: 241200, completion: 82, pm: "Grant Bellamy" },
  { name: "Ridgeview Townhomes Ph.2", client: "Ridgeview Holdings", type: "Multi-Family", phase: "Framing", budget: 4800000, spent: 2150000, completion: 44, pm: "Sonia Aguirre" },
  { name: "Hillside Kitchen Reno", client: "Lillian Park", type: "Residential", phase: "MEP", budget: 92000, spent: 51400, completion: 58, pm: "Grant Bellamy" },
  { name: "Cypress Medical Build-Out", client: "Cypress Health", type: "Commercial", phase: "Closeout", budget: 1280000, spent: 1248000, completion: 97, pm: "Rashad Freeman" },
  { name: "Pecan Creek New Build", client: "Wellmore Homes", type: "Residential", phase: "Foundation", budget: 640000, spent: 72000, completion: 12, pm: "Sonia Aguirre" },
  { name: "Southpark Retail Fitout", client: "Southpark LLC", type: "Commercial", phase: "Finishing", budget: 520000, spent: 384000, completion: 74, pm: "Rashad Freeman" },
  { name: "Elm Grove Bathroom Suite", client: "Teodora Carr", type: "Residential", phase: "Finishing", budget: 48000, spent: 39200, completion: 88, pm: "Grant Bellamy" },
  { name: "Lakeside Boathouse", client: "Haverford Estate", type: "Residential", phase: "Planning", budget: 180000, spent: 4800, completion: 3, pm: "Minh-An Tran" },
  { name: "Riverbend Office Tower", client: "Riverbend REIT", type: "Commercial", phase: "Framing", budget: 18400000, spent: 6920000, completion: 38, pm: "Sonia Aguirre" },
  { name: "Foothills ADU Addition", client: "Desmond Farr", type: "Residential", phase: "MEP", budget: 115000, spent: 68000, completion: 61, pm: "Minh-An Tran" },
  { name: "Downtown Brewery Tenant", client: "Copperwing Brew Co", type: "Commercial", phase: "Closeout", budget: 340000, spent: 332000, completion: 95, pm: "Rashad Freeman" },
  { name: "Hollow Ridge Drainage", client: "City of Pflugerville", type: "Civil", phase: "Foundation", budget: 720000, spent: 201000, completion: 28, pm: "Minh-An Tran" },
];

export default function ProjectsPage() {
  const totalBudget = projects.reduce((a, p) => a + p.budget, 0);
  const totalSpent = projects.reduce((a, p) => a + p.spent, 0);
  const avgCompletion = Math.round(projects.reduce((a, p) => a + p.completion, 0) / projects.length);

  return (
    <ModuleShell
      icon={Hammer}
      hub="Construction Hub"
      title="Projects"
      description="Active construction projects with budget burn, phase tracking, and PM ownership."
      primaryAction={{ label: "Add Project" }}
      searchPlaceholder="Search projects by name, client, or PM..."
      stats={[
        { label: "Projects", value: projects.length },
        { label: "Total Budget", value: `$${(totalBudget / 1_000_000).toFixed(1)}M` },
        { label: "Spent to Date", value: `$${(totalSpent / 1_000_000).toFixed(1)}M` },
        { label: "Avg Completion", value: `${avgCompletion}%` },
      ]}
    >
      <ModuleTable
        columns={["Project", "Client", "Type", "Phase", "Budget", "Spent", "Completion", "PM"]}
        rows={projects.map((p) => [
          <span key="n" className="font-semibold text-text">{p.name}</span>,
          <span key="c" className="text-text-dim">{p.client}</span>,
          <span key="t" className="text-text-dim">{p.type}</span>,
          <span key="ph" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${phaseColors[p.phase]}`}>{p.phase}</span>,
          <span key="b" className="font-semibold text-text">${p.budget.toLocaleString()}</span>,
          <span key="s" className="font-semibold text-green">${p.spent.toLocaleString()}</span>,
          <span key="co" className="font-bold text-cyan">{p.completion}%</span>,
          <span key="pm" className="text-text-dim">{p.pm}</span>,
        ])}
      />
    </ModuleShell>
  );
}
