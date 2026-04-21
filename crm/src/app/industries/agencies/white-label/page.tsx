"use client";

import { Palette } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";

type LogoStatus = "Uploaded" | "Pending" | "Needs Review";

const logoColors: Record<LogoStatus, string> = {
  Uploaded: "bg-green/15 text-green",
  Pending: "bg-orange/15 text-orange",
  "Needs Review": "bg-red/15 text-red",
};

interface WhiteLabel {
  brand: string;
  domain: string;
  logo: LogoStatus;
  scheme: string;
  customEmail: boolean;
  seats: number;
}

const configs: WhiteLabel[] = [
  { brand: "Ridgeline Digital", domain: "app.ridgelinedigital.com", logo: "Uploaded", scheme: "Forest", customEmail: true, seats: 18 },
  { brand: "Peak Growth Co", domain: "crm.peakgrowth.co", logo: "Uploaded", scheme: "Midnight", customEmail: true, seats: 24 },
  { brand: "Westbrook Media", domain: "hq.westbrookmedia.com", logo: "Uploaded", scheme: "Slate", customEmail: true, seats: 12 },
  { brand: "Nova Reach", domain: "portal.novareach.io", logo: "Uploaded", scheme: "Cobalt", customEmail: true, seats: 22 },
  { brand: "Catalyst Ops", domain: "ops.catalystagency.com", logo: "Needs Review", scheme: "Graphite", customEmail: false, seats: 15 },
  { brand: "Fieldstone Partners", domain: "app.fieldstonepartners.com", logo: "Uploaded", scheme: "Oxblood", customEmail: true, seats: 30 },
  { brand: "Solstice Media", domain: "crm.solsticemedia.co", logo: "Pending", scheme: "Sunset", customEmail: false, seats: 10 },
  { brand: "Tidewater Growth", domain: "hq.tidewatergrowth.com", logo: "Uploaded", scheme: "Lagoon", customEmail: true, seats: 14 },
  { brand: "Redthread Digital", domain: "app.redthread.agency", logo: "Uploaded", scheme: "Crimson", customEmail: true, seats: 20 },
  { brand: "BrightLoop Studio", domain: "brightloop.app", logo: "Pending", scheme: "Solar", customEmail: false, seats: 6 },
  { brand: "Harbor Lab", domain: "app.harborlab.dev", logo: "Uploaded", scheme: "Marine", customEmail: false, seats: 8 },
  { brand: "Vantage Creative", domain: "crm.vantagecreative.co", logo: "Needs Review", scheme: "Default", customEmail: false, seats: 7 },
];

export default function WhiteLabelPage() {
  const totalSeats = configs.reduce((a, c) => a + c.seats, 0);
  const ready = configs.filter((c) => c.logo === "Uploaded").length;
  const customEmail = configs.filter((c) => c.customEmail).length;

  return (
    <ModuleShell
      icon={Palette}
      hub="Agency Partner Hub"
      title="White-Label Configs"
      description="Per-brand domain routing, theme palettes, sender identity, and seat allocation."
      primaryAction={{ label: "Add Config" }}
      searchPlaceholder="Search configs by brand or domain..."
      stats={[
        { label: "Configs", value: configs.length },
        { label: "Fully Branded", value: ready },
        { label: "Custom Email", value: customEmail },
        { label: "Total Seats", value: totalSeats },
      ]}
    >
      <ModuleTable
        columns={["Brand", "Custom Domain", "Logo Status", "Color Scheme", "Custom Email", "Monthly Seats"]}
        rows={configs.map((c) => [
          <span key="b" className="font-semibold text-text">{c.brand}</span>,
          <span key="d" className="text-text-dim">{c.domain}</span>,
          <span key="l" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${logoColors[c.logo]}`}>{c.logo}</span>,
          <span key="s" className="text-text-dim">{c.scheme}</span>,
          <span key="ce" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${c.customEmail ? "bg-accent/15 text-accent" : "bg-text-dim/15 text-text-dim"}`}>
            {c.customEmail ? "Yes" : "No"}
          </span>,
          <span key="se" className="font-semibold text-text">{c.seats}</span>,
        ])}
      />
    </ModuleShell>
  );
}
