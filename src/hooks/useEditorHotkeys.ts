import { useEffect, useRef } from "react";
import type { ID, Slide, SlideElement } from "../types";

type Options = {
  isEditor: boolean;
  slides: Slide[];
  activeSlideId: ID | null;
  selectedElementIds: ID[];
  getSelectedElements: () => SlideElement[];
  onSelectSlide: (id: ID) => void;
  onDeleteElements: () => void;
  onDeleteSlide: () => void;
  onDuplicateElements: () => void;
  onPasteElements: (elements: SlideElement[]) => void;
};

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

export function useEditorHotkeys({
  isEditor,
  slides,
  activeSlideId,
  selectedElementIds,
  getSelectedElements,
  onSelectSlide,
  onDeleteElements,
  onDeleteSlide,
  onDuplicateElements,
  onPasteElements,
}: Options) {
  const clipboardRef = useRef<SlideElement[] | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!isEditor) return;
      if (isEditableTarget(e.target)) return;

      const modifier = e.ctrlKey || e.metaKey;

      if (modifier && e.code === "KeyC") {
        if (!selectedElementIds.length) return;
        clipboardRef.current = getSelectedElements();
        return;
      }

      if (modifier && e.code === "KeyV") {
        if (!clipboardRef.current || !clipboardRef.current.length) return;
        e.preventDefault();
        onPasteElements(clipboardRef.current);
        return;
      }

      if (modifier && e.code === "KeyD") {
        if (!selectedElementIds.length) return;
        e.preventDefault();
        onDuplicateElements();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElementIds.length) {
          e.preventDefault();
          onDeleteElements();
          return;
        }
        if (activeSlideId) {
          e.preventDefault();
          onDeleteSlide();
          return;
        }
      }

      const idx = activeSlideId
        ? slides.findIndex((s) => s.id === activeSlideId)
        : -1;

      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (!slides.length) return;
        e.preventDefault();
        const prev = idx > 0 ? slides[idx - 1] : slides[0];
        if (prev) onSelectSlide(prev.id);
      }

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (!slides.length) return;
        e.preventDefault();
        const next =
          idx < 0 ? slides[0] : idx < slides.length - 1 ? slides[idx + 1] : slides[slides.length - 1];
        if (next) onSelectSlide(next.id);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    isEditor,
    slides,
    activeSlideId,
    selectedElementIds,
    getSelectedElements,
    onSelectSlide,
    onDeleteElements,
    onDeleteSlide,
    onDuplicateElements,
    onPasteElements,
  ]);
}
