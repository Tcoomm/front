import React from "react";
import { useI18n } from "../translations";
import type { Slide } from "../types";

type PlayerPageProps = {
  currentSlide: Slide | null;
  playerIndex: number;
  totalSlides: number;
  playerScale: number;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  stageRef?: React.Ref<HTMLDivElement>;
};

export default function PlayerPage({
  currentSlide,
  playerIndex,
  totalSlides,
  playerScale,
  onBack,
  onPrev,
  onNext,
  stageRef,
}: PlayerPageProps) {
  const { t } = useI18n();
  function escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  const playerBackground: React.CSSProperties = {};
  if (currentSlide?.background.kind === "color") {
    playerBackground.backgroundColor = currentSlide.background.value;
  } else if (currentSlide?.background.kind === "image") {
    playerBackground.backgroundImage = `url(${currentSlide.background.src})`;
    playerBackground.backgroundSize = "100% 100%";
    playerBackground.backgroundPosition = "center";
    playerBackground.backgroundRepeat = "no-repeat";
  }

  return (
    <div className="player-page">
      <div className="player-top">
        <div className="player-actions">
          <span className="player-counter">
            {Math.min(playerIndex + 1, totalSlides)}/{totalSlides || 1}
          </span>
          <button className="player-btn" onClick={onBack}>
            {t("player.back")}
          </button>
        </div>
      </div>
      <div className="player-stage" ref={stageRef}>
        <div className="player-zoom" style={{ transform: `scale(${playerScale})` }}>
          <div className="player-slide" style={playerBackground}>
            {currentSlide
              ? currentSlide.elements.map((el) => (
                  <div
                    key={el.id}
                    className={`player-el ${el.kind === "text" ? "player-text-wrap" : "player-image"}`}
                    style={{
                      left: el.position.x,
                      top: el.position.y,
                      width: Math.max(20, el.size.width),
                      height: Math.max(20, el.size.height),
                    }}
                  >
                    {el.kind === "text" ? (
                      <div
                        className="player-text-shell"
                        style={{
                          backgroundColor: el.backgroundColor ?? "transparent",
                          border:
                            el.borderWidth > 0
                              ? `${el.borderWidth}px solid ${el.borderColor ?? "#111"}`
                              : "none",
                        }}
                      >
                        <div
                          className="player-text"
                          style={{
                            color: el.color,
                            fontSize: `${el.fontSize}px`,
                            fontFamily: el.fontFamily,
                            textAlign: el.textAlign ?? "left",
                            fontWeight:
                              !(el.isRichText || /<[^>]+>/.test(el.content)) && el.bold
                                ? "700"
                                : "400",
                            fontStyle:
                              !(el.isRichText || /<[^>]+>/.test(el.content)) && el.italic
                                ? "italic"
                                : "normal",
                            textDecoration:
                              !(el.isRichText || /<[^>]+>/.test(el.content)) && el.underline
                                ? "underline"
                                : "none",
                          }}
                          dangerouslySetInnerHTML={{
                            __html:
                              el.isRichText || /<[^>]+>/.test(el.content)
                                ? el.content
                                : escapeHtml(el.content).replace(/\n/g, "<br/>"),
                          }}
                        />
                      </div>
                    ) : (
                      <img src={el.src} className="player-img" draggable={false} />
                    )}
                  </div>
                ))
              : null}
          </div>
        </div>
      </div>
      <div className="player-controls">
        <button className="player-btn" onClick={onPrev} disabled={playerIndex <= 0}>
          {t("player.prev")}
        </button>
        <button
          className="player-btn-primary"
          onClick={onNext}
          disabled={playerIndex >= totalSlides - 1}
        >
          {t("player.next")}
        </button>
      </div>
    </div>
  );
}
