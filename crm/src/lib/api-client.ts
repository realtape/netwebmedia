/**
 * Thin client for /api/resources/{type}[/{id}].
 *
 * Works against the PHP backend (api-php/routes/resources.php) which exposes a
 * generic polymorphic CRUD endpoint backed by the `resources` table.
 *
 * Every CRM module (companies, tickets, quotes, automations, landing-pages...)
 * uses this — there are no per-module route handlers. The `type` string maps
 * 1:1 to the page route (e.g. /crm/companies -> type: "companies").
 *
 * If the backend is unreachable (offline dev, not logged in, 404 on demo
 * deploys), callers get { ok: false } and can fall back to seed mock data so
 * the UI stays usable.
 */

export interface ResourceRow<T = Record<string, unknown>> {
  id: number;
  slug: string | null;
  title: string | null;
  status: string | null;
  data: T;
  owner_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ListResponse<T = Record<string, unknown>> {
  total: number;
  limit: number;
  offset: number;
  items: ResourceRow<T>[];
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

const BASE_PATH = "/api/resources";

// Allow overriding the API origin at build time (prod deploys point the CRM
// static export at the same host as the PHP backend).
const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN ??
  (typeof window !== "undefined" ? "" : "");

function urlFor(type: string, id?: number | string, query?: Record<string, string | number | undefined>) {
  const qs = query
    ? "?" +
      Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  const idPart = id !== undefined ? `/${encodeURIComponent(String(id))}` : "";
  return `${API_ORIGIN}${BASE_PATH}/${encodeURIComponent(type)}${idPart}${qs}`;
}

async function request<T>(
  url: string,
  init: RequestInit = {}
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}`, status: res.status };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function listResources<T = Record<string, unknown>>(
  type: string,
  opts: { q?: string; status?: string; limit?: number; offset?: number } = {}
): Promise<ApiResult<ListResponse<T>>> {
  return request<ListResponse<T>>(urlFor(type, undefined, opts));
}

export function getResource<T = Record<string, unknown>>(
  type: string,
  id: number | string
): Promise<ApiResult<ResourceRow<T>>> {
  return request<ResourceRow<T>>(urlFor(type, id));
}

export function createResource<T = Record<string, unknown>>(
  type: string,
  body: { title?: string; slug?: string; status?: string; data?: T }
): Promise<ApiResult<ResourceRow<T>>> {
  return request<ResourceRow<T>>(urlFor(type), {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateResource<T = Record<string, unknown>>(
  type: string,
  id: number | string,
  body: Partial<{ title: string; slug: string; status: string; data: T }>
): Promise<ApiResult<ResourceRow<T>>> {
  return request<ResourceRow<T>>(urlFor(type, id), {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteResource(
  type: string,
  id: number | string
): Promise<ApiResult<{ ok: true }>> {
  return request<{ ok: true }>(urlFor(type, id), { method: "DELETE" });
}
