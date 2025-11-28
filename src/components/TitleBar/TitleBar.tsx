import React from "react";
import s from "./TitleBar.module.css";

type Props = {
    title: string;
    onChange: (value: string) => void;
    onBlur?: () => void; // сделали необязательным
};

export default function TitleBar({ title, onChange, onBlur }: Props) {
    return (
        <div className={s.root}>
            <label className={s.label}>Название:</label>
            <input
                className={s.input}
                value={title}
                onChange={(e) => {
                    const v = e.target.value;
                    console.log("[title] change:", v);
                    onChange(v);
                }}
                onBlur={() => {
                    onBlur?.();
                }}
            />
        </div>
    );
}
