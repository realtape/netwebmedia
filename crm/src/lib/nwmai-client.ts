/**
 * NWMai client — thin typed fetch wrapper over /api/nwmai/*.
 *
 * All calls run with credentials:"include" so the nwm_token cookie is sent.
 * Every return is a discriminated union so callers can `if (r.ok)` narrow.
 */

const BASE =
  (typeof window !== "undefined" &&
    (window as unknown as { __NWM_API_BASE__?: string }).__NWM_API_BASE__) ||
  "/api";

export type NWMaiContext = {
  /** Current CRM route, e.g. "/companies/42" */
  route?: string;
  /** Focused entity (company/deal/contact/page) */
  entity?: Record<string, unknown>;
  /** Any additional free-form context */
  [key: string]: unknown;
};

export type NWMaiMessage = {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
};

export type NWMaiChatResult =
  | { ok: true; sessionId: string; reply: string; mock: boolean }
  | { ok: false; error: string; status?: number };

export type NWMaiGenerateKind =
  | "page_draft"
  | "blog_section"
  | "meta"
  | "email_subject"
  | "email_body"
  | "summary"
  | "next_steps"
  | "translate";

export type NWMaiGenerateResult =
  | { ok: true; output: string; mock: boolean }
  | { ok: false; error: string; status?: number };

export type NWMaiSessionSummary = {
  session_id: string;
  started_at: string;
  last_at: string;
  turns: number;
  first_message: string | null;
};

function extractError(json: unknown, status: number): string {
  if (
    json &&
    typeof json === "object" &&
    "error" in json &&
    typeof (json as { error: unknown }).error === "string"
  ) {
    return (json as { error: string }).error;
  }
  return `HTTP ${status}`;
}

async function post<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<
  { ok: true; data: T } | { ok: false; error: string; status?: number }
> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // not JSON
    }
    if (!res.ok) {
      return { ok: false, error: extractError(json, res.status), status: res.status };
    }
    return { ok: true, data: json as T };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "Network error" };
  }
}

async function getJson<T>(
  path: string,
): Promise<
  { ok: true; data: T } | { ok: false; error: string; status?: number }
> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      credentials: "include",
      cache: "no-store",
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // not JSON
    }
    if (!res.ok) {
      return { ok: false, error: extractError(json, res.status), status: res.status };
    }
    return { ok: true, data: json as T };
  } catch (e) {
    return { ok: false, error: (e as Error).message || "Network error" };
  }
}

/** Chat with NWMai. Pass sessionId to continue a conversation, or omit to start a new one. */
export async function nwmaiChat(
  message: string,
  sessionId?: string,
  context?: NWMaiContext,
): Promise<NWMaiChatResult> {
  const r = await post<{
    session_id: string;
    reply: string;
    mock: boolean;
  }>("/nwmai/chat", {
    message,
    session_id: sessionId,
    context: context ?? {},
  });
  if (!r.ok) return r;
  return {
    ok: true,
    sessionId: r.data.session_id,
    reply: r.data.reply,
    mock: !!r.data.mock,
  };
}

/** One-shot content generation (CMS, emails, meta, translate, etc.) */
export async function nwmaiGenerate(
  kind: NWMaiGenerateKind,
  input: string,
  opts?: { tone?: string; language?: string },
): Promise<NWMaiGenerateResult> {
  const r = await post<{
    output: string;
    mock: boolean;
    error?: string;
  }>("/nwmai/generate", { kind, input, ...opts });
  if (!r.ok) return r;
  if (r.data.error) return { ok: false, error: r.data.error };
  return { ok: true, output: r.data.output ?? "", mock: !!r.data.mock };
}

export async function nwmaiListSessions(): Promise<
  | { ok: true; sessions: NWMaiSessionSummary[] }
  | { ok: false; error: string; status?: number }
> {
  const r = await getJson<{ sessions: NWMaiSessionSummary[] }>(
    "/nwmai/sessions",
  );
  if (!r.ok) return r;
  return { ok: true, sessions: r.data.sessions ?? [] };
}

export async function nwmaiGetSession(
  id: string,
): Promise<
  | { ok: true; messages: NWMaiMessage[] }
  | { ok: false; error: string; status?: number }
> {
  const r = await getJson<{ messages: NWMaiMessage[] }>(
    `/nwmai/session/${encodeURIComponent(id)}`,
  );
  if (!r.ok) return r;
  return { ok: true, messages: r.data.messages ?? [] };
}
