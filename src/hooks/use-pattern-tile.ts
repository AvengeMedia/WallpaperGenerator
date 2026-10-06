import { useEffect, useState } from "react";
import { patternTileSize, patternUrl, type PatternId } from "@/lib/patterns";

export const usePatternTile = (pattern: PatternId): [number, number] | null => {
  const [size, setSize] = useState<[number, number] | null>(null);
  const src = patternUrl(pattern);

  useEffect(() => {
    if (!src) return;
    let alive = true;
    void patternTileSize(src).then((s) => alive && setSize(s));
    return () => {
      alive = false;
    };
  }, [src]);

  return src ? size : null;
};
