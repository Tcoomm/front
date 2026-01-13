// src/testdata.ts
import type { Presentation, Slide, SlideElement, TextElement, ImageElement, ID } from "./types";

const uid = (): ID => Math.random().toString(36).slice(2, 10);

// 1) Минимальные данные:
// - опциональные поля не заданы (name/selection.slideId)
// - все коллекции пустые (slides: [])
export function makeMinimalPresentation(): Presentation {
  return {
    id: uid(),
    title: "Untitled",
    slides: [],
    selection: { elementIds: [] },
  };
}

// 2) Максимальные данные:
// - все опциональные поля заданы
// - в коллекциях минимум по 2 элемента
// - в elements присутствуют все типы (text + image)
export function makeMaximalPresentation(): Presentation {
  const s1Id = uid();
  const s2Id = uid();

  const t1: TextElement = {
    kind: "text",
    id: uid(),
    content: "Title",
    isRichText: false,
    position: { x: 30, y: 30 },
    size: { width: 200, height: 50 },
    fontFamily: "Arial",
    fontSize: 42,
    color: "#111",
    backgroundColor: null,
    borderColor: null,
    borderWidth: 0,
    textAlign: "left",
    bold: false,
    italic: false,
    underline: false,
  };
  const i1: ImageElement = {
    kind: "image",
    id: uid(),
    src: "https://picsum.photos/400/240",
    position: { x: 290, y: 30 },
    size: { width: 360, height: 220 },
  };

  const t2: TextElement = {
    kind: "text",
    id: uid(),
    content: "Second slide",
    isRichText: false,
    position: { x: 30, y: 30 },
    size: { width: 200, height: 50 },
    fontFamily: "Inter",
    fontSize: 32,
    color: "#333",
    backgroundColor: null,
    borderColor: null,
    borderWidth: 0,
    textAlign: "left",
    bold: false,
    italic: false,
    underline: false,
  };
  const i2: ImageElement = {
    kind: "image",
    id: uid(),
    src: "https://picsum.photos/400/240",
    position: { x: 290, y: 30 },
    size: { width: 360, height: 220 },
  };

  const s1: Slide = {
    id: s1Id,
    name: "Intro",
    background: { kind: "color", value: "#f5f5f5" },
    elements: [t1, i1] as SlideElement[],
  };
  const s2: Slide = {
    id: s2Id,
    name: "Details",
    background: { kind: "image", src: "https://picsum.photos/960/540" },
    elements: [t2, i2] as SlideElement[],
  };

  return {
    id: uid(),
    title: "My Talk",
    slides: [s1, s2],
    selection: { slideId: s1Id, elementIds: [t1.id] },
  };
}
