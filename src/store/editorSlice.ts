import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Presentation, Slide, SlideBackground, SlideElement, ID, Size, Position } from "../types";
import { makeMaximalPresentation } from "../Testdata";

const initialState: Presentation = makeMaximalPresentation();

function generateId(): ID {
    return Math.random().toString(36).substring(2, 10);
}

type MovePayload = { slideId: ID; elId: ID; x: number; y: number };
type ResizePayload = MovePayload & { w: number; h: number };

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
                position: { x: 40 + offset, y: 40 + offset },
                size: { width: 240, height: 80 },
                color: "#000",
                fontSize: 32,
                fontFamily: "Arial",
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
        updateTextContent(state, action: PayloadAction<{ slideId: ID; elId: ID; content: string }>) {
            const { slideId, elId, content } = action.payload;
            const sl = state.slides.find((s) => s.id === slideId);
            if (!sl) return;
            const el = sl.elements.find((e) => e.id === elId && e.kind === "text");
            if (!el || el.kind !== "text") return;
            el.content = content;
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
    reorderSlides,
} = presentationSlice.actions;

export const presentationReducer = presentationSlice.reducer;
