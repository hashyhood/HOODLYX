import { useEffect, useRef, useState } from "react";
import { REPEATABLE, type AllowedKey } from "../features/remote/keys";
import { sendKey, stopRepeat } from "../api/client";

type Props = {
  id: string;
  label: string;
  keyName: AllowedKey;
  className?: string;
  children?: React.ReactNode;
};

export function RemoteButton({ id, label, keyName, className, children }: Props) {
  const [pressed, setPressed] = useState(false);
  const groupRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const sentRef = useRef(false);

  function haptic() {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
  }

  async function fire(group?: string) {
    haptic();
    await sendKey(keyName, group);
  }

  function clearRepeat() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    if (groupRef.current) void stopRepeat(groupRef.current);
    groupRef.current = null;
    setPressed(false);
  }

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    sentRef.current = true;
    setPressed(true);
    if (!REPEATABLE.has(keyName)) {
      void fire();
      return;
    }
    const group = `${id}-${Date.now()}`;
    groupRef.current = group;
    void fire(group);
    window.setTimeout(() => {
      if (!groupRef.current) return;
      timerRef.current = window.setInterval(() => {
        if (groupRef.current) void fire(groupRef.current);
      }, 320);
    }, 300);
  }

  useEffect(() => {
    const stop = () => clearRepeat();
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", stop);
    document.addEventListener("pagehide", stop);
    return () => {
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", stop);
      document.removeEventListener("pagehide", stop);
      clearRepeat();
    };
  }, []);

  return (
    <button
      type="button"
      className={`remote-btn ${className ?? ""} ${pressed ? "pressed" : ""}`}
      aria-label={label}
      data-key={keyName}
      data-testid={`btn-${id}`}
      onPointerDown={onPointerDown}
      onPointerUp={clearRepeat}
      onPointerCancel={clearRepeat}
      onLostPointerCapture={clearRepeat}
      onClick={(event) => {
        if (sentRef.current) {
          event.preventDefault();
          sentRef.current = false;
        }
      }}
    >
      {children ?? (
        <>
          <span className="glyph">{label}</span>
        </>
      )}
    </button>
  );
}
