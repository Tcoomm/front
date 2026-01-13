import { useEffect, useLayoutEffect, useState } from "react";
import type { Slide } from "../types";

type UsePlayerControlsOptions = {
  isPlayer: boolean;
  slides: Slide[];
  selectionSlideId?: string | null;
  slideWidth: number;
  slideHeight: number;
  onExit: () => void;
};

export function usePlayerControls({
  isPlayer,
  slides,
  selectionSlideId,
  slideWidth,
  slideHeight,
  onExit,
}: UsePlayerControlsOptions) {
  const [playerIndex, setPlayerIndex] = useState(0);
  const [playerScale, setPlayerScale] = useState(1);

  useEffect(() => {
    if (!isPlayer) return;
    const idx = selectionSlideId
      ? slides.findIndex((s) => s.id === selectionSlideId)
      : 0;
    setPlayerIndex(idx >= 0 ? idx : 0);
  }, [isPlayer, selectionSlideId, slides]);

  useEffect(() => {
    if (!isPlayer) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        setPlayerIndex((prev) => Math.min(slides.length - 1, prev + 1)); // Перемещаюсь к следующему слайду
      } else if (e.key === "ArrowLeft") {
        setPlayerIndex((prev) => Math.max(0, prev - 1)); // Перемещаюсь к предыдущему слайду
      } else if (e.key === "Escape") {
        onExit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPlayer, slides.length, onExit]);

  useLayoutEffect(() => {
    if (!isPlayer) return;
    let raf = 0;
    const updateScale = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const scale = Math.min(w / slideWidth, h / slideHeight); // Вычисляю масштаб, чтобы слайд вписался в окно
        setPlayerScale(Number.isFinite(scale) && scale > 0 ? scale : 1); // Обновляю состояние масштаба
      });
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateScale);
    };
  }, [isPlayer, slideWidth, slideHeight]);

  return { playerIndex, setPlayerIndex, playerScale };
}
