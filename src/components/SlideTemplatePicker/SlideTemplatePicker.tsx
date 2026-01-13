import React, { useMemo, useState } from "react";
import { useI18n } from "../../translations";
import { DEFAULT_TEMPLATE_ID, slideTemplates } from "../../slideTemplates";
import s from "./SlideTemplatePicker.module.css";

type Props = {
  onAddTemplate: (templateId: string) => void;
  compact?: boolean;
};

export default function SlideTemplatePicker({ onAddTemplate, compact }: Props) {
  const { t } = useI18n();
  const options = useMemo(() => slideTemplates, []);
  const [value, setValue] = useState(DEFAULT_TEMPLATE_ID);

  return (
    <div className={`${s.root} ${compact ? s.compact : ""}`}>
      <select
        className={`${s.select} ${compact ? s.compactSelect : ""}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        {options.map((template) => (
          <option key={template.id} value={template.id}>
            {(() => {
              const translated = t(`template.${template.id}`);
              return translated === `template.${template.id}` ? template.label : translated;
            })()}
          </option>
        ))}
      </select>
      <button className={`${s.btn} ${compact ? s.compactBtn : ""}`} onClick={() => onAddTemplate(value)}>
        {t("slideTemplate.add")}
      </button>
    </div>
  );
}


