"use client";

import { UtensilsCrossed } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface MenuItem {
  id: string;
  category: "Starters" | "Mains" | "Pasta" | "Dessert" | "Wine" | "Cocktails";
  name: string;
  price: number;
  cost: number;
  inventory: "Available" | "Low" | "86'd";
  soldToday: number;
}

const menu: MenuItem[] = [
  { id: "M-101", category: "Starters", name: "Burrata with Stone Fruit", price: 18, cost: 5.2, inventory: "Available", soldToday: 24 },
  { id: "M-102", category: "Starters", name: "Tuna Crudo, Ponzu", price: 22, cost: 7.8, inventory: "Low", soldToday: 31 },
  { id: "M-103", category: "Starters", name: "Charred Shishito Peppers", price: 14, cost: 2.6, inventory: "Available", soldToday: 19 },
  { id: "M-201", category: "Pasta", name: "Cacio e Pepe", price: 26, cost: 4.8, inventory: "Available", soldToday: 42 },
  { id: "M-202", category: "Pasta", name: "Lamb Ragu Pappardelle", price: 32, cost: 9.2, inventory: "Available", soldToday: 28 },
  { id: "M-301", category: "Mains", name: "Dry-Aged Ribeye 16oz", price: 68, cost: 22.4, inventory: "Available", soldToday: 18 },
  { id: "M-302", category: "Mains", name: "Pan-Seared Halibut", price: 48, cost: 15.8, inventory: "86'd", soldToday: 12 },
  { id: "M-303", category: "Mains", name: "Roasted Duck Breast", price: 42, cost: 13.6, inventory: "Available", soldToday: 16 },
  { id: "M-304", category: "Mains", name: "Charred Cauliflower Steak", price: 28, cost: 5.4, inventory: "Available", soldToday: 11 },
  { id: "M-401", category: "Dessert", name: "Olive Oil Cake", price: 14, cost: 2.8, inventory: "Available", soldToday: 22 },
  { id: "M-402", category: "Dessert", name: "Dark Chocolate Budino", price: 12, cost: 2.4, inventory: "Low", soldToday: 18 },
  { id: "M-501", category: "Wine", name: "Barolo 2019, glass", price: 28, cost: 8.4, inventory: "Available", soldToday: 34 },
  { id: "M-601", category: "Cocktails", name: "House Negroni", price: 16, cost: 3.2, inventory: "Available", soldToday: 46 },
  { id: "M-602", category: "Cocktails", name: "Smoked Old Fashioned", price: 18, cost: 4.1, inventory: "Available", soldToday: 38 },
];

const invColors: Record<MenuItem["inventory"], string> = {
  Available: "bg-green-500/15 text-green",
  Low: "bg-orange-500/15 text-orange",
  "86'd": "bg-red-500/15 text-red",
};

export default function HospitalityMenusPage() {
  const totalRevenueToday = menu.reduce((a, m) => a + m.price * m.soldToday, 0);
  const totalCostToday = menu.reduce((a, m) => a + m.cost * m.soldToday, 0);
  const avgMargin = Math.round(((totalRevenueToday - totalCostToday) / totalRevenueToday) * 100);
  const eightySixed = menu.filter((m) => m.inventory === "86'd").length;

  return (
    <ModuleShell
      icon={UtensilsCrossed}
      hub="Hospitality Hub"
      title="Menu Items"
      description="Full menu with today's covers, food-cost margin, and 86 tracking so the kitchen and FOH stay in sync."
      primaryAction={{ label: "Add Item" }}
      searchPlaceholder="Search menu..."
      stats={[
        { label: "Menu Items", value: menu.length },
        { label: "Revenue Today", value: `$${totalRevenueToday.toLocaleString()}` },
        { label: "Avg Margin", value: `${avgMargin}%` },
        { label: "86'd Items", value: eightySixed },
      ]}
    >
      <ModuleTable
        columns={["ID", "Category", "Name", "Price", "Cost", "Margin", "Sold Today", "Inventory"]}
        rows={menu.map((m) => {
          const margin = Math.round(((m.price - m.cost) / m.price) * 100);
          return [
            <span key="id" className="font-mono text-[10px] text-text-dim">{m.id}</span>,
            <span key="c" className="text-[10px] font-semibold text-text-dim uppercase tracking-wider">{m.category}</span>,
            <span key="n" className="font-semibold text-text">{m.name}</span>,
            <span key="p" className="font-semibold text-green">${m.price}</span>,
            <span key="co" className="text-text-dim">${m.cost.toFixed(2)}</span>,
            <span key="ma" className={`font-bold ${margin >= 70 ? "text-green" : margin >= 50 ? "text-cyan" : "text-orange"}`}>{margin}%</span>,
            <span key="s" className="font-semibold text-text">{m.soldToday}</span>,
            <span key="i" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${invColors[m.inventory]}`}>
              {m.inventory}
            </span>,
          ];
        })}
      />
    </ModuleShell>
  );
}
