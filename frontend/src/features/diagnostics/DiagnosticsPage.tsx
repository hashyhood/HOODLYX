import { useEffect, useState } from "react";
import { api } from "../../api/client";

export function DiagnosticsPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void api<Record<string, unknown>>("/api/diagnostics").then(setData);
  }, []);

  if (!data) return <p>Loading diagnostics…</p>;

  const rows: [string, unknown][] = [
    ["TV IP", data.tv_ip],
    ["Laptop LAN IP", data.laptop_lan_ip],
    ["Pairing port", data.pairing_port],
    ["Remote port", data.remote_port],
    ["Port reachability", JSON.stringify(data.port_reachability)],
    ["Protocol", data.protocol],
    ["Credential present", data.credential_present],
    ["Session ID present", data.session_id_present],
    ["Last connected", data.last_connected_time],
    ["Last key", data.last_key],
    ["Last error", data.last_error],
    ["Queue length", data.queue_length],
    ["Phone access", String(data.phone_access)],
    ["Phone sessions", data.connected_phone_sessions],
    ["App version", data.application_version],
    ["Dependencies", JSON.stringify(data.dependency_versions)],
  ];

  return (
    <section>
      <h2>Diagnostics</h2>
      <p className="model">Secrets are redacted. Tokens and session IDs are never exported in full.</p>
      <table className="diag-table">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th>{label}</th>
              <td>{String(value ?? "—")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <a className="primary" style={{ display: "inline-block", padding: "12px 16px", textDecoration: "none" }} href="/api/diagnostics/export">
          Export redacted JSON
        </a>
      </p>
    </section>
  );
}
