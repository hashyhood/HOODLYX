import { useEffect, useRef } from "react";
import { isTypingTarget, KEYBOARD_SHORTCUTS, type AllowedKey } from "../features/remote/keys";
import { sendKey } from "../api/client";

export function useKeyboardShortcuts(enabled: boolean) {
  const lastSpace = useRef<"KEY_PLAY" | "KEY_PAUSE">("KEY_PAUSE");

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;
      if (event.repeat && !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown"].includes(event.code)) {
        return;
      }
      let command: AllowedKey | undefined;
      if (event.code === "Space") {
        command = lastSpace.current === "KEY_PLAY" ? "KEY_PAUSE" : "KEY_PLAY";
        lastSpace.current = command;
      } else {
        const match = KEYBOARD_SHORTCUTS.find(
          (item) => item.code === event.code || item.key === event.key.toLowerCase() || item.key === event.key,
        );
        command = match?.command;
      }
      if (!command) return;
      event.preventDefault();
      void sendKey(command);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
