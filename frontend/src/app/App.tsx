import { NavLink, Route, HashRouter, Routes } from "react-router-dom";
import { RemotePage } from "../features/remote/RemotePage";
import { SetupPage } from "../features/setup/SetupPage";
import { PairingPage } from "../features/pairing/PairingPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { DiagnosticsPage } from "../features/diagnostics/DiagnosticsPage";
import { PhonePage } from "../features/setup/PhonePage";
import { useStatus } from "../hooks/useStatus";

export function App() {
  const { status, error } = useStatus();
  const hostDown = Boolean(error) && !status?.host_running;

  return (
    <HashRouter>
      <div className="app-shell">
        <header className="header">
          <div>
            <h1>{status?.device?.display_name ?? "Hashir Samsung Remote"}</h1>
            <div className="model">Model: Samsung UA55H6400 · 2014 H-series / Orsay</div>
          </div>
          <NavLink to="/settings" className="ghost" style={{ padding: "8px 12px", textDecoration: "none", color: "inherit" }}>
            Settings
          </NavLink>
        </header>
        <div className="status-row">
          <span className={`pill ${status?.status === "Connected" ? "ok" : "warn"}`}>
            TV: {status?.status ?? (error ? "Host offline" : "…")}
          </span>
          <span className={`pill ${status?.host_running ? "ok" : "bad"}`}>
            Windows host: {status?.host_running ? "running" : "not running"}
          </span>
          <span className={`pill ${status?.phone_access ? "ok" : ""}`}>
            Phone: {status?.phone_access ? "LAN enabled" : "laptop only"}
          </span>
        </div>
        {hostDown && (
          <p className="error">
            The Windows host is not reachable. Start Hashir Samsung Remote on the laptop. The phone remote cannot work without it.
          </p>
        )}
        <nav className="row" style={{ marginBottom: 8 }}>
          <NavLink to="/" className="ghost" style={{ textAlign: "center", textDecoration: "none", color: "inherit", padding: 12 }}>
            Remote
          </NavLink>
          <NavLink to="/setup" className="ghost" style={{ textAlign: "center", textDecoration: "none", color: "inherit", padding: 12 }}>
            Setup
          </NavLink>
          <NavLink to="/diagnostics" className="ghost" style={{ textAlign: "center", textDecoration: "none", color: "inherit", padding: 12 }}>
            Diagnostics
          </NavLink>
        </nav>
        <Routes>
          <Route path="/" element={<RemotePage status={status} />} />
          <Route path="/setup" element={<SetupPage status={status} />} />
          <Route path="/pairing" element={<PairingPage />} />
          <Route path="/settings" element={<SettingsPage status={status} />} />
          <Route path="/diagnostics" element={<DiagnosticsPage />} />
          <Route path="/phone" element={<PhonePage />} />
        </Routes>
        <p className="host-banner">Local household LAN only. No cloud account. Windows host required for phone control.</p>
      </div>
    </HashRouter>
  );
}
