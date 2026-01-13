import React, { useRef, useState } from "react";
import { useI18n } from "../../translations";
import s from "./Toolbar.module.css";
import SlideTemplatePicker from "../SlideTemplatePicker/SlideTemplatePicker";

type Props = {
    onAddSlide: () => void;
    onAddSlideFromTemplate: (templateId: string) => void;
    onAddText: () => void;
    onAddImageFile: (file: File) => void;
    onExportPdf: () => void;
    onExportJson: () => void;
    onImportJsonFile: (file: File) => void;
    onSetBgImageFile: (file: File) => void;
    onAlignElements: (axis: "x" | "y", mode: "start" | "center" | "end") => void;
    onDeleteAny: () => void;
    onSetBgColor: (c: string) => void;
    onSetBgNone: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onOpenPlayer: () => void;
};

export default function Toolbar(props: Props) {
    const { t, lang } = useI18n();
    const [color, setColor] = useState("#ffffff");
    const [alignOpen, setAlignOpen] = useState(false);
    const [alignPos, setAlignPos] = useState<{ left: number; top: number } | null>(null);
    const alignBtnRef = useRef<HTMLButtonElement | null>(null);
    const [exportOpen, setExportOpen] = useState(false);
    const [exportPos, setExportPos] = useState<{ left: number; top: number } | null>(null);
    const exportBtnRef = useRef<HTMLButtonElement | null>(null);

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        props.onAddImageFile(file);
        e.target.value = "";
    }

    function handleBgFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        props.onSetBgImageFile(file);
        e.target.value = "";
    }

    function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        props.onImportJsonFile(file);
        e.target.value = "";
    }

    function toggleAlignMenu() {
        setAlignOpen((prev) => {
            const next = !prev;
            if (next && alignBtnRef.current) {
                const rect = alignBtnRef.current.getBoundingClientRect();
                setAlignPos({ left: rect.left, top: rect.bottom + 6 });
            } else if (!next) {
                setAlignPos(null);
            }
            return next;
        });
    }

    function toggleExportMenu() {
        setExportOpen((prev) => {
            const next = !prev;
            if (next && exportBtnRef.current) {
                const rect = exportBtnRef.current.getBoundingClientRect();
                setExportPos({ left: rect.left, top: rect.bottom + 6 });
            } else if (!next) {
                setExportPos(null);
            }
            return next;
        });
    }

    return (
        <div className={`${s.root} ${lang === "ru" ? s.compact : ""}`}>
            <button className={s.btn} onClick={props.onUndo}>
                {t("toolbar.undo")}
            </button>
            <button className={s.btn} onClick={props.onRedo}>
                {t("toolbar.redo")}
            </button>
            <button className={s.btnPrimary} onClick={props.onAddSlide}>
                {t("toolbar.addSlide")}
            </button>
            <SlideTemplatePicker onAddTemplate={props.onAddSlideFromTemplate} compact={lang === "ru"} />
            <button className={s.btn} onClick={props.onOpenPlayer}>
                {t("toolbar.player")}
            </button>
            <button className={s.btn} onClick={props.onAddText}>
                {t("toolbar.addText")}
            </button>
            <div className={s.alignWrap}>
                <button className={s.btn} ref={exportBtnRef} onClick={toggleExportMenu}>
                    {t("toolbar.export")}
                </button>
                {exportOpen && exportPos && (
                    <div
                        className={s.alignMenu}
                        style={{ left: exportPos.left, top: exportPos.top }}
                        onMouseLeave={() => setExportOpen(false)}
                    >
                        <button
                            className={s.alignItem}
                            onClick={() => {
                                props.onExportPdf();
                                setExportOpen(false);
                            }}
                        >
                            {t("toolbar.export.pdf")}
                        </button>
                        <button
                            className={s.alignItem}
                            onClick={() => {
                                props.onExportJson();
                                setExportOpen(false);
                            }}
                        >
                            {t("toolbar.export.json")}
                        </button>
                    </div>
                )}
            </div>

            <label className={s.fileBtn}>
                <input className={s.fileInput} type="file" accept="image/*" onChange={handleFile} />
                {t("toolbar.addImage")}
            </label>

            <label className={s.fileBtn}>
                <input className={s.fileInput} type="file" accept=".json,application/json" onChange={handleImportFile} />
                {t("toolbar.import.json")}
            </label>

            <div className={s.alignWrap}>
                <button className={s.btn} ref={alignBtnRef} onClick={toggleAlignMenu}>
                    {t("toolbar.align")}
                </button>
                {alignOpen && alignPos && (
                    <div
                        className={s.alignMenu}
                        style={{ left: alignPos.left, top: alignPos.top }}
                        onMouseLeave={() => setAlignOpen(false)}
                    >
                        <button
                            className={s.alignItem}
                            onClick={() => {
                                props.onAlignElements("x", "start");
                                setAlignOpen(false);
                            }}
                        >
                            {t("toolbar.align.left")}
                        </button>
                        <button
                            className={s.alignItem}
                            onClick={() => {
                                props.onAlignElements("x", "center");
                                setAlignOpen(false);
                            }}
                        >
                            {t("toolbar.align.center")}
                        </button>
                        <button
                            className={s.alignItem}
                            onClick={() => {
                                props.onAlignElements("x", "end");
                                setAlignOpen(false);
                            }}
                        >
                            {t("toolbar.align.right")}
                        </button>
                        <button
                            className={s.alignItem}
                            onClick={() => {
                                props.onAlignElements("y", "start");
                                setAlignOpen(false);
                            }}
                        >
                            {t("toolbar.align.top")}
                        </button>
                        <button
                            className={s.alignItem}
                            onClick={() => {
                                props.onAlignElements("y", "center");
                                setAlignOpen(false);
                            }}
                        >
                            {t("toolbar.align.middle")}
                        </button>
                        <button
                            className={s.alignItem}
                            onClick={() => {
                                props.onAlignElements("y", "end");
                                setAlignOpen(false);
                            }}
                        >
                            {t("toolbar.align.bottom")}
                        </button>
                    </div>
                )}
            </div>

            <button className={s.btn} onClick={props.onDeleteAny}>
                {t("toolbar.delete")}
            </button>

            <div className={s.colorGroup}>
                <input
                    className={s.colorInput}
                    type="color"
                    value={color}
                    onChange={(e) => {
                        const next = e.target.value;
                        setColor(next);
                        props.onSetBgColor(next);
                    }}
                />
                <button className={s.btn} onClick={props.onSetBgNone}>
                    {t("toolbar.clearBackground")}
                </button>
                <label className={s.fileBtn}>
                    <input className={s.fileInput} type="file" accept="image/*" onChange={handleBgFile} />
                    {t("toolbar.backgroundImage")}
                </label>
            </div>
        </div>
    );
}


