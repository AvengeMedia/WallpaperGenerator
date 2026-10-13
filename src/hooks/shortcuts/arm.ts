import { ui } from "@/store/ui";

const COOLDOWN = 2000;

interface Armed {
  id: string;
  code: string;
  at: number;
}

let armed: Armed | null = null;
let listening = false;

const disarmOnOtherKey = (event: KeyboardEvent) => {
  if (armed && event.code !== armed.code) armed = null;
};

const listen = () => {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("keydown", disarmOnOtherKey, true);
};

export const armable = (event: KeyboardEvent, id: string, hint: string, run: () => void) => {
  listen();
  if (event.repeat) return;
  if (armed?.id === id && armed.code === event.code && performance.now() - armed.at < COOLDOWN) {
    armed = null;
    run();
    return;
  }
  armed = { id, code: event.code, at: performance.now() };
  ui.showToast(hint, COOLDOWN);
};
