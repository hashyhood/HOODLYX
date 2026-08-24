import { useEffect, useState } from "react";
import { api, type StatusPayload } from "../../api/client";

type Props = { status: StatusPayload | null };

type Session = { session_id: string; client_ip: string; label: string; created_at: string };

export function SettingsPage({ status }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [qr, setQr] = useState<string | null>(null);
  const [gap, setGap] = useState(320);
  const [msg, setMsg] = useState<string | null>(null);

  async function refreshSessions() {
    const data = await api<{ sessions: Session[] }>("/api/phone/sessions");
    setSessions(data.sessions);
  }

  useEffect(() => {
    void refreshSessions().catch(() => undefined);
  }, []);

  async function togglePhone(enabled: boolean) {
    const result = await api<{ warning: string; firewall: { guidance: string } }>("/api/phone/enable", {
      method: "POST",
      body: JSON.stringify({ enabled }),
    });
    setMsg(`${result.warning} ${result.firewall.guidance}`);
    if (enabled) {
      const code = await api<{ qr: string }>("/api/phone/pairing-code", { method: "POST" });
      setQr(code.qr);
    } else {
      setQr(null);
    }
    await refreshSessions();
  }

  return (
    <section>
      <h2>Settings</h2>
      <p className="notice">
        Enable phone remote only on your household Wi-Fi. The Windows host must keep running. An untrusted shared network is unsafe.
        Do not port-forward 8000, 8080, or this app.
      </p>
      <label style={{ display: "flex", gap: 12, alignItems: "center", margin: "12px 0" }}>
        <input
          type="checkbox"
          checked={Boolean(status?.phone_access)}
          onChange={(e) => void togglePhone(e.target.checked)}
        />
        Enable phone remote
      </label>
      {qr && <img className="qr" src={qr} alt="QR code for phone pairing" />}
      <h3>Connected phone sessions</h3>
      {sessions.length === 0 && <p className="model">No phone sessions.</p>}
      <ul>
        {sessions.map((item) => (
          <li key={item.session_id}>
            {item.label} · {item.client_ip} · {item.created_at}
          </li>
        ))}
      </ul>
      <button type="button" className="ghost" style={{ width: "100%" }} onClick={() => void api("/api/phone/revoke-sessions", { method: "POST" }).then(refreshSessions)}>
        Revoke all phone sessions
      </button>
      <h3>Command spacing</h3>
      <div className="field">
        <label htmlFor="gap">Milliseconds between commands (300–350 recommended)</label>
        <input id="gap" type="number" min={50} max={2000} value={gap} onChange={(e) => setGap(Number(e.target.value))} />
      </div>
      <button
        type="button"
        className="ghost"
        style={{ width: "100%" }}
        onClick={() => void api("/api/settings/command-gap", { method: "POST", body: JSON.stringify({ gap_ms: gap }) })}
      >
        Save command gap
      </button>
      <h3>Television pairing</h3>
      <button type="button" className="ghost" style={{ width: "100%", marginBottom: 8 }} onClick={() => void api("/api/pairing/reset", { method: "POST" })}>
        Reset pairing
      </button>
      <button type="button" className="ghost" style={{ width: "100%" }} onClick={() => void api("/api/device/forget", { method: "POST" })}>
        Forget TV
      </button>
      {msg && <p className="notice">{msg}</p>}
    </section>
  );
}
