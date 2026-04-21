"use client";

/**
 * useResource — React hook for every CRM module page.
 *
 * Contract: pass a resource type (e.g. "companies") and seed mock data. The
 * hook tries /api/resources/{type} first; if the backend is reachable and has
 * rows, those win. Otherwise it falls back to the mock seed so the UI keeps
 * rendering in local dev / unauthenticated demos / static exports.
 *
 * Mutations (create/update/remove) hit the backend when online, otherwise
 * mutate an in-memory clone so clicking buttons still feels live during demos.
 */

import { useCallback, useEffect, useState } from "react";
import {
  createResource,
  deleteResource,
  listResources,
  updateResource,
  type ResourceRow,
} from "./api-client";

export type ResourceState = "loading" | "ready" | "offline";

export interface UseResourceResult<T> {
  items: T[];
  state: ResourceState;
  online: boolean;
  refresh: () => Promise<void>;
  add: (item: Partial<T> & { title?: string; status?: string }) => Promise<void>;
  update: (id: string | number, patch: Partial<T>) => Promise<void>;
  remove: (id: string | number) => Promise<void>;
}

export function useResource<T extends { id?: string | number }>(
  type: string,
  seed: T[]
): UseResourceResult<T> {
  const [items, setItems] = useState<T[]>(seed);
  const [state, setState] = useState<ResourceState>("loading");
  const [online, setOnline] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    const res = await listResources<T>(type);
    if (res.ok && res.data.items.length > 0) {
      // Prefer backend rows. Flatten ResourceRow<T> so UI keeps dealing with
      // the flat shape it already knows from mock-data.
      const flat = res.data.items.map((row: ResourceRow<T>) => ({
        ...(row.data as object),
        id: row.id,
      })) as T[];
      setItems(flat);
      setOnline(true);
      setState("ready");
    } else if (res.ok) {
      // Backend reachable but empty — use seed for display but mark online so
      // mutations persist to the backend.
      setItems(seed);
      setOnline(true);
      setState("ready");
    } else {
      setItems(seed);
      setOnline(false);
      setState("offline");
    }
  }, [type, seed]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = useCallback<UseResourceResult<T>["add"]>(
    async (item) => {
      if (online) {
        const res = await createResource<T>(type, {
          title: item.title as string | undefined,
          status: item.status as string | undefined,
          data: item as T,
        });
        if (res.ok) {
          await refresh();
          return;
        }
      }
      setItems((curr) => [...curr, { ...(item as T), id: item.id ?? `local-${Date.now()}` }]);
    },
    [online, type, refresh]
  );

  const update = useCallback<UseResourceResult<T>["update"]>(
    async (id, patch) => {
      if (online && typeof id === "number") {
        const res = await updateResource<T>(type, id, { data: patch as T });
        if (res.ok) {
          await refresh();
          return;
        }
      }
      setItems((curr) => curr.map((it) => (it.id === id ? { ...it, ...patch } : it)));
    },
    [online, type, refresh]
  );

  const remove = useCallback<UseResourceResult<T>["remove"]>(
    async (id) => {
      if (online && typeof id === "number") {
        const res = await deleteResource(type, id);
        if (res.ok) {
          await refresh();
          return;
        }
      }
      setItems((curr) => curr.filter((it) => it.id !== id));
    },
    [online, type, refresh]
  );

  return { items, state, online, refresh, add, update, remove };
}
