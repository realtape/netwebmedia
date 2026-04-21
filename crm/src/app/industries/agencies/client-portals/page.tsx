"use client";

import { DoorOpen } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

type Tier = "Starter" | "Growth" | "Scale" | "Enterprise";

const tierColors: Record<Tier, string> = {
  Starter: "bg-cyan/15 text-cyan",
  Growth: "bg-accent/15 text-accent",
  Scale: "bg-purple-500/15 text-purple-400",
  Enterprise: "bg-green/15 text-green",
};

interface Portal {
  client: string;
  url: string;
  activeUsers: number;
  lastLogin: string;
  openTickets: number;
  tier: Tier;
}

const portals: Portal[] = [
  { client: "Evergreen Homes", url: "portal.ridgelinedigital.com/evergreen", activeUsers: 6, lastLogin: "12m ago", openTickets: 2, tier: "Growth" },
  { client: "Sunrise Fitness Group", url: "portal.brightloop.app/sunrise", activeUsers: 4, lastLogin: "2h ago", openTickets: 0, tier: "Starter" },
  { client: "MetroLaw Group", url: "ops.catalystagency.com/metrolaw", activeUsers: 9, lastLogin: "45m ago", openTickets: 1, tier: "Scale" },
  { client: "Harbor Medical", url: "portal.novareach.io/harbor", activeUsers: 12, lastLogin: "5m ago", openTickets: 3, tier: "Enterprise" },
  { client: "North Star Realty", url: "hq.westbrookmedia.com/northstar", activeUsers: 5, lastLogin: "1d ago", openTickets: 0, tier: "Growth" },
  { client: "Copper Kitchen Co", url: "hq.tidewatergrowth.com/copperkitchen", activeUsers: 3, lastLogin: "4h ago", openTickets: 1, tier: "Starter" },
  { client: "Delta Auto Group", url: "app.redthread.agency/delta", activeUsers: 8, lastLogin: "22m ago", openTickets: 2, tier: "Scale" },
  { client: "Ember Capital", url: "app.fieldstonepartners.com/ember", activeUsers: 14, lastLogin: "7m ago", openTickets: 1, tier: "Enterprise" },
  { client: "Pioneer Charter", url: "crm.solsticemedia.co/pioneer", activeUsers: 2, lastLogin: "3d ago", openTickets: 4, tier: "Growth" },
  { client: "Driftwood Cafe Group", url: "hq.tidewatergrowth.com/driftwood", activeUsers: 3, lastLogin: "6h ago", openTickets: 0, tier: "Starter" },
  { client: "Magnolia Pediatrics", url: "portal.novareach.io/magnolia", activeUsers: 7, lastLogin: "1h ago", openTickets: 1, tier: "Growth" },
  { client: "Summit Wealth Advisors", url: "app.fieldstonepartners.com/summit", activeUsers: 11, lastLogin: "18m ago", openTickets: 2, tier: "Scale" },
];

export default function ClientPortalsPage() {
  const totalUsers = portals.reduce((a, p) => a + p.activeUsers, 0);
  const openTickets = portals.reduce((a, p) => a + p.openTickets, 0);
  const enterprise = portals.filter((p) => p.tier === "Enterprise").length;

  return (
    <ModuleShell
      icon={DoorOpen}
      hub="Agency Partner Hub"
      title="Client Portals"
      description="End-client login footprint across sub-accounts with ticket volume and tier breakdown."
      primaryAction={{ label: "Add Portal" }}
      searchPlaceholder="Search portals by client or URL..."
      stats={[
        { label: "Portals", value: portals.length },
        { label: "Active Users", value: totalUsers },
        { label: "Open Tickets", value: openTickets },
        { label: "Enterprise Tier", value: enterprise },
      ]}
    >
      <ModuleTable
        columns={["Client", "Portal URL", "Active Users", "Last Login", "Open Tickets", "Tier"]}
        rows={portals.map((p) => [
          <span key="c" className="font-semibold text-text">{p.client}</span>,
          <span key="u" className="text-text-dim">{p.url}</span>,
          <span key="a" className="font-semibold text-text">{p.activeUsers}</span>,
          <span key="ll" className="text-text-dim">{p.lastLogin}</span>,
          <span key="o" className={`font-bold ${p.openTickets > 2 ? "text-orange" : p.openTickets > 0 ? "text-cyan" : "text-text-dim"}`}>{p.openTickets}</span>,
          <span key="t" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${tierColors[p.tier]}`}>{p.tier}</span>,
        ])}
      />
    </ModuleShell>
  );
}
