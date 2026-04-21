"use client";

import { useState } from "react";
import { Globe, Sparkles, Loader2, Wand2 } from "lucide-react";
import { ModuleShell, ModuleTable } from "@/components/module-shell";
import { cmsPages } from "@/lib/mock-data-extended";
import { nwmaiGenerate, type NWMaiGenerateKind } from "@/lib/nwmai-client";

const typeColors: Record<string, string> = {
  home: "bg-accent/15 text-accent",
  landing: "bg-cyan/15 text-cyan",
  blog: "bg-green/15 text-green",
  legal: "bg-bg-hover text-text-dim",
  custom: "bg-purple-500/15 text-purple-400",
};

const statusColors: Record<string, string> = {
  published: "bg-green/15 text-green",
  draft: "bg-bg-hover text-text-dim",
  scheduled: "bg-cyan/15 text-cyan",
};

type GenOption = { kind: NWMaiGenerateKind; label: string; placeholder: string };
const GEN_OPTIONS: GenOption[] = [
  { kind: "page_draft", label: "Full Page HTML", placeholder: "AI marketing platform for growing agencies…" },
  { kind: "blog_section", label: "Blog Section", placeholder: "Why owning your customer data matters in 2026…" },
  { kind: "meta", label: "SEO Meta (title + description)", placeholder: "Paste page content or describe the topic…" },
];

export default function CMSPagesPage() {
  const published = cmsPages.filter((p) => p.status === "published");
  const drafts = cmsPages.filter((p) => p.status === "draft").length;
  const visits = cmsPages.reduce((a, p) => a + p.visits, 0);
  const avgVisits = Math.round(visits / cmsPages.length);

  const [showNWMai, setShowNWMai] = useState(false);
  const [kind, setKind] = useState<NWMaiGenerateKind>("page_draft");
  const [topic, setTopic] = useState("");
  const [lang, setLang] = useState<"en" | "es">("en");
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState("");

  const generate = async () => {
    if (!topic.trim() || busy) return;
    setBusy(true);
    setOutput("");
    const r = await nwmaiGenerate(kind, topic.trim(), { language: lang });
    setBusy(false);
    if (r.ok) setOutput(r.output);
    else setOutput(`Error: ${r.error}`);
  };

  return (
    <ModuleShell
      icon={Globe}
      hub="CMS & Sites"
      title="Pages"
      description="Full website CMS — home, landing, blog, legal pages with version history, staging environments, and NWMai content generation."
      primaryAction={{ label: "New Page" }}
      searchPlaceholder="Search pages..."
      stats={[
        { label: "Published", value: published.length },
        { label: "Drafts", value: drafts },
        { label: "Total Visits", value: visits.toLocaleString() },
        { label: "Avg Visits", value: avgVisits.toLocaleString() },
      ]}
    >
      {/* --- NWMai CMS assist ---------------------------------------------- */}
      <div className="mb-4 bg-bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowNWMai((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-hover transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600 text-white flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-text flex items-center gap-2">
                Draft with NWMai
                <span className="text-[9px] font-semibold uppercase tracking-widest bg-cyan-500/15 text-cyan-300 px-1.5 py-0.5 rounded">
                  New
                </span>
              </div>
              <div className="text-[11px] text-text-dim">
                Generate a full page, a blog section, or SEO meta — in English or Spanish.
              </div>
            </div>
          </div>
          <span className="text-xs text-text-dim">{showNWMai ? "Hide" : "Open"}</span>
        </button>

        {showNWMai && (
          <div className="border-t border-border p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
                  Artifact
                </label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as NWMaiGenerateKind)}
                  className="text-xs bg-bg-hover border border-border rounded px-2 py-1 text-text"
                >
                  {GEN_OPTIONS.map((o) => (
                    <option key={o.kind} value={o.kind}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <label className="ml-4 text-[10px] font-bold uppercase tracking-widest text-text-dim">
                  Language
                </label>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as "en" | "es")}
                  className="text-xs bg-bg-hover border border-border rounded px-2 py-1 text-text"
                >
                  <option value="en">EN</option>
                  <option value="es">ES</option>
                </select>
              </div>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={6}
                placeholder={
                  GEN_OPTIONS.find((o) => o.kind === kind)?.placeholder ??
                  "Describe what you want NWMai to write…"
                }
                className="w-full resize-none text-sm bg-bg-hover border border-border rounded-lg
                           text-text placeholder:text-text-dim p-3
                           focus:outline-none focus:border-cyan-500/60"
              />
              <button
                onClick={() => void generate()}
                disabled={!topic.trim() || busy}
                className="mt-2 w-full py-2 rounded-lg text-sm font-semibold
                           bg-gradient-to-br from-cyan-500 to-sky-600 text-white
                           disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition
                           inline-flex items-center justify-center gap-2"
              >
                {busy ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    Generate with NWMai
                  </>
                )}
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-1 block">
                Output
              </label>
              <div
                className="min-h-[180px] max-h-[320px] overflow-y-auto text-xs whitespace-pre-wrap
                           bg-bg-hover border border-border rounded-lg p-3 text-text font-mono"
              >
                {output || (busy ? "…" : "Output will appear here.")}
              </div>
              {output && (
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => void navigator.clipboard.writeText(output)}
                    className="text-xs text-cyan-300 hover:text-cyan-200"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => setOutput("")}
                    className="text-xs text-text-dim hover:text-text"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- Pages table ---------------------------------------------------- */}
      <ModuleTable
        columns={["Title", "Slug", "Type", "Status", "Visits", "Last Edited", "Author"]}
        rows={cmsPages.map((p) => [
          <span key="t" className="font-semibold text-text">{p.title}</span>,
          <span key="s" className="font-mono text-[11px] text-text-dim">{p.slug}</span>,
          <span key="ty" className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${typeColors[p.type]}`}>{p.type}</span>,
          <span key="st" className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[p.status]}`}>{p.status}</span>,
          <span key="v" className="text-text-dim">{p.visits.toLocaleString()}</span>,
          <span key="e" className="text-text-dim">{p.lastEdited}</span>,
          <span key="a" className="text-text-dim">{p.author}</span>,
        ])}
      />
    </ModuleShell>
  );
}
