"use client";

import { Users, TrendingUp, DollarSign, Target, BarChart3, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/stat-card";
import { dashboardStats, revenueData, deals, contacts, calendarEvents } from "@/lib/mock-data";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const upcomingEvents = calendarEvents.slice(0, 4);
  const recentDeals = deals.filter((d) => d.stage !== "Closed Won" && d.stage !== "Closed Lost").slice(0, 5);
  const recentContacts = contacts.slice(0, 5);

  // Read user from localStorage (set by /login.html or /register.html)
  const [firstName, setFirstName] = useState<string>("there");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nwm_user");
      if (raw) {
        const u = JSON.parse(raw);
        const name: string = u?.name || u?.full_name || u?.email?.split("@")[0] || "";
        if (name) setFirstName(name.split(" ")[0]);
      }
    } catch {
      // localStorage not available — keep default
    }
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-sm text-text-dim mt-1">Welcome back, {firstName}. Here&apos;s your overview.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-xs font-semibold bg-bg-card border border-border rounded-lg hover:bg-bg-hover transition-colors">
            Export
          </button>
          <button className="px-4 py-2 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent-light transition-colors">
            + New Contact
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard label="Total Contacts" value={dashboardStats.totalContacts.toLocaleString()} change="12% this month" changeType="up" icon={Users} color="bg-accent/15 text-accent-light" />
        <StatCard label="New Leads" value={dashboardStats.newLeads.toString()} change="8 today" changeType="up" icon={UserPlus} color="bg-cyan/15 text-cyan" />
        <StatCard label="Active Deals" value={dashboardStats.activeDeals.toString()} change="3 closing soon" changeType="neutral" icon={Target} color="bg-orange/15 text-orange" />
        <StatCard label="Revenue" value={`$${(dashboardStats.revenue / 1000).toFixed(1)}k`} change="18% vs last month" changeType="up" icon={DollarSign} color="bg-green/15 text-green" />
        <StatCard label="Conversion" value={`${dashboardStats.conversionRate}%`} change="2% improvement" changeType="up" icon={TrendingUp} color="bg-pink/15 text-pink" />
        <StatCard label="Avg Deal Size" value={`$${(dashboardStats.avgDealSize / 1000).toFixed(1)}k`} change="$800 increase" changeType="up" icon={BarChart3} color="bg-red/15 text-red" />
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-sm font-bold">Revenue Overview</h2>
            <span className="text-xs text-text-dim">Last 7 months</span>
          </div>
          <div className="p-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3b" />
                <XAxis dataKey="month" stroke="#8b8fa3" fontSize={12} />
                <YAxis stroke="#8b8fa3" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: "#1a1d27", border: "1px solid #2a2e3b", borderRadius: "8px", color: "#e4e7ec" }}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6c5ce7" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-sm font-bold">Today&apos;s Schedule</h2>
            <span className="text-xs text-accent-light cursor-pointer hover:underline">View all</span>
          </div>
          <div className="p-4 space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  event.type === "call" ? "bg-cyan" : event.type === "demo" ? "bg-accent" : event.type === "meeting" ? "bg-green" : "bg-orange"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{event.title}</div>
                  <div className="text-[10px] text-text-dim">{event.contactName}</div>
                  <div className="text-[10px] text-text-dim">{event.time} · {event.duration}min</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Deals + Recent Contacts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Active Deals */}
        <div className="bg-bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-sm font-bold">Active Deals</h2>
            <span className="text-xs text-accent-light cursor-pointer hover:underline">View pipeline</span>
          </div>
          <div className="divide-y divide-border">
            {recentDeals.map((deal) => (
              <div key={deal.id} className="flex items-center justify-between p-4 hover:bg-bg-hover transition-colors">
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{deal.title}</div>
                  <div className="text-[10px] text-text-dim">{deal.contactName} · {deal.stage}</div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="text-xs font-bold text-green">${deal.value.toLocaleString()}</div>
                  <div className="text-[10px] text-text-dim">{deal.probability}% likely</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Contacts */}
        <div className="bg-bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-sm font-bold">Recent Contacts</h2>
            <span className="text-xs text-accent-light cursor-pointer hover:underline">View all</span>
          </div>
          <div className="divide-y divide-border">
            {recentContacts.map((contact) => (
              <div key={contact.id} className="flex items-center gap-3 p-4 hover:bg-bg-hover transition-colors">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent-light text-xs font-bold shrink-0">
                  {contact.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{contact.name}</div>
                  <div className="text-[10px] text-text-dim truncate">{contact.company} · {contact.email}</div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  contact.status === "customer" ? "bg-green/15 text-green" :
                  contact.status === "prospect" ? "bg-cyan/15 text-cyan" :
                  contact.status === "lead" ? "bg-orange/15 text-orange" :
                  "bg-red/15 text-red"
                }`}>
                  {contact.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
