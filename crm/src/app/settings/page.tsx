"use client";

import { useState } from "react";
import { Building2, Palette, Globe, Users, Shield, Bell, CreditCard } from "lucide-react";

const tabs = [
  { id: "general", label: "General", icon: Building2 },
  { id: "branding", label: "White Label", icon: Palette },
  { id: "team", label: "Team", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "security", label: "Security", icon: Shield },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-sm text-text-dim mt-1">Manage your CRM configuration</p>
      </div>

      <div className="flex gap-6">
        {/* Tabs */}
        <div className="w-48 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-accent text-white"
                  : "text-text-dim hover:bg-bg-hover hover:text-text"
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="bg-bg-card border border-border rounded-xl p-6">
                <h2 className="text-sm font-bold mb-4">Company Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1.5">Company Name</label>
                    <input type="text" defaultValue="NetWebMedia" className="w-full px-3 py-2.5 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1.5">Website</label>
                    <input type="text" defaultValue="https://netwebmedia.com" className="w-full px-3 py-2.5 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1.5">Industry</label>
                    <input type="text" defaultValue="Digital Marketing & Technology" className="w-full px-3 py-2.5 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1.5">Timezone</label>
                    <select className="w-full px-3 py-2.5 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:border-accent">
                      <option>America/New_York (EST)</option>
                      <option>America/Chicago (CST)</option>
                      <option>America/Denver (MST)</option>
                      <option>America/Los_Angeles (PST)</option>
                    </select>
                  </div>
                </div>
                <button className="mt-4 px-4 py-2 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent-light transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === "branding" && (
            <div className="space-y-6">
              <div className="bg-bg-card border border-border rounded-xl p-6">
                <h2 className="text-sm font-bold mb-1">White Label Settings</h2>
                <p className="text-xs text-text-dim mb-4">Customize the CRM branding for your clients</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1.5">Platform Name</label>
                    <input type="text" defaultValue="NetWebMedia CRM" className="w-full px-3 py-2.5 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1.5">Logo</label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <div className="text-text-dim text-xs">
                        Drag & drop your logo here, or <span className="text-accent-light cursor-pointer">browse</span>
                      </div>
                      <div className="text-[10px] text-text-dim mt-1">SVG, PNG, or JPG (max 2MB)</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1.5">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent border border-border cursor-pointer" />
                      <input type="text" defaultValue="#6c5ce7" className="w-32 px-3 py-2.5 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:border-accent" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1.5">Custom Domain</label>
                    <input type="text" placeholder="crm.yourdomain.com" className="w-full px-3 py-2.5 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1.5">Favicon</label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                      <div className="text-text-dim text-xs">Upload favicon (32x32 .ico or .png)</div>
                    </div>
                  </div>
                </div>
                <button className="mt-4 px-4 py-2 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent-light transition-colors">
                  Save Branding
                </button>
              </div>

              <div className="bg-bg-card border border-border rounded-xl p-6">
                <h2 className="text-sm font-bold mb-1">Email Templates</h2>
                <p className="text-xs text-text-dim mb-4">Customize system email templates with your branding</p>
                <div className="space-y-2">
                  {["Welcome Email", "Password Reset", "Invoice", "Appointment Confirmation", "Follow-up Reminder"].map((template) => (
                    <div key={template} className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-hover transition-colors">
                      <span className="text-xs font-medium">{template}</span>
                      <button className="text-xs text-accent-light hover:underline">Customize</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "team" && (
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold">Team Members</h2>
                <button className="px-3 py-1.5 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent-light transition-colors">
                  + Invite
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { name: "John Doe", email: "john@netwebmedia.com", role: "Admin" },
                  { name: "Jane Smith", email: "jane@netwebmedia.com", role: "Sales Manager" },
                  { name: "Alex Rivera", email: "alex@netwebmedia.com", role: "Agent" },
                ].map((member) => (
                  <div key={member.email} className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-hover transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent-light text-xs font-bold">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{member.name}</div>
                        <div className="text-[10px] text-text-dim">{member.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent-light">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-bold mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: "New lead assigned", desc: "Get notified when a new lead is assigned to you" },
                  { label: "Deal stage changes", desc: "When a deal moves to a new stage" },
                  { label: "New messages", desc: "Incoming messages from contacts" },
                  { label: "Appointment reminders", desc: "15 minutes before scheduled appointments" },
                  { label: "Weekly summary", desc: "Performance summary every Monday" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-xs font-semibold">{item.label}</div>
                      <div className="text-[10px] text-text-dim">{item.desc}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-bg-hover rounded-full peer peer-checked:bg-accent transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6">
              <div className="bg-bg-card border border-border rounded-xl p-6">
                <h2 className="text-sm font-bold mb-1">Current Plan</h2>
                <div className="flex items-center justify-between mt-4 p-4 bg-accent/10 border border-accent/30 rounded-lg">
                  <div>
                    <div className="text-sm font-bold text-accent-light">Pro Plan</div>
                    <div className="text-xs text-text-dim">Unlimited contacts, 5 team members</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold">$297<span className="text-xs text-text-dim font-normal">/mo</span></div>
                  </div>
                </div>
                <button className="mt-3 text-xs text-accent-light hover:underline">Upgrade Plan</button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="bg-bg-card border border-border rounded-xl p-6">
              <h2 className="text-sm font-bold mb-4">Security Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1.5">Current Password</label>
                  <input type="password" className="w-full px-3 py-2.5 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1.5">New Password</label>
                  <input type="password" className="w-full px-3 py-2.5 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1.5">Confirm New Password</label>
                  <input type="password" className="w-full px-3 py-2.5 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:border-accent" />
                </div>
                <button className="px-4 py-2 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent-light transition-colors">
                  Update Password
                </button>

                <div className="pt-4 mt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold">Two-Factor Authentication</div>
                      <div className="text-[10px] text-text-dim">Add an extra layer of security</div>
                    </div>
                    <button className="px-3 py-1.5 text-xs font-semibold bg-green/15 text-green rounded-lg hover:bg-green/25 transition-colors">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
