"use client";

import { ReactNode } from "react";
import { LucideIcon, Plus, Search, Sparkles } from "lucide-react";

interface ModuleShellProps {
  icon: LucideIcon;
  hub: string;
  title: string;
  description: string;
  aiFeature?: string;
  primaryAction?: { label: string; onClick?: () => void };
  searchPlaceholder?: string;
  stats?: { label: string; value: string | number; delta?: string }[];
  children: ReactNode;
}

export function ModuleShell({
  icon: Icon,
  hub,
  title,
  description,
  aiFeature,
  primaryAction,
  searchPlaceholder,
  stats,
  children,
}: ModuleShellProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
            <Icon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-widest font-bold text-text-dim">{hub}</span>
              {aiFeature && (
                <span className="text-[9px] font-bold uppercase tracking-widest bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={10} /> {aiFeature}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
            <p className="text-sm text-text-dim mt-1 max-w-2xl">{description}</p>
          </div>
        </div>
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent-light transition-colors shrink-0"
          >
            <Plus size={14} /> {primaryAction.label}
          </button>
        )}
      </div>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-bg-card border border-border rounded-xl p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-dim">{s.label}</div>
              <div className="text-2xl font-extrabold text-text mt-1">{s.value}</div>
              {s.delta && (
                <div className="text-[11px] text-green mt-0.5 font-semibold">{s.delta}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      {searchPlaceholder && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-bg-card border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:border-accent"
          />
        </div>
      )}

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}

export function ModuleTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-border">
              {columns.map((c) => (
                <th key={c} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-dim">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-bg-hover transition-colors">
                {r.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-xs text-text">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ModuleCards({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>;
}

export function ModuleCard({
  title,
  subtitle,
  badge,
  badgeColor = "accent",
  children,
  href,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: "accent" | "green" | "orange" | "red" | "cyan" | "purple";
  children?: ReactNode;
  href?: string;
}) {
  const badgeClasses: Record<string, string> = {
    accent: "bg-accent/15 text-accent",
    green: "bg-green/15 text-green",
    orange: "bg-orange/15 text-orange",
    red: "bg-red/15 text-red",
    cyan: "bg-cyan/15 text-cyan",
    purple: "bg-purple-500/15 text-purple-400",
  };

  const Wrapper = href ? "a" : "div";

  return (
    <Wrapper
      href={href}
      className={`bg-bg-card border border-border rounded-xl p-5 transition-all ${
        href ? "hover:border-accent hover:-translate-y-0.5 cursor-pointer" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-text text-sm">{title}</h3>
        {badge && (
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${badgeClasses[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && <div className="text-xs text-text-dim mb-3">{subtitle}</div>}
      {children}
    </Wrapper>
  );
}
