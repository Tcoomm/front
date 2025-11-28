import React, { useMemo } from "react";
import "./app.css";

import type { Presentation, Slide, SlideElement } from "./types";

import {
  dispatch,
  opRenamePresentation,
  opAddSlide,
  opRemoveSlide,
  opSelectSlide,
  opSelectElement,
  opSelectElements,
  opAddText,
  opAddImage,
  opRemoveElement,
  opSetSlideBackground,
  opMoveElement,
  opResizeElement,
} from "./editor";

import TitleBar from "./components/TitleBar/TitleBar";
import SlideList from "./components/SlideList/SlideList";
import Workspace from "./components/Workspace/Workspace";
import Toolbar from "./components/Toolbar/Toolbar";

type Props = { model: Presentation };

export default function App({ model }: Props) {
  // Активный слайд по selection
  const activeSlide: Slide | null = useMemo(() => {
    const id = model.selection.slideId;
    return id ? model.slides.find((s) => s.id === id) ?? null : null;
  }, [model]);

  const selectedIds = model.selection.elementIds ?? [];

  // === TitleBar
  function onRename(title: string) {
    dispatch(opRenamePresentation, title);
  }

  // === Слайды
  function onAddSlide() {
    dispatch(opAddSlide);
  }

  function onDeleteSlide() {
    dispatch(opRemoveSlide);
  }

  function onSelectSlide(slide: Slide) {
    dispatch(opSelectSlide, slide.id);
  }

  // === Элементы
  function onAddText() {
    if (!activeSlide) return;
    dispatch(opAddText, activeSlide.id, "Title");
  }

  function onAddImage(url: string) {
    if (!activeSlide || !url) return;
    dispatch(opAddImage, activeSlide.id, url);
  }

  function onDeleteElement() {
    if (!activeSlide || selectedIds.length === 0) return;
    // удаляем все выделенные элементы разом
    dispatch(opRemoveElement, activeSlide.id, selectedIds);
  }

  function onSelectElement(el: SlideElement, multi: boolean) {
    // multi = true, если зажат Shift (см. Workspace)
    dispatch(opSelectElements, el.id, multi);
  }

  // === Перемещение / ресайз
  function onMoveElement(id: string, x: number, y: number) {
    if (!activeSlide) return;
    dispatch(opMoveElement, activeSlide.id, id, x, y);
  }

  function onResizeElement(id: string, x: number, y: number, w: number, h: number) {
    if (!activeSlide) return;
    dispatch(opResizeElement, activeSlide.id, id, x, y, w, h);
  }

  // === Фон
  function onSetBgColor(c: string) {
    if (!activeSlide) return;
    dispatch(opSetSlideBackground, activeSlide.id, { kind: "color", value: c });
  }

  function onSetBgNone() {
    if (!activeSlide) return;
    dispatch(opSetSlideBackground, activeSlide.id, { kind: "none" });
  }

  return (
    <div className="page">
      <div className="header">
        <TitleBar title={model.title} onChange={onRename} />
      </div>

      <div className="grid">
        <SlideList
          slides={model.slides}
          activeId={activeSlide?.id ?? null}
          onClick={onSelectSlide}
        />

        <Workspace
          slide={activeSlide}
          selectedIds={selectedIds}
          onSelect={onSelectElement}
          onMove={onMoveElement}
          onResize={onResizeElement}
        />
      </div>

      <Toolbar
        onAddSlide={onAddSlide}
        onDeleteSlide={onDeleteSlide}
        onAddText={onAddText}
        onAddImageUrl={onAddImage}
        onDeleteSelected={onDeleteElement}
        onSetBgColor={onSetBgColor}
        onSetBgNone={onSetBgNone}
      />
    </div>
  );
}
