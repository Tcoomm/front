import React, { useState } from "react";
import type { Slide, ID } from "../../types";
import { dispatch, opReorderSlides } from "../../editor";

import s from "./SlideList.module.css";

type Props = {
    slides: Slide[];
    activeId: string | null;
    onClick: (s: Slide) => void;
};

export default function SlideList({ slides, activeId, onClick }: Props) {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);

    // Локальное выделение нескольких слайдов (через Shift)
    const [selectedIds, setSelectedIds] = useState<ID[]>([]);

    function handleMouseDown(i: number, sl: Slide, e: React.MouseEvent<HTMLDivElement>) {
        if (e.shiftKey) {
            setSelectedIds(prev =>
                prev.includes(sl.id) ? prev : [...prev, sl.id]
            );
        } else {
            setSelectedIds([sl.id]);
        }

        setDragIndex(i);
        document.body.style.userSelect = "none";
        e.stopPropagation();
    }

    function handleMouseEnter(i: number) {
        if (dragIndex !== null) {
            setOverIndex(i);
        }
    }

    function handleMouseUp() {
        if (
            dragIndex !== null &&
            overIndex !== null &&
            dragIndex !== overIndex
        ) {
            // если выделено больше одного — двигаем всю пачку
            const hasMulti = selectedIds.length > 1;

            // какие слайды реально двигаем
            const idsToMove: ID[] = hasMulti
                ? selectedIds
                : [slides[dragIndex].id];

            dispatch(opReorderSlides, dragIndex, overIndex, idsToMove);
        }

        setDragIndex(null);
        setOverIndex(null);
        document.body.style.userSelect = "auto";
    }

    return (
        <div className={s.root} onMouseUp={handleMouseUp}>
            <h3 className={s.title}>Слайды</h3>

            <div className={s.list}>
                {slides.map((sl, i) => {
                    const isSelected = selectedIds.includes(sl.id);
                    const isActive = sl.id === activeId || isSelected;
                    const isOver = i === overIndex && dragIndex !== null;
                    const isDragging = i === dragIndex;

                    return (
                        <div
                            key={sl.id}
                            className={`${s.item} 
                                ${isActive ? s.active : ""} 
                                ${isOver ? s.over : ""} 
                                ${isDragging ? s.dragging : ""}
                            `}
                            onMouseDown={(e) => handleMouseDown(i, sl, e)}
                            onMouseEnter={() => handleMouseEnter(i)}
                            onClick={() => onClick(sl)}
                        >
                            <div className={s.name}>{sl.name} (№{i + 1})</div>
                            <div className={s.id}>id: {sl.id}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
