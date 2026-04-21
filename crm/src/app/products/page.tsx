"use client";

import { ShoppingBag } from "lucide-react";
import { ModuleShell, ModuleCards, ModuleCard } from "@/components/module-shell";
import { products } from "@/lib/mock-data-extended";

export default function ProductsPage() {
  const plans = products.filter((p) => p.category === "Plans").length;
  const addons = products.filter((p) => p.category === "Add-ons").length;
  const avgPrice = Math.round(products.reduce((a, p) => a + p.price, 0) / products.length);

  return (
    <ModuleShell
      icon={ShoppingBag}
      hub="Sales Hub"
      title="Products & Services"
      description="Catalog of plans, add-ons and services with SKUs, recurring billing, and unit tracking."
      primaryAction={{ label: "Add Product" }}
      searchPlaceholder="Search products..."
      stats={[
        { label: "Total Products", value: products.length },
        { label: "Active Plans", value: plans },
        { label: "Add-ons", value: addons },
        { label: "Avg Price", value: `$${avgPrice}` },
      ]}
    >
      <ModuleCards>
        {products.map((p) => (
          <ModuleCard
            key={p.id}
            title={p.name}
            subtitle={`$${p.price}${p.recurring === "one-time" ? "" : `/${p.recurring === "monthly" ? "mo" : "yr"}`}`}
            badge={p.category}
            badgeColor={p.category === "Plans" ? "accent" : p.category === "Add-ons" ? "purple" : "cyan"}
          >
            <div className="text-xs text-text-dim mb-3">{p.description}</div>
            <div className="flex items-center justify-between text-[11px] border-t border-border pt-3">
              <span className="text-text-dim">SKU: <span className="text-text font-mono">{p.sku}</span></span>
              <span className="text-text-dim">Sold: <span className="text-text font-semibold">{p.unitsSold}</span></span>
            </div>
          </ModuleCard>
        ))}
      </ModuleCards>
    </ModuleShell>
  );
}
