"use client";

import { TrendingUp } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

type Risk = "Conservative" | "Moderate" | "Aggressive";

const riskColors: Record<Risk, string> = {
  Conservative: "bg-cyan/15 text-cyan",
  Moderate: "bg-accent/15 text-accent",
  Aggressive: "bg-purple-500/15 text-purple-400",
};

interface Portfolio {
  client: string;
  aum: number;
  allocation: string;
  ytdReturn: number;
  risk: Risk;
  advisor: string;
}

const portfolios: Portfolio[] = [
  { client: "Helena Vasquez", aum: 2480000, allocation: "60/30/10", ytdReturn: 8.4, risk: "Moderate", advisor: "Preston Kelly" },
  { client: "Ashok Raman Trust", aum: 5920000, allocation: "40/50/10", ytdReturn: 6.1, risk: "Conservative", advisor: "Deirdre Shaw" },
  { client: "Lucia Mendoza", aum: 780000, allocation: "80/15/5", ytdReturn: 12.7, risk: "Aggressive", advisor: "Preston Kelly" },
  { client: "Bernhard Holdings LLC", aum: 14200000, allocation: "50/40/10", ytdReturn: 7.3, risk: "Moderate", advisor: "Tomasz Novak" },
  { client: "Yvonne Carrington", aum: 1150000, allocation: "70/25/5", ytdReturn: 10.2, risk: "Aggressive", advisor: "Deirdre Shaw" },
  { client: "Caldwell Family Office", aum: 8760000, allocation: "45/45/10", ytdReturn: 6.8, risk: "Moderate", advisor: "Tomasz Novak" },
  { client: "Sandeep Chaudhary", aum: 640000, allocation: "75/20/5", ytdReturn: 11.4, risk: "Aggressive", advisor: "Preston Kelly" },
  { client: "Margot Eisenberg", aum: 3280000, allocation: "55/35/10", ytdReturn: 7.9, risk: "Moderate", advisor: "Deirdre Shaw" },
  { client: "Pelham Ventures Trust", aum: 4940000, allocation: "35/55/10", ytdReturn: 5.4, risk: "Conservative", advisor: "Tomasz Novak" },
  { client: "Kiara Johnson", aum: 410000, allocation: "85/10/5", ytdReturn: 14.1, risk: "Aggressive", advisor: "Preston Kelly" },
  { client: "Oscar Lindstrom", aum: 2090000, allocation: "50/40/10", ytdReturn: 7.6, risk: "Moderate", advisor: "Deirdre Shaw" },
  { client: "Zhao Wei Family", aum: 6730000, allocation: "42/48/10", ytdReturn: 6.4, risk: "Conservative", advisor: "Tomasz Novak" },
];

export default function PortfoliosPage() {
  const totalAUM = portfolios.reduce((a, p) => a + p.aum, 0);
  const avgReturn = (portfolios.reduce((a, p) => a + p.ytdReturn, 0) / portfolios.length).toFixed(1);

  return (
    <ModuleShell
      icon={TrendingUp}
      hub="Finance & Insurance Hub"
      title="Client Portfolios"
      description="AUM rollups, allocation models, and advisor assignments across the book of business."
      primaryAction={{ label: "Add Portfolio" }}
      searchPlaceholder="Search portfolios by client or advisor..."
      stats={[
        { label: "Portfolios", value: portfolios.length },
        { label: "Total AUM", value: `$${(totalAUM / 1_000_000).toFixed(1)}M` },
        { label: "Avg YTD", value: `${avgReturn}%` },
        { label: "Advisors", value: new Set(portfolios.map((p) => p.advisor)).size },
      ]}
    >
      <ModuleTable
        columns={["Client", "AUM", "Allocation", "YTD Return", "Risk Profile", "Advisor"]}
        rows={portfolios.map((p) => [
          <span key="c" className="font-semibold text-text">{p.client}</span>,
          <span key="a" className="font-semibold text-green">${p.aum.toLocaleString()}</span>,
          <span key="al" className="text-text-dim">{p.allocation}</span>,
          <span key="y" className={`font-bold ${p.ytdReturn >= 8 ? "text-green" : "text-cyan"}`}>{p.ytdReturn.toFixed(1)}%</span>,
          <span key="r" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${riskColors[p.risk]}`}>{p.risk}</span>,
          <span key="ad" className="text-text-dim">{p.advisor}</span>,
        ])}
      />
    </ModuleShell>
  );
}
