import type { Slide, SlideElement, TextElement, ImageElement } from "./types";
import { DEFAULT_TEXT_FONT_FAMILY, uid, makeSlide } from "./types";

export type SlideTemplate = {
  id: string;
  label: string;
  build: () => Slide;
};

function textEl(
  content: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fontSize: number,
  color = "#111",
): TextElement {
  return {
    id: uid(),
    kind: "text",
    content,
    isRichText: false,
    position: { x, y },
    size: { width: w, height: h },
    fontFamily: DEFAULT_TEXT_FONT_FAMILY,
    fontSize,
    color,
    backgroundColor: null,
    borderColor: null,
    borderWidth: 0,
    textAlign: "left",
    bold: false,
    italic: false,
    underline: false,
  };
}

function imageEl(src: string, x: number, y: number, w: number, h: number): ImageElement {
  return {
    id: uid(),
    kind: "image",
    src,
    position: { x, y },
    size: { width: w, height: h },
  };
}

function placeholderImage(label: string, w: number, h: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="100%" height="100%" fill="#e2e8f0"/>
  <rect x="2" y="2" width="${w - 4}" height="${h - 4}" fill="none" stroke="#94a3b8" stroke-width="2"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
    font-family="Arial, sans-serif" font-size="24" fill="#475569">${label}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function namedSlide(name: string, elements: SlideElement[]): Slide {
  const slide = makeSlide(name);
  slide.elements = elements;
  return slide;
}

export const slideTemplates: SlideTemplate[] = [
  {
    id: "title",
    label: "Title",
    build: () =>
      namedSlide("Title", [
        textEl("Presentation title", 120, 160, 960, 120, 72),
        textEl("Subtitle or author", 120, 300, 960, 70, 32, "#475569"),
      ]),
  },
  {
    id: "title-object",
    label: "Title + Object",
    build: () =>
      namedSlide("Title + Object", [
        textEl("Title", 80, 50, 1040, 70, 54),
        textEl("Short description or bullet list", 80, 160, 520, 360, 28, "#1f2937"),
        imageEl(placeholderImage("Image", 480, 360), 640, 160, 480, 360),
      ]),
  },
  {
    id: "section-header",
    label: "Section Header",
    build: () =>
      namedSlide("Section Header", [
        textEl("Section title", 120, 260, 960, 120, 64, "#0f172a"),
      ]),
  },
  {
    id: "two-objects",
    label: "Two Objects",
    build: () =>
      namedSlide("Two Objects", [
        textEl("Title", 80, 40, 1040, 70, 52),
        imageEl(placeholderImage("Object A", 420, 260), 120, 150, 420, 260),
        imageEl(placeholderImage("Object B", 420, 260), 660, 150, 420, 260),
        textEl("Caption A", 120, 430, 420, 60, 24, "#475569"),
        textEl("Caption B", 660, 430, 420, 60, 24, "#475569"),
      ]),
  },
  {
    id: "comparison",
    label: "Comparison",
    build: () =>
      namedSlide("Comparison", [
        textEl("Comparison", 80, 40, 1040, 70, 50),
        textEl("Option A", 120, 150, 420, 50, 32, "#0f172a"),
        textEl("Option B", 660, 150, 420, 50, 32, "#0f172a"),
        textEl("- Point 1\n- Point 2\n- Point 3", 120, 220, 420, 320, 24, "#334155"),
        textEl("- Point 1\n- Point 2\n- Point 3", 660, 220, 420, 320, 24, "#334155"),
      ]),
  },
  {
    id: "title-only",
    label: "Title Only",
    build: () =>
      namedSlide("Title Only", [
        textEl("Title", 120, 120, 960, 120, 76),
      ]),
  },
  {
    id: "blank",
    label: "Blank",
    build: () => namedSlide("Blank", []),
  },
  {
    id: "object-caption",
    label: "Object + Caption",
    build: () =>
      namedSlide("Object + Caption", [
        textEl("Title", 80, 40, 1040, 60, 44),
        imageEl(placeholderImage("Object", 680, 380), 260, 140, 680, 380),
        textEl("Caption describing the object", 220, 540, 760, 70, 26, "#475569"),
      ]),
  },
  {
    id: "picture-caption",
    label: "Picture + Caption",
    build: () =>
      namedSlide("Picture + Caption", [
        imageEl(placeholderImage("Picture", 1040, 440), 80, 90, 1040, 440),
        textEl("Caption", 120, 560, 960, 70, 28, "#334155"),
      ]),
  },
];

export function createSlideFromTemplate(templateId: string): Slide {
  const template = slideTemplates.find((t) => t.id === templateId);
  if (template) return template.build();
  return makeSlide("Slide");
}

export const DEFAULT_TEMPLATE_ID = slideTemplates[0]?.id ?? "blank";
