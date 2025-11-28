import React, { useState, useRef } from "react";
import s from "./Toolbar.module.css";

type Props = {
    onAddSlide: () => void;
    onDeleteSlide: () => void;
    onAddText: () => void;
    onAddImageUrl: (url: string) => void;
    onDeleteSelected: () => void;
    onSetBgColor: (c: string) => void;
    onSetBgNone: () => void;
};

const DEFAULT_BG_COLOR = "#f5f5f5";

export default function Toolbar({
    onAddSlide,
    onDeleteSlide,
    onAddText,
    onAddImageUrl,
    onDeleteSelected,
    onSetBgColor,
    onSetBgNone,
}: Props) {
    const [bgColor, setBgColor] = useState<string>(DEFAULT_BG_COLOR);

    // скрытый input
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    function handleFilePick() {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        console.log("[toolbar] selected file:", file.name);

        onAddImageUrl(url);

        // сброс чтобы можно было выбрать тот же файл
        e.target.value = "";
    }

    function handleApplyBgColor() {
        onSetBgColor(bgColor);
    }

    return (
        <div className={s.root}>
            <button className={s.btn} onClick={onAddSlide}>
                Добавить слайд
            </button>

            <button className={s.btn} onClick={onDeleteSlide}>
                Удалить слайд
            </button>

            <button className={s.btn} onClick={onAddText}>
                Добавить текст
            </button>

            {/* скрытый input */}
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
            />

            {/* Кнопка, которая открывает окно выбора файла */}
            <button className={s.btn} onClick={handleFilePick}>
                Добавить картинку
            </button>

            <button className={s.btnDanger} onClick={onDeleteSelected}>
                Удалить элемент
            </button>

            {/* выбор цвета */}
            <input
                type="color"
                className={s.input}
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
            />
            <button className={s.btn} onClick={handleApplyBgColor}>
                Цвет фона
            </button>

            <button className={s.btn} onClick={onSetBgNone}>
                Убрать фон
            </button>
        </div>
    );
}
