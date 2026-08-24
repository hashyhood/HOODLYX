import type { AllowedKey } from "../features/remote/keys";

export type StatusPayload = {
  status: string;
  host_running: boolean;
  phone_access: boolean;
  tv_model: string;
  protocol: string;
  device: {
    host: string;
    display_name: string;
    model: string;
    auth_port: number;
    remote_port: number;
    credentials_valid: boolean;
  } | null;
  credential_present: boolean | string;
  session_id_present: boolean | string;
  queue_length: number;
  last_key: string | null;
  last_error: string | null;
  lan_ip: string | null;
  version: string;
  csrf_token?: string;
  warning?: string;
  power_on_supported: boolean;
  power_on_message: string;
};

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: unknown; error?: string };
    if (typeof data.detail === "string") return data.detail;
    if (data.detail && typeof data.detail === "object" && "error" in data.detail) {
      return String((data.detail as { error: string }).error);
    }
    if (data.error) return data.error;
  } catch {
    /* ignore */
  }
  return res.statusText;
}

let csrf = "";

export function setCsrf(token: string) {
  csrf = token;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.method && init.method !== "GET") {
    headers.set("X-CSRF-Token", csrf);
    if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, { ...init, headers, credentials: "same-origin" });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as T;
}

export async function fetchHealth(): Promise<StatusPayload> {
  const data = await api<StatusPayload>("/api/health");
  if (data.csrf_token) setCsrf(data.csrf_token);
  return data;
}

export function sendKey(key: AllowedKey, repeatGroup?: string) {
  return api<{ ok: boolean; key: string }>("/api/remote/key", {
    method: "POST",
    body: JSON.stringify({ key, repeat_group: repeatGroup ?? null }),
  });
}

export function stopRepeat(repeatGroup: string) {
  return api("/api/remote/repeat/stop", {
    method: "POST",
    body: JSON.stringify({ repeat_group: repeatGroup }),
  });
}
