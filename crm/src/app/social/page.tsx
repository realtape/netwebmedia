"use client";

import { useState } from "react";
import { Share2, X } from "lucide-react";
import { ModuleShell, ModuleCards, ModuleCard } from "@/components/module-shell";
import { showToast } from "@/lib/toast";
import { socialPosts } from "@/lib/mock-data-extended";

/* ── Platform registry ─────────────────────────────────────────────── */
type PlatformKey = "ig" | "fb" | "li" | "yt" | "tk";

const PLATFORMS: Record<PlatformKey, { name: string; color: string; abbr: string; instructions: string }> = {
  ig: {
    name: "Instagram",
    abbr: "IG",
    color: "bg-gradient-to-br from-purple-500 to-pink-500",
    instructions:
      "Requires an Instagram Business account linked to a Facebook Page. Use the Meta Graph API Explorer (scopes: instagram_basic + instagram_content_publish) to generate a long-lived token.",
  },
  fb: {
    name: "Facebook",
    abbr: "FB",
    color: "bg-blue-600",
    instructions:
      "Go to Meta for Developers → create an App → Facebook Login → generate a long-lived Page Access Token for your Business Page.",
  },
  li: {
    name: "LinkedIn",
    abbr: "LI",
    color: "bg-sky-600",
    instructions:
      "LinkedIn Developer Portal → create an app → request r_organization_social + w_organization_social scopes → find your Company URN via GET /v2/organizationalEntityAcls.",
  },
  yt: {
    name: "YouTube",
    abbr: "YT",
    color: "bg-red-600",
    instructions:
      "Google Cloud Console → enable YouTube Data API v3 → create OAuth 2.0 credentials (Web App) → run the consent flow to get an access token and refresh token.",
  },
  tk: {
    name: "TikTok",
    abbr: "TK",
    color: "bg-neutral-900 border border-white/10",
    instructions:
      "developers.tiktok.com → create an app → request Content Posting API access → complete sandbox approval → run the OAuth flow to get an access token.",
  },
};

const PLATFORM_KEYS: PlatformKey[] = ["ig", "fb", "li", "yt", "tk"];

type ConnectedMap = Partial<Record<PlatformKey, boolean>>;
type CredentialMap = Partial<Record<PlatformKey, string>>;

/* ── Component ─────────────────────────────────────────────────────── */
export default function SocialPage() {
  const [connected, setConnected] = useState<ConnectedMap>({});
  const [credTokens, setCredTokens] = useState<CredentialMap>({});
  const [connectingKey, setConnectingKey] = useState<PlatformKey | null>(null);
  const [credInput, setCredInput] = useState("");
  const [showPostModal, setShowPostModal] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postDate, setPostDate] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<PlatformKey>>(new Set());

  const scheduled   = socialPosts.filter((p) => p.status === "scheduled").length;
  const published   = socialPosts.filter((p) => p.status === "published");
  const impressions = socialPosts.reduce((a, p) => a + p.impressions, 0);
  const avgEngagement =
    published.length > 0
      ? Math.round(published.reduce((a, p) => a + p.engagement, 0) / published.length)
      : 0;

  const connectedCount = PLATFORM_KEYS.filter((k) => connected[k]).length;

  /* ── Connect / disconnect ──────────────────────────────────────────── */
  function openConnect(key: PlatformKey) {
    setConnectingKey(key);
    setCredInput(credTokens[key] ?? "");
  }

  function saveConnect() {
    if (!connectingKey) return;
    if (!credInput.trim()) {
      showToast("Please enter your access token", "error");
      return;
    }
    setConnected((prev) => ({ ...prev, [connectingKey]: true }));
    setCredTokens((prev) => ({ ...prev, [connectingKey]: credInput.trim() }));
    showToast(`${PLATFORMS[connectingKey].name} connected successfully`, "success");
    setConnectingKey(null);
    setCredInput("");
  }

  function disconnect(key: PlatformKey) {
    setConnected((prev) => ({ ...prev, [key]: false }));
    setCredTokens((prev) => ({ ...prev, [key]: undefined }));
    showToast(`${PLATFORMS[key].name} disconnected`, "info");
  }

  /* ── New Post ──────────────────────────────────────────────────────── */
  function togglePlatform(key: PlatformKey) {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function schedulePost() {
    if (!postContent.trim()) {
      showToast("Post content is required", "error");
      return;
    }
    if (selectedPlatforms.size === 0) {
      showToast("Select at least one platform", "error");
      return;
    }
    const platforms = Array.from(selectedPlatforms).map((k) => PLATFORMS[k].name).join(", ");
    setShowPostModal(false);
    setPostContent(""); setPostDate(""); setSelectedPlatforms(new Set());
    showToast(`Post scheduled for ${platforms}`, "success");
  }

  const inputCls =
    "w-full px-3 py-2 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:border-accent";
  const labelCls = "block text-[11px] font-bold uppercase tracking-widest text-text-dim mb-1.5";

  return (
    <>
      <ModuleShell
        icon={Share2}
        hub="Marketing Hub"
        title="Social Planner"
        description="Cross-channel scheduling for LinkedIn, Twitter, Facebook, Instagram with AI-generated content suggestions."
        aiFeature="AI Content"
        primaryAction={{ label: "New Post", onClick: () => setShowPostModal(true) }}
        searchPlaceholder="Search posts..."
        stats={[
          { label: "Scheduled",       value: scheduled },
          { label: "Published",       value: published.length },
          { label: "Impressions",     value: impressions.toLocaleString() },
          { label: "Avg Engagement",  value: avgEngagement },
        ]}
      >
        {/* ── Connected Accounts ─────────────────────────────────────── */}
        <div className="bg-bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold tracking-tight">Connected Accounts</h3>
              <p className="text-[11px] text-text-dim mt-0.5">
                {connectedCount} / {PLATFORM_KEYS.length} platforms connected
              </p>
            </div>
            {connectedCount === 0 && (
              <span className="text-[10px] font-bold uppercase tracking-widest bg-orange/15 text-orange px-2.5 py-1 rounded-full">
                Setup needed
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PLATFORM_KEYS.map((key) => {
              const p = PLATFORMS[key];
              const isConnected = !!connected[key];
              return (
                <div
                  key={key}
                  className="bg-bg border border-border rounded-xl p-3 flex flex-col items-center gap-2 text-center"
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-[11px] font-extrabold ${p.color}`}
                  >
                    {p.abbr}
                  </div>
                  <div className="text-[11px] font-semibold text-text">{p.name}</div>
                  <div
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isConnected
                        ? "bg-green/15 text-green"
                        : "bg-bg-hover text-text-dim"
                    }`}
                  >
                    {isConnected ? "● Connected" : "○ Not connected"}
                  </div>
                  {isConnected ? (
                    <button
                      onClick={() => disconnect(key)}
                      className="w-full text-[10px] font-semibold border border-border rounded-lg py-1 text-text-dim hover:border-red/50 hover:text-red transition-colors"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => openConnect(key)}
                      className="w-full text-[10px] font-semibold bg-accent text-white rounded-lg py-1 hover:bg-accent-light transition-colors"
                    >
                      Connect
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Scheduled Posts ─────────────────────────────────────────── */}
        <ModuleCards>
          {socialPosts.map((p) => (
            <ModuleCard
              key={p.id}
              title={p.content.length > 60 ? `${p.content.substring(0, 60)}...` : p.content}
              subtitle={p.channels.join(" · ")}
              badge={p.status}
              badgeColor={p.status === "published" ? "green" : p.status === "scheduled" ? "accent" : "orange"}
            >
              <div className="text-[11px] text-text-dim mb-3">Scheduled: {p.scheduledFor}</div>
              <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-border">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Impressions</div>
                  <div className="text-sm font-extrabold text-text">{p.impressions.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Clicks</div>
                  <div className="text-sm font-extrabold text-accent">{p.clicks}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Engage</div>
                  <div className="text-sm font-extrabold text-green">{p.engagement}</div>
                </div>
              </div>
            </ModuleCard>
          ))}
        </ModuleCards>
      </ModuleShell>

      {/* ── Connect Platform Modal ─────────────────────────────────────── */}
      {connectingKey && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9998] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setConnectingKey(null); }}
        >
          <div className="bg-bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-[11px] font-extrabold ${PLATFORMS[connectingKey].color}`}>
                  {PLATFORMS[connectingKey].abbr}
                </div>
                <div>
                  <h2 className="text-sm font-extrabold">Connect {PLATFORMS[connectingKey].name}</h2>
                  <p className="text-[10px] text-text-dim mt-0.5">Enter your API credentials</p>
                </div>
              </div>
              <button
                onClick={() => setConnectingKey(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-hover text-text-dim"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Instructions */}
              <div className="bg-bg border border-border rounded-lg p-3 text-[11px] text-text-dim leading-relaxed">
                {PLATFORMS[connectingKey].instructions}
              </div>

              <div>
                <label className={labelCls}>Access Token *</label>
                <input
                  className={inputCls}
                  type="password"
                  placeholder="Paste your access token here…"
                  value={credInput}
                  onChange={(e) => setCredInput(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setConnectingKey(null)}
                className="px-4 py-2 text-xs font-semibold text-text-dim hover:text-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveConnect}
                className="px-5 py-2 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent-light transition-colors"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Post Modal ─────────────────────────────────────────────── */}
      {showPostModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9998] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPostModal(false); }}
        >
          <div className="bg-bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="text-base font-extrabold tracking-tight">New Social Post</h2>
                <p className="text-[11px] text-text-dim mt-0.5">Schedule a post across your connected channels</p>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-hover text-text-dim"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Platform picker */}
              <div>
                <label className={labelCls}>Platforms *</label>
                <div className="flex gap-2 flex-wrap">
                  {PLATFORM_KEYS.map((key) => {
                    const sel = selectedPlatforms.has(key);
                    return (
                      <button
                        key={key}
                        onClick={() => togglePlatform(key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                          sel
                            ? "border-accent bg-accent/15 text-accent"
                            : "border-border bg-bg text-text-dim hover:border-accent/40"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded text-[8px] font-extrabold flex items-center justify-center text-white ${PLATFORMS[key].color}`}>
                          {PLATFORMS[key].abbr.slice(0, 1)}
                        </span>
                        {PLATFORMS[key].name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className={labelCls}>Caption / Content *</label>
                <textarea
                  className={`${inputCls} min-h-[100px] resize-none`}
                  placeholder="Write your post content here…"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
                <div className="text-[10px] text-text-muted mt-1 text-right">{postContent.length} / 2200</div>
              </div>

              {/* Schedule date */}
              <div>
                <label className={labelCls}>Schedule Date & Time</label>
                <input
                  className={inputCls}
                  type="datetime-local"
                  value={postDate}
                  onChange={(e) => setPostDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowPostModal(false)}
                className="px-4 py-2 text-xs font-semibold text-text-dim hover:text-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={schedulePost}
                className="px-5 py-2 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent-light transition-colors"
              >
                Schedule Post
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
