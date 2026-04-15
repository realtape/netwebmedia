"use client";

import { useState } from "react";
import { Search, Send, Mail, MessageSquare, Phone, Paperclip, Smile } from "lucide-react";
import { conversations, type Conversation } from "@/lib/mock-data";

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

export default function ConversationsPage() {
  const [selected, setSelected] = useState<Conversation>(conversations[0]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");

  const filtered = conversations.filter(
    (c) =>
      c.contactName.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

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
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((conv) => {
            const ChannelIcon = channelIcons[conv.channel];
            return (
              <div
                key={conv.id}
                onClick={() => setSelected(conv)}
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
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
                <div className={`text-[9px] mt-1 ${msg.sender === "agent" ? "text-white/60" : "text-text-dim"}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
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
              className="flex-1 px-4 py-2.5 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:border-accent"
            />
            <button className="p-2 text-text-dim hover:text-text rounded-lg hover:bg-bg-hover transition-colors">
              <Smile size={16} />
            </button>
            <button className="p-2.5 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
