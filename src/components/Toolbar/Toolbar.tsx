import React, { useState } from "react";
import s from "./Toolbar.module.css";

type Props = {
    onAddSlide: () => void;
    onDeleteSlide: () => void;
    onAddText: () => void;
    onAddImageFile: (file: File) => void;
    onDeleteSelected: () => void;
    onSetBgColor: (c: string) => void;
    onSetBgNone: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onOpenPlayer: () => void;
};

export default function Toolbar(props: Props) {
    const [color, setColor] = useState("#ffffff");

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        props.onAddImageFile(file);
        e.target.value = "";
    }

    return (
        <div className={s.root}>
            <button className={s.btn} onClick={props.onUndo}>
                Undo
            </button>
            <button className={s.btn} onClick={props.onRedo}>
                Redo
            </button>
            <button className={s.btnPrimary} onClick={props.onAddSlide}>
                Add slide
            </button>
            <button className={s.btn} onClick={props.onOpenPlayer}>
                Player
            </button>
            <button className={s.btn} onClick={props.onDeleteSlide}>
                Delete slide
            </button>
            <button className={s.btn} onClick={props.onAddText}>
                Add text
            </button>

            <label className={s.fileBtn}>
                <input className={s.fileInput} type="file" accept="image/*" onChange={handleFile} />
                Add image
            </label>

            <button className={s.btn} onClick={props.onDeleteSelected}>
                Delete element
            </button>

            <div className={s.colorGroup}>
                <input
                    className={s.colorInput}
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                />
                <button className={s.btn} onClick={() => props.onSetBgColor(color)}>
                    Set background
                </button>
                <button className={s.btn} onClick={props.onSetBgNone}>
                    Clear background
                </button>
            </div>
        </div>
    );
}
