import { clamp } from "./utils";

export const FORMATS = [
  { id: "16:9", width: 1920, height: 1080, hint: "Most monitors & laptops" },
  { id: "16:10", width: 1920, height: 1200, hint: "MacBooks & many laptops" },
  { id: "21:9", width: 2560, height: 1080, hint: "Ultrawide" },
  { id: "32:9", width: 3840, height: 1080, hint: "Super ultrawide" },
  { id: "3:2", width: 2160, height: 1440, hint: "Surface & Framework laptops" },
  { id: "4:3", width: 1920, height: 1440, hint: "Classic 4:3 monitors" },
  { id: "5:4", width: 1280, height: 1024, hint: "Classic 5:4 monitors" },
] as const;

export type PresetFormatId = (typeof FORMATS)[number]["id"];
export type FormatId = PresetFormatId | "custom";
export type Orientation = "landscape" | "portrait";

export interface Size {
  width: number;
  height: number;
}

export const MIN_PX = 320;
export const MAX_PX = 7680;

export const clampPx = (value: number) => Math.round(clamp(value || MIN_PX, MIN_PX, MAX_PX));

export const findFormat = (id: string) => FORMATS.find((f) => f.id === id);

export const isFormatId = (value: unknown): value is FormatId =>
  value === "custom" || FORMATS.some((format) => format.id === value);

export const canvasSize = (format: FormatId, orientation: Orientation, custom: Size): Size => {
  const formatPreset = findFormat(format);
  if (!formatPreset) return { width: clampPx(custom.width), height: clampPx(custom.height) };
  return orientation === "portrait"
    ? { width: formatPreset.height, height: formatPreset.width }
    : { width: formatPreset.width, height: formatPreset.height };
};
