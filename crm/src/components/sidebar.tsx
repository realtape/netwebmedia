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
  ChevronDown,
  Mail,
  Workflow,
  FileText,
  Megaphone,
  FlaskConical,
  Share2,
  Target,
  Gauge,
  Ticket,
  BookOpen,
  UserCircle2,
  Star,
  ClipboardList,
  Globe,
  Users2,
  Link2,
  Bot,
  Mic,
  Video,
  Sparkles,
  FileSignature,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Trophy,
  Building2,
  Percent,
  MessagesSquare,
  Phone,
  Webhook,
  Code2,
  GraduationCap,
  HeartPulse,
  Scale,
  Wrench,
  DollarSign,
  Hammer,
  UtensilsCrossed,
  Briefcase,
  Home as HomeIcon,
} from "lucide-react";
import { useState, useEffect } from "react";

type NavItem = { label: string; href: string; icon: React.ElementType; badge?: string };
type NavGroup = { title: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Reports", href: "/reports", icon: Gauge, badge: "New" },
    ],
  },
  {
    title: "Sales Hub",
    items: [
      { label: "Contacts", href: "/contacts", icon: Users },
      { label: "Companies", href: "/companies", icon: Building2 },
      { label: "Pipeline", href: "/pipeline", icon: Kanban },
      { label: "Forecasting", href: "/forecasting", icon: TrendingUp },
      { label: "Products", href: "/products", icon: ShoppingBag },
      { label: "Quotes", href: "/quotes", icon: FileSignature },
      { label: "Playbooks", href: "/playbooks", icon: ClipboardList },
      { label: "Sequences", href: "/sequences", icon: Mail },
      { label: "Calendar", href: "/calendar", icon: CalendarDays },
    ],
  },
  {
    title: "Marketing Hub",
    items: [
      { label: "Campaigns", href: "/campaigns", icon: Megaphone },
      { label: "Automations", href: "/automations", icon: Workflow },
      { label: "Landing Pages", href: "/landing-pages", icon: FileText },
      { label: "Forms", href: "/forms", icon: ClipboardList },
      { label: "A/B Tests", href: "/ab-tests", icon: FlaskConical },
      { label: "SMS", href: "/sms", icon: MessagesSquare },
      { label: "Social Planner", href: "/social", icon: Share2 },
      { label: "Ads Manager", href: "/ads", icon: Target },
      { label: "Lead Scoring", href: "/lead-scoring", icon: Gauge },
      { label: "Blog", href: "/blog", icon: FileText },
    ],
  },
  {
    title: "Service Hub",
    items: [
      { label: "Conversations", href: "/conversations", icon: MessageSquare },
      { label: "Tickets", href: "/tickets", icon: Ticket },
      { label: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
      { label: "Customer Portal", href: "/customer-portal", icon: UserCircle2 },
      { label: "Surveys / NPS", href: "/surveys", icon: Star },
      { label: "SLAs", href: "/slas", icon: ClipboardList },
      { label: "Calls", href: "/calls", icon: Phone },
    ],
  },
  {
    title: "CMS & Sites",
    items: [
      { label: "Pages", href: "/pages", icon: Globe },
      { label: "Memberships", href: "/memberships", icon: Users2 },
      { label: "Courses (LMS)", href: "/courses", icon: GraduationCap },
      { label: "Community", href: "/community", icon: Users2 },
    ],
  },
  {
    title: "AI Agents",
    items: [
      { label: "NWMai", href: "/nwmai", icon: Sparkles, badge: "New" },
      { label: "AI Copilot", href: "/ai-copilot", icon: Sparkles, badge: "GPT-4" },
      { label: "AI SDR", href: "/ai-sdr", icon: Bot },
      { label: "Voice AI", href: "/voice-ai", icon: Mic },
      { label: "Video Factory", href: "/video-factory", icon: Video },
      { label: "Content AI", href: "/content-ai", icon: Sparkles },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Integrations", href: "/integrations", icon: Link2 },
      { label: "Webhooks", href: "/webhooks", icon: Webhook },
      { label: "Custom Code", href: "/custom-code", icon: Code2 },
      { label: "API Keys", href: "/api-keys", icon: Code2 },
    ],
  },
  {
    title: "Agency / Partner",
    items: [
      { label: "Sub-accounts", href: "/sub-accounts", icon: Building2 },
      { label: "White-label", href: "/white-label", icon: Sparkles },
      { label: "Billing / SaaS", href: "/billing", icon: Receipt },
      { label: "Affiliate Mgr", href: "/affiliates", icon: Percent },
      { label: "Reputation", href: "/reputation", icon: Trophy },
    ],
  },
  {
    title: "Industries",
    items: [
      { label: "All Verticals", href: "/industries", icon: Briefcase, badge: "11" },
      { label: "Real Estate", href: "/industries/real-estate/properties", icon: HomeIcon },
      { label: "Healthcare", href: "/industries/healthcare/patients", icon: HeartPulse },
      { label: "E-Commerce", href: "/industries/ecommerce/products", icon: ShoppingBag },
      { label: "SaaS", href: "/industries/saas/subscribers", icon: Code2 },
      { label: "Hospitality", href: "/industries/hospitality/reservations", icon: UtensilsCrossed },
      { label: "Professional Svc", href: "/industries/professional-services/matters", icon: Scale },
      { label: "Local Services", href: "/industries/local-services/jobs", icon: Wrench },
      { label: "Finance", href: "/industries/finance/portfolios", icon: DollarSign },
      { label: "Education", href: "/industries/education/students", icon: GraduationCap },
      { label: "Construction", href: "/industries/construction/projects", icon: Hammer },
      { label: "Agencies", href: "/industries/agencies/sub-accounts", icon: Briefcase },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  // Read user from localStorage so the sidebar reflects the logged-in account.
  const [user, setUser] = useState<{ name: string; role: string; initials: string }>({
    name: "Guest",
    role: "Trial user",
    initials: "G",
  });
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nwm_user");
      if (raw) {
        const u = JSON.parse(raw);
        const name: string = u?.name || u?.full_name || u?.email?.split("@")[0] || "User";
        const role: string = u?.role || u?.type || "Member";
        const initials = name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((p: string) => p[0]?.toUpperCase() || "")
          .join("") || name[0]?.toUpperCase() || "U";
        setUser({ name, role: role.charAt(0).toUpperCase() + role.slice(1), initials });
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-bg-card border-r border-border transition-all duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border shrink-0">
        <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold shrink-0">
          N
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-extrabold text-sm tracking-tight text-text">NetWebMedia</div>
            <div className="text-[10px] text-text-dim">CRM · Marketing · AI</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-2">
            {!collapsed && (
              <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-text-dim">
                {group.title}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2 text-[13px] font-medium transition-colors ${
                        isActive
                          ? "bg-accent text-white"
                          : "text-text-dim hover:bg-bg-hover hover:text-text"
                      } ${collapsed ? "justify-center" : ""}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon size={16} />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-accent/20 text-accent-light px-1.5 py-0.5 rounded">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-3 space-y-2 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 text-text-dim hover:text-text transition-colors rounded-lg hover:bg-bg-hover"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="ml-2 text-xs font-medium">Collapse</span>}
        </button>
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center text-accent-light text-xs font-bold shrink-0">
            {user.initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-text truncate">{user.name}</div>
              <div className="text-[10px] text-text-dim truncate">{user.role}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
