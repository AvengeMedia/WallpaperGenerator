import {
  formatForDisplay,
  formatHotkey,
  parseHotkey,
  type DisplayHotkey,
} from "@tanstack/react-hotkeys";

export const keyParts = (hotkey: DisplayHotkey) => formatForDisplay(hotkey, { parts: true });

export const keyLabel = (hotkey: DisplayHotkey) => formatForDisplay(hotkey);

export const ariaKeyshortcuts = (hotkey: string) => formatHotkey(parseHotkey(hotkey));
