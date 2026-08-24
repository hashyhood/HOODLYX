import { describe, expect, it } from "vitest";
import {
  ALLOWED_KEYS,
  BUTTON_BINDINGS,
  KEYBOARD_SHORTCUTS,
  POWER_ON_UNSUPPORTED,
  bindingForId,
  isTypingTarget,
} from "./keys";

describe("remote key bindings", () => {
  it("maps every visible button to an allowlisted command", () => {
    for (const binding of BUTTON_BINDINGS) {
      expect(ALLOWED_KEYS).toContain(binding.key);
    }
  });

  it("sends KEY_CONTENTS for Smart Hub", () => {
    expect(bindingForId("hub")?.key).toBe("KEY_CONTENTS");
  });

  it("sends KEY_RETURN for Back", () => {
    expect(bindingForId("back")?.key).toBe("KEY_RETURN");
  });

  it("sends only KEY_POWEROFF for power", () => {
    expect(bindingForId("power")?.key).toBe("KEY_POWEROFF");
    const keys = BUTTON_BINDINGS.map((item) => item.key as string);
    expect(keys).not.toContain("KEY_POWERON");
    expect(keys).not.toContain("KEY_POWER");
  });

  it("does not offer factory/service keys", () => {
    for (const binding of BUTTON_BINDINGS) {
      expect(binding.key).not.toMatch(/FACTORY|SERVICE|EEPROM|HOTEL/i);
    }
  });

  it("maps laptop shortcuts including Smart Hub on H", () => {
    expect(KEYBOARD_SHORTCUTS.find((item) => item.key === "h")?.command).toBe("KEY_CONTENTS");
  });

  it("states that Wi-Fi power-on is unavailable", () => {
    expect(POWER_ON_UNSUPPORTED).toMatch(/cannot be powered on over Wi-Fi/i);
  });

  it("disables shortcut detection inside inputs", () => {
    const input = document.createElement("input");
    expect(isTypingTarget(input)).toBe(true);
    expect(isTypingTarget(document.createElement("div"))).toBe(false);
  });
});
