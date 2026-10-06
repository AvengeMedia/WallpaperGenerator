import { useCallback, useEffect } from "react";
import { parseLayout } from "@/lib/layout-file";
import { wallpaper, wallpaperStore } from "@/store/wallpaper";
import { ui } from "@/store/ui";

const MAX_BYTES = 1e6;

export const importLayoutText = (text: string) => {
  const result = parseLayout(text, wallpaperStore.state.canvas);
  if (!result.ok) {
    ui.showToast(result.error, 4000);
    return;
  }
  wallpaper.importLayout(result.layout);
  const { skipped } = result.layout;
  if (skipped)
    ui.showToast(
      `${skipped} shape${skipped === 1 ? "" : "s"} in that file couldn't be read.`,
      3000,
    );
};

export const importLayoutFile = async (file: File | null | undefined) => {
  if (!file) return;
  if (file.size > MAX_BYTES) {
    ui.showToast("That file is too large.", 3000);
    return;
  }
  importLayoutText(await file.text());
};

export const useDropImport = () => {
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes("Files")) e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      const file = [...(e.dataTransfer?.files ?? [])].find((f) => /\.json$/i.test(f.name));
      if (!file) return;
      e.preventDefault();
      void importLayoutFile(file);
    };
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  return useCallback((input: HTMLInputElement) => {
    void importLayoutFile(input.files?.[0]);
    input.value = "";
  }, []);
};
