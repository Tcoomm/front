import { useEffect, useRef } from "react";
import type { ID } from "../types";

type DragOptions = {
    gridSize?: number;
    disableSnapKey?: "Alt" | "Shift";
};

export function useDrag(
    selected: ID[],
    getElement: (id: ID) => { x: number; y: number },
    onMove: (id: ID, x: number, y: number) => void,
    options?: DragOptions
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

            const grid = options?.gridSize ?? 0;
            const disableKey = options?.disableSnapKey;
            const snapEnabled =
                (disableKey === "Alt" && ev.altKey) || (disableKey === "Shift" && ev.shiftKey);

            let moveDx = dx;
            let moveDy = dy;

            if (grid > 0 && snapEnabled) {
                const refId = drag.ids[0];
                const base = drag.start[refId];
                const snap = (value: number) => Math.round(value / grid) * grid;
                moveDx = snap(base.x + dx) - base.x;
                moveDy = snap(base.y + dy) - base.y;
            }

            drag.ids.forEach((id) => {
                const base = drag.start[id];
                onMoveRef.current(id, base.x + moveDx, base.y + moveDy);
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
