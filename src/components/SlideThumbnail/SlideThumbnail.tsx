import React from "react";
import type { Slide, SlideElement } from "../../types";
import s from "./SlideThumbnail.module.css";

const SLIDE_WIDTH = 1200;
const SLIDE_HEIGHT = 675;
const THUMB_WIDTH = 210;
const THUMB_HEIGHT = 118;

type Props = {
  slide: Slide;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function backgroundStyle(slide: Slide): React.CSSProperties {
  if (slide.background.kind === "color") {
    return { backgroundColor: slide.background.value };
  }
  if (slide.background.kind === "image") {
    return {
      backgroundImage: `url(${slide.background.src})`,
      backgroundSize: "100% 100%",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }
  return { backgroundColor: "#fff" };
}

function renderElement(el: SlideElement) {
  if (el.kind === "text") {
    const isRich = Boolean(el.isRichText) || /<[^>]+>/.test(el.content);
    return (
      <div
        key={el.id}
        className={s.text}
        style={{
          left: el.position.x,
          top: el.position.y,
          width: el.size.width,
          height: el.size.height,
          fontSize: el.fontSize,
          fontFamily: el.fontFamily,
          color: el.color,
          backgroundColor: el.backgroundColor ?? "transparent",
          textAlign: el.textAlign ?? "left",
          fontWeight: isRich ? "400" : el.bold ? "700" : "400",
          fontStyle: isRich ? "normal" : el.italic ? "italic" : "normal",
          textDecoration: isRich ? "none" : el.underline ? "underline" : "none",
          border:
            el.borderWidth > 0
              ? `${el.borderWidth}px solid ${el.borderColor ?? "#111"}`
              : "none",
        }}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: isRich ? el.content : escapeHtml(el.content).replace(/\n/g, "<br/>"),
          }}
        />
      </div>
    );
  }

  return (
    <img
      key={el.id}
      className={s.image}
      src={el.src}
      alt=""
      style={{
        left: el.position.x,
        top: el.position.y,
        width: el.size.width,
        height: el.size.height,
      }}
      draggable={false}
    />
  );
}

export default function SlideThumbnail({ slide }: Props) {
  const scale = Math.min(THUMB_WIDTH / SLIDE_WIDTH, THUMB_HEIGHT / SLIDE_HEIGHT);
  return (
    <div className={s.frame}>
      <div className={s.thumb} style={backgroundStyle(slide)}>
        <div
          className={s.canvas}
          style={{
            width: SLIDE_WIDTH,
            height: SLIDE_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          {slide.elements.map(renderElement)}
        </div>
      </div>
    </div>
  );
}
