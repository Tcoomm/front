import type { Presentation } from "../types";
import { buildPdfHtml } from "./buildPdfHtml";

export function openPdfExport(presentation: Presentation, slideWidth: number, slideHeight: number) {
  const win = window.open("", "_blank");
  if (!win) return;
  const html = buildPdfHtml(presentation, slideWidth, slideHeight);
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}
