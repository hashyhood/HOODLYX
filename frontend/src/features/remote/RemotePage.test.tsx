import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { vi, describe, expect, it, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RemoteButton } from "../../components/RemoteButton";
import { RemotePage } from "./RemotePage";
import { PairingPage } from "../pairing/PairingPage";
import { SettingsPage } from "../settings/SettingsPage";

const sendKey = vi.fn();
const stopRepeat = vi.fn();
const api = vi.fn();

vi.mock("../../api/client", () => ({
  sendKey: (...args: unknown[]) => sendKey(...args),
  stopRepeat: (...args: unknown[]) => stopRepeat(...args),
  api: (...args: unknown[]) => api(...args),
  fetchHealth: vi.fn(),
}));

describe("Remote UI", () => {
  beforeEach(() => {
    sendKey.mockReset().mockResolvedValue({ ok: true });
    stopRepeat.mockReset().mockResolvedValue({ ok: true });
    api.mockReset().mockResolvedValue({ sessions: [] });
  });

  it("does not include a raw Samsung key text box", () => {
    render(<RemotePage status={null} />);
    expect(screen.queryByLabelText(/raw/i)).toBeNull();
    expect(document.querySelector("input[name='raw-key']")).toBeNull();
  });

  it("shows an honest Wi-Fi power-on message when offline", () => {
    render(
      <RemotePage
        status={{
          status: "TV offline",
          host_running: true,
          phone_access: false,
          tv_model: "UA55H6400",
          protocol: "H-Series Encrypted v1",
          device: null,
          credential_present: false,
          session_id_present: false,
          queue_length: 0,
          last_key: null,
          last_error: null,
          lan_ip: null,
          version: "1.0.0",
          power_on_supported: false,
          power_on_message: "no",
        }}
      />,
    );
    expect(screen.getByTestId("power-on-notice").textContent).toMatch(/cannot be powered on over Wi-Fi/i);
  });

  it("maps Smart Hub / Back / Power buttons to allowlisted keys", () => {
    render(<RemotePage status={null} />);
    expect(screen.getByTestId("btn-hub")).toHaveAttribute("data-key", "KEY_CONTENTS");
    expect(screen.getByTestId("btn-back")).toHaveAttribute("data-key", "KEY_RETURN");
    expect(screen.getByTestId("btn-power")).toHaveAttribute("data-key", "KEY_POWEROFF");
  });

  it("stops hold-repeat on pointerup and pointercancel", async () => {
    render(<RemoteButton id="volup" label="Volume up" keyName="KEY_VOLUP" />);
    const btn = screen.getByTestId("btn-volup");
    fireEvent.pointerDown(btn);
    fireEvent.pointerUp(btn);
    expect(stopRepeat).toHaveBeenCalled();
    fireEvent.pointerDown(btn);
    fireEvent.pointerCancel(btn);
    expect(stopRepeat.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("requires exactly four digits to confirm pairing", () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<PairingPage />} />
        </Routes>
      </MemoryRouter>,
    );
    const input = screen.getByLabelText(/four-digit pin/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "12a45" } });
    expect(input.value).toBe("1245");
    expect(screen.getByRole("button", { name: /confirm pin/i })).toBeEnabled();
    fireEvent.change(input, { target: { value: "12" } });
    expect(screen.getByRole("button", { name: /confirm pin/i })).toBeDisabled();
  });

  it("can revoke phone sessions from settings", async () => {
    api.mockResolvedValue({ sessions: [], warning: "", firewall: { guidance: "" } });
    render(<SettingsPage status={null} />);
    fireEvent.click(screen.getByText(/revoke all phone sessions/i));
    expect(api).toHaveBeenCalledWith("/api/phone/revoke-sessions", expect.objectContaining({ method: "POST" }));
  });
});
