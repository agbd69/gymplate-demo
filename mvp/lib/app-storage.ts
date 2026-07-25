import type { DailyRecord, MealTemplate } from "./types";
import { createOptionalClient } from "./supabase/client";

export const appStorageKey = "gymplate-mvp-state-v1";

export type StoredState = {
  record: DailyRecord;
  templates: MealTemplate[];
};

export type StorageStatus = {
  mode: "local" | "cloud" | "local-fallback";
  message: string;
};

export async function loadStoredState(fallback: StoredState): Promise<{ state: StoredState; status: StorageStatus }> {
  const localState = readLocalState() ?? fallback;
  const client = createOptionalClient();
  if (!client) {
    return { state: localState, status: { mode: "local", message: "本地保存" } };
  }

  const { data: sessionData } = await client.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) {
    return { state: localState, status: { mode: "local", message: "未登录，本地保存" } };
  }

  const { data, error } = await client
    .from("app_snapshots")
    .select("state")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { state: localState, status: { mode: "local-fallback", message: "云端读取失败，已回退本地" } };
  }

  const cloudState = parseStoredState(data?.state);
  return { state: cloudState ?? localState, status: { mode: "cloud", message: "云端同步" } };
}

export async function saveStoredState(state: StoredState): Promise<StorageStatus> {
  window.localStorage.setItem(appStorageKey, JSON.stringify(state));
  const client = createOptionalClient();
  if (!client) return { mode: "local", message: "本地保存" };

  const { data: sessionData } = await client.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { mode: "local", message: "未登录，本地保存" };

  const { error } = await client
    .from("app_snapshots")
    .upsert({ user_id: user.id, state, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

  if (error) return { mode: "local-fallback", message: "云端同步失败，已保存本地" };
  return { mode: "cloud", message: "云端同步" };
}

function readLocalState(): StoredState | null {
  try {
    return parseStoredState(JSON.parse(window.localStorage.getItem(appStorageKey) ?? "null"));
  } catch {
    return null;
  }
}

function parseStoredState(value: unknown): StoredState | null {
  const state = value as Partial<StoredState> | null;
  if (!state || !state.record || !Array.isArray(state.templates)) return null;
  return { record: state.record, templates: state.templates };
}
