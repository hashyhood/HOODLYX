import { useState } from "react";
import { RemoteButton } from "../../components/RemoteButton";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { POWER_ON_UNSUPPORTED } from "./keys";
import type { StatusPayload } from "../../api/client";
import { api } from "../../api/client";

type Props = { status: StatusPayload | null };

export function RemotePage({ status }: Props) {
  const [help, setHelp] = useState(false);
  const [powerMsg, setPowerMsg] = useState<string | null>(null);
  useKeyboardShortcuts(true);

  async function powerOff() {
    setPowerMsg(null);
    await api("/api/remote/key", { method: "POST", body: JSON.stringify({ key: "KEY_POWEROFF" }) });
    setPowerMsg(POWER_ON_UNSUPPORTED);
  }

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <button type="button" className="ghost" onClick={() => setHelp(true)}>
          Keyboard shortcuts
        </button>
        <button type="button" className="ghost" data-testid="btn-power" data-key="KEY_POWEROFF" onClick={() => void powerOff()} aria-label="Power off">
          Power off
        </button>
      </div>
      {(status?.status === "TV offline" || status?.status === "Disconnected") && (
        <p className="notice" data-testid="power-on-notice">
          {POWER_ON_UNSUPPORTED}
        </p>
      )}
      {powerMsg && (
        <p className="notice" data-testid="power-on-notice">
          {powerMsg}
        </p>
      )}

      <div className="remote-grid">
        <div className="side-stack">
          <RemoteButton id="volup" label="Volume up" keyName="KEY_VOLUP">
            <span className="glyph">＋</span>
            <span className="label">Vol</span>
          </RemoteButton>
          <RemoteButton id="mute" label="Mute" keyName="KEY_MUTE">
            <span className="glyph">Mute</span>
          </RemoteButton>
          <RemoteButton id="voldown" label="Volume down" keyName="KEY_VOLDOWN">
            <span className="glyph">－</span>
            <span className="label">Vol</span>
          </RemoteButton>
        </div>

        <div className="dpad" role="group" aria-label="Direction pad">
          <RemoteButton id="up" label="Up" keyName="KEY_UP" className="up">
            ▲
          </RemoteButton>
          <RemoteButton id="left" label="Left" keyName="KEY_LEFT" className="left">
            ◀
          </RemoteButton>
          <RemoteButton id="enter" label="OK" keyName="KEY_ENTER" className="ok">
            OK
          </RemoteButton>
          <RemoteButton id="right" label="Right" keyName="KEY_RIGHT" className="right">
            ▶
          </RemoteButton>
          <RemoteButton id="down" label="Down" keyName="KEY_DOWN" className="down">
            ▼
          </RemoteButton>
        </div>

        <div className="side-stack">
          <RemoteButton id="chup" label="Channel up" keyName="KEY_CHUP">
            <span className="glyph">＋</span>
            <span className="label">CH</span>
          </RemoteButton>
          <RemoteButton id="chlist" label="Channel list" keyName="KEY_CH_LIST">
            <span className="glyph">List</span>
          </RemoteButton>
          <RemoteButton id="chdown" label="Channel down" keyName="KEY_CHDOWN">
            <span className="glyph">－</span>
            <span className="label">CH</span>
          </RemoteButton>
        </div>
      </div>

      <div className="row">
        <RemoteButton id="back" label="Back" keyName="KEY_RETURN">
          Back
        </RemoteButton>
        <RemoteButton id="hub" label="Smart Hub" keyName="KEY_CONTENTS">
          Smart Hub
        </RemoteButton>
        <RemoteButton id="menu" label="Menu" keyName="KEY_MENU">
          Menu
        </RemoteButton>
        <RemoteButton id="source" label="Source" keyName="KEY_SOURCE">
          Source
        </RemoteButton>
      </div>

      <div className="row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <RemoteButton id="guide" label="Guide" keyName="KEY_GUIDE">
          Guide
        </RemoteButton>
        <RemoteButton id="info" label="Info" keyName="KEY_INFO">
          Info
        </RemoteButton>
        <RemoteButton id="tools" label="Tools" keyName="KEY_TOOLS">
          Tools
        </RemoteButton>
        <RemoteButton id="stop" label="Stop" keyName="KEY_STOP">
          Stop
        </RemoteButton>
      </div>
      <div className="row">
        <RemoteButton id="rew" label="Rewind" keyName="KEY_REWIND">
          ⏪
        </RemoteButton>
        <RemoteButton id="play" label="Play" keyName="KEY_PLAY">
          Play
        </RemoteButton>
        <RemoteButton id="pause" label="Pause" keyName="KEY_PAUSE">
          Pause
        </RemoteButton>
        <RemoteButton id="ff" label="Fast-forward" keyName="KEY_FF">
          ⏩
        </RemoteButton>
      </div>

      <details className="panel">
        <summary>Numeric keypad and colour buttons</summary>
        <div className="num-grid">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
            <RemoteButton key={n} id={`n${n}`} label={n} keyName={`KEY_${n}` as "KEY_1"}>
              {n}
            </RemoteButton>
          ))}
          <RemoteButton id="prech" label="Previous channel" keyName="KEY_PRECH">
            Pre-CH
          </RemoteButton>
          <RemoteButton id="n0" label="0" keyName="KEY_0">
            0
          </RemoteButton>
          <RemoteButton id="enter2" label="Enter" keyName="KEY_ENTER">
            Enter
          </RemoteButton>
        </div>
        <div className="color-row">
          <RemoteButton id="red" label="Red" keyName="KEY_RED" className="color-red">
            Red
          </RemoteButton>
          <RemoteButton id="green" label="Green" keyName="KEY_GREEN" className="color-green">
            Green
          </RemoteButton>
          <RemoteButton id="yellow" label="Yellow" keyName="KEY_YELLOW" className="color-yellow">
            Yellow
          </RemoteButton>
          <RemoteButton id="blue" label="Blue" keyName="KEY_BLUE" className="color-blue">
            Blue
          </RemoteButton>
        </div>
      </details>

      {help && (
        <div className="modal-backdrop" role="dialog" aria-label="Keyboard shortcuts">
          <div className="modal">
            <h2>Laptop keyboard shortcuts</h2>
            <p>Disabled while typing in an input field.</p>
            <ul>
              <li>Arrows — navigate</li>
              <li>Enter — OK</li>
              <li>Esc / Backspace — Back</li>
              <li>H — Smart Hub (KEY_CONTENTS)</li>
              <li>M Menu · S Source · G Guide · I Info</li>
              <li>+ / - volume · U mute · Page Up/Down channel</li>
              <li>Space — Play / Pause</li>
            </ul>
            <button type="button" className="primary" onClick={() => setHelp(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
