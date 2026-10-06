import { useEffect, useMemo } from "react";
import { rgbCss, rgbToHex } from "@/lib/color";
import { hueGradient, shiftedTokens, TOKENS, tokenCssVar } from "@/lib/theme";
import { useWallpaper } from "@/store/wallpaper";

export const useThemeColors = () => {
  const { dark, hue } = useWallpaper((s) => ({ dark: s.dark, hue: s.prefs.hue }));
  const tokens = useMemo(() => shiftedTokens(dark, hue), [dark, hue]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.classList.toggle("light", !dark);
    root.style.colorScheme = dark ? "dark" : "light";
    for (const name of TOKENS) root.style.setProperty(tokenCssVar(name), rgbCss(tokens[name]));
  }, [dark, tokens]);

  return {
    tokens,
    primaryHex: rgbToHex(tokens.primary),
    hueTrack: useMemo(() => hueGradient(dark), [dark]),
  };
};
