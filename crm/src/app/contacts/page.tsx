"use client";

import { useState } from "react";
import { Search, Filter, Plus, Mail, Phone, MoreVertical, ChevronDown } from "lucide-react";
import { contacts, type Contact } from "@/lib/mock-data";

const statusColors: Record<Contact["status"], string> = {
  customer: "bg-green/15 text-green",
  prospect: "bg-cyan/15 text-cyan",
  lead: "bg-orange/15 text-orange",
  churned: "bg-red/15 text-red",
};

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Contact | null>(null);

  const filtered = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-[calc(100vh-48px)] gap-6">
      {/* Contact List */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Contacts</h1>
            <p className="text-sm text-text-dim mt-1">{contacts.length} total contacts</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent-light transition-colors">
            <Plus size={14} /> Add Contact
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-bg-card border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:border-accent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-xs bg-bg-card border border-border rounded-lg text-text focus:outline-none focus:border-accent appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="lead">Leads</option>
            <option value="prospect">Prospects</option>
            <option value="customer">Customers</option>
            <option value="churned">Churned</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden flex-1">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-text-dim p-4">Contact</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-text-dim p-4">Company</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-text-dim p-4">Status</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-text-dim p-4">Value</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-text-dim p-4">Source</th>
                <th className="text-left text-[10px] font-bold uppercase tracking-wider text-text-dim p-4">Last Active</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((contact) => (
                <tr
                  key={contact.id}
                  onClick={() => setSelected(contact)}
                  className={`hover:bg-bg-hover transition-colors cursor-pointer ${
                    selected?.id === contact.id ? "bg-bg-hover" : ""
                  }`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent-light text-xs font-bold shrink-0">
                        {contact.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <div className="text-xs font-semibold">{contact.name}</div>
                        <div className="text-[10px] text-text-dim">{contact.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-text-dim">{contact.company}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[contact.status]}`}>
                      {contact.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-semibold text-green">${contact.value.toLocaleString()}</td>
                  <td className="p-4 text-xs text-text-dim">{contact.source}</td>
                  <td className="p-4 text-xs text-text-dim">{contact.lastActivity}</td>
                  <td className="p-4">
                    <button className="p-1 rounded hover:bg-bg-hover text-text-dim">
                      <MoreVertical size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact Detail Panel */}
      {selected && (
        <div className="w-80 bg-bg-card border border-border rounded-xl p-5 overflow-y-auto shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold">Contact Details</h2>
            <button onClick={() => setSelected(null)} className="text-text-dim hover:text-text text-xs">
              Close
            </button>
          </div>

          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent-light text-xl font-bold mb-3">
              {selected.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="text-sm font-bold">{selected.name}</div>
            <div className="text-xs text-text-dim">{selected.company}</div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-2 ${statusColors[selected.status]}`}>
              {selected.status}
            </span>
          </div>

          <div className="flex gap-2 mb-6">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent-light transition-colors">
              <Mail size={12} /> Email
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-bg-hover border border-border text-text rounded-lg hover:border-text-dim transition-colors">
              <Phone size={12} /> Call
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1">Email</div>
              <div className="text-xs">{selected.email}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1">Phone</div>
              <div className="text-xs">{selected.phone}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1">Source</div>
              <div className="text-xs">{selected.source}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1">Lifetime Value</div>
              <div className="text-xs font-semibold text-green">${selected.value.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1">Tags</div>
              <div className="flex flex-wrap gap-1">
                {selected.tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 bg-bg-hover border border-border rounded-full text-text-dim">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1">Last Activity</div>
              <div className="text-xs text-text-dim">{selected.lastActivity}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-dim mb-1">Created</div>
              <div className="text-xs text-text-dim">{selected.createdAt}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
