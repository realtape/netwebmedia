"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, User } from "lucide-react";
import { calendarEvents } from "@/lib/mock-data";

const typeColors: Record<string, string> = {
  call: "bg-cyan/15 text-cyan border-cyan/30",
  demo: "bg-accent/15 text-accent-light border-accent/30",
  meeting: "bg-green/15 text-green border-green/30",
  "follow-up": "bg-orange/15 text-orange border-orange/30",
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8am to 7pm

export default function CalendarPage() {
  const [view, setView] = useState<"week" | "day">("week");
  const [selectedDate] = useState("2026-04-14");

  // Get current week dates (Mon-Sun starting from April 13)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2026, 3, 13 + i);
    return {
      day: days[i],
      date: d.getDate(),
      full: `2026-04-${String(d.getDate()).padStart(2, "0")}`,
      isToday: d.getDate() === 14,
    };
  });

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Calendar</h1>
          <p className="text-sm text-text-dim mt-1">April 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-bg-card border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                view === "week" ? "bg-accent text-white" : "text-text-dim hover:text-text"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView("day")}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                view === "day" ? "bg-accent text-white" : "text-text-dim hover:text-text"
              }`}
            >
              Day
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg hover:bg-bg-hover text-text-dim hover:text-text transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold px-2">Apr 13 – 19</span>
            <button className="p-1.5 rounded-lg hover:bg-bg-hover text-text-dim hover:text-text transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent-light transition-colors">
            <Plus size={14} /> New Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-bg-card border border-border rounded-xl overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
          <div className="p-2" />
          {weekDates.map((d) => (
            <div
              key={d.full}
              className={`p-3 text-center border-l border-border ${d.isToday ? "bg-accent/5" : ""}`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-text-dim">{d.day}</div>
              <div className={`text-lg font-extrabold mt-0.5 ${d.isToday ? "text-accent" : ""}`}>
                {d.date}
              </div>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="overflow-y-auto flex-1" style={{ maxHeight: "calc(100vh - 240px)" }}>
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border min-h-[60px]">
              <div className="p-2 text-[10px] text-text-dim font-medium text-right pr-3">
                {hour > 12 ? `${hour - 12}PM` : hour === 12 ? "12PM" : `${hour}AM`}
              </div>
              {weekDates.map((d) => {
                const dayEvents = calendarEvents.filter(
                  (e) => e.date === d.full && parseInt(e.time.split(":")[0]) === hour
                );
                return (
                  <div
                    key={d.full}
                    className={`border-l border-border p-1 ${d.isToday ? "bg-accent/5" : ""}`}
                  >
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-2 rounded-lg border text-[10px] cursor-pointer hover:opacity-80 transition-opacity ${
                          typeColors[event.type] || "bg-bg-hover text-text border-border"
                        }`}
                      >
                        <div className="font-semibold truncate">{event.title}</div>
                        <div className="flex items-center gap-1 mt-0.5 opacity-80">
                          <User size={8} />
                          <span className="truncate">{event.contactName}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 opacity-80">
                          <Clock size={8} />
                          <span>{event.time} · {event.duration}m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
