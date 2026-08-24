import { useEffect, useState } from "react";
import { fetchHealth, type StatusPayload } from "../api/client";

export function useStatus() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchHealth();
        if (!cancelled) {
          setStatus(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Host unreachable");
      }
    }
    void load();
    const es = new EventSource("/api/events");
    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as { payload?: StatusPayload };
        if (parsed.payload) setStatus((prev) => ({ ...(prev ?? parsed.payload!), ...parsed.payload }));
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => setError("Live updates lost. The Windows host must stay running.");
    const poll = window.setInterval(() => void load(), 8000);
    return () => {
      cancelled = true;
      es.close();
      window.clearInterval(poll);
    };
  }, []);

  return { status, error, setStatus };
}
