"use client";

import { Home } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Property {
  id: string;
  address: string;
  city: string;
  status: "Active" | "Pending" | "Sold" | "Off Market";
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  agent: string;
}

const properties: Property[] = [
  { id: "MLS-4421", address: "1482 Coral Ridge Dr", city: "Fort Lauderdale, FL", status: "Active", price: 1285000, beds: 4, baths: 3, sqft: 3240, agent: "Elena Ruiz" },
  { id: "MLS-4422", address: "27 Laurel Canyon Way", city: "Austin, TX", status: "Pending", price: 874500, beds: 3, baths: 2.5, sqft: 2180, agent: "Marcus Patel" },
  { id: "MLS-4423", address: "618 Brookline Ave", city: "Boston, MA", status: "Active", price: 2150000, beds: 5, baths: 4, sqft: 4120, agent: "Sarah Nakamura" },
  { id: "MLS-4424", address: "9 Pacific Dunes Ct", city: "Santa Monica, CA", status: "Sold", price: 3485000, beds: 4, baths: 4.5, sqft: 3870, agent: "Elena Ruiz" },
  { id: "MLS-4425", address: "312 Maplewood Ln", city: "Minneapolis, MN", status: "Active", price: 512000, beds: 3, baths: 2, sqft: 1940, agent: "David Chen" },
  { id: "MLS-4426", address: "77 Harbor Point", city: "Seattle, WA", status: "Off Market", price: 1620000, beds: 3, baths: 3, sqft: 2610, agent: "Marcus Patel" },
  { id: "MLS-4427", address: "450 Buckhead Ridge", city: "Atlanta, GA", status: "Active", price: 945000, beds: 4, baths: 3, sqft: 2980, agent: "Tasha Williams" },
  { id: "MLS-4428", address: "1201 Lakeshore Dr", city: "Chicago, IL", status: "Pending", price: 1750000, beds: 3, baths: 3, sqft: 2450, agent: "Sarah Nakamura" },
  { id: "MLS-4429", address: "88 Camelback Rd", city: "Phoenix, AZ", status: "Active", price: 678000, beds: 4, baths: 2.5, sqft: 2720, agent: "David Chen" },
  { id: "MLS-4430", address: "525 Mercer St", city: "Brooklyn, NY", status: "Sold", price: 2895000, beds: 2, baths: 2, sqft: 1680, agent: "Tasha Williams" },
  { id: "MLS-4431", address: "14 Aspen Grove", city: "Denver, CO", status: "Active", price: 835000, beds: 3, baths: 2.5, sqft: 2210, agent: "Elena Ruiz" },
  { id: "MLS-4432", address: "309 Kiawah Island Pkwy", city: "Charleston, SC", status: "Pending", price: 1380000, beds: 4, baths: 3.5, sqft: 3060, agent: "Marcus Patel" },
];

const statusColors: Record<Property["status"], string> = {
  Active: "bg-green-500/15 text-green",
  Pending: "bg-orange-500/15 text-orange",
  Sold: "bg-accent/15 text-accent",
  "Off Market": "bg-red-500/15 text-red",
};

export default function RealEstatePropertiesPage() {
  const active = properties.filter((p) => p.status === "Active").length;
  const totalValue = properties.reduce((a, p) => a + p.price, 0);
  const avgPrice = Math.round(totalValue / properties.length);

  return (
    <ModuleShell
      icon={Home}
      hub="Real Estate Hub"
      title="Properties"
      description="Full property inventory with listing status, pricing, and agent assignments across every active and archived MLS record."
      primaryAction={{ label: "Add Property" }}
      searchPlaceholder="Search by address, MLS #, or agent..."
      stats={[
        { label: "Total Properties", value: properties.length },
        { label: "Active Listings", value: active },
        { label: "Portfolio Value", value: `$${(totalValue / 1_000_000).toFixed(1)}M` },
        { label: "Avg Price", value: `$${avgPrice.toLocaleString()}` },
      ]}
    >
      <ModuleTable
        columns={["MLS #", "Address", "Status", "Price", "Beds/Baths", "Sqft", "Agent"]}
        rows={properties.map((p) => [
          <span key="id" className="font-mono text-[10px] text-text-dim">{p.id}</span>,
          <div key="a">
            <div className="font-semibold text-text">{p.address}</div>
            <div className="text-[10px] text-text-dim">{p.city}</div>
          </div>,
          <span key="s" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[p.status]}`}>
            {p.status}
          </span>,
          <span key="p" className="font-semibold text-green">${p.price.toLocaleString()}</span>,
          <span key="b" className="text-text-dim">{p.beds}bd / {p.baths}ba</span>,
          <span key="sq" className="text-text-dim">{p.sqft.toLocaleString()}</span>,
          <span key="ag" className="text-text">{p.agent}</span>,
        ])}
      />
    </ModuleShell>
  );
}
