// ====== Core types ======
export type ID = string;

export type Position = { x: number; y: number };
export type Size = { width: number; height: number };

// ====== UI defaults (унификация размеров) ======
export const GAP = 24;

export const DEFAULT_TEXT_FONT_FAMILY =
  "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
export const DEFAULT_TEXT_FONT_SIZE = 25; // <-- одинаковый размер
export const DEFAULT_TEXT_SIZE: Size = { width: 200, height: 50 };

export const DEFAULT_IMAGE_SIZE: Size = { width: 360, height: 220 };

// Elements
export type BaseElement = {
  id: ID;
  position: Position;
  size: Size;
};

export type TextElement = BaseElement & {
  kind: "text";
  content: string;
  isRichText: boolean;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string | null;
  borderColor: string | null;
  borderWidth: number;
  textAlign: "left" | "center" | "right";
  bold: boolean;
  italic: boolean;
  underline: boolean;
};

export type ImageElement = BaseElement & {
  kind: "image";
  src: string;
};

export type SlideElement = TextElement | ImageElement;

// Background
export type ColorBackground = { kind: "color"; value: string };
export type ImageBackground = { kind: "image"; src: string };
export type NoneBackground = { kind: "none" };
export type SlideBackground = ColorBackground | ImageBackground | NoneBackground;

// Slide
export type Slide = {
  id: ID;
  name?: string;
  background: SlideBackground;
  elements: SlideElement[];
};

// Selection
export type Selection = {
  slideId?: ID | null;
  elementIds: ID[];
};

// Presentation
export type Presentation = {
  id: ID;
  title: string;
  ownerId?: string;
  slides: Slide[];
  selection: Selection;
};

// ======= Helpers =======
export function cloneElement(el: SlideElement): SlideElement {
  return { ...el, position: { ...el.position }, size: { ...el.size } } as SlideElement;
}

export function cloneSlide(s: Slide): Slide {
  return {
    ...s,
    background:
      s.background.kind === "color"
        ? { ...s.background }
        : s.background.kind === "image"
          ? { ...s.background }
          : { kind: "none" },
    elements: s.elements.map(cloneElement),
  };
}

export function clonePresentation(p: Presentation): Presentation {
  return {
    ...p,
    slides: p.slides.map(cloneSlide),
    selection: { slideId: p.selection.slideId, elementIds: [...p.selection.elementIds] },
  };
}

// ====== Factories ======
export function uid(): ID {
  return Math.random().toString(36).slice(2, 10);
}

export function makeText(content = "Title"): TextElement {
  return {
    id: uid(),
    kind: "text",
    content,
    isRichText: false,
    fontSize: DEFAULT_TEXT_FONT_SIZE,     // <-- фикс
    fontFamily: DEFAULT_TEXT_FONT_FAMILY, // <-- фикс
    color: "#111",
    backgroundColor: null,
    borderColor: null,
    borderWidth: 0,
    textAlign: "left",
    bold: false,
    italic: false,
    underline: false,
    position: { x: GAP, y: GAP },         // старт — но потом сместим автолейаутом
    size: { ...DEFAULT_TEXT_SIZE },       // <-- фикс
  };
}

export function makeImage(src: string): ImageElement {
  return {
    id: uid(),
    kind: "image",
    src,
    position: { x: GAP, y: GAP },
    size: { ...DEFAULT_IMAGE_SIZE },      // <-- фикс
  };
}

export function makeSlide(name?: string): Slide {
  return {
    id: uid(),
    name,
    background: { kind: "none" },
    elements: [],
  };
}
