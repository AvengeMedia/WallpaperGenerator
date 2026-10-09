import { ui } from "@/store/ui";

const COOLDOWN = 2000;

interface Armed {
  id: string;
  code: string;
  at: number;
}

let armed: Armed | null = null;
let listening = false;

const disarmOnOtherKey = (e: KeyboardEvent) => {
  if (armed && e.code !== armed.code) armed = null;
};

const listen = () => {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("keydown", disarmOnOtherKey, true);
};

export const armable = (e: KeyboardEvent, id: string, hint: string, run: () => void) => {
  listen();
  if (e.repeat) return;
  if (armed?.id === id && armed.code === e.code && performance.now() - armed.at < COOLDOWN) {
    armed = null;
    run();
    return;
  }
  armed = { id, code: e.code, at: performance.now() };
  ui.showToast(hint, COOLDOWN);
};
