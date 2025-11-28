import type {
    Presentation,
    Slide,
    SlideElement,
    SlideBackground,
    ID,
} from "./types";

// =======================================
// ХРАНИЛИЩЕ СОСТОЯНИЯ РЕДАКТОРА
// =======================================

let model: Presentation;
const handlers: Array<(p: Presentation) => void> = [];

// Текущая модель
export function getEditorModel(): Presentation {
    return model;
}

// Совместимость с lab2
export function getModel(): Presentation {
    return getEditorModel();
}

// Установить новую модель и уведомить подписчиков
export function setEditorModel(next: Presentation): void {
    model = next;
    handlers.forEach((h) => h(next));
}

// Подписка на изменения
export function addEditorChangeHandler(handler: (p: Presentation) => void): void {
    handlers.push(handler);
}

// Внутренний helper
function apply(next: Presentation): void {
    setEditorModel(next);
}

// =======================================
// УТИЛИТЫ
// =======================================

function replaceSlide(updated: Slide): Presentation {
    return {
        ...model,
        slides: model.slides.map((s) => (s.id === updated.id ? updated : s)),
    };
}

function generateId(): ID {
    return Math.random().toString(36).substring(2, 9);
}

// =======================================
// ОПЕРАЦИИ
// =======================================

// ---- Переименование презентации
export function opRenamePresentation(title: string): Presentation {
    console.log("[editor] rename presentation:", title);
    return { ...model, title };
}

// ---- Добавление слайда
export function opAddSlide(): Presentation {
    const newSlide: Slide = {
        id: generateId(),
        name: "Slide",
        background: { kind: "none" },
        elements: [],
    };

    console.log("[editor] add slide:", newSlide.id);

    return {
        ...model,
        slides: [...model.slides, newSlide],
        selection: { slideId: newSlide.id, elementIds: [] },
    };
}

// ---- Удаление активного слайда
export function opRemoveSlide(): Presentation {
    const active = model.selection.slideId;
    if (!active) return model;

    const rest = model.slides.filter((s) => s.id !== active);

    console.log("[editor] remove slide:", active);

    return {
        ...model,
        slides: rest,
        selection: {
            slideId: rest.length ? rest[0].id : null,
            elementIds: [],
        },
    };
}

// ---- Выбор слайда
export function opSelectSlide(id: ID): Presentation {
    console.log("[editor] select slide:", id);
    return {
        ...model,
        selection: { slideId: id, elementIds: [] },
    };
}

// ---- Простой выбор одного элемента (старый вариант, если где-то нужен)
export function opSelectElement(id: ID): Presentation {
    console.log("[editor] select element:", id);
    return {
        ...model,
        selection: { ...model.selection, elementIds: [id] },
    };
}

// ---- НОВОЕ: выбор элементов с учётом Shift
export function opSelectElements(id: ID, multi: boolean): Presentation {
    const prev = model.selection.elementIds ?? [];
    let next: ID[];

    if (multi) {
        // toggle-логика
        if (prev.includes(id)) {
            next = prev.filter((x) => x !== id);
        } else {
            next = [...prev, id];
        }
    } else {
        next = [id];
    }

    console.log("[editor] select elements:", next);

    return {
        ...model,
        selection: { ...model.selection, elementIds: next },
    };
}

// ---- Установка фона
export function opSetSlideBackground(
    slideId: ID,
    bg: SlideBackground
): Presentation {
    const slide = model.slides.find((s) => s.id === slideId);
    if (!slide) return model;

    console.log("[editor] set background:", slideId, bg);

    const updated: Slide = { ...slide, background: bg };
    return replaceSlide(updated);
}

// ---- Добавление текста
export function opAddText(slideId: ID, text: string): Presentation {
    const slide = model.slides.find((s) => s.id === slideId);
    if (!slide) return model;

    const id = generateId();
    const offset = slide.elements.length * 20;

    const newEl: SlideElement = {
        id,
        kind: "text",
        content: text,
        position: { x: 40 + offset, y: 40 + offset },
        size: { width: 240, height: 80 },
        color: "#000000",
        fontSize: 32,
        fontFamily: "Arial",
    };

    console.log("[editor] add text:", id, "to slide:", slideId);

    const updated: Slide = {
        ...slide,
        elements: [...slide.elements, newEl],
    };

    return {
        ...replaceSlide(updated),
        selection: { slideId, elementIds: [id] },
    };
}

// ---- Добавление картинки
export function opAddImage(slideId: ID, url: string): Presentation {
    const slide = model.slides.find((s) => s.id === slideId);
    if (!slide) return model;

    const id = generateId();
    const offset = slide.elements.length * 20;

    const newEl: SlideElement = {
        id,
        kind: "image",
        src: url,
        position: { x: 40 + offset, y: 40 + offset },
        size: { width: 320, height: 220 },
    };

    console.log("[editor] add image:", id, "to slide:", slideId);

    const updated: Slide = { ...slide, elements: [...slide.elements, newEl] };

    return {
        ...replaceSlide(updated),
        selection: { slideId, elementIds: [id] },
    };
}

// ---- Перемещение элемента (drag)
export function opMoveElement(
    slideId: ID,
    elId: ID,
    x: number,
    y: number
): Presentation {
    const slide = model.slides.find((s) => s.id === slideId);
    if (!slide) return model;

    const updated: Slide = {
        ...slide,
        elements: slide.elements.map((el) =>
            el.id === elId ? { ...el, position: { x, y } } : el
        ),
    };

    console.log("[editor] move element:", elId, "->", x, y);

    return replaceSlide(updated);
}

// ---- Удаление элемента(ов)
export function opRemoveElement(
    slideId: ID,
    elIds: ID | ID[]
): Presentation {
    const slide = model.slides.find((s) => s.id === slideId);
    if (!slide) return model;

    const ids = Array.isArray(elIds) ? elIds : [elIds];

    console.log("[editor] remove elements:", ids, "from slide:", slideId);

    const updated: Slide = {
        ...slide,
        elements: slide.elements.filter((e) => !ids.includes(e.id)),
    };

    return {
        ...replaceSlide(updated),
        selection: { slideId, elementIds: [] },
    };
}

// ---- Изменение размера элемента
export function opResizeElement(
    slideId: ID,
    elId: ID,
    x: number,
    y: number,
    w: number,
    h: number
): Presentation {
    const slide = model.slides.find((s) => s.id === slideId);
    if (!slide) return model;

    const updated: Slide = {
        ...slide,
        elements: slide.elements.map((el) =>
            el.id === elId
                ? { ...el, position: { x, y }, size: { width: w, height: h } }
                : el
        ),
    };

    console.log("[editor] resize element:", elId, "->", w, h);

    return replaceSlide(updated);
}

// ---- Перестановка слайдов (список слева)
export function opReorderSlides(
    fromIndex: number,
    toIndex: number,
    ids?: ID[]
): Presentation {
    const slides = [...model.slides];

    // Если массив ids не передан — старое поведение (перемещение одного слайда)
    if (!ids || ids.length === 0) {
        if (
            fromIndex < 0 ||
            fromIndex >= slides.length ||
            toIndex < 0 ||
            toIndex >= slides.length
        ) {
            return model;
        }

        const [moved] = slides.splice(fromIndex, 1);
        slides.splice(toIndex, 0, moved);

        console.log("[editor] reorder one slide:", fromIndex, "->", toIndex);
        return { ...model, slides };
    }

    // ---- Перемещение нескольких слайдов по их ID ----

    // 1) Слайды, которые двигаем (в порядке, как они уже стоят в презентации)
    const moving = slides.filter(s => ids.includes(s.id));
    if (moving.length === 0) return model;

    // 2) Остальные слайды
    let remain = slides.filter(s => !ids.includes(s.id));

    // 3) Определяем, куда в "remain" вставлять группу
    let insertIndex = toIndex;
    if (insertIndex < 0) insertIndex = 0;
    if (insertIndex > slides.length) insertIndex = slides.length;

    const target = slides[toIndex];
    if (target) {
        const idxInRemain = remain.findIndex(s => s.id === target.id);
        if (idxInRemain >= 0) {
            insertIndex = idxInRemain;
        } else {
            insertIndex = remain.length;
        }
    } else {
        insertIndex = remain.length;
    }

    const newSlides = [
        ...remain.slice(0, insertIndex),
        ...moving,
        ...remain.slice(insertIndex),
    ];

    console.log(
        "[editor] reorder multiple slides:",
        ids,
        "to index",
        insertIndex
    );

    return {
        ...model,
        slides: newSlides,
    };
}



// =======================================
// DISPATCH — единая точка входа
// =======================================

export function dispatch(
    operation: (...args: any[]) => Presentation,
    ...args: any[]
) {
    const next = operation(...args);
    apply(next);
}
