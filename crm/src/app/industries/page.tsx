"use client";

import Link from "next/link";
import {
  Home as HomeIcon,
  HeartPulse,
  ShoppingBag,
  Code2,
  UtensilsCrossed,
  Scale,
  Wrench,
  DollarSign,
  GraduationCap,
  Hammer,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { ModuleShell } from "@/components/module-shell";

type Vertical = {
  slug: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  modules: { label: string; href: string }[];
};

const verticals: Vertical[] = [
  {
    slug: "real-estate",
    name: "Real Estate",
    icon: HomeIcon,
    color: "bg-orange-500/15 text-orange-400",
    description:
      "Listings, agent profiles, showing bookings, and buyer/seller pipeline.",
    modules: [
      { label: "Properties", href: "/industries/real-estate/properties" },
      { label: "Active Listings", href: "/industries/real-estate/listings" },
      { label: "Showing Bookings", href: "/industries/real-estate/bookings" },
    ],
  },
  {
    slug: "healthcare",
    name: "Healthcare / Wellness",
    icon: HeartPulse,
    color: "bg-red-500/15 text-red-400",
    description:
      "Patient records, appointments, provider schedules, and HIPAA-aware workflows.",
    modules: [
      { label: "Patients", href: "/industries/healthcare/patients" },
      { label: "Appointments", href: "/industries/healthcare/appointments" },
      { label: "Providers", href: "/industries/healthcare/providers" },
    ],
  },
  {
    slug: "ecommerce",
    name: "E-Commerce / DTC",
    icon: ShoppingBag,
    color: "bg-green-500/15 text-green-400",
    description:
      "Product catalog, orders, inventory, and lifecycle retention flows.",
    modules: [
      { label: "Products", href: "/industries/ecommerce/products" },
      { label: "Orders", href: "/industries/ecommerce/orders" },
      { label: "Inventory", href: "/industries/ecommerce/inventory" },
    ],
  },
  {
    slug: "saas",
    name: "SaaS / Technology",
    icon: Code2,
    color: "bg-cyan-500/15 text-cyan-400",
    description:
      "Subscribers, plans, usage metrics, activation funnels, expansion playbooks.",
    modules: [
      { label: "Subscribers", href: "/industries/saas/subscribers" },
      { label: "Plans", href: "/industries/saas/plans" },
      { label: "Usage Metrics", href: "/industries/saas/usage-metrics" },
    ],
  },
  {
    slug: "hospitality",
    name: "Restaurants & Hospitality",
    icon: UtensilsCrossed,
    color: "bg-amber-500/15 text-amber-400",
    description: "Reservations, table management, menus, and guest loyalty.",
    modules: [
      { label: "Reservations", href: "/industries/hospitality/reservations" },
      { label: "Tables", href: "/industries/hospitality/tables" },
      { label: "Menus", href: "/industries/hospitality/menus" },
    ],
  },
  {
    slug: "professional-services",
    name: "Professional Services",
    icon: Scale,
    color: "bg-purple-500/15 text-purple-400",
    description:
      "Matters, time tracking, retainers — law, accounting, consulting workflows.",
    modules: [
      {
        label: "Matters / Cases",
        href: "/industries/professional-services/matters",
      },
      {
        label: "Time Tracking",
        href: "/industries/professional-services/time-tracking",
      },
      {
        label: "Retainers",
        href: "/industries/professional-services/retainers",
      },
    ],
  },
  {
    slug: "local-services",
    name: "Local Services",
    icon: Wrench,
    color: "bg-sky-500/15 text-sky-400",
    description:
      "Home services, auto, beauty — job dispatch and technician routing.",
    modules: [
      { label: "Jobs", href: "/industries/local-services/jobs" },
      { label: "Technicians", href: "/industries/local-services/technicians" },
      { label: "Dispatch", href: "/industries/local-services/dispatch" },
    ],
  },
  {
    slug: "finance",
    name: "Finance / Insurance",
    icon: DollarSign,
    color: "bg-emerald-500/15 text-emerald-400",
    description:
      "Portfolios, policies, claims, and compliance-aware client comms.",
    modules: [
      { label: "Portfolios", href: "/industries/finance/portfolios" },
      { label: "Policies", href: "/industries/finance/policies" },
      { label: "Claims", href: "/industries/finance/claims" },
    ],
  },
  {
    slug: "education",
    name: "Education / EdTech",
    icon: GraduationCap,
    color: "bg-indigo-500/15 text-indigo-400",
    description:
      "Student progress, course catalogs, enrollments, completion analytics.",
    modules: [
      { label: "Students", href: "/industries/education/students" },
      { label: "Courses", href: "/industries/education/courses" },
      { label: "Enrollments", href: "/industries/education/enrollments" },
    ],
  },
  {
    slug: "construction",
    name: "Construction",
    icon: Hammer,
    color: "bg-yellow-500/15 text-yellow-400",
    description:
      "Projects, materials, subcontractor management, and budget tracking.",
    modules: [
      { label: "Projects", href: "/industries/construction/projects" },
      { label: "Materials", href: "/industries/construction/materials" },
      {
        label: "Subcontractors",
        href: "/industries/construction/subcontractors",
      },
    ],
  },
  {
    slug: "agencies",
    name: "Marketing Agencies",
    icon: Briefcase,
    color: "bg-pink-500/15 text-pink-400",
    description:
      "White-label NWM SaaS — resell the full platform under your own brand.",
    modules: [
      { label: "Sub-Accounts", href: "/industries/agencies/sub-accounts" },
      { label: "White-Label", href: "/industries/agencies/white-label" },
      { label: "Client Portals", href: "/industries/agencies/client-portals" },
    ],
  },
];

export default function IndustriesHubPage() {
  return (
    <ModuleShell
      icon={Briefcase}
      hub="Vertical CRMs"
      title="Industries"
      description="Industry-specific CRM backends with the exact objects your vertical runs on. 11 verticals × 3 modules each = 33 purpose-built screens."
      stats={[
        { label: "Verticals", value: verticals.length },
        { label: "Modules", value: verticals.reduce((a, v) => a + v.modules.length, 0) },
        { label: "CMS Templates", value: 33 },
        { label: "Status", value: "Live" },
      ]}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {verticals.map((v) => {
          const Icon = v.icon;
          return (
            <div
              key={v.slug}
              className="bg-bg-card border border-border rounded-xl p-5 hover:border-accent/50 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${v.color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-text text-sm leading-tight">{v.name}</h3>
                </div>
              </div>
              <p className="text-xs text-text-dim mb-4 leading-relaxed">{v.description}</p>
              <div className="space-y-1 pt-3 border-t border-border">
                {v.modules.map((m) => (
                  <Link
                    key={m.href}
                    href={m.href}
                    className="flex items-center justify-between text-xs text-text hover:text-accent py-1.5 transition-colors"
                  >
                    <span>{m.label}</span>
                    <ArrowRight size={12} className="text-text-dim" />
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </ModuleShell>
  );
}
