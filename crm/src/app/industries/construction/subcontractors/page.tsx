"use client";

import { Users } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Sub {
  company: string;
  trade: string;
  activeProjects: number;
  rating: number;
  license: string;
  contractValue: number;
}

const subs: Sub[] = [
  { company: "Ironwood Framing LLC", trade: "Framing", activeProjects: 3, rating: 4.8, license: "TX-FRM-88412", contractValue: 840000 },
  { company: "Blueline Plumbing Co", trade: "Plumbing", activeProjects: 5, rating: 4.7, license: "TX-MPL-21094", contractValue: 612000 },
  { company: "Voltage Electric Services", trade: "Electrical", activeProjects: 4, rating: 4.9, license: "TX-ME-10485", contractValue: 984000 },
  { company: "Rockline Concrete Partners", trade: "Concrete", activeProjects: 2, rating: 4.6, license: "TX-CON-66120", contractValue: 1280000 },
  { company: "Topline Roofing", trade: "Roofing", activeProjects: 3, rating: 4.5, license: "TX-ROF-33481", contractValue: 520000 },
  { company: "Azure Tile & Stone", trade: "Flooring", activeProjects: 4, rating: 4.7, license: "TX-FL-22097", contractValue: 340000 },
  { company: "Clearview HVAC Systems", trade: "HVAC", activeProjects: 6, rating: 4.8, license: "TAC-5540B", contractValue: 1120000 },
  { company: "Redwing Painting LLC", trade: "Paint", activeProjects: 2, rating: 4.4, license: "TX-PNT-71280", contractValue: 184000 },
  { company: "Magnolia Drywall", trade: "Drywall", activeProjects: 3, rating: 4.6, license: "TX-DW-40915", contractValue: 268000 },
  { company: "Prairie Excavation Co", trade: "Excavation", activeProjects: 2, rating: 4.9, license: "TX-EX-88034", contractValue: 920000 },
  { company: "Summit Cabinetry", trade: "Millwork", activeProjects: 1, rating: 4.8, license: "TX-MW-19204", contractValue: 148000 },
  { company: "Horizon Landscaping", trade: "Landscape", activeProjects: 4, rating: 4.5, license: "TX-LND-55102", contractValue: 210000 },
];

export default function SubcontractorsPage() {
  const totalContract = subs.reduce((a, s) => a + s.contractValue, 0);
  const avgRating = (subs.reduce((a, s) => a + s.rating, 0) / subs.length).toFixed(2);
  const totalActive = subs.reduce((a, s) => a + s.activeProjects, 0);

  return (
    <ModuleShell
      icon={Users}
      hub="Construction Hub"
      title="Subcontractors"
      description="Trade partner bench with license verification, performance ratings, and contract exposure."
      primaryAction={{ label: "Add Subcontractor" }}
      searchPlaceholder="Search subs by company or trade..."
      stats={[
        { label: "Subs", value: subs.length },
        { label: "Contract Value", value: `$${(totalContract / 1_000_000).toFixed(1)}M` },
        { label: "Active Projects", value: totalActive },
        { label: "Avg Rating", value: avgRating },
      ]}
    >
      <ModuleTable
        columns={["Company", "Trade", "Active Projects", "Rating", "License #", "Contract Value"]}
        rows={subs.map((s) => [
          <span key="c" className="font-semibold text-text">{s.company}</span>,
          <span key="t" className="text-text-dim">{s.trade}</span>,
          <span key="a" className="font-semibold text-text">{s.activeProjects}</span>,
          <span key="r" className="font-bold text-green">{s.rating.toFixed(1)}</span>,
          <span key="l" className="text-text-dim">{s.license}</span>,
          <span key="cv" className="font-semibold text-green">${s.contractValue.toLocaleString()}</span>,
        ])}
      />
    </ModuleShell>
  );
}
