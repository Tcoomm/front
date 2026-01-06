import React from "react";
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
  const playerBackground: React.CSSProperties = {};
  if (currentSlide?.background.kind === "color") {
    playerBackground.backgroundColor = currentSlide.background.value;
  } else if (currentSlide?.background.kind === "image") {
    playerBackground.backgroundImage = `url(${currentSlide.background.src})`;
    playerBackground.backgroundSize = "cover";
    playerBackground.backgroundPosition = "center";
  }

  return (
    <div className="player-page">
      <div className="player-top">
        <div className="player-actions">
          <span className="player-counter">
            {Math.min(playerIndex + 1, totalSlides)}/{totalSlides || 1}
          </span>
          <button className="player-btn" onClick={onBack}>
            Back to editor
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
                    className={`player-el ${el.kind === "text" ? "player-text" : "player-image"}`}
                    style={{
                      left: el.position.x,
                      top: el.position.y,
                      width: Math.max(20, el.size.width),
                      height: Math.max(20, el.size.height),
                      color: el.kind === "text" ? el.color : undefined,
                      fontSize: el.kind === "text" ? `${el.fontSize}px` : undefined,
                      fontFamily: el.kind === "text" ? el.fontFamily : undefined,
                    }}
                  >
                    {el.kind === "text" ? (
                      el.content
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
          Prev
        </button>
        <button
          className="player-btn-primary"
          onClick={onNext}
          disabled={playerIndex >= totalSlides - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}
