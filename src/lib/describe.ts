import { layerName, type Layer } from "@/lib/layer";
import { PALETTE } from "@/lib/palette";
import { normDeg } from "@/lib/utils";

export const describeShape = (l: Layer): string => {
  const bits = [layerName(l)];
  const rot = Math.round(normDeg(l.rot)) % 360;
  if (rot !== 0) bits.push(`rotated ${rot}°`);
  bits.push(`fill color ${PALETTE.indexOf(l.fill) + 1}`);
  bits.push(`opacity ${Math.round((l.opacity ?? 1) * 100)}%`);
  return bits.join(", ");
};

export const describeLayerPosition = (index: number, total: number): string =>
  `Layer ${index + 1} of ${total}`;
