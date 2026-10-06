import { hasOverlap, layerPath, layerTransform, type Layer } from "@/lib/layer";
import { cssColor, type PaletteColor } from "@/lib/palette";

interface LayerShapeProps {
  layer: Layer;
  index: number;
  below: Layer[];
}

const maskBounds = (l: Layer) => {
  const reach = l.size * 0.25;
  return { x: l.x - reach, y: l.y - reach, width: l.size + reach * 2, height: l.size + reach * 2 };
};

export function LayerShape({ layer, index, below }: LayerShapeProps) {
  const d = layerPath(layer);
  const transform = layerTransform(layer);
  const groupStyle = layer.opacity !== undefined ? { opacity: layer.opacity } : undefined;

  if (!hasOverlap(layer, index)) {
    return (
      <g style={groupStyle}>
        <path
          d={d}
          transform={transform}
          data-id={layer.id}
          className="cursor-grab active:cursor-grabbing"
          style={{ fill: cssColor(layer.fill) }}
        />
      </g>
    );
  }

  const maskId = `mask-${layer.id}`;
  const half = layer.size * 0.75;
  const cx = layer.x + layer.size / 2;
  const cy = layer.y + layer.size / 2;

  return (
    <g style={groupStyle}>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" {...maskBounds(layer)}>
          <path d={d} transform={transform} fill="#fff" />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`} className="pointer-events-none">
        <rect
          x={cx - half}
          y={cy - half}
          width={half * 2}
          height={half * 2}
          className=""
          style={{ fill: cssColor(layer.fill) }}
        />
        {below.map((b) => (
          <path
            key={b.id}
            d={layerPath(b)}
            transform={layerTransform(b)}
            className=""
            style={{ fill: cssColor(layer.overlap as PaletteColor) }}
          />
        ))}
      </g>
      <path
        d={d}
        transform={transform}
        data-id={layer.id}
        fill="#000"
        fillOpacity={0}
        className="cursor-grab active:cursor-grabbing"
      />
    </g>
  );
}
