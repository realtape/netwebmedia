"use client";

import { Package } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Material {
  sku: string;
  name: string;
  qty: number;
  unitCost: number;
  supplier: string;
  reorder: number;
}

const materials: Material[] = [
  { sku: "LUM-2x4-8", name: "2x4 SPF Stud 8ft", qty: 840, unitCost: 4.82, supplier: "Heartland Lumber Co", reorder: 500 },
  { sku: "OSB-4x8-7/16", name: "OSB Sheathing 7/16 in", qty: 212, unitCost: 28.4, supplier: "Heartland Lumber Co", reorder: 150 },
  { sku: "DRW-4x8-1/2", name: "Drywall 1/2 in 4x8", qty: 96, unitCost: 14.2, supplier: "Cornerstone Drywall", reorder: 120 },
  { sku: "CON-MIX-80", name: "Concrete Mix 80lb", qty: 322, unitCost: 6.74, supplier: "Rockline Concrete", reorder: 200 },
  { sku: "PVC-3-10", name: "PVC Pipe 3in x 10ft", qty: 58, unitCost: 22.8, supplier: "Summit Plumbing Supply", reorder: 60 },
  { sku: "WIR-12-250", name: "12 AWG Romex 250ft", qty: 44, unitCost: 142.9, supplier: "Beacon Electric", reorder: 30 },
  { sku: "INS-R30-15", name: "R-30 Insulation 15in", qty: 28, unitCost: 68.5, supplier: "Cornerstone Drywall", reorder: 40 },
  { sku: "ROF-SHG-33", name: "Architectural Shingles", qty: 78, unitCost: 94.0, supplier: "Topline Roofing", reorder: 50 },
  { sku: "NAI-16D-50", name: "16D Framing Nails 50lb", qty: 18, unitCost: 88.2, supplier: "Heartland Lumber Co", reorder: 12 },
  { sku: "PNT-INT-5", name: "Interior Paint 5gal", qty: 52, unitCost: 112.0, supplier: "Redwing Paint", reorder: 30 },
  { sku: "TIL-CER-12", name: "Ceramic Tile 12in box", qty: 146, unitCost: 34.7, supplier: "Azure Tile & Stone", reorder: 80 },
  { sku: "WIN-36-48", name: "Window 36x48 Vinyl", qty: 14, unitCost: 285.0, supplier: "Northfield Windows", reorder: 20 },
];

export default function MaterialsPage() {
  const totalValue = materials.reduce((a, m) => a + m.qty * m.unitCost, 0);
  const belowReorder = materials.filter((m) => m.qty < m.reorder).length;
  const suppliers = new Set(materials.map((m) => m.supplier)).size;

  return (
    <ModuleShell
      icon={Package}
      hub="Construction Hub"
      title="Materials"
      description="On-site inventory, reorder thresholds, supplier assignments, and carrying value."
      primaryAction={{ label: "Add Material" }}
      searchPlaceholder="Search materials by SKU or name..."
      stats={[
        { label: "SKUs", value: materials.length },
        { label: "Inventory Value", value: `$${Math.round(totalValue).toLocaleString()}` },
        { label: "Below Reorder", value: belowReorder },
        { label: "Suppliers", value: suppliers },
      ]}
    >
      <ModuleTable
        columns={["SKU", "Material", "Qty on Hand", "Unit Cost", "Supplier", "Reorder Point"]}
        rows={materials.map((m) => [
          <span key="s" className="font-semibold text-text">{m.sku}</span>,
          <span key="n" className="text-text">{m.name}</span>,
          <span key="q" className={`font-bold ${m.qty < m.reorder ? "text-orange" : "text-green"}`}>{m.qty}</span>,
          <span key="u" className="font-semibold text-text">${m.unitCost.toFixed(2)}</span>,
          <span key="sp" className="text-text-dim">{m.supplier}</span>,
          <span key="r" className="text-text-dim">{m.reorder}</span>,
        ])}
      />
    </ModuleShell>
  );
}
