"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Send, Mail, MessageSquare, Phone, Paperclip, Smile, Zap, Bell } from "lucide-react";
import { conversations as initialConversations, type Conversation } from "@/lib/mock-data";

const channelIcons: Record<Conversation["channel"], typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  chat: MessageSquare,
  whatsapp: Phone,
};

const channelColors: Record<Conversation["channel"], string> = {
  email: "bg-accent/15 text-accent-light",
  sms: "bg-cyan/15 text-cyan",
  chat: "bg-green/15 text-green",
  whatsapp: "bg-green/15 text-green",
};

const AUTO_REPLY_BY_CHANNEL: Record<Conversation["channel"], string> = {
  email:
    "Thanks for reaching out to NetWebMedia! A member of our team will get back to you within 1 business hour. — James, Customer Success",
  sms: "Hi! Thanks for your message. James from NetWebMedia here — I'll respond within 1 business hour.",
  chat: "Hi! Thanks for messaging. James from NetWebMedia will be with you shortly — typically under 5 minutes during business hours.",
  whatsapp:
    "Hi! Thanks for reaching out on WhatsApp. James from NetWebMedia here — I'll respond within 1 business hour. 👋",
};

function nowLabel() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function ConversationsPage() {
  const [convos, setConvos] = useState<Conversation[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string>(initialConversations[0].id);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [autoReplyLog, setAutoReplyLog] = useState<string[]>([]);
  const autoRepliedRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selected = convos.find((c) => c.id === selectedId) ?? convos[0];

  const filtered = convos.filter(
    (c) =>
      c.contactName.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  // Automation: Inbound Message → Instant Auto-Reply + SLA Timer
  const runAutoReply = useCallback(
    (convId: string) => {
      if (!autoReplyEnabled) return;
      if (autoRepliedRef.current.has(convId)) return;
      setConvos((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          const last = c.messages[c.messages.length - 1];
          if (!last || last.sender !== "contact") return c;
          const replyText = AUTO_REPLY_BY_CHANNEL[c.channel];
          autoRepliedRef.current.add(convId);
          return {
            ...c,
            unread: false,
            lastMessage: replyText,
            messages: [
              ...c.messages,
              { sender: "agent", text: replyText, time: nowLabel() },
            ],
          };
        })
      );
      setAutoReplyLog((prev) => [
        `${nowLabel()} · Auto-reply sent to ${convos.find((c) => c.id === convId)?.contactName ?? convId}`,
        ...prev,
      ].slice(0, 5));
    },
    [autoReplyEnabled, convos]
  );

  // Fire auto-reply for any unread inbound conversation on mount/when toggled on
  useEffect(() => {
    if (!autoReplyEnabled) return;
    convos.forEach((c) => {
      if (c.unread) {
        const last = c.messages[c.messages.length - 1];
        if (last?.sender === "contact") {
          // small stagger so the UI visibly animates
          setTimeout(() => runAutoReply(c.id), 400);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoReplyEnabled]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected.messages.length, selectedId]);

  const sendMessage = () => {
    const text = newMessage.trim();
    if (!text) return;
    setConvos((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              lastMessage: text,
              messages: [...c.messages, { sender: "agent", text, time: nowLabel() }],
            }
          : c
      )
    );
    setNewMessage("");
  };

  const simulateInbound = () => {
    const sampleTexts = [
      "Quick question — do you support multi-location billing?",
      "Is there a discount for annual plans?",
      "Can we get a demo for our marketing team?",
      "What integrations do you have with Slack?",
    ];
    const text = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    setConvos((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? {
              ...c,
              unread: true,
              lastMessage: text,
              messages: [...c.messages, { sender: "contact", text, time: nowLabel() }],
            }
          : c
      )
    );
    autoRepliedRef.current.delete(selectedId);
    setTimeout(() => runAutoReply(selectedId), 600);
  };

  return (
    <div className="flex h-[calc(100vh-48px)] gap-0 -m-6">
      {/* Conversation List */}
      <div className="w-80 border-r border-border flex flex-col shrink-0 bg-bg-card">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-extrabold tracking-tight mb-3">Conversations</h1>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:border-accent"
            />
          </div>
          <div className="mt-3 flex items-center justify-between p-2 rounded-lg bg-bg border border-border">
            <div className="flex items-center gap-2">
              <Zap size={12} className={autoReplyEnabled ? "text-green" : "text-text-dim"} />
              <span className="text-[10px] font-semibold">Auto-Reply</span>
            </div>
            <button
              onClick={() => setAutoReplyEnabled((v) => !v)}
              className={`relative w-8 h-4 rounded-full transition-colors ${autoReplyEnabled ? "bg-green" : "bg-bg-hover"}`}
              aria-label="Toggle auto-reply"
            >
              <span
                className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${autoReplyEnabled ? "left-4" : "left-0.5"}`}
              />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((conv) => {
            const ChannelIcon = channelIcons[conv.channel];
            return (
              <div
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`flex items-start gap-3 p-4 cursor-pointer border-b border-border transition-colors ${
                  selected.id === conv.id ? "bg-bg-hover" : "hover:bg-bg-hover/50"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent-light text-xs font-bold shrink-0">
                  {conv.contactName.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold truncate">{conv.contactName}</span>
                    <span className="text-[10px] text-text-dim shrink-0 ml-2">{conv.timestamp}</span>
                  </div>
                  <div className="text-[10px] text-text-dim truncate">{conv.lastMessage}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${channelColors[conv.channel]}`}>
                      <ChannelIcon size={8} />
                      {conv.channel}
                    </span>
                    {conv.unread && (
                      <span className="w-2 h-2 rounded-full bg-accent" />
                    )}
                    {autoRepliedRef.current.has(conv.id) && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-green/15 text-green flex items-center gap-1">
                        <Zap size={8} />
                        auto-replied
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {autoReplyLog.length > 0 && (
          <div className="border-t border-border p-3 bg-bg/50">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Bell size={10} className="text-green" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Automation Log</span>
            </div>
            <div className="space-y-1">
              {autoReplyLog.map((line, i) => (
                <div key={i} className="text-[9px] text-text-dim leading-tight">{line}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-bg-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent-light text-xs font-bold">
              {selected.contactName.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <div className="text-sm font-bold">{selected.contactName}</div>
              <div className="text-[10px] text-text-dim">{selected.contactEmail}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={simulateInbound}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-bg-hover text-text-dim hover:text-text transition-colors"
              title="Simulate a new inbound message to test the auto-reply automation"
            >
              + Simulate Inbound
            </button>
            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${channelColors[selected.channel]}`}>
              {selected.channel}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {selected.messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === "agent" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-md px-4 py-2.5 rounded-xl text-xs leading-relaxed ${
                  msg.sender === "agent"
                    ? "bg-accent text-white rounded-br-sm"
                    : "bg-bg-card border border-border text-text rounded-bl-sm"
                }`}
              >
                <div>{msg.text}</div>
                <div className={`text-[9px] mt-1 flex items-center gap-1 ${msg.sender === "agent" ? "text-white/60" : "text-text-dim"}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-bg-card">
          <div className="flex items-center gap-2">
            <button className="p-2 text-text-dim hover:text-text rounded-lg hover:bg-bg-hover transition-colors">
              <Paperclip size={16} />
            </button>
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="flex-1 px-4 py-2.5 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:border-accent"
            />
            <button className="p-2 text-text-dim hover:text-text rounded-lg hover:bg-bg-hover transition-colors">
              <Smile size={16} />
            </button>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="p-2.5 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
