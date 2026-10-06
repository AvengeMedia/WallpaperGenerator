import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const normDeg = (d: number) => ((d % 360) + 360) % 360;

export const round = (v: number, digits = 3) => +v.toFixed(digits);

export const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export const pickRandom = <T>(list: readonly T[]): T =>
  list[Math.floor(Math.random() * list.length)];

export const camel = (s: string) => s.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

export const lowerFirst = (s: string) => s[0].toLowerCase() + s.slice(1);
