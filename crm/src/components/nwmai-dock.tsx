"use client";

/**
 * NWMaiDock — the floating AI assistant available on every /crm/* page.
 *
 *  * Collapsed: a 56×56 gradient bubble bottom-right with the NWMai mark.
 *  * Expanded : 420×600 chat drawer with slash-commands, context-aware prompts,
 *              message history, and a compose area.
 *  * Shortcut : Cmd/Ctrl+K toggles open/close from anywhere.
 *
 * Context is pulled from the current pathname so the assistant knows which
 * module the user is on and can suggest relevant next actions.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, Send, X, Loader2, Plus } from "lucide-react";
import { nwmaiChat, type NWMaiMessage } from "@/lib/nwmai-client";

type SlashCommand = {
  cmd: string;
  label: string;
  hint: string;
};

const SLASH_COMMANDS: SlashCommand[] = [
  { cmd: "/summarize", label: "Summarize this page", hint: "Executive bullets" },
  { cmd: "/draft-email", label: "Draft an email", hint: "About current entity" },
  { cmd: "/next-steps", label: "Suggest next steps", hint: "3 actions to take" },
  { cmd: "/find", label: "Find a contact or deal", hint: "Natural-language search" },
  { cmd: "/write", label: "Write CMS content", hint: "Page, blog, meta" },
  { cmd: "/translate", label: "Translate content", hint: "EN ↔ ES" },
];

const SEED_ASSISTANT_MSG: NWMaiMessage = {
  role: "assistant",
  content:
    "Hi — I'm NWMai, your always-on assistant across CRM, CMS, and marketing. Ask me to summarize a deal, draft an email, write a landing page, or suggest next steps. Type / to see commands.",
};

function routeLabel(path: string): string {
  if (path === "/" || path === "") return "Dashboard";
  const seg = path.replace(/^\//, "").split("/")[0] ?? "";
  return seg
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function NWMaiDock() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<NWMaiMessage[]>([SEED_ASSISTANT_MSG]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [showSlash, setShowSlash] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const contextLabel = useMemo(() => routeLabel(pathname), [pathname]);

  // Cmd/Ctrl+K global toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Autoscroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  const handleSend = useCallback(
    async (text?: string) => {
      const body = (text ?? input).trim();
      if (!body || sending) return;
      setInput("");
      setShowSlash(false);
      const userMsg: NWMaiMessage = { role: "user", content: body };
      setMessages((m) => [...m, userMsg]);
      setSending(true);
      const r = await nwmaiChat(body, sessionId, { route: pathname });
      setSending(false);
      if (r.ok) {
        setSessionId(r.sessionId);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: r.mock
              ? r.reply + "\n\n_(running in mock mode — set ANTHROPIC_API_KEY in server config to go live)_"
              : r.reply,
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              r.status === 401
                ? "You need to be signed in to use NWMai. Please log in and try again."
                : `NWMai error: ${r.error}`,
          },
        ]);
      }
    },
    [input, sending, sessionId, pathname],
  );

  const newChat = useCallback(() => {
    setSessionId(undefined);
    setMessages([SEED_ASSISTANT_MSG]);
    setInput("");
    setShowSlash(false);
    inputRef.current?.focus();
  }, []);

  const pickSlash = (cmd: SlashCommand) => {
    const seed =
      cmd.cmd === "/summarize"
        ? `Summarize the ${contextLabel} I'm looking at right now.`
        : cmd.cmd === "/draft-email"
          ? `Draft a short follow-up email based on the current ${contextLabel} context.`
          : cmd.cmd === "/next-steps"
            ? `What are the 3 best next steps I should take on this ${contextLabel}?`
            : cmd.cmd === "/find"
              ? "Find: "
              : cmd.cmd === "/write"
                ? "Write a CMS landing page about: "
                : cmd.cmd === "/translate"
                  ? "Translate to Spanish: "
                  : "";
    setInput(seed);
    setShowSlash(false);
    inputRef.current?.focus();
  };

  const onInputChange = (v: string) => {
    setInput(v);
    setShowSlash(v.trimStart().startsWith("/") && v.length < 40);
  };

  // --- Collapsed bubble ----------------------------------------------------
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open NWMai"
        title="NWMai  ·  Cmd/Ctrl+K"
        className="fixed bottom-5 right-5 z-[60] w-14 h-14 rounded-full shadow-lg shadow-cyan-500/20
                   bg-gradient-to-br from-cyan-500 to-sky-600 text-white
                   flex items-center justify-center
                   hover:scale-105 active:scale-95 transition-transform
                   ring-1 ring-white/10"
      >
        <Sparkles size={22} strokeWidth={2.25} />
        <span className="sr-only">NWMai</span>
      </button>
    );
  }

  // --- Expanded drawer -----------------------------------------------------
  return (
    <div
      className="fixed bottom-5 right-5 z-[60] w-[420px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-2rem)]
                 bg-bg-card border border-border rounded-2xl shadow-2xl shadow-black/40
                 flex flex-col overflow-hidden"
      role="dialog"
      aria-label="NWMai assistant"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-cyan-500/10 to-sky-500/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600 text-white flex items-center justify-center">
          <Sparkles size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-text flex items-center gap-2">
            NWMai
            <span className="text-[9px] font-semibold uppercase tracking-widest bg-cyan-500/15 text-cyan-300 px-1.5 py-0.5 rounded">
              Beta
            </span>
          </div>
          <div className="text-[11px] text-text-dim truncate">
            Context: {contextLabel}
          </div>
        </div>
        <button
          onClick={newChat}
          title="New conversation"
          className="p-1.5 rounded hover:bg-bg-hover text-text-dim hover:text-text transition-colors"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => setOpen(false)}
          title="Close (Esc)"
          className="p-1.5 rounded hover:bg-bg-hover text-text-dim hover:text-text transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap px-3 py-2 rounded-lg ${
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

      {/* Slash commands */}
      {showSlash && (
        <div className="border-t border-border bg-bg-card/95 backdrop-blur-sm max-h-[220px] overflow-y-auto">
          {SLASH_COMMANDS.filter((c) =>
            c.cmd.startsWith(input.trimStart().toLowerCase()),
          ).map((c) => (
            <button
              key={c.cmd}
              onClick={() => pickSlash(c)}
              className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-bg-hover transition-colors"
            >
              <div>
                <div className="text-xs font-mono text-cyan-300">{c.cmd}</div>
                <div className="text-[13px] text-text">{c.label}</div>
              </div>
              <div className="text-[10px] text-text-dim">{c.hint}</div>
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-border p-3">
        <div className="relative">
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask NWMai… (type / for commands)"
            className="w-full resize-none text-sm bg-bg-hover border border-border rounded-lg
                       text-text placeholder:text-text-dim p-3 pr-12
                       focus:outline-none focus:border-cyan-500/60"
          />
          <button
            onClick={() => handleSend()}
            disabled={sending || !input.trim()}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-md bg-gradient-to-br from-cyan-500 to-sky-600
                       text-white flex items-center justify-center
                       disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
            title="Send (Enter)"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-text-dim">
          <span>Shift+Enter for newline · Esc to close</span>
          <span className="font-mono">Cmd/Ctrl+K</span>
        </div>
      </div>
    </div>
  );
}
