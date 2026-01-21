import type { Presentation } from "../types";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildPdfHtml(presentation: Presentation, slideWidth: number, slideHeight: number) {
  const title = escapeHtml(presentation.title || "Presentation");
  const slideBlocks = presentation.slides
    .map((slide) => {
      const bg =
        slide.background.kind === "color"
          ? `background-color: ${slide.background.value};`
          : slide.background.kind === "image"
            ? `background-image: url('${slide.background.src}'); background-size: 100% 100%; background-position: center; background-repeat: no-repeat;`
            : "background-color: #ffffff;";

      const elements = slide.elements
        .map((el) => {
          if (el.kind === "text") {
            const isRich = Boolean(el.isRichText) || /<[^>]+>/.test(el.content);
            const content = isRich ? el.content : escapeHtml(el.content).replace(/\n/g, "<br/>");
            const border =
              el.borderWidth && el.borderWidth > 0
                ? `border:${el.borderWidth}px solid ${el.borderColor ?? "#111"};`
                : "border:none;";
            const style = [
              `color:${el.color}`,
              `font-size:${el.fontSize}px`,
              `font-family:${el.fontFamily}`,
              `text-align:${el.textAlign ?? "left"}`,
              `background-color: transparent`,
              border,
            ];
            if (!isRich) {
              style.push(`font-weight:${el.bold ? "700" : "400"}`);
              style.push(`font-style:${el.italic ? "italic" : "normal"}`);
              style.push(`text-decoration:${el.underline ? "underline" : "none"}`);
            }
            return `<div class="el text-shell" style="left:${el.position.x}px; top:${el.position.y}px; width:${el.size.width}px; height:${el.size.height}px; background-color:${el.backgroundColor ?? "transparent"}; ${border}">
              <div class="text" style="${style.join("; ")};">${content}</div>
            </div>`;
          }
          return `<img class="el img" src="${el.src}" alt="" style="left:${el.position.x}px; top:${el.position.y}px; width:${el.size.width}px; height:${el.size.height}px;" />`;
        })
        .join("");

      return `<section class="slide" style="${bg}">${elements}</section>`;
    })
    .join("");

  const widthIn = (slideWidth / 96).toFixed(2);
  const heightIn = (slideHeight / 96).toFixed(2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: ${widthIn}in ${heightIn}in; margin: 0; }
    html, body { margin: 0; padding: 0; }
    body {
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .slide {
      width: ${slideWidth}px;
      height: ${slideHeight}px;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .slide:last-child { page-break-after: auto; }
    .el { position: absolute; box-sizing: border-box; }
    .text-shell {
      position: absolute;
      box-sizing: border-box;
      border-radius: 6px;
      overflow: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .text {
      width: 100%;
      height: 100%;
      padding: 8px 10px;
      border-radius: 6px;
      white-space: pre-wrap;
      word-break: break-word;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      position: absolute;
      top: 0;
      left: 0;
      box-sizing: border-box;
      overflow: hidden;
      letter-spacing: -0.2px;
      word-spacing: -0.3px;
    }
    .text * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    .text ul,
    .text ol {
      padding-left: 18px;
    }
    .img { object-fit: fill; }
  </style>
</head>
<body>
  ${slideBlocks}
  <script>
    (function () {
      var imgs = Array.from(document.images || []);
      var wait = imgs.map(function (img) {
        if (img.decode) {
          return img.decode().catch(function () {});
        }
        return new Promise(function (resolve) {
          img.onload = img.onerror = resolve;
        });
      });
      Promise.all(wait).then(function () {
        setTimeout(function () { window.print(); }, 50);
      });
    })();
  </script>
</body>
</html>`;
}
