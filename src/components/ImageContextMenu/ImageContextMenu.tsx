import React from "react";
import { useI18n } from "../../translations";
import s from "./ImageContextMenu.module.css";

type Props = {
    onReplace: (file: File) => void;
};

export default function ImageContextMenu({ onReplace }: Props) {
    const { t } = useI18n();
    function onFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        onReplace(file);
        e.target.value = "";
    }

    return (
        <div className={s.menu} onContextMenu={(e) => e.preventDefault()}>
            <label className={s.fileBtn}>
                <input className={s.fileInput} type="file" accept="image/*" onChange={onFile} />
                {t("imageMenu.replace")}
            </label>
        </div>
    );
}


