import { useEffect, useRef } from "react";
import type { ID } from "../types";

export function useDrag(
    selected: ID[],
    getElement: (id: ID) => { x: number; y: number },
    onMove: (id: ID, x: number, y: number) => void
) {
    const dragRef = useRef<{
        ids: ID[];
        startX: number;
        startY: number;
        start: Record<ID, { x: number; y: number }>;
    } | null>(null);
    const onMoveRef = useRef(onMove);

    useEffect(() => {
        onMoveRef.current = onMove;
    }, [onMove]);

    function startDrag(e: React.MouseEvent, id: ID, idsOverride?: ID[]) {
        document.body.style.userSelect = "none";

        const ids = idsOverride ?? (selected.length ? selected : [id]);

        dragRef.current = {
            ids,
            startX: e.clientX,
            startY: e.clientY,
            start: Object.fromEntries(
                ids.map((id) => {
                    const pos = getElement(id);
                    return [id, { x: pos.x, y: pos.y }];
                })
            ),
        };

        e.stopPropagation();
    }

    useEffect(() => {
        function move(ev: MouseEvent) {
            const drag = dragRef.current;
            if (!drag) return;

            const dx = ev.clientX - drag.startX;
            const dy = ev.clientY - drag.startY;

            drag.ids.forEach((id) => {
                const base = drag.start[id];
                onMoveRef.current(id, base.x + dx, base.y + dy);
            });
        }

        function stop() {
            if (dragRef.current) {
                dragRef.current = null;
                document.body.style.userSelect = "auto";
            }
        }

        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", stop);

        return () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", stop);
        };
    }, []);

    return { startDrag };
}
