import { useState } from "react";

export function useSelection(initial: string[]) {
    const [selectedIds, setSelectedIds] = useState<string[]>(initial);

    function select(id: string, multi: boolean) {
        if (multi) {
            setSelectedIds(prev =>
                prev.includes(id) ? prev : [...prev, id]
            );
        } else {
            setSelectedIds([id]);
        }
    }

    function clear() {
        setSelectedIds([]);
    }

    return { selectedIds, select, clear };
}
