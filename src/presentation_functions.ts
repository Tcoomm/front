import type {
  ID,
  Position,
  Size,
  SlideBackground,
  Presentation,
  Slide,
  SlideElement,
} from "./types";
import {
  GAP,
  clonePresentation,
  cloneSlide,
  makeSlide,
  makeText,
  makeImage,
  DEFAULT_TEXT_SIZE,
  DEFAULT_IMAGE_SIZE,
} from "./types";

/* ====== Константы размера слайда (как в CSS) ====== */
const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;

/* ============ вспомогалки для сетки ============ */

type Rect = { x: number; y: number; w: number; h: number };

function toRect(el: SlideElement): Rect {
  return {
    x: el.position.x,
    y: el.position.y,
    w: el.size.width,
    h: el.size.height,
  };
}

function intersects(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.w <= b.x ||
    a.x >= b.x + b.w ||
    a.y + a.h <= b.y ||
    a.y >= b.y + b.h
  );
}

function intersectsAny(rect: Rect, elements: SlideElement[]): boolean {
  for (const el of elements) {
    if (intersects(rect, toRect(el))) return true;
  }
  return false;
}

/**
 * Подбор позиции: идём по строкам слева направо, избегая пересечений.
 * Если места вообще не осталось — кладём в самом низу, прижав к границе.
 */
function autoPosition(slide: Slide, size: Size): Position {
  const startX = GAP * 2;
  const startY = GAP * 2;
  const maxX = SLIDE_WIDTH - GAP - size.width;

  let y = startY;

  while (true) {
    for (let x = startX; x <= maxX; x += size.width + GAP) {
      const rect: Rect = { x, y, w: size.width, h: size.height };
      if (!intersectsAny(rect, slide.elements)) {
        return { x, y };
      }
    }
    // перенос на следующую строку
    y += size.height + GAP;
    if (y + size.height > SLIDE_HEIGHT - GAP) {
      // всё забито — ставим внизу, даже если чуть залезет
      return {
        x: startX,
        y: SLIDE_HEIGHT - GAP - size.height,
      };
    }
  }
}

/* ================== Презентация ================== */

export function renamePresentation(p: Presentation, nextTitle: string): Presentation {
  const next = clonePresentation(p);
  next.title = nextTitle;
  return next;
}

export function setActiveSlide(p: Presentation, slideId: ID | null): Presentation {
  const next = clonePresentation(p);
  next.selection.slideId = slideId ?? undefined;
  next.selection.elementIds = [];
  return next;
}

export function addSlide(p: Presentation): Presentation {
  const next = clonePresentation(p);
  const s = makeSlide("Slide");
  next.slides.push(s);
  next.selection.slideId = s.id;
  next.selection.elementIds = [];
  return next;
}

export function removeSlide(p: Presentation): Presentation {
  const next = clonePresentation(p);
  const id = next.selection.slideId;
  if (!id) return next;
  const idx = next.slides.findIndex((s) => s.id === id);
  if (idx === -1) return next;
  next.slides.splice(idx, 1);
  const fallback = next.slides[Math.max(0, idx - 1)];
  next.selection.slideId = fallback ? fallback.id : undefined;
  next.selection.elementIds = [];
  return next;
}

/** Переставить слайд на позицию `to` (0-based). */
export function moveSlide(p: Presentation, slideId: ID, to: number): Presentation {
  const next = clonePresentation(p);
  const i = next.slides.findIndex((s) => s.id === slideId);
  if (i < 0) return next;
  const [s] = next.slides.splice(i, 1);
  const clamped = Math.max(0, Math.min(to, next.slides.length));
  next.slides.splice(clamped, 0, s);
  return next;
}

/* ================== Элементы слайда ================== */

export function addText(slide: Slide, content = "Title"): Slide {
  const next = cloneSlide(slide);
  const el = makeText(content);
  el.size = { ...DEFAULT_TEXT_SIZE };
  el.position = autoPosition(next, el.size);
  next.elements.push(el);
  return next;
}

export function addImage(slide: Slide, src: string): Slide {
  const next = cloneSlide(slide);
  const el = makeImage(src);
  el.size = { ...DEFAULT_IMAGE_SIZE };
  el.position = autoPosition(next, el.size);
  next.elements.push(el);
  return next;
}

export function removeElement(slide: Slide, elementId: ID): Slide {
  const next = cloneSlide(slide);
  next.elements = next.elements.filter((el) => el.id !== elementId);
  return next;
}
export const removeElementById = removeElement;

export function setElementPosition(slide: Slide, elementId: ID, pos: Position): Slide {
  const next = cloneSlide(slide);
  next.elements = next.elements.map((el) =>
    el.id === elementId ? { ...el, position: { ...pos } } : el,
  );
  return next;
}

export function setElementSize(slide: Slide, elementId: ID, size: Size): Slide {
  const next = cloneSlide(slide);
  next.elements = next.elements.map((el) =>
    el.id === elementId ? { ...el, size: { ...size } } : el,
  );
  return next;
}

/* ===== текстовые правки ===== */

export function setTextContent(slide: Slide, elementId: ID, content: string): Slide {
  const next = cloneSlide(slide);
  next.elements = next.elements.map((el) =>
    el.id === elementId && el.kind === "text" ? { ...el, content } : el,
  );
  return next;
}

export function setTextFontSize(slide: Slide, elementId: ID, fontSize: number): Slide {
  const next = cloneSlide(slide);
  next.elements = next.elements.map((el) =>
    el.id === elementId && el.kind === "text" ? { ...el, fontSize } : el,
  );
  return next;
}

export function setTextFontFamily(slide: Slide, elementId: ID, fontFamily: string): Slide {
  const next = cloneSlide(slide);
  next.elements = next.elements.map((el) =>
    el.id === elementId && el.kind === "text" ? { ...el, fontFamily } : el,
  );
  return next;
}

/* ================== Фон слайда ================== */

export function setSlideBackground(slide: Slide, newBackground: SlideBackground): Slide {
  const next = cloneSlide(slide);
  next.background = { ...newBackground } as SlideBackground;
  return next;
}
