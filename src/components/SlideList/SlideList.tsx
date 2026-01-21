import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { reorderSlides, selectPresentation, selectSlide } from "../../store";
import { useI18n } from "../../translations";
import SlideThumbnail from "../SlideThumbnail/SlideThumbnail";

import s from "./SlideList.module.css";

export default function SlideList() {
    const { t } = useI18n();
    const [drag, setDrag] = useState<{ index: number; ids: string[] } | null>(null);
    const [over, setOver] = useState<number | null>(null);
    const [moved, setMoved] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const dispatch = useDispatch();
    const presentation = useSelector(selectPresentation);
    const slides = presentation.slides;
    const activeId = presentation.selection.slideId ?? null;
    const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Keep at least one selected slide to drive group drag
    useEffect(() => {
        if (!selectedIds.length && activeId) {
            setSelectedIds([activeId]);
        }
    }, [activeId, selectedIds.length]);

    // Scroll the active slide into view when it changes (undo/redo)
    useEffect(() => {
        if (!activeId) return;
        const node = itemRefs.current[activeId];
        node?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, [activeId]);

    function orderByList(ids: string[]) {
        const set = new Set(ids);
        return slides.filter((sl) => set.has(sl.id)).map((sl) => sl.id);
    }

    function onDown(e: React.MouseEvent, i: number) {
        const slideId = slides[i].id;
        const base = selectedIds.length ? selectedIds : activeId ? [activeId] : [];

        let next: string[];
        if (e.shiftKey) {
            next = base.includes(slideId)
                ? base.filter((x) => x !== slideId)
                : [...base, slideId];
        } else {
            next = [slideId];
        }

        const ordered = orderByList(next);

        setSelectedIds(ordered);
        setDrag({ index: i, ids: ordered });
        setMoved(false);
        document.body.style.userSelect = "none";
    }

    function onEnter(i: number) {
        if (drag !== null) {
            if (i !== drag.index) setMoved(true);
            setOver(i);
        }
    }

    function onUp(e: React.MouseEvent) {
        if (drag !== null && moved && over !== null) {
            const idsToMove = drag.ids.length ? drag.ids : [slides[drag.index].id];

            const indices = idsToMove
                .map((id) => slides.findIndex((s) => s.id === id))
                .filter((i) => i >= 0);

            const targetId = slides[over]?.id ?? null;
            dispatch(reorderSlides({ indices, targetId }));
        }
        setDrag(null);
        setOver(null);
        setMoved(false);
        document.body.style.userSelect = "auto";
    }

    return (
        <div className={s.root} onMouseUp={onUp}>
            <div className={s.list}>
                {slides.map((sl, i) => {
                    const active = sl.id === activeId || selectedIds.includes(sl.id);
                    const overed = i === over && drag !== null;
                    const dragging = drag !== null && i === drag.index;

                    return (
                        <div
                            key={sl.id}
                            ref={(el) => {
                                itemRefs.current[sl.id] = el;
                            }}
                            className={`${s.item} ${active ? s.active : ""} ${overed ? s.over : ""
                                } ${dragging ? s.dragging : ""}`}
                            onMouseDown={(e) => onDown(e, i)}
                            onMouseEnter={() => onEnter(i)}
                            onClick={() => {
                                dispatch(selectSlide(sl.id));
                            }}
                        >
                            <div className={s.thumb}>
                                <SlideThumbnail slide={sl} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


