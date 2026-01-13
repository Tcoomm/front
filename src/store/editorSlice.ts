import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Presentation, Slide, SlideBackground, SlideElement, ID, Size, Position } from "../types";
import { makeMaximalPresentation } from "../Testdata";
import { createSlideFromTemplate } from "../slideTemplates";

const initialState: Presentation = makeMaximalPresentation();

function generateId(): ID {
    return Math.random().toString(36).substring(2, 10);
}

type MovePayload = { slideId: ID; elId: ID; x: number; y: number };
type ResizePayload = MovePayload & { w: number; h: number };
type UpdateTextBackgroundPayload = { slideId: ID; elId: ID; backgroundColor: string | null };
type UpdateTextFontSizePayload = { slideId: ID; elId: ID; fontSize: number };
type UpdateTextFontFamilyPayload = { slideId: ID; elId: ID; fontFamily: string };
type UpdateTextColorPayload = { slideId: ID; elId: ID; color: string };
type UpdateTextBorderPayload = { slideId: ID; elId: ID; borderColor?: string | null; borderWidth?: number };
type AlignElementsPayload = {
    slideId: ID;
    elementIds: ID[];
    axis: "x" | "y";
    mode: "start" | "center" | "end";
    relativeTo?: "slide" | "selection";
};
type UpdateTextAlignPayload = { slideId: ID; elId: ID; textAlign: "left" | "center" | "right" };
type UpdateTextStylePayload = {
    slideId: ID;
    elId: ID;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
};
type UpdateImagePayload = { slideId: ID; elId: ID; src: string };
type PastePayload = { slideId: ID; elements: SlideElement[]; offset?: number };
type DuplicatePayload = { slideId: ID; elementIds: ID[]; offset?: number };

const DEFAULT_PASTE_OFFSET = 24;

function cloneWithOffset(el: SlideElement, id: ID, offset: number): SlideElement {
    return {
        ...el,
        id,
        position: {
            x: el.position.x + offset,
            y: el.position.y + offset,
        },
        size: { ...el.size },
    } as SlideElement;
}

const presentationSlice = createSlice({
    name: "presentation",
    initialState,
    reducers: {
        renamePresentation(state, action: PayloadAction<string>) {
            state.title = action.payload;
        },
        addSlide(state) {
            const newSlide: Slide = {
                id: generateId(),
                name: "Slide",
                background: { kind: "none" },
                elements: [],
            };
            state.slides.push(newSlide);
            state.selection = { slideId: newSlide.id, elementIds: [] };
        },
        addSlideFromTemplate(state, action: PayloadAction<{ templateId: string }>) {
            const slide = createSlideFromTemplate(action.payload.templateId);
            state.slides.push(slide);
            state.selection = { slideId: slide.id, elementIds: [] };
        },
        removeSlide(state) {
            const active = state.selection.slideId;
            if (!active) return;
            const rest = state.slides.filter((s) => s.id !== active);
            state.slides = rest;
            state.selection = { slideId: rest[0]?.id ?? null, elementIds: [] };
        },
        selectSlide(state, action: PayloadAction<ID>) {
            state.selection = { slideId: action.payload, elementIds: [] };
        },
        selectElements(state, action: PayloadAction<ID[]>) {
            state.selection = { ...state.selection, elementIds: [...action.payload] };
        },
        addText(state, action: PayloadAction<{ slideId: ID; text: string }>) {
            const { slideId, text } = action.payload;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl) return;
            const id = generateId();
            const offset = sl.elements.length * 20;
            const el: SlideElement = {
                id,
                kind: "text",
                content: text,
                isRichText: false,
                position: { x: 40 + offset, y: 40 + offset },
                size: { width: 240, height: 80 },
                color: "#000",
                backgroundColor: null,
                borderColor: null,
                borderWidth: 0,
                fontSize: 32,
                fontFamily: "Arial",
                textAlign: "left",
                bold: false,
                italic: false,
                underline: false,
            };
            sl.elements.push(el);
            state.selection = { slideId, elementIds: [id] };
        },
        addImage(state, action: PayloadAction<{ slideId: ID; src: string; size?: Size; position?: Position }>) {
            const { slideId, src, size, position } = action.payload;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl) return;
            const id = generateId();
            const offset = sl.elements.length * 20;
            const el: SlideElement = {
                id,
                kind: "image",
                src,
                position: position ?? { x: 40 + offset, y: 40 + offset },
                size: size ?? { width: 320, height: 220 },
            };
            sl.elements.push(el);
            state.selection = { slideId, elementIds: [id] };
        },
        moveElement(state, action: PayloadAction<MovePayload>) {
            const { slideId, elId, x, y } = action.payload;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl) return;
            const el = sl.elements.find((e) => e.id === elId);
            if (!el) return;
            el.position = { x, y };
        },
        resizeElement(state, action: PayloadAction<ResizePayload>) {
            const { slideId, elId, x, y, w, h } = action.payload;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl) return;
            const el = sl.elements.find((e) => e.id === elId);
            if (!el) return;
            el.position = { x, y };
            el.size = { width: w, height: h };
        },
        removeElement(state, action: PayloadAction<{ slideId: ID; elId: ID }>) {
            const { slideId, elId } = action.payload;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl) return;
            sl.elements = sl.elements.filter((e) => e.id !== elId);
            state.selection = { slideId, elementIds: [] };
        },
        setSlideBackground(state, action: PayloadAction<{ slideId: ID; bg: SlideBackground }>) {
            const { slideId, bg } = action.payload;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl) return;
            sl.background = bg;
        },
        updateTextContent(
            state,
            action: PayloadAction<{ slideId: ID; elId: ID; content: string; isRichText?: boolean }>
        ) {
            const { slideId, elId, content, isRichText } = action.payload;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl) return;
            const el = sl.elements.find((e) => e.id === elId && e.kind === "text");
            if (!el || el.kind !== "text") return;
            el.content = content;
            if (isRichText !== undefined) el.isRichText = isRichText;
        },
        updateTextBackground(state, action: PayloadAction<UpdateTextBackgroundPayload>) {
            const { slideId, elId, backgroundColor } = action.payload;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl) return;
            const el = sl.elements.find((e) => e.id === elId && e.kind === "text");
            if (!el || el.kind !== "text") return;
            el.backgroundColor = backgroundColor;
        },
        updateTextFontSize(state, action: PayloadAction<UpdateTextFontSizePayload>) {
            const { slideId, elId, fontSize } = action.payload;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl) return;
            const el = sl.elements.find((e) => e.id === elId && e.kind === "text");
            if (!el || el.kind !== "text") return;
            el.fontSize = Math.max(8, Math.min(200, fontSize));
        },
        updateTextFontFamily(state, action: PayloadAction<UpdateTextFontFamilyPayload>) {
            const { slideId, elId, fontFamily } = action.payload;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl) return;
            const el = sl.elements.find((e) => e.id === elId && e.kind === "text");
            if (!el || el.kind !== "text") return;
            el.fontFamily = fontFamily;
        },
        updateTextColor(state, action: PayloadAction<UpdateTextColorPayload>) {
            const { slideId, elId, color } = action.payload;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl) return;
            const el = sl.elements.find((e) => e.id === elId && e.kind === "text");
            if (!el || el.kind !== "text") return;
            el.color = color;
        },
        updateTextBorder(state, action: PayloadAction<UpdateTextBorderPayload>) {
            const { slideId, elId, borderColor, borderWidth } = action.payload;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl) return;
            const el = sl.elements.find((e) => e.id === elId && e.kind === "text");
            if (!el || el.kind !== "text") return;
            if (borderColor !== undefined) el.borderColor = borderColor;
            if (borderWidth !== undefined) {
                el.borderWidth = Math.max(0, Math.min(20, borderWidth));
            }
        },
        alignElements(state, action: PayloadAction<AlignElementsPayload>) {
            const { slideId, elementIds, axis, mode, relativeTo } = action.payload;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl || elementIds.length < 1) return;
            const elements = elementIds
                .map((id) => sl.elements.find((e) => e.id === id))
                .filter(Boolean) as SlideElement[];
            if (elements.length < 1) return;

            const SLIDE_WIDTH = 1200;
            const SLIDE_HEIGHT = 675;

            const useSlide = relativeTo === "slide";
            const minX = useSlide ? 0 : Math.min(...elements.map((e) => e.position.x));
            const minY = useSlide ? 0 : Math.min(...elements.map((e) => e.position.y));
            const maxX = useSlide
                ? SLIDE_WIDTH
                : Math.max(...elements.map((e) => e.position.x + e.size.width));
            const maxY = useSlide
                ? SLIDE_HEIGHT
                : Math.max(...elements.map((e) => e.position.y + e.size.height));
            const centerX = minX + (maxX - minX) / 2;
            const centerY = minY + (maxY - minY) / 2;

            elements.forEach((el) => {
                if (axis === "x") {
                    if (elements.length === 1 || useSlide) {
                        if (mode === "start") el.position.x = 0;
                        else if (mode === "center") el.position.x = (SLIDE_WIDTH - el.size.width) / 2;
                        else el.position.x = SLIDE_WIDTH - el.size.width;
                    } else {
                        if (mode === "start") el.position.x = minX;
                        else if (mode === "center") el.position.x = centerX - el.size.width / 2;
                        else el.position.x = maxX - el.size.width;
                    }
                } else {
                    if (elements.length === 1 || useSlide) {
                        if (mode === "start") el.position.y = 0;
                        else if (mode === "center") el.position.y = (SLIDE_HEIGHT - el.size.height) / 2;
                        else el.position.y = SLIDE_HEIGHT - el.size.height;
                    } else {
                        if (mode === "start") el.position.y = minY;
                        else if (mode === "center") el.position.y = centerY - el.size.height / 2;
                        else el.position.y = maxY - el.size.height;
                    }
                }
            });
        },
        updateTextAlign(state, action: PayloadAction<UpdateTextAlignPayload>) {
            const { slideId, elId, textAlign } = action.payload;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl) return;
            const el = sl.elements.find((e) => e.id === elId && e.kind === "text");
            if (!el || el.kind !== "text") return;
            el.textAlign = textAlign;
        },
        updateTextStyle(state, action: PayloadAction<UpdateTextStylePayload>) {
            const { slideId, elId, bold, italic, underline } = action.payload;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl) return;
            const el = sl.elements.find((e) => e.id === elId && e.kind === "text");
            if (!el || el.kind !== "text") return;
            if (bold !== undefined) el.bold = bold;
            if (italic !== undefined) el.italic = italic;
            if (underline !== undefined) el.underline = underline;
        },
        updateImageSrc(state, action: PayloadAction<UpdateImagePayload>) {
            const { slideId, elId, src } = action.payload;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl) return;
            const el = sl.elements.find((e) => e.id === elId && e.kind === "image");
            if (!el || el.kind !== "image") return;
            el.src = src;
        },
        duplicateElements(state, action: PayloadAction<DuplicatePayload>) {
            const { slideId, elementIds, offset = DEFAULT_PASTE_OFFSET } = action.payload;
            if (!elementIds.length) return;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl) return;
            const originals = elementIds
                .map((id) => sl.elements.find((e) => e.id === id))
                .filter(Boolean) as SlideElement[];
            if (!originals.length) return;
            const clones = originals.map((el) => cloneWithOffset(el, generateId(), offset));
            sl.elements.push(...clones);
            state.selection = { slideId, elementIds: clones.map((e) => e.id) };
        },
        pasteElements(state, action: PayloadAction<PastePayload>) {
            const { slideId, elements, offset = DEFAULT_PASTE_OFFSET } = action.payload;
            if (!elements.length) return;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl) return;
            const clones = elements.map((el) => cloneWithOffset(el, generateId(), offset));
            sl.elements.push(...clones);
            state.selection = { slideId, elementIds: clones.map((e) => e.id) };
        },
        reorderSlides(state, action: PayloadAction<{ indices: number[]; targetId: ID | null }>) {
            const { indices, targetId } = action.payload;
            if (!indices.length) return;
            const unique = Array.from(new Set(indices.filter((i) => i >= 0 && i < state.slides.length))).sort(
                (a, b) => a - b
            );
            const picked = unique.map((i) => state.slides[i]).filter(Boolean);
            const rest = state.slides.filter((_, i) => !unique.includes(i));
            const insertAt = targetId
                ? Math.max(0, rest.findIndex((s) => s.id === targetId))
                : rest.length;
            state.slides = [...rest.slice(0, insertAt), ...picked, ...rest.slice(insertAt)];
            state.selection = { slideId: picked[0]?.id ?? state.selection.slideId ?? null, elementIds: [] };
        },
    },
});

export const {
    renamePresentation,
    addSlide,
    addSlideFromTemplate,
    removeSlide,
    selectSlide,
    selectElements,
    addText,
    addImage,
    moveElement,
    resizeElement,
    removeElement,
    setSlideBackground,
    updateTextContent,
    updateTextBackground,
    updateTextFontSize,
    updateTextFontFamily,
    updateTextColor,
    updateTextBorder,
    alignElements,
    updateTextAlign,
    updateTextStyle,
    updateImageSrc,
    duplicateElements,
    pasteElements,
    reorderSlides,
} = presentationSlice.actions;

export const presentationReducer = presentationSlice.reducer;
