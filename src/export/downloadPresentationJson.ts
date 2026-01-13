import type { Presentation } from "../types";

function sanitizeFilename(value: string) {
  const trimmed = value.trim();
  const base = trimmed ? trimmed : "presentation";
  return base.replace(/[\\/:*?"<>|]+/g, "_");
}

export function downloadPresentationJson(presentation: Presentation) {
  const name = sanitizeFilename(presentation.title || "presentation");
  const payload = JSON.stringify(presentation, null, 2);
  const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
