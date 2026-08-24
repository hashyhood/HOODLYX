import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type StatusPayload } from "../../api/client";

type Props = { status: StatusPayload | null };

export function SetupPage({ status }: Props) {
  const navigate = useNavigate();
  const [host, setHost] = useState(status?.device?.host ?? "");
  const [name, setName] = useState(status?.device?.display_name ?? "Living Room TV");
  const [authPort, setAuthPort] = useState(String(status?.device?.auth_port ?? 8080));
  const [remotePort, setRemotePort] = useState(String(status?.device?.remote_port ?? 8000));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [discovered, setDiscovered] = useState<{ host: string; name: string }[]>([]);

  async function testPorts(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const result = await api<{ auth: { reachable: boolean; detail: string }; remote: { reachable: boolean; detail: string } }>(
        "/api/device/test",
        { method: "POST", body: JSON.stringify({ host, auth_port: Number(authPort), remote_port: Number(remotePort) }) },
      );
      setMessage(`${result.auth.detail} ${result.remote.detail}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed");
    }
  }

  async function saveAndPair() {
    setError(null);
    try {
      await api("/api/device/save", {
        method: "POST",
        body: JSON.stringify({
          host,
          display_name: name,
          auth_port: Number(authPort),
          remote_port: Number(remotePort),
        }),
      });
      await api("/api/pairing/start", {
        method: "POST",
        body: JSON.stringify({ host, display_name: name, auth_port: Number(authPort), remote_port: Number(remotePort) }),
      });
      navigate("/pairing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pairing did not start");
    }
  }

  async function discover() {
    setError(null);
    try {
      const result = await api<{ devices: { host: string; name: string }[] }>("/api/device/discover", { method: "POST" });
      setDiscovered(result.devices);
      if (!result.devices.length) setMessage("No Samsung devices advertised via SSDP. Enter the TV IP manually.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Discovery failed");
    }
  }

  return (
    <section>
      <h2>Setup</h2>
      <p className="notice">
        This remote uses the 2014 H-series encrypted protocol (pairing port 8080, remote port 8000), not modern Tizen 8001/8002.
        The TV, laptop and phone must share the same household Wi-Fi. Guest isolation and VPNs often block control.
      </p>
      <form onSubmit={testPorts}>
        <div className="field">
          <label htmlFor="tv-ip">Television IP (required)</label>
          <input id="tv-ip" value={host} onChange={(e) => setHost(e.target.value)} placeholder="192.168.1.50" required />
        </div>
        <div className="field">
          <label htmlFor="tv-name">Display name</label>
          <input id="tv-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="row-2">
          <div className="field">
            <label htmlFor="auth-port">Pairing port</label>
            <input id="auth-port" value={authPort} onChange={(e) => setAuthPort(e.target.value)} inputMode="numeric" />
          </div>
          <div className="field">
            <label htmlFor="remote-port">Remote port</label>
            <input id="remote-port" value={remotePort} onChange={(e) => setRemotePort(e.target.value)} inputMode="numeric" />
          </div>
        </div>
        <button type="submit" className="ghost" style={{ width: "100%", marginBottom: 8 }}>
          Test ports
        </button>
        <button type="button" className="primary" onClick={() => void saveAndPair()}>
          Start pairing
        </button>
      </form>
      <p>
        <button type="button" className="ghost" style={{ width: "100%", marginTop: 8 }} onClick={() => void discover()}>
          Search LAN (SSDP, optional)
        </button>
      </p>
      {discovered.map((item) => (
        <button
          key={item.host}
          type="button"
          className="ghost"
          style={{ width: "100%", marginBottom: 6 }}
          onClick={() => {
            setHost(item.host);
            setName(item.name);
          }}
        >
          {item.name} — {item.host}
        </button>
      ))}
      {message && <p className="notice">{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
