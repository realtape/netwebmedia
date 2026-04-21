"use client";

/**
 * NWMai hub — full-page console.
 *
 * Left rail: session history (from /api/nwmai/sessions).
 * Right:     active conversation window + template grid + generator tools.
 *
 * Keeps a parallel session from the floating dock (which uses its own state),
 * so power-users can open a full-screen chat without losing the dock context.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Send, Loader2, Plus, FileText, Mail, Languages, BarChart3, Wand2 } from "lucide-react";
import { ModuleShell } from "@/components/module-shell";
import {
  nwmaiChat,
  nwmaiGenerate,
  nwmaiListSessions,
  nwmaiGetSession,
  type NWMaiMessage,
  type NWMaiSessionSummary,
  type NWMaiGenerateKind,
} from "@/lib/nwmai-client";

type GenTemplate = {
  kind: NWMaiGenerateKind;
  icon: React.ElementType;
  title: string;
  description: string;
  placeholder: string;
};

const GEN_TEMPLATES: GenTemplate[] = [
  { kind: "page_draft", icon: FileText, title: "CMS Page Draft", description: "Full landing page HTML — hero, features, CTA.", placeholder: "AI-powered email marketing for agencies…" },
  { kind: "blog_section", icon: FileText, title: "Blog Section", description: "One H2 + 250-word section.", placeholder: "Why HubSpot pricing punishes growing agencies…" },
  { kind: "meta", icon: BarChart3, title: "SEO Meta", description: "Title + description + OG tags.", placeholder: "Paste the page content or headline…" },
  { kind: "email_subject", icon: Mail, title: "Email Subjects", description: "5 subject lines, optimized for opens.", placeholder: "Welcome email for a new agency customer…" },
  { kind: "email_body", icon: Mail, title: "Email Body", description: "Short marketing email with CTA.", placeholder: "Re-engage trial users who haven't logged in…" },
  { kind: "translate", icon: Languages, title: "Translate EN↔ES", description: "Faithful, CTA-preserving translation.", placeholder: "Paste English or Spanish text…" },
];

export default function NWMaiHubPage() {
  const [sessions, setSessions] = useState<NWMaiSessionSummary[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<NWMaiMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHist, setLoadingHist] = useState(false);

  const [genKind, setGenKind] = useState<NWMaiGenerateKind | null>(null);
  const [genInput, setGenInput] = useState("");
  const [genOutput, setGenOutput] = useState("");
  const [genBusy, setGenBusy] = useState(false);
  const [genLang, setGenLang] = useState<"en" | "es">("en");

  const scrollRef = useRef<HTMLDivElement>(null);

  const refreshSessions = useCallback(async () => {
    const r = await nwmaiListSessions();
    if (r.ok) setSessions(r.sessions);
  }, []);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const openSession = useCallback(async (id: string) => {
    setSessionId(id);
    setLoadingHist(true);
    const r = await nwmaiGetSession(id);
    setLoadingHist(false);
    if (r.ok) setMessages(r.messages);
  }, []);

  const newChat = useCallback(() => {
    setSessionId(undefined);
    setMessages([]);
    setInput("");
  }, []);

  const sendChat = useCallback(async () => {
    const body = input.trim();
    if (!body || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: body }]);
    setSending(true);
    const r = await nwmaiChat(body, sessionId, { route: "/nwmai" });
    setSending(false);
    if (r.ok) {
      setSessionId(r.sessionId);
      setMessages((m) => [...m, { role: "assistant", content: r.reply }]);
      void refreshSessions();
    } else {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Error: ${r.error}` },
      ]);
    }
  }, [input, sending, sessionId, refreshSessions]);

  const runGen = useCallback(async () => {
    if (!genKind || !genInput.trim() || genBusy) return;
    setGenBusy(true);
    setGenOutput("");
    const r = await nwmaiGenerate(genKind, genInput.trim(), { language: genLang });
    setGenBusy(false);
    if (r.ok) setGenOutput(r.output);
    else setGenOutput(`Error: ${r.error}`);
  }, [genKind, genInput, genBusy, genLang]);

  const stats = useMemo(
    () => [
      { label: "Conversations", value: sessions.length.toString() },
      { label: "Active Session", value: sessionId ? "Yes" : "—" },
      { label: "Model", value: "Claude 3.5" },
      { label: "Status", value: "Beta" },
    ],
    [sessions.length, sessionId],
  );

  return (
    <ModuleShell
      icon={Sparkles}
      hub="AI Agents"
      title="NWMai"
      description="The unified AI brain across CRM, CMS, and marketing — draft, summarize, generate, translate, and plan next actions with full context."
      aiFeature="Claude 3.5 Sonnet"
      stats={stats}
    >
      {/* === Chat console ================================================== */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[240px_1fr] min-h-[520px]">
          {/* Left rail — sessions */}
          <aside className="border-r border-border flex flex-col">
            <div className="px-3 py-2 flex items-center justify-between border-b border-border">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
                Conversations
              </span>
              <button
                onClick={newChat}
                className="p-1 rounded hover:bg-bg-hover text-text-dim hover:text-text"
                title="New chat"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="p-4 text-xs text-text-dim">
                  No conversations yet. Start a new chat on the right.
                </div>
              ) : (
                <ul className="py-1">
                  {sessions.map((s) => (
                    <li key={s.session_id}>
                      <button
                        onClick={() => openSession(s.session_id)}
                        className={`w-full text-left px-3 py-2 text-xs border-l-2 transition-colors ${
                          sessionId === s.session_id
                            ? "border-cyan-500 bg-bg-hover text-text"
                            : "border-transparent text-text-dim hover:bg-bg-hover hover:text-text"
                        }`}
                      >
                        <div className="truncate font-medium">
                          {s.first_message || "(empty)"}
                        </div>
                        <div className="text-[10px] text-text-dim mt-0.5">
                          {s.turns} turns · {new Date(s.last_at).toLocaleDateString()}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* Right — active conversation */}
          <section className="flex flex-col">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingHist && (
                <div className="flex items-center gap-2 text-xs text-text-dim">
                  <Loader2 size={14} className="animate-spin" />
                  Loading history…
                </div>
              )}
              {!loadingHist && messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-center text-sm text-text-dim">
                  <div>
                    <Sparkles size={28} className="mx-auto mb-2 text-cyan-400" />
                    <div className="font-semibold text-text">Start a conversation with NWMai</div>
                    <div className="text-xs mt-1 max-w-xs">
                      Ask it to draft an email, summarize a deal, build an automation, or write a landing page.
                    </div>
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] text-sm whitespace-pre-wrap px-3 py-2 rounded-lg ${
                      m.role === "user"
                        ? "bg-accent text-white"
                        : "bg-bg-hover text-text border border-border"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-bg-hover text-text-dim border border-border rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    NWMai is thinking…
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border p-3">
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendChat();
                    }
                  }}
                  rows={2}
                  placeholder="Ask NWMai anything…"
                  className="w-full resize-none text-sm bg-bg-hover border border-border rounded-lg
                             text-text placeholder:text-text-dim p-3 pr-12
                             focus:outline-none focus:border-cyan-500/60"
                />
                <button
                  onClick={() => void sendChat()}
                  disabled={!input.trim() || sending}
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-md
                             bg-gradient-to-br from-cyan-500 to-sky-600 text-white
                             flex items-center justify-center
                             disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* === Generators grid =============================================== */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-text flex items-center gap-2">
              <Wand2 size={14} className="text-cyan-400" />
              Quick Generators
            </h2>
            <p className="text-xs text-text-dim mt-0.5">
              One-shot tools for CMS content, email, SEO, and translation.
            </p>
          </div>
          {genKind && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
                Language
              </label>
              <select
                value={genLang}
                onChange={(e) => setGenLang(e.target.value as "en" | "es")}
                className="text-xs bg-bg-hover border border-border rounded px-2 py-1 text-text"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
              <button
                onClick={() => {
                  setGenKind(null);
                  setGenInput("");
                  setGenOutput("");
                }}
                className="text-xs text-text-dim hover:text-text"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {!genKind ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {GEN_TEMPLATES.map((t) => (
              <button
                key={t.kind}
                onClick={() => {
                  setGenKind(t.kind);
                  setGenInput("");
                  setGenOutput("");
                }}
                className="bg-bg-card border border-border rounded-xl p-4 text-left hover:border-cyan-500/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-300 flex items-center justify-center mb-2">
                  <t.icon size={16} />
                </div>
                <div className="text-sm font-bold text-text">{t.title}</div>
                <div className="text-[11px] text-text-dim mt-1">{t.description}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-bg-card border border-border rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-1 block">
                  Input
                </label>
                <textarea
                  value={genInput}
                  onChange={(e) => setGenInput(e.target.value)}
                  rows={8}
                  placeholder={
                    GEN_TEMPLATES.find((t) => t.kind === genKind)?.placeholder ??
                    "Paste or type your input…"
                  }
                  className="w-full resize-none text-sm bg-bg-hover border border-border rounded-lg
                             text-text placeholder:text-text-dim p-3
                             focus:outline-none focus:border-cyan-500/60"
                />
                <button
                  onClick={() => void runGen()}
                  disabled={!genInput.trim() || genBusy}
                  className="mt-2 w-full py-2 rounded-lg text-sm font-semibold
                             bg-gradient-to-br from-cyan-500 to-sky-600 text-white
                             disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
                >
                  {genBusy ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Generating…
                    </span>
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim mb-1 block">
                  Output
                </label>
                <div
                  className="h-[200px] md:h-[calc(100%-2rem)] overflow-y-auto text-xs whitespace-pre-wrap
                             bg-bg-hover border border-border rounded-lg p-3 text-text font-mono"
                >
                  {genOutput || (genBusy ? "…" : "Output will appear here.")}
                </div>
                {genOutput && (
                  <button
                    onClick={() => void navigator.clipboard.writeText(genOutput)}
                    className="mt-2 text-xs text-cyan-300 hover:text-cyan-200"
                  >
                    Copy to clipboard
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ModuleShell>
  );
}
