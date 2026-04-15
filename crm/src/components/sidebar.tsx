"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Kanban,
  MessageSquare,
  CalendarDays,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Pipeline", href: "/pipeline", icon: Kanban },
  { label: "Conversations", href: "/conversations", icon: MessageSquare },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-bg-card border-r border-border transition-all duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold shrink-0">
          N
        </div>
        {!collapsed && (
          <span className="font-extrabold text-sm tracking-tight text-text">
            NetWebMedia
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {!collapsed && (
          <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-text-dim">
            Menu
          </div>
        )}
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-white"
                      : "text-text-dim hover:bg-bg-hover hover:text-text"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <item.icon size={18} />
                  {!collapsed && item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-3 space-y-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 text-text-dim hover:text-text transition-colors rounded-lg hover:bg-bg-hover"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && (
            <span className="ml-2 text-xs font-medium">Collapse</span>
          )}
        </button>
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center text-accent-light text-xs font-bold shrink-0">
            JD
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-text truncate">John Doe</div>
              <div className="text-[10px] text-text-dim truncate">Admin</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
