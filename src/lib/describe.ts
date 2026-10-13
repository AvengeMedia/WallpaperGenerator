import { layerName, type Layer } from "@/lib/layer";
import { PALETTE } from "@/lib/palette";
import { normDeg } from "@/lib/utils";

export const describeShape = (layer: Layer): string => {
  const bits = [layerName(layer)];
  const rot = Math.round(normDeg(layer.rot)) % 360;
  if (rot !== 0) bits.push(`rotated ${rot}°`);
  bits.push(`fill color ${PALETTE.indexOf(layer.fill) + 1}`);
  bits.push(`opacity ${Math.round((layer.opacity ?? 1) * 100)}%`);
  return bits.join(", ");
};

export const describeLayerPosition = (index: number, total: number): string =>
  `Layer ${index + 1} of ${total}`;
