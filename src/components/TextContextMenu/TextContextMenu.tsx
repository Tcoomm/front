import React from "react";
import { useI18n } from "../../translations";
import s from "./TextContextMenu.module.css";

type Props = {
    color: string;
    textColor: string;
    fontSize: number;
    fontFamily: string;
    borderColor: string;
    borderWidth: number;
    onChange: (color: string) => void;
    onTextColorChange: (color: string) => void;
    onBorderColorChange: (color: string) => void;
    onBorderWidthChange: (width: number) => void;
    onClear: () => void;
    onFontSizeChange: (size: number) => void;
    onFontFamilyChange: (family: string) => void;
    onTextAlignChange: (align: "left" | "center" | "right") => void;
    onToggleBold: () => void;
    onToggleItalic: () => void;
    onToggleUnderline: () => void;
};

export default function TextContextMenu({
    color,
    textColor,
    fontSize,
    fontFamily,
    borderColor,
    borderWidth,
    onChange,
    onTextColorChange,
    onBorderColorChange,
    onBorderWidthChange,
    onClear,
    onFontSizeChange,
    onFontFamilyChange,
    onTextAlignChange,
    onToggleBold,
    onToggleItalic,
    onToggleUnderline,
}: Props) {
    const { t } = useI18n();
    return (
        <div className={s.menu} onContextMenu={(e) => e.preventDefault()}>
            <div className={s.row}>
                <span className={s.label}>{t("textMenu.background")}</span>
                <input
                    className={s.color}
                    type="color"
                    value={color}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
            <div className={s.row}>
                <span className={s.label}>{t("textMenu.color")}</span>
                <input
                    className={s.color}
                    type="color"
                    value={textColor}
                    onChange={(e) => onTextColorChange(e.target.value)}
                />
            </div>
            <div className={s.row}>
                <span className={s.label}>{t("textMenu.borderColor")}</span>
                <input
                    className={s.color}
                    type="color"
                    value={borderColor}
                    onChange={(e) => onBorderColorChange(e.target.value)}
                />
            </div>
            <div className={s.row}>
                <span className={s.label}>{t("textMenu.borderWidth")}</span>
                <input
                    className={s.size}
                    type="number"
                    min={0}
                    max={20}
                    value={borderWidth}
                    onChange={(e) => onBorderWidthChange(Number(e.target.value) || 0)}
                />
            </div>
            <div className={s.row}>
                <span className={s.label}>{t("textMenu.size")}</span>
                <input
                    className={s.size}
                    type="number"
                    min={8}
                    max={200}
                    value={fontSize}
                    onChange={(e) => onFontSizeChange(Number(e.target.value) || 8)}
                />
            </div>
            <div className={s.row}>
                <span className={s.label}>{t("textMenu.font")}</span>
                <select
                    className={s.select}
                    value={fontFamily}
                    onChange={(e) => onFontFamilyChange(e.target.value)}
                >
                    <option value="Arial">Arial</option>
                    <option value="Inter">Inter</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                </select>
            </div>
            <div className={s.row}>
                <span className={s.label}>{t("textMenu.align")}</span>
                <div className={s.alignGroup}>
                    <button className={s.alignBtn} onClick={() => onTextAlignChange("left")}>{t("textMenu.left")}</button>
                    <button className={s.alignBtn} onClick={() => onTextAlignChange("center")}>{t("textMenu.center")}</button>
                    <button className={s.alignBtn} onClick={() => onTextAlignChange("right")}>{t("textMenu.right")}</button>
                </div>
            </div>
            <div className={s.row}>
                <span className={s.label}>{t("textMenu.format")}</span>
                <div className={s.alignGroup}>
                    <button className={s.alignBtn} onClick={onToggleBold}>{t("textMenu.bold")}</button>
                    <button className={s.alignBtn} onClick={onToggleItalic}>{t("textMenu.italic")}</button>
                    <button className={s.alignBtn} onClick={onToggleUnderline}>{t("textMenu.underline")}</button>
                </div>
            </div>
            <button className={s.clear} onClick={onClear}>
                {t("textMenu.clear")}
            </button>
        </div>
    );
}


