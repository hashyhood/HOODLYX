import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";

export function PairingPage() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function confirm(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly four digits.");
      return;
    }
    try {
      await api("/api/pairing/confirm", { method: "POST", body: JSON.stringify({ pin }) });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "PIN rejected");
    }
  }

  return (
    <section>
      <h2>Enter the PIN shown on the TV</h2>
      <p className="notice">Look at the television. Samsung should display a four-digit pairing code.</p>
      <form onSubmit={confirm}>
        <div className="field">
          <label htmlFor="pin">Four-digit PIN</label>
          <input
            id="pin"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            aria-describedby="pin-help"
          />
        </div>
        <p id="pin-help" className="model">
          Exactly four digits. Nothing is sent until you confirm.
        </p>
        <button type="submit" className="primary" disabled={pin.length !== 4}>
          Confirm PIN
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
