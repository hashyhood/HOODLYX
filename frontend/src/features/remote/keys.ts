export const ALLOWED_KEYS = [
  "KEY_UP",
  "KEY_DOWN",
  "KEY_LEFT",
  "KEY_RIGHT",
  "KEY_ENTER",
  "KEY_RETURN",
  "KEY_EXIT",
  "KEY_CONTENTS",
  "KEY_MENU",
  "KEY_SOURCE",
  "KEY_GUIDE",
  "KEY_INFO",
  "KEY_TOOLS",
  "KEY_VOLUP",
  "KEY_VOLDOWN",
  "KEY_MUTE",
  "KEY_CHUP",
  "KEY_CHDOWN",
  "KEY_CH_LIST",
  "KEY_PRECH",
  "KEY_0",
  "KEY_1",
  "KEY_2",
  "KEY_3",
  "KEY_4",
  "KEY_5",
  "KEY_6",
  "KEY_7",
  "KEY_8",
  "KEY_9",
  "KEY_PLAY",
  "KEY_PAUSE",
  "KEY_STOP",
  "KEY_REWIND",
  "KEY_FF",
  "KEY_RECORD",
  "KEY_RED",
  "KEY_GREEN",
  "KEY_YELLOW",
  "KEY_BLUE",
  "KEY_POWEROFF",
] as const;

export type AllowedKey = (typeof ALLOWED_KEYS)[number];

export const BUTTON_BINDINGS: { id: string; label: string; key: AllowedKey; extra?: string }[] = [
  { id: "up", label: "Up", key: "KEY_UP" },
  { id: "down", label: "Down", key: "KEY_DOWN" },
  { id: "left", label: "Left", key: "KEY_LEFT" },
  { id: "right", label: "Right", key: "KEY_RIGHT" },
  { id: "enter", label: "OK", key: "KEY_ENTER" },
  { id: "back", label: "Back", key: "KEY_RETURN" },
  { id: "hub", label: "Smart Hub", key: "KEY_CONTENTS" },
  { id: "menu", label: "Menu", key: "KEY_MENU" },
  { id: "source", label: "Source", key: "KEY_SOURCE" },
  { id: "volup", label: "Volume up", key: "KEY_VOLUP" },
  { id: "mute", label: "Mute", key: "KEY_MUTE" },
  { id: "voldown", label: "Volume down", key: "KEY_VOLDOWN" },
  { id: "chup", label: "Channel up", key: "KEY_CHUP" },
  { id: "chlist", label: "Channel list", key: "KEY_CH_LIST" },
  { id: "chdown", label: "Channel down", key: "KEY_CHDOWN" },
  { id: "guide", label: "Guide", key: "KEY_GUIDE" },
  { id: "info", label: "Info", key: "KEY_INFO" },
  { id: "tools", label: "Tools", key: "KEY_TOOLS" },
  { id: "rew", label: "Rewind", key: "KEY_REWIND" },
  { id: "play", label: "Play", key: "KEY_PLAY" },
  { id: "pause", label: "Pause", key: "KEY_PAUSE" },
  { id: "ff", label: "Fast-forward", key: "KEY_FF" },
  { id: "stop", label: "Stop", key: "KEY_STOP" },
  { id: "power", label: "Power off", key: "KEY_POWEROFF" },
  { id: "prech", label: "Previous channel", key: "KEY_PRECH" },
  { id: "n0", label: "0", key: "KEY_0" },
  { id: "n1", label: "1", key: "KEY_1" },
  { id: "n2", label: "2", key: "KEY_2" },
  { id: "n3", label: "3", key: "KEY_3" },
  { id: "n4", label: "4", key: "KEY_4" },
  { id: "n5", label: "5", key: "KEY_5" },
  { id: "n6", label: "6", key: "KEY_6" },
  { id: "n7", label: "7", key: "KEY_7" },
  { id: "n8", label: "8", key: "KEY_8" },
  { id: "n9", label: "9", key: "KEY_9" },
  { id: "red", label: "Red", key: "KEY_RED" },
  { id: "green", label: "Green", key: "KEY_GREEN" },
  { id: "yellow", label: "Yellow", key: "KEY_YELLOW" },
  { id: "blue", label: "Blue", key: "KEY_BLUE" },
];

export const KEYBOARD_SHORTCUTS: { code?: string; key?: string; command: AllowedKey; when?: string }[] = [
  { code: "ArrowUp", command: "KEY_UP" },
  { code: "ArrowDown", command: "KEY_DOWN" },
  { code: "ArrowLeft", command: "KEY_LEFT" },
  { code: "ArrowRight", command: "KEY_RIGHT" },
  { code: "Enter", command: "KEY_ENTER" },
  { code: "Escape", command: "KEY_RETURN" },
  { code: "Backspace", command: "KEY_RETURN" },
  { key: "h", command: "KEY_CONTENTS" },
  { key: "m", command: "KEY_MENU" },
  { key: "s", command: "KEY_SOURCE" },
  { key: "g", command: "KEY_GUIDE" },
  { key: "i", command: "KEY_INFO" },
  { key: "+", command: "KEY_VOLUP" },
  { key: "=", command: "KEY_VOLUP" },
  { key: "-", command: "KEY_VOLDOWN" },
  { key: "u", command: "KEY_MUTE" },
  { code: "PageUp", command: "KEY_CHUP" },
  { code: "PageDown", command: "KEY_CHDOWN" },
];

export const REPEATABLE = new Set<AllowedKey>([
  "KEY_VOLUP",
  "KEY_VOLDOWN",
  "KEY_CHUP",
  "KEY_CHDOWN",
  "KEY_UP",
  "KEY_DOWN",
  "KEY_LEFT",
  "KEY_RIGHT",
  "KEY_REWIND",
  "KEY_FF",
]);

export const POWER_ON_UNSUPPORTED =
  "This 2014 Samsung model normally cannot be powered on over Wi-Fi. Use the physical remote or an optional infrared bridge.";

export function bindingForId(id: string) {
  return BUTTON_BINDINGS.find((item) => item.id === id);
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || Boolean(target.isContentEditable);
}
