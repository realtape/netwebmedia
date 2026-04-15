import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: LucideIcon;
  color: string;
}

export function StatCard({ label, value, change, changeType = "up", icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-dim">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="text-2xl font-extrabold tracking-tight">{value}</div>
      {change && (
        <div className={`text-xs mt-1 font-medium ${
          changeType === "up" ? "text-green" : changeType === "down" ? "text-red" : "text-text-dim"
        }`}>
          {changeType === "up" ? "↑" : changeType === "down" ? "↓" : ""} {change}
        </div>
      )}
    </div>
  );
}
