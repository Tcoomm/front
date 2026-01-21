import {
  configureStore,
  createAction,
  createSlice,
  createNextState,
  PayloadAction,
  type AnyAction,
} from "@reduxjs/toolkit";
import { presentationReducer } from "./editorSlice";
import type { Presentation } from "../types";
import { makeMaximalPresentation } from "../Testdata";

const undo = createAction("history/undo");
const redo = createAction("history/redo");

type HistoryState = {
  past: Presentation[];
  present: Presentation;
  future: Presentation[];
  lastWasContinuous: boolean;
  lastContinuousAt: number | null;
};

const initialPresentation = makeMaximalPresentation();
const initialHistory: HistoryState = {
  past: [],
  present: initialPresentation,
  future: [],
  lastWasContinuous: false,
  lastContinuousAt: null,
};

const historySlice = createSlice({
  name: "history",
  initialState: initialHistory,
  reducers: {
    loadPresentation(state, action: PayloadAction<Presentation>) {
      state.present = action.payload;
      state.past = [];
      state.future = [];
      state.lastWasContinuous = false;
      state.lastContinuousAt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(undo, (state) => {
        if (!state.past.length) return;
        const previous = state.past[state.past.length - 1];
        state.future.unshift(state.present);
        state.present = previous;
        state.past = state.past.slice(0, -1);
        state.lastWasContinuous = false;
        state.lastContinuousAt = null;
      })
      .addCase(redo, (state) => {
        if (!state.future.length) return;
        const next = state.future[0];
        state.past.push(state.present);
        state.present = next;
        state.future = state.future.slice(1);
        state.lastWasContinuous = false;
        state.lastContinuousAt = null;
      })
      .addDefaultCase((state, action) => {
        // Игнорируем не относящиеся к презентации действия
        if (!action.type.startsWith("presentation/")) return;

        const newPresent = createNextState(state.present, (draft) =>
          presentationReducer(draft as Presentation, action as AnyAction),
        );

        const continuousTypes = new Set(["presentation/moveElement", "presentation/resizeElement"]);
        const isContinuous = continuousTypes.has(action.type);
        const now = Date.now();
        const sameSeries =
          isContinuous &&
          state.lastWasContinuous &&
          state.lastContinuousAt !== null &&
          now - state.lastContinuousAt < 150;

        if (sameSeries) {
          state.present = newPresent;
          state.lastContinuousAt = now;
          return;
        }

        state.past.push(state.present);
        state.present = newPresent;
        state.future = [];
        state.lastWasContinuous = isContinuous;
        state.lastContinuousAt = isContinuous ? now : null;
      });
  },
});

export const store = configureStore({
  reducer: {
    history: historySlice.reducer,
  },
});

export {
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
} from "./editorSlice";

export const { loadPresentation } = historySlice.actions;

export { undo, redo };

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const selectPresentation = (state: RootState) => state.history.present;
