"use client";

import { Warehouse } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Inventory {
  sku: string;
  product: string;
  stock: number;
  reorderAt: number;
  warehouse: string;
  velocity: number;
  daysOfSupply: number;
}

const inventory: Inventory[] = [
  { sku: "NWM-APP-001", product: "Merino Travel Hoodie", stock: 428, reorderAt: 150, warehouse: "CA-01 Oakland", velocity: 18, daysOfSupply: 24 },
  { sku: "NWM-APP-002", product: "Organic Cotton Tee (3-Pack)", stock: 1284, reorderAt: 400, warehouse: "OH-02 Columbus", velocity: 42, daysOfSupply: 31 },
  { sku: "NWM-HOM-001", product: "Linen Bundle — King", stock: 94, reorderAt: 100, warehouse: "TX-01 Dallas", velocity: 6, daysOfSupply: 15 },
  { sku: "NWM-HOM-002", product: "Ceramic Pour-Over Set", stock: 0, reorderAt: 80, warehouse: "OH-02 Columbus", velocity: 11, daysOfSupply: 0 },
  { sku: "NWM-BTY-001", product: "Vitamin C Serum 30ml", stock: 672, reorderAt: 200, warehouse: "NY-01 Brooklyn", velocity: 28, daysOfSupply: 24 },
  { sku: "NWM-BTY-002", product: "Overnight Repair Cream", stock: 41, reorderAt: 120, warehouse: "NY-01 Brooklyn", velocity: 9, daysOfSupply: 5 },
  { sku: "NWM-FIT-001", product: "Resistance Band Kit", stock: 318, reorderAt: 150, warehouse: "CA-01 Oakland", velocity: 14, daysOfSupply: 22 },
  { sku: "NWM-FIT-002", product: "Cork Yoga Mat", stock: 156, reorderAt: 100, warehouse: "TX-01 Dallas", velocity: 8, daysOfSupply: 19 },
  { sku: "NWM-TCH-001", product: "USB-C Hub 8-in-1", stock: 22, reorderAt: 100, warehouse: "CA-01 Oakland", velocity: 16, daysOfSupply: 1 },
  { sku: "NWM-TCH-002", product: "Bamboo Wireless Charger", stock: 0, reorderAt: 80, warehouse: "CA-01 Oakland", velocity: 10, daysOfSupply: 0 },
  { sku: "NWM-FOO-001", product: "Single-Origin Coffee (1lb)", stock: 892, reorderAt: 300, warehouse: "WA-01 Seattle", velocity: 34, daysOfSupply: 26 },
  { sku: "NWM-FOO-002", product: "Adaptogen Tea Trio", stock: 204, reorderAt: 150, warehouse: "WA-01 Seattle", velocity: 12, daysOfSupply: 17 },
];

function stockColor(item: Inventory) {
  if (item.stock === 0) return "bg-red-500/15 text-red";
  if (item.stock <= item.reorderAt) return "bg-orange-500/15 text-orange";
  return "bg-green-500/15 text-green";
}

function stockLabel(item: Inventory) {
  if (item.stock === 0) return "Out";
  if (item.stock <= item.reorderAt) return "Reorder";
  return "Healthy";
}

export default function EcommerceInventoryPage() {
  const outOfStock = inventory.filter((i) => i.stock === 0).length;
  const reorder = inventory.filter((i) => i.stock > 0 && i.stock <= i.reorderAt).length;
  const totalUnits = inventory.reduce((a, i) => a + i.stock, 0);

  return (
    <ModuleShell
      icon={Warehouse}
      hub="Commerce Hub"
      title="Inventory"
      description="Warehouse stock positions with reorder points, sales velocity, and days-of-supply forecasting across fulfillment centers."
      primaryAction={{ label: "Receive Stock" }}
      searchPlaceholder="Search inventory by SKU or warehouse..."
      stats={[
        { label: "SKUs", value: inventory.length },
        { label: "Total Units", value: totalUnits.toLocaleString() },
        { label: "Reorder Soon", value: reorder },
        { label: "Out of Stock", value: outOfStock },
      ]}
    >
      <ModuleTable
        columns={["SKU", "Product", "Warehouse", "On Hand", "Reorder At", "Velocity/Day", "Days Supply", "Health"]}
        rows={inventory.map((i) => [
          <span key="sku" className="font-mono text-[10px] text-text-dim">{i.sku}</span>,
          <span key="p" className="font-semibold text-text">{i.product}</span>,
          <span key="w" className="text-text-dim">{i.warehouse}</span>,
          <span key="s" className="font-bold text-text">{i.stock}</span>,
          <span key="r" className="text-text-dim">{i.reorderAt}</span>,
          <span key="v" className="text-text">{i.velocity}</span>,
          <span key="ds" className={`font-semibold ${i.daysOfSupply < 7 ? "text-red" : i.daysOfSupply < 15 ? "text-orange" : "text-green"}`}>{i.daysOfSupply}d</span>,
          <span key="h" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${stockColor(i)}`}>
            {stockLabel(i)}
          </span>,
        ])}
      />
    </ModuleShell>
  );
}
