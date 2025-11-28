import type { Presentation, Slide, TextElement, ID } from "./types";
import {
  renamePresentation,
  addSlide,
  removeSlide,
  moveSlide,
  addText,
  addImage,
  removeElementById,
  setElementPosition,
  setElementSize,
  setTextContent,
  setTextFontSize,
  setTextFontFamily,
  setSlideBackground,
} from "./presentation_functions";

// ===== утилиты ===================================================
const uid = (): ID => Math.random().toString(36).slice(2, 10);

function requireSlide(p: Presentation, id: ID): Slide {
  const s = p.slides.find((x) => x.id === id);
  if (!s) throw new Error("Слайд не найден: " + id);
  return s;
}
function slidesIds(p: Presentation): string {
  return p.slides.map((s) => s.id).join(", ");
}

// Обёртка: трассируем изменения презентации
function runP(
  label: string,
  p: Presentation,
  mutator: (p: Presentation) => Presentation,
): Presentation {
  const before = p;
  const after = mutator(p);
  console.group(label);
  console.log("Название:", `"${before.title}" → "${after.title}"`);
  if (slidesIds(before) !== slidesIds(after)) {
    console.log("Порядок слайдов:", `[${slidesIds(before)}] → [${slidesIds(after)}]`);
  }
  if (before.slides.length !== after.slides.length) {
    console.log("Количество слайдов:", before.slides.length, "→", after.slides.length);
  }
  console.log("Создан новый объект (иммутабельность):", before !== after);
  console.groupEnd();
  return after;
}

// Обёртка: трассируем изменения конкретного слайда
function runS(
  label: string,
  p: Presentation,
  slideId: ID,
  mutator: (s: Slide) => Slide,
): Presentation {
  const idx = p.slides.findIndex((s) => s.id === slideId);
  if (idx === -1) {
    console.warn(label, "↯ слайд не найден:", slideId);
    return p;
  }
  const beforeS = p.slides[idx];
  const afterS = mutator(beforeS);

  console.group(`${label} (слайд ${slideId})`);
  // фон
  const bgB = JSON.stringify(beforeS.background);
  const bgA = JSON.stringify(afterS.background);
  if (bgB !== bgA) console.log("Фон:", bgB, "→", bgA);

  // элементы
  if (beforeS.elements.length !== afterS.elements.length) {
    console.log("Количество элементов:", beforeS.elements.length, "→", afterS.elements.length);
  }
  for (const eA of afterS.elements) {
    const eB = beforeS.elements.find((e) => e.id === eA.id);
    if (!eB) {
      console.log("Элемент ДОБАВЛЕН:", eA.id, `(${eA.kind})`);
      continue;
    }
    const posB = JSON.stringify(eB.position),
      posA = JSON.stringify(eA.position);
    const sizeB = JSON.stringify(eB.size),
      sizeA = JSON.stringify(eA.size);
    if (posB !== posA) console.log(`Позиция ${eA.id}:`, posB, "→", posA);
    if (sizeB !== sizeA) console.log(`Размер ${eA.id}:`, sizeB, "→", sizeA);
    if (eA.kind === "text" && eB.kind === "text") {
      if (eB.content !== eA.content)
        console.log(`Текст ${eA.id}:`, `"${eB.content}" → "${eA.content}"`);
      if (eB.fontSize !== eA.fontSize)
        console.log(`Размер шрифта ${eA.id}:`, eB.fontSize, "→", eA.fontSize);
      if (eB.fontFamily !== eA.fontFamily)
        console.log(`Семейство шрифта ${eA.id}:`, eB.fontFamily, "→", eA.fontFamily);
    }
  }
  for (const eB of beforeS.elements) {
    if (!afterS.elements.find((e) => e.id === eB.id)) {
      console.log("Элемент УДАЛЁН:", eB.id, `(${eB.kind})`);
    }
  }
  console.groupEnd();

  const slidesNext = [...p.slides];
  slidesNext[idx] = afterS;
  return { ...p, slides: slidesNext };
}

// ===== минимальные данные =======================================
let presMin: Presentation = {
  id: uid(),
  title: "Без названия",
  slides: [],
  selection: { elementIds: [] },
};
presMin = runP("min: добавляем 2 слайда", presMin, (p) => {
  p = addSlide(p, { id: uid(), background: { kind: "none" }, elements: [] });
  p = addSlide(p, { id: uid(), background: { kind: "none" }, elements: [] });
  return p;
});
const minS1 = presMin.slides[0].id;
const minS2 = presMin.slides[1].id;

// ===== максимальные данные ======================================
const s1: Slide = {
  id: uid(),
  name: "Intro",
  background: { kind: "color", value: "#f5f5f5" },
  elements: [],
};
const s2: Slide = {
  id: uid(),
  name: "Details",
  background: { kind: "image", src: "https://example.com/bg.jpg" },
  elements: [],
};
let presMax: Presentation = {
  id: uid(),
  title: "My Talk",
  slides: [s1, s2],
  selection: { slideId: s1.id, elementIds: [] },
};

// 1) rename
presMin = runP("min: переименовать презентацию", presMin, (p) =>
  renamePresentation(p, "Минимальная"),
);
presMax = runP("max: переименовать презентацию", presMax, (p) =>
  renamePresentation(p, "Максимальная"),
);

// 2) move/remove
presMin = runP("min: переместить 2-й слайд на позицию 0", presMin, (p) => moveSlide(p, minS2, 0));
presMax = runP("max: переместить s1 на позицию 1", presMax, (p) => moveSlide(p, s1.id, 1));
presMin = runP("min: удалить несуществующий слайд", presMin, (p) => removeSlide(p, "nope"));
presMax = runP("max: удалить s2", presMax, (p) => removeSlide(p, s2.id));

// 3) фон
presMin = runS("min: установить фон-цвет", presMin, minS1, (s) =>
  setSlideBackground(s, { kind: "color", value: "#eee" }),
);
presMax = runS("max: установить фон-картинку", presMax, s1.id, (s) =>
  setSlideBackground(s, { kind: "image", src: "https://example.com/new-bg.jpg" }),
);

// 4) addText/addImage
presMin = runS("min: добавить текст и картинку", presMin, minS1, (s) => {
  const t: TextElement = {
    kind: "text",
    id: uid(),
    content: "Hello",
    position: { x: 40, y: 60 },
    size: { width: 300, height: 80 },
    fontFamily: "Arial",
    fontSize: 24,
    color: "#000",
  };
  s = addText(s, t);
  s = addImage(s, {
    kind: "image",
    id: uid(),
    src: "https://example.com/a.png",
    position: { x: 200, y: 140 },
    size: { width: 200, height: 120 },
  });
  return s;
});

presMax = runS("max: добавить текст и картинку", presMax, s1.id, (s) => {
  s = addText(s, {
    kind: "text",
    id: uid(),
    content: "Title",
    position: { x: 60, y: 60 },
    size: { width: 500, height: 100 },
    fontFamily: "Inter",
    fontSize: 32,
    color: "#111",
  });
  s = addImage(s, {
    kind: "image",
    id: uid(),
    src: "https://example.com/b.png",
    position: { x: 300, y: 220 },
    size: { width: 320, height: 180 },
  });
  return s;
});

// 5) removeElementById
{
  const slide1 = requireSlide(presMax, s1.id);
  const imgId = slide1.elements.find((e) => e.kind === "image")?.id;
  if (imgId)
    presMax = runS("max: удалить элемент (картинка)", presMax, s1.id, (s) =>
      removeElementById(s, imgId),
    );
}
presMin = runS("min: попытка удалить несуществующий элемент", presMin, minS1, (s) =>
  removeElementById(s, "nope"),
);

// 6) position/size
{
  const textId = requireSlide(presMax, s1.id).elements.find((e) => e.kind === "text")?.id;
  if (textId)
    presMax = runS("max: изменить позицию и размер текста", presMax, s1.id, (s) => {
      s = setElementPosition(s, textId, { x: 100, y: 120 });
      s = setElementSize(s, textId, { width: 400, height: 120 });
      return s;
    });
}

// 7) text edits
{
  const textId = requireSlide(presMax, s1.id).elements.find((e) => e.kind === "text")?.id;
  if (textId)
    presMax = runS("max: изменить текст/размер/шрифт", presMax, s1.id, (s) => {
      s = setTextContent(s, textId, "Обновлённый текст");
      s = setTextFontSize(s, textId, 40);
      s = setTextFontFamily(s, textId, "Segoe UI");
      return s;
    });
}

console.log("✓ ЛР2: подробный прогон завершён (минимальные и максимальные данные).");
