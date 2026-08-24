import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, fetchHealth } from "../../api/client";

export function PhonePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    if (!code) {
      setError("Missing pairing code. Scan the QR from the Windows host.");
      return;
    }
    void (async () => {
      try {
        await fetchHealth();
        await api("/api/phone/redeem", { method: "POST", body: JSON.stringify({ code }) });
        navigate("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Phone pairing failed");
      }
    })();
  }, [params, navigate]);

  return (
    <section>
      <h2>Connecting phone</h2>
      <p className="notice">The Windows host application must be running on the same Wi-Fi.</p>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
