"use client";

import { Tag } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Listing {
  id: string;
  address: string;
  price: number;
  dom: number;
  views: number;
  inquiries: number;
  leads: number;
  temperature: "Hot" | "Warm" | "Cold";
}

const listings: Listing[] = [
  { id: "MLS-4421", address: "1482 Coral Ridge Dr", price: 1285000, dom: 6, views: 2184, inquiries: 47, leads: 12, temperature: "Hot" },
  { id: "MLS-4423", address: "618 Brookline Ave", price: 2150000, dom: 14, views: 1462, inquiries: 28, leads: 6, temperature: "Warm" },
  { id: "MLS-4425", address: "312 Maplewood Ln", price: 512000, dom: 3, views: 3201, inquiries: 82, leads: 19, temperature: "Hot" },
  { id: "MLS-4427", address: "450 Buckhead Ridge", price: 945000, dom: 22, views: 894, inquiries: 14, leads: 3, temperature: "Warm" },
  { id: "MLS-4429", address: "88 Camelback Rd", price: 678000, dom: 41, views: 612, inquiries: 8, leads: 2, temperature: "Cold" },
  { id: "MLS-4431", address: "14 Aspen Grove", price: 835000, dom: 9, views: 1748, inquiries: 36, leads: 9, temperature: "Hot" },
  { id: "MLS-4433", address: "2104 Ocean Breeze Ln", price: 1190000, dom: 18, views: 1280, inquiries: 22, leads: 5, temperature: "Warm" },
  { id: "MLS-4434", address: "67 Willow Creek Dr", price: 445000, dom: 2, views: 940, inquiries: 31, leads: 11, temperature: "Hot" },
  { id: "MLS-4435", address: "1502 Pinehurst Ct", price: 725000, dom: 35, views: 488, inquiries: 6, leads: 1, temperature: "Cold" },
  { id: "MLS-4436", address: "881 Cascade Falls", price: 1390000, dom: 11, views: 1622, inquiries: 29, leads: 7, temperature: "Warm" },
  { id: "MLS-4437", address: "45 Beacon Hill", price: 2480000, dom: 48, views: 372, inquiries: 4, leads: 1, temperature: "Cold" },
  { id: "MLS-4438", address: "720 Old Town Rd", price: 589000, dom: 7, views: 2014, inquiries: 44, leads: 13, temperature: "Hot" },
];

const tempColors: Record<Listing["temperature"], string> = {
  Hot: "bg-red-500/15 text-red",
  Warm: "bg-orange-500/15 text-orange",
  Cold: "bg-cyan-500/15 text-cyan",
};

export default function RealEstateListingsPage() {
  const totalLeads = listings.reduce((a, l) => a + l.leads, 0);
  const avgDom = Math.round(listings.reduce((a, l) => a + l.dom, 0) / listings.length);
  const totalViews = listings.reduce((a, l) => a + l.views, 0);

  return (
    <ModuleShell
      icon={Tag}
      hub="Real Estate Hub"
      title="Active Listings"
      description="Live marketing performance by listing with days-on-market, traffic, and conversion metrics so agents can prioritize stale inventory."
      primaryAction={{ label: "Add Listing" }}
      searchPlaceholder="Search listings..."
      stats={[
        { label: "Active Listings", value: listings.length },
        { label: "Avg DOM", value: `${avgDom} days` },
        { label: "Total Views", value: totalViews.toLocaleString() },
        { label: "Total Leads", value: totalLeads },
      ]}
    >
      <ModuleTable
        columns={["MLS #", "Address", "Price", "DOM", "Views", "Inquiries", "Leads", "Demand"]}
        rows={listings.map((l) => [
          <span key="id" className="font-mono text-[10px] text-text-dim">{l.id}</span>,
          <span key="a" className="font-semibold text-text">{l.address}</span>,
          <span key="p" className="font-semibold text-green">${l.price.toLocaleString()}</span>,
          <span key="d" className={`font-bold ${l.dom > 30 ? "text-red" : l.dom > 14 ? "text-orange" : "text-green"}`}>{l.dom}d</span>,
          <span key="v" className="text-text-dim">{l.views.toLocaleString()}</span>,
          <span key="i" className="text-text">{l.inquiries}</span>,
          <span key="l" className="font-semibold text-text">{l.leads}</span>,
          <span key="t" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${tempColors[l.temperature]}`}>
            {l.temperature}
          </span>,
        ])}
      />
    </ModuleShell>
  );
}
