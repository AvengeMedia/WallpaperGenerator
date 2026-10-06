import { clamp } from "./utils";

export const FORMATS = [
  { id: "16:9", w: 1920, h: 1080, hint: "Most monitors & laptops" },
  { id: "16:10", w: 1920, h: 1200, hint: "MacBooks & many laptops" },
  { id: "21:9", w: 2560, h: 1080, hint: "Ultrawide" },
  { id: "32:9", w: 3840, h: 1080, hint: "Super ultrawide" },
  { id: "3:2", w: 2160, h: 1440, hint: "Surface & Framework laptops" },
  { id: "4:3", w: 1920, h: 1440, hint: "Classic 4:3 monitors" },
  { id: "5:4", w: 1280, h: 1024, hint: "Classic 5:4 monitors" },
] as const;

export type PresetFormatId = (typeof FORMATS)[number]["id"];
export type FormatId = PresetFormatId | "custom";
export type Orientation = "landscape" | "portrait";

export interface Size {
  w: number;
  h: number;
}

export const MIN_PX = 320;
export const MAX_PX = 7680;

export const clampPx = (v: number) => Math.round(clamp(v || MIN_PX, MIN_PX, MAX_PX));

export const findFormat = (id: string) => FORMATS.find((f) => f.id === id);

export const isFormatId = (v: unknown): v is FormatId =>
  v === "custom" || FORMATS.some((f) => f.id === v);

export const canvasSize = (format: FormatId, orientation: Orientation, custom: Size): Size => {
  const f = findFormat(format);
  if (!f) return { w: clampPx(custom.w), h: clampPx(custom.h) };
  return orientation === "portrait" ? { w: f.h, h: f.w } : { w: f.w, h: f.h };
};
