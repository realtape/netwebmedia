"use client";

import { ShoppingCart } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

interface Order {
  id: string;
  date: string;
  customer: string;
  total: number;
  items: number;
  shipping: string;
  status: "Pending" | "Paid" | "Fulfilled" | "Shipped" | "Delivered" | "Refunded";
}

const orders: Order[] = [
  { id: "#NWM-30482", date: "Apr 20", customer: "Hannah Drummond", total: 248.40, items: 3, shipping: "UPS Ground", status: "Paid" },
  { id: "#NWM-30483", date: "Apr 20", customer: "Jamal Rivers", total: 64.00, items: 1, shipping: "USPS First-Class", status: "Shipped" },
  { id: "#NWM-30484", date: "Apr 20", customer: "Sofía Aguilar", total: 412.80, items: 5, shipping: "FedEx 2-Day", status: "Fulfilled" },
  { id: "#NWM-30485", date: "Apr 19", customer: "Theodore Whitlock", total: 158.60, items: 2, shipping: "UPS Ground", status: "Delivered" },
  { id: "#NWM-30486", date: "Apr 19", customer: "Priya Chandrasekar", total: 92.00, items: 2, shipping: "USPS First-Class", status: "Delivered" },
  { id: "#NWM-30487", date: "Apr 19", customer: "Oliver Brenneman", total: 524.00, items: 7, shipping: "FedEx Overnight", status: "Paid" },
  { id: "#NWM-30488", date: "Apr 19", customer: "Anonymous Guest", total: 38.00, items: 1, shipping: "USPS Media Mail", status: "Pending" },
  { id: "#NWM-30489", date: "Apr 18", customer: "Clara Okonkwo", total: 316.00, items: 4, shipping: "UPS Ground", status: "Refunded" },
  { id: "#NWM-30490", date: "Apr 18", customer: "Noah Steinberg", total: 146.80, items: 2, shipping: "USPS Priority", status: "Delivered" },
  { id: "#NWM-30491", date: "Apr 18", customer: "Valentina Rossi", total: 192.00, items: 3, shipping: "DHL Express", status: "Shipped" },
  { id: "#NWM-30492", date: "Apr 17", customer: "Benjamin Kuznetsov", total: 84.00, items: 2, shipping: "USPS First-Class", status: "Delivered" },
  { id: "#NWM-30493", date: "Apr 17", customer: "Ling Mei Tan", total: 428.80, items: 6, shipping: "FedEx 2-Day", status: "Delivered" },
];

const statusColors: Record<Order["status"], string> = {
  Pending: "bg-orange-500/15 text-orange",
  Paid: "bg-accent/15 text-accent",
  Fulfilled: "bg-cyan-500/15 text-cyan",
  Shipped: "bg-purple-500/15 text-purple-400",
  Delivered: "bg-green-500/15 text-green",
  Refunded: "bg-red-500/15 text-red",
};

export default function EcommerceOrdersPage() {
  const totalRevenue = orders.filter((o) => o.status !== "Refunded").reduce((a, o) => a + o.total, 0);
  const aov = totalRevenue / orders.length;
  const pending = orders.filter((o) => o.status === "Pending" || o.status === "Paid").length;

  return (
    <ModuleShell
      icon={ShoppingCart}
      hub="Commerce Hub"
      title="Orders"
      description="Real-time order queue with payment status, fulfillment progress, and shipping carrier tracking."
      primaryAction={{ label: "Create Order" }}
      searchPlaceholder="Search by order # or customer..."
      stats={[
        { label: "Orders", value: orders.length },
        { label: "Gross Revenue", value: `$${totalRevenue.toFixed(2)}` },
        { label: "AOV", value: `$${aov.toFixed(2)}` },
        { label: "Needs Fulfillment", value: pending },
      ]}
    >
      <ModuleTable
        columns={["Order #", "Date", "Customer", "Total", "Items", "Shipping", "Status"]}
        rows={orders.map((o) => [
          <span key="id" className="font-mono text-[10px] text-text-dim">{o.id}</span>,
          <span key="d" className="font-semibold text-text">{o.date}</span>,
          <span key="c" className="text-text">{o.customer}</span>,
          <span key="t" className="font-semibold text-green">${o.total.toFixed(2)}</span>,
          <span key="i" className="text-text-dim">{o.items}</span>,
          <span key="sh" className="text-text-dim">{o.shipping}</span>,
          <span key="st" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusColors[o.status]}`}>
            {o.status}
          </span>,
        ])}
      />
    </ModuleShell>
  );
}
