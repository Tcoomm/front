import { useEffect, useRef } from "react";
import type { ID } from "../types";

export function useResize(
  getElement: (id: ID) => { x: number; y: number; w: number; h: number },
  onResize: (id: ID, x: number, y: number, w: number, h: number) => void,
  getAspectRatio?: (id: ID) => number | null,
) {
  type ResizeState = {
    id: ID;
    handle: string;
    startX: number;
    startY: number;
    start: { x: number; y: number; w: number; h: number };
    aspect: number | null;
    freeform: boolean;
  };
  const resRef = useRef<ResizeState | null>(null);
  const onResizeRef = useRef(onResize);

  useEffect(() => {
    onResizeRef.current = onResize;
  }, [onResize]);

  function startResize(e: React.MouseEvent, id: ID, handle: string) {
    const pos = getElement(id);
    const aspect = getAspectRatio ? getAspectRatio(id) : null;

    document.body.style.userSelect = "none";

    resRef.current = {
      id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      start: pos,
      aspect,
      freeform: e.shiftKey,
    };

    e.stopPropagation();
  }

  useEffect(() => {
    function move(ev: MouseEvent) {
      const res = resRef.current;
      if (!res) return;

      const dx = ev.clientX - res.startX;
      const dy = ev.clientY - res.startY;

      const { x: sx, y: sy, w: sw, h: sh } = res.start;
      let x = sx;
      let y = sy;
      let w = sw;
      let h = sh;

      const minSize = 20;

      switch (res.handle) {
        case "tl": {
          const newW = Math.max(minSize, sw - dx);
          const newH = Math.max(minSize, sh - dy);
          x = sx + (sw - newW);
          y = sy + (sh - newH);
          w = newW;
          h = newH;
          break;
        }
        case "tr": {
          const newW = Math.max(minSize, sw + dx);
          const newH = Math.max(minSize, sh - dy);
          x = sx;
          y = sy + (sh - newH);
          w = newW;
          h = newH;
          break;
        }
        case "bl": {
          const newW = Math.max(minSize, sw - dx);
          const newH = Math.max(minSize, sh + dy);
          x = sx + (sw - newW);
          y = sy;
          w = newW;
          h = newH;
          break;
        }
        case "br": {
          w = Math.max(minSize, sw + dx);
          h = Math.max(minSize, sh + dy);
          break;
        }
        case "tm": {
          const newH = Math.max(minSize, sh - dy);
          y = sy + (sh - newH);
          h = newH;
          break;
        }
        case "bm": {
          h = Math.max(minSize, sh + dy);
          break;
        }
        case "ml": {
          const newW = Math.max(minSize, sw - dx);
          x = sx + (sw - newW);
          w = newW;
          break;
        }
        case "mr": {
          w = Math.max(minSize, sw + dx);
          break;
        }
      }

      if (res.aspect && !res.freeform) {
        const ratio = res.aspect;
        let newW = w;
        let newH = h;

        if (["tl", "tr", "bl", "br"].includes(res.handle)) {
          const useWidth = Math.abs(dx) >= Math.abs(dy);
          if (useWidth) {
            newW = Math.max(minSize, w);
            newH = Math.max(minSize, newW / ratio);
          } else {
            newH = Math.max(minSize, h);
            newW = Math.max(minSize, newH * ratio);
          }

          if (res.handle === "tl") {
            x = sx + (sw - newW);
            y = sy + (sh - newH);
          } else if (res.handle === "tr") {
            x = sx;
            y = sy + (sh - newH);
          } else if (res.handle === "bl") {
            x = sx + (sw - newW);
            y = sy;
          } else if (res.handle === "br") {
            x = sx;
            y = sy;
          }
        } else if (res.handle === "tm" || res.handle === "bm") {
          newH = Math.max(minSize, h);
          newW = Math.max(minSize, newH * ratio);
          x = sx + (sw - newW) / 2;
          if (res.handle === "tm") {
            y = sy + (sh - newH);
          } else {
            y = sy;
          }
        } else if (res.handle === "ml" || res.handle === "mr") {
          newW = Math.max(minSize, w);
          newH = Math.max(minSize, newW / ratio);
          y = sy + (sh - newH) / 2;
          if (res.handle === "ml") {
            x = sx + (sw - newW);
          } else {
            x = sx;
          }
        }

        w = newW;
        h = newH;
      }

      onResizeRef.current(res.id, x, y, w, h);
    }

    function stop() {
      if (resRef.current) {
        resRef.current = null;
        document.body.style.userSelect = "auto";
      }
    }

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    };
  }, []);

  return { startResize };
}
