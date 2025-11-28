import React, { useState, useEffect } from "react";
import type { Slide, SlideElement, ID } from "../../types";
import s from "./Workspace.module.css";

type Props = {
    slide: Slide | null;
    selectedIds: ID[];
    onSelect: (el: SlideElement, multi: boolean) => void;
    onMove: (id: ID, x: number, y: number) => void;
    onResize: (id: ID, x: number, y: number, w: number, h: number) => void;
};

export default function Workspace({
    slide,
    selectedIds,
    onSelect,
    onMove,
    onResize,
}: Props) {
    const [drag, setDrag] = useState<{
        ids: ID[];
        startX: number;
        startY: number;
        start: Record<ID, { x: number; y: number }>;
    } | null>(null);

    const [resize, setResize] = useState<{
        id: ID;
        handle: string;
        startX: number;
        startY: number;
        origX: number;
        origY: number;
        origW: number;
        origH: number;
    } | null>(null);

    useEffect(() => {
        function move(ev: MouseEvent) {
            if (!slide) return;

            // ---- DRAG ----
            if (drag) {
                const dx = ev.clientX - drag.startX;
                const dy = ev.clientY - drag.startY;

                drag.ids.forEach((id) => {
                    const o = drag.start[id];
                    onMove(id, o.x + dx, o.y + dy);
                });
            }

            // ---- RESIZE ----
            if (resize) {
                const dx = ev.clientX - resize.startX;
                const dy = ev.clientY - resize.startY;

                let x = resize.origX;
                let y = resize.origY;
                let w = resize.origW;
                let h = resize.origH;

                switch (resize.handle) {
                    case "tl":
                        x = resize.origX + dx;
                        y = resize.origY + dy;
                        w = resize.origW - dx;
                        h = resize.origH - dy;
                        break;
                    case "tr":
                        y = resize.origY + dy;
                        w = resize.origW + dx;
                        h = resize.origH - dy;
                        break;
                    case "bl":
                        x = resize.origX + dx;
                        w = resize.origW - dx;
                        h = resize.origH + dy;
                        break;
                    case "br":
                        w = resize.origW + dx;
                        h = resize.origH + dy;
                        break;
                    case "tm":
                        y = resize.origY + dy;
                        h = resize.origH - dy;
                        break;
                    case "bm":
                        h = resize.origH + dy;
                        break;
                    case "ml":
                        x = resize.origX + dx;
                        w = resize.origW - dx;
                        break;
                    case "mr":
                        w = resize.origW + dx;
                        break;
                }
                const MIN_W = 20;
                const MIN_H = 20;

                if (w < MIN_W) {
                    const diff = MIN_W - w;
                    if (["tl", "ml", "bl"].includes(resize.handle)) {
                        x -= diff;
                    }
                    w = MIN_W;
                }

                if (h < MIN_H) {
                    const diff = MIN_H - h;
                    if (["tl", "tm", "tr"].includes(resize.handle)) {

                        y -= diff;
                    }
                    h = MIN_H;
                }

                onResize(resize.id, x, y, w, h);
            }
        }

        function stop() {
            if (drag) setDrag(null);
            if (resize) setResize(null);
            document.body.style.userSelect = "auto";
        }

        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", stop);
        return () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", stop);
        };
    }, [drag, resize, slide, onMove, onResize]);

    // === Drag start
    function startDrag(e: React.MouseEvent, el: SlideElement) {
        if (resize) return;

        const multi = e.shiftKey;
        onSelect(el, multi);

        const ids = multi ? [...new Set([...selectedIds, el.id])] : [el.id];

        document.body.style.userSelect = "none";

        setDrag({
            ids,
            startX: e.clientX,
            startY: e.clientY,
            start: Object.fromEntries(
                ids.map((id) => {
                    const elem = slide!.elements.find((e) => e.id === id)!;
                    return [id, { x: elem.position.x, y: elem.position.y }];
                })
            ),
        });

        e.stopPropagation();
    }

    // === Resize start
    function startResize(e: React.MouseEvent, el: SlideElement, handle: string) {
        const multi = e.shiftKey;
        onSelect(el, multi);

        document.body.style.userSelect = "none";
        e.stopPropagation();

        setResize({
            id: el.id,
            handle,
            startX: e.clientX,
            startY: e.clientY,
            origX: el.position.x,
            origY: el.position.y,
            origW: el.size.width,
            origH: el.size.height,
        });
    }

    // === Background
    let bg: React.CSSProperties = {};
    if (slide) {
        if (slide.background.kind === "color") {
            bg.backgroundColor = slide.background.value;
        } else if (slide.background.kind === "image") {
            bg.backgroundImage = `url(${slide.background.src})`;
            bg.backgroundSize = "cover";
            bg.backgroundPosition = "center";
        }
    }

    return (
        <main className={s.root}>
            <h3 className={s.title}>Рабочая область</h3>

            <div className={s.stage} style={bg}>
                <div className={s.slide}>
                    {slide &&
                        slide.elements.map((el) => {
                            const selected = selectedIds.includes(el.id);

                            return (
                                <div
                                    key={el.id}
                                    className={`${s.element} ${selected ? s.selected : ""}`}
                                    style={{
                                        left: el.position.x,
                                        top: el.position.y,
                                        width: el.size.width,
                                        height: el.size.height,
                                    }}
                                    onMouseDown={(e) => startDrag(e, el)}
                                >
                                    {el.kind === "text" ? (
                                        <div className={s.text}>{el.content}</div>
                                    ) : (
                                        <img src={el.src} className={s.img} draggable={false} />
                                    )}

                                    {selected && (
                                        <>
                                            {/* углы */}
                                            <div
                                                className={`${s.handle} ${s.tl}`}
                                                onMouseDown={(e) => startResize(e, el, "tl")}
                                            />
                                            <div
                                                className={`${s.handle} ${s.tr}`}
                                                onMouseDown={(e) => startResize(e, el, "tr")}
                                            />
                                            <div
                                                className={`${s.handle} ${s.bl}`}
                                                onMouseDown={(e) => startResize(e, el, "bl")}
                                            />
                                            <div
                                                className={`${s.handle} ${s.br}`}
                                                onMouseDown={(e) => startResize(e, el, "br")}
                                            />

                                            {/* середины сторон */}
                                            <div
                                                className={`${s.handle} ${s.tm}`}
                                                onMouseDown={(e) => startResize(e, el, "tm")}
                                            />
                                            <div
                                                className={`${s.handle} ${s.bm}`}
                                                onMouseDown={(e) => startResize(e, el, "bm")}
                                            />
                                            <div
                                                className={`${s.handle} ${s.ml}`}
                                                onMouseDown={(e) => startResize(e, el, "ml")}
                                            />
                                            <div
                                                className={`${s.handle} ${s.mr}`}
                                                onMouseDown={(e) => startResize(e, el, "mr")}
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
