"use client";

import { Package } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Product {
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  variants: number;
  revenueYtd: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

const products: Product[] = [
  { sku: "NWM-APP-001", name: "Merino Travel Hoodie", category: "Apparel", price: 148, stock: 428, variants: 12, revenueYtd: 187_340, status: "In Stock" },
  { sku: "NWM-APP-002", name: "Organic Cotton Tee (3-Pack)", category: "Apparel", price: 64, stock: 1284, variants: 18, revenueYtd: 312_480, status: "In Stock" },
  { sku: "NWM-HOM-001", name: "Linen Bundle — King", category: "Home", price: 289, stock: 94, variants: 6, revenueYtd: 142_980, status: "Low Stock" },
  { sku: "NWM-HOM-002", name: "Ceramic Pour-Over Set", category: "Home", price: 78, stock: 0, variants: 3, revenueYtd: 89_760, status: "Out of Stock" },
  { sku: "NWM-BTY-001", name: "Vitamin C Serum 30ml", category: "Beauty", price: 52, stock: 672, variants: 2, revenueYtd: 218_940, status: "In Stock" },
  { sku: "NWM-BTY-002", name: "Overnight Repair Cream", category: "Beauty", price: 68, stock: 41, variants: 2, revenueYtd: 168_720, status: "Low Stock" },
  { sku: "NWM-FIT-001", name: "Resistance Band Kit", category: "Fitness", price: 42, stock: 318, variants: 4, revenueYtd: 74_820, status: "In Stock" },
  { sku: "NWM-FIT-002", name: "Cork Yoga Mat", category: "Fitness", price: 88, stock: 156, variants: 5, revenueYtd: 102_440, status: "In Stock" },
  { sku: "NWM-TCH-001", name: "USB-C Hub 8-in-1", category: "Tech", price: 94, stock: 22, variants: 2, revenueYtd: 156_200, status: "Low Stock" },
  { sku: "NWM-TCH-002", name: "Bamboo Wireless Charger", category: "Tech", price: 58, stock: 0, variants: 1, revenueYtd: 94_680, status: "Out of Stock" },
  { sku: "NWM-FOO-001", name: "Single-Origin Coffee (1lb)", category: "Food", price: 28, stock: 892, variants: 8, revenueYtd: 246_120, status: "In Stock" },
  { sku: "NWM-FOO-002", name: "Adaptogen Tea Trio", category: "Food", price: 38, stock: 204, variants: 3, revenueYtd: 68_920, status: "In Stock" },
];

const statusColors: Record<Product["status"], string> = {
  "In Stock": "bg-green-500/15 text-green",
  "Low Stock": "bg-orange-500/15 text-orange",
  "Out of Stock": "bg-red-500/15 text-red",
};

export default function EcommerceProductsPage() {
  const totalRevenue = products.reduce((a, p) => a + p.revenueYtd, 0);
  const avgPrice = Math.round(products.reduce((a, p) => a + p.price, 0) / products.length);
  const lowStock = products.filter((p) => p.status !== "In Stock").length;

  return (
    <ModuleShell
      icon={Package}
      hub="Commerce Hub"
      title="Product Catalog"
      description="Active SKUs across categories with inventory, pricing, variant counts, and year-to-date revenue performance."
      primaryAction={{ label: "Add Product" }}
      searchPlaceholder="Search by SKU, name, or category..."
      stats={[
        { label: "SKUs", value: products.length },
        { label: "Revenue YTD", value: `$${(totalRevenue / 1_000_000).toFixed(2)}M` },
        { label: "Avg Price", value: `$${avgPrice}` },
        { label: "Stock Issues", value: lowStock },
      ]}
    >
      <ModuleTable
        columns={["SKU", "Product", "Category", "Price", "Stock", "Variants", "Rev YTD", "Status"]}
        rows={products.map((p) => [
          <span key="sku" className="font-mono text-[10px] text-text-dim">{p.sku}</span>,
          <span key="n" className="font-semibold text-text">{p.name}</span>,
          <span key="c" className="text-text-dim">{p.category}</span>,
          <span key="pr" className="font-semibold text-text">${p.price}</span>,
          <span key="s" className={`font-bold ${p.stock === 0 ? "text-red" : p.stock < 100 ? "text-orange" : "text-text"}`}>{p.stock}</span>,
          <span key="v" className="text-text-dim">{p.variants}</span>,
          <span key="rv" className="font-semibold text-green">${p.revenueYtd.toLocaleString()}</span>,
          <span key="st" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[p.status]}`}>
            {p.status}
          </span>,
        ])}
      />
    </ModuleShell>
  );
}
