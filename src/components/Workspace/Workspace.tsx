import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { SlideElement, ID } from "../../types";
import {
    moveElement,
    resizeElement,
    selectElements,
    selectPresentation,
    updateTextContent,
} from "../../store";
import { useDrag } from "../../hooks/useDrag";
import { useResize } from "../../hooks/useResize";
import s from "./Workspace.module.css";

export default function Workspace() {
    const dispatch = useDispatch();
    const presentation = useSelector(selectPresentation);
    const activeSlide = useMemo(() => {
        const id = presentation.selection.slideId ?? null;
        return id ? presentation.slides.find((s) => s.id === id) ?? null : null;
    }, [presentation]);
    const selectedIds = presentation.selection.elementIds;
    const slideRef = useRef<HTMLDivElement | null>(null);

    const [editingId, setEditingId] = useState<ID | null>(null);
    const [editingValue, setEditingValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // auto-resize textarea to fit content within box
    useEffect(() => {
        if (editingId && textareaRef.current) {
            const ta = textareaRef.current;
            ta.style.height = "auto";
            ta.style.height = `${ta.scrollHeight}px`;
        }
    }, [editingId, editingValue]);

    function handleSelect(el: SlideElement, multi: boolean) {
        let ids = selectedIds;

        if (multi) {
            ids = ids.includes(el.id) ? ids.filter((x) => x !== el.id) : [...ids, el.id];
        } else {
            ids = [el.id];
        }

        dispatch(selectElements(ids));
    }

    function getElement(id: string) {
        const el = activeSlide?.elements.find((e) => e.id === id);
        return el
            ? {
                  x: el.position.x,
                  y: el.position.y,
                  w: el.size.width,
                  h: el.size.height,
              }
            : { x: 0, y: 0, w: 0, h: 0 };
    }

    // DRAG
    const { startDrag } = useDrag(selectedIds, getElement, (id, x, y) => {
        if (!activeSlide) return;
        dispatch(moveElement({ slideId: activeSlide.id, elId: id, x, y }));
    });

    // RESIZE
    const { startResize } = useResize(getElement, (id, x, y, w, h) => {
        if (!activeSlide) return;
        dispatch(resizeElement({ slideId: activeSlide.id, elId: id, x, y, w, h }));
    });

    function startEditing(el: SlideElement) {
        if (el.kind !== "text") return;
        setEditingId(el.id);
        setEditingValue(el.content);
    }

    function stopEditing(save: boolean, el: SlideElement) {
        if (el.kind !== "text") return;
        if (save && activeSlide) {
            dispatch(updateTextContent({ slideId: activeSlide.id, elId: el.id, content: editingValue }));
        }
        setEditingId(null);
        setEditingValue("");
    }

    // background
    const bg: React.CSSProperties = {};
    if (activeSlide) {
        if (activeSlide.background.kind === "color") {
            bg.backgroundColor = activeSlide.background.value;
        } else if (activeSlide.background.kind === "image") {
            bg.backgroundImage = `url(${activeSlide.background.src})`;
            bg.backgroundSize = "cover";
            bg.backgroundPosition = "center";
        }
    }

    // Keep the workspace in view when slide changes (undo/redo)
    useEffect(() => {
        if (!activeSlide) return;
        slideRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        slideRef.current?.focus();
    }, [activeSlide?.id]);

    return (
        <main className={s.root}>
            <h3 className={s.title}>Workspace</h3>

            <div className={s.stage} style={bg}>
                <div className={s.slide} tabIndex={-1} ref={slideRef}>
                    {activeSlide &&
                        activeSlide.elements.map((el) => {
                            const selected = selectedIds.includes(el.id);
                            const isEditing = editingId === el.id;

                            return (
                                <div
                                    key={el.id}
                                    className={`${s.element} ${el.kind === "image" ? s.imageElement : ""} ${
                                        selected ? s.selected : ""
                                    }`}
                                    style={{
                                        left: el.position.x,
                                        top: el.position.y,
                                        width: Math.max(20, el.size.width),
                                        height: Math.max(20, el.size.height),
                                    }}
                                    onDoubleClick={(e) => {
                                        if (el.kind === "text") {
                                            e.stopPropagation();
                                            startEditing(el);
                                        }
                                    }}
                                    onMouseDown={(e) => {
                                        const multi = e.shiftKey;

                                        // If editing text, don't start drag/select
                                        if (editingId) return;

                                        // Calculate what selection will be after this click
                                        const current = [...selectedIds];
                                        let nextSelection: ID[];

                                        if (multi) {
                                            nextSelection = current.includes(el.id)
                                                ? current.filter((x) => x !== el.id)
                                                : [...current, el.id];
                                        } else {
                                            nextSelection = [el.id];
                                        }

                                        const dragIds = nextSelection.length ? nextSelection : [el.id];

                                        handleSelect(el, multi);
                                        startDrag(e, el.id, dragIds);
                                    }}
                                >
                                    {el.kind === "text" ? (
                                        isEditing ? (
                                            <textarea
                                                className={s.textarea}
                                                autoFocus
                                                ref={textareaRef}
                                                value={editingValue}
                                                onChange={(ev) => setEditingValue(ev.target.value)}
                                                onBlur={() => stopEditing(true, el)}
                                                onKeyDown={(ev) => {
                                                    if (ev.key === "Escape") {
                                                        ev.preventDefault();
                                                        stopEditing(false, el);
                                                    }
                                                    if (ev.key === "Enter" && ev.metaKey) {
                                                        ev.preventDefault();
                                                        stopEditing(true, el);
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className={s.text}
                                                onMouseDown={(ev) => {
                                                    // allow drag even on text area
                                                    if (editingId) {
                                                        ev.stopPropagation();
                                                    }
                                                }}
                                            >
                                                {el.content}
                                            </div>
                                        )
                                    ) : (
                                        <img src={el.src} className={s.img} draggable={false} />
                                    )}

                                    {selected && !isEditing && (
                                        <>
                                            <div
                                                className={`${s.handle} ${s.tl}`}
                                                onMouseDown={(e) => startResize(e, el.id, "tl")}
                                            />
                                            <div
                                                className={`${s.handle} ${s.tr}`}
                                                onMouseDown={(e) => startResize(e, el.id, "tr")}
                                            />
                                            <div
                                                className={`${s.handle} ${s.bl}`}
                                                onMouseDown={(e) => startResize(e, el.id, "bl")}
                                            />
                                            <div
                                                className={`${s.handle} ${s.br}`}
                                                onMouseDown={(e) => startResize(e, el.id, "br")}
                                            />

                                            {/* middle handles */}
                                            <div
                                                className={`${s.handle} ${s.tm}`}
                                                onMouseDown={(e) => startResize(e, el.id, "tm")}
                                            />
                                            <div
                                                className={`${s.handle} ${s.bm}`}
                                                onMouseDown={(e) => startResize(e, el.id, "bm")}
                                            />
                                            <div
                                                className={`${s.handle} ${s.ml}`}
                                                onMouseDown={(e) => startResize(e, el.id, "ml")}
                                            />
                                            <div
                                                className={`${s.handle} ${s.mr}`}
                                                onMouseDown={(e) => startResize(e, el.id, "mr")}
                                            />
                                        </>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </div>
        </main>
    );
}
