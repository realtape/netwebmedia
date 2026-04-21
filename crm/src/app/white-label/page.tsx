"use client";

import { Sparkles, Palette, Globe, Mail, Shield } from "lucide-react";
import { ModuleShell } from "@/components/module-shell";

const features = [
  { icon: Palette, title: "Custom Branding", desc: "Logo, color palette, favicon, login page background — all per sub-account." },
  { icon: Globe, title: "Custom Domain", desc: "app.youragency.com — white-label CNAME with automated SSL provisioning." },
  { icon: Mail, title: "Email From Your Domain", desc: "Outbound email uses your domain with SPF, DKIM, DMARC auto-configured." },
  { icon: Shield, title: "Hidden 'Powered By'", desc: "No NetWebMedia branding anywhere — your clients never see the underlying platform." },
];

export default function WhiteLabelPage() {
  return (
    <ModuleShell
      icon={Sparkles}
      hub="Agency / Partner"
      title="White-label"
      description="Ship NWM under your brand. Domain, logo, colors, email, login page — the works. Included in Agency plan — no upcharges."
      primaryAction={{ label: "Configure Brand" }}
      stats={[
        { label: "Brand Assets", value: 8 },
        { label: "Custom Domains", value: 12 },
        { label: "Provisioned SSL", value: 12 },
        { label: "Sub-accounts", value: 8 },
      ]}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {features.map((f) => (
          <div key={f.title} className="bg-bg-card border border-border rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center text-accent shrink-0">
                <f.icon size={16} />
              </div>
              <div>
                <div className="text-sm font-bold text-text mb-1">{f.title}</div>
                <div className="text-[11px] text-text-dim">{f.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-accent/10 to-purple-500/10 border border-accent/30 rounded-xl p-6">
        <div className="text-sm font-bold text-text mb-1">Active Configuration</div>
        <div className="text-[11px] text-text-dim mb-4">Your agency brand is live on 12 sub-accounts.</div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Primary Color</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-6 h-6 rounded bg-accent"></div>
              <span className="text-xs font-mono text-text">#FF6B00</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Domain</div>
            <div className="text-xs font-mono text-text mt-1">app.youragency.com</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">SSL</div>
            <div className="text-xs font-semibold text-green mt-1">✓ Valid · 87 days</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Email Domain</div>
            <div className="text-xs font-mono text-text mt-1">mail.youragency.com</div>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}
