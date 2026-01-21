import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { SlideElement, ID } from "../../types";
import {
  moveElement,
  resizeElement,
  selectElements,
  selectPresentation,
  updateTextContent,
  updateTextBackground,
  updateTextBorder,
  updateTextColor,
  updateTextFontFamily,
  updateTextFontSize,
  updateTextAlign,
  updateTextStyle,
} from "../../store";
import { useDrag } from "../../hooks/useDrag";
import { useResize } from "../../hooks/useResize";
import TextContextMenu from "../TextContextMenu/TextContextMenu";
import ImageContextMenu from "../ImageContextMenu/ImageContextMenu";
import s from "./Workspace.module.css";

type WorkspaceProps = {
  onReplaceImageFile: (elId: ID, file: File) => void;
};

export default function Workspace({ onReplaceImageFile }: WorkspaceProps) {
  const dispatch = useDispatch();
  const presentation = useSelector(selectPresentation);
  const activeSlide = useMemo(() => {
    const id = presentation.selection.slideId ?? null;
    return id ? (presentation.slides.find((s) => s.id === id) ?? null) : null;
  }, [presentation]);
  const selectedIds = presentation.selection.elementIds;
  const slideRef = useRef<HTMLDivElement | null>(null);

  const [editingId, setEditingId] = useState<ID | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingRich, setEditingRich] = useState(false);
  const [editingWasRich, setEditingWasRich] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const richEditRef = useRef<HTMLDivElement | null>(null);
  const lastEditingIdRef = useRef<ID | null>(null);
  const selectionRef = useRef<Range | null>(null);
  const [textMenu, setTextMenu] = useState<{ x: number; y: number; elId: ID } | null>(null);
  const [imageMenu, setImageMenu] = useState<{ x: number; y: number; elId: ID } | null>(null);
  const suppressBlurRef = useRef(false);

  function escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function decodeHtml(value: string) {
    const el = document.createElement("textarea");
    el.innerHTML = value;
    return el.value;
  }

  function htmlToPlainText(value: string) {
    return decodeHtml(
      value
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(div|p)>/gi, "\n")
        .replace(/<[^>]+>/g, ""),
    );
  }

  // auto-resize textarea to fit content within box
  useEffect(() => {
    if (editingId && textareaRef.current) {
      const ta = textareaRef.current;
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }, [editingId, editingValue]);

  useEffect(() => {
    if (editingId && editingRich && richEditRef.current) {
      if (lastEditingIdRef.current !== editingId) {
        richEditRef.current.innerHTML = editingValue;
        lastEditingIdRef.current = editingId;
      }
      richEditRef.current.focus();
    }
  }, [editingId, editingRich, editingValue]);

  function handleSelect(el: SlideElement, multi: boolean) {
    let ids = selectedIds;

    if (multi) {
      ids = ids.includes(el.id) ? ids.filter((x) => x !== el.id) : [...ids, el.id];
    } else {
      ids = [el.id];
    }

    dispatch(selectElements(ids));
  }

  function getElement(id: string) {
    const el = activeSlide?.elements.find((e) => e.id === id);
    return el
      ? {
          x: el.position.x,
          y: el.position.y,
          w: el.size.width,
          h: el.size.height,
        }
      : { x: 0, y: 0, w: 0, h: 0 };
  }

  // DRAG
  const { startDrag } = useDrag(
    selectedIds,
    getElement,
    (id, x, y) => {
      if (!activeSlide) return;
      dispatch(moveElement({ slideId: activeSlide.id, elId: id, x, y }));
    },
    { gridSize: 10, disableSnapKey: "Alt" },
  );

  // RESIZE
  const { startResize } = useResize(getElement, (id, x, y, w, h) => {
    if (!activeSlide) return;
    dispatch(resizeElement({ slideId: activeSlide.id, elId: id, x, y, w, h }));
  });

  function startEditing(el: SlideElement) {
    if (el.kind !== "text") return;
    const hasMarkup = /<[^>]+>/.test(el.content);
    const wasRich = el.isRichText || hasMarkup;
    const html = wasRich ? el.content : escapeHtml(el.content).replace(/\n/g, "<br/>");
    lastEditingIdRef.current = null;
    setEditingId(el.id);
    setEditingValue(html);
    setEditingRich(true);
    setEditingWasRich(wasRich);
  }

  function stopEditing(save: boolean, el: SlideElement) {
    if (el.kind !== "text") return;
    if (save && activeSlide) {
      const hasMarkup = /<[^>]+>/.test(editingValue);
      const hasFormatting =
        /<(b|strong|i|em|u|span|font)\b/i.test(editingValue) || /style\s*=/.test(editingValue);
      const isRichText = editingWasRich || (hasMarkup && hasFormatting);
      dispatch(
        updateTextContent({
          slideId: activeSlide.id,
          elId: el.id,
          content: isRichText ? editingValue : htmlToPlainText(editingValue),
          isRichText,
        }),
      );
    }
    setEditingId(null);
    setEditingValue("");
    setEditingRich(false);
    setEditingWasRich(false);
    lastEditingIdRef.current = null;
  }

  function applyRichCommand(command: "bold" | "italic" | "underline") {
    if (!richEditRef.current) return false;
    if (selectionRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(selectionRef.current);
      }
    }
    richEditRef.current.focus();
    document.execCommand(command, false);
    setEditingValue(richEditRef.current.innerHTML);
    setEditingWasRich(true);
    return true;
  }

  function applyRichFontSize(size: number) {
    if (!richEditRef.current) return false;
    if (selectionRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(selectionRef.current);
      }
    }
    richEditRef.current.focus();
    document.execCommand("fontSize", false, "7");
    const fonts = richEditRef.current.querySelectorAll('font[size="7"]');
    fonts.forEach((node) => {
      const span = document.createElement("span");
      span.style.fontSize = `${size}px`;
      span.innerHTML = node.innerHTML;
      node.replaceWith(span);
    });
    setEditingValue(richEditRef.current.innerHTML);
    setEditingWasRich(true);
    return true;
  }

  function captureSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!richEditRef.current) return;
    if (richEditRef.current.contains(range.startContainer)) {
      selectionRef.current = range;
    }
  }

  useEffect(() => {
    if (!editingId || !editingRich) return;
    function handleSelectionChange() {
      captureSelection();
    }
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [editingId, editingRich]);

  useEffect(() => {
    if (!textMenu) return;
    function handleClick() {
      setTextMenu(null);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setTextMenu(null);
    }
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [textMenu]);

  useEffect(() => {
    if (!imageMenu) return;
    function handleClick() {
      setImageMenu(null);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setImageMenu(null);
    }
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [imageMenu]);

  // background
  const bg: React.CSSProperties = {};
  if (activeSlide) {
    if (activeSlide.background.kind === "color") {
      bg.backgroundColor = activeSlide.background.value;
    } else if (activeSlide.background.kind === "image") {
      bg.backgroundImage = `url(${activeSlide.background.src})`;
      bg.backgroundSize = "cover";
      bg.backgroundPosition = "center";
    }
  }

  // Keep the workspace in view when slide changes (undo/redo)
  useEffect(() => {
    if (!activeSlide) return;
    slideRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    slideRef.current?.focus();
  }, [activeSlide, activeSlide?.id]);

  return (
    <main className={s.root}>
      <h3 className={s.title}>Workspace</h3>

      <div className={s.stage} style={bg}>
        <div className={s.slide} tabIndex={-1} ref={slideRef}>
          {activeSlide &&
            activeSlide.elements.map((el) => {
              const selected = selectedIds.includes(el.id);
              const isEditing = editingId === el.id;
              const isRich =
                el.kind === "text" && (Boolean(el.isRichText) || /<[^>]+>/.test(el.content));
              const textStyles: React.CSSProperties =
                el.kind === "text"
                  ? {
                      fontFamily: el.fontFamily,
                      fontSize: el.fontSize,
                      color: el.color,
                      textAlign: el.textAlign,
                      backgroundColor: "transparent",
                      boxSizing: "border-box",
                      direction: "ltr",
                      unicodeBidi: "plaintext",
                      fontWeight: !isRich && el.bold ? "700" : "400",
                      fontStyle: !isRich && el.italic ? "italic" : "normal",
                      textDecoration: !isRich && el.underline ? "underline" : "none",
                    }
                  : {};
              const textShellStyles: React.CSSProperties =
                el.kind === "text"
                  ? {
                      border:
                        el.borderWidth > 0
                          ? `${el.borderWidth}px solid ${el.borderColor ?? "#111"}`
                          : "none",
                      backgroundColor: el.backgroundColor ?? "transparent",
                    }
                  : {};

              return (
                <div
                  key={el.id}
                  className={`${s.element} ${el.kind === "image" ? s.imageElement : ""} ${
                    selected ? s.selected : ""
                  }`}
                  style={{
                    left: el.position.x,
                    top: el.position.y,
                    width: Math.max(20, el.size.width),
                    height: Math.max(20, el.size.height),
                  }}
                  onDoubleClick={(e) => {
                    if (el.kind === "text") {
                      e.preventDefault();
                      e.stopPropagation();
                      startEditing(el);
                    }
                  }}
                  onMouseDown={(e) => {
                    const multi = e.shiftKey;

                    // If editing text, don't start drag/select
                    if (editingId) return;
                    if (el.kind === "text" && e.detail >= 2) return;

                    // Calculate what selection will be after this click
                    const current = [...selectedIds];
                    let nextSelection: ID[];

                    if (multi) {
                      nextSelection = current.includes(el.id)
                        ? current.filter((x) => x !== el.id)
                        : [...current, el.id];
                    } else {
                      nextSelection = [el.id];
                    }

                    const dragIds = nextSelection.length ? nextSelection : [el.id];

                    handleSelect(el, multi);
                    startDrag(e, el.id, dragIds);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(el, false);
                    setImageMenu(null);
                    if (el.kind === "text") {
                      if (editingId === el.id && editingRich) {
                        captureSelection();
                      }
                      setTextMenu({ x: e.clientX, y: e.clientY, elId: el.id });
                      return;
                    }
                    setTextMenu(null);
                    setImageMenu({ x: e.clientX, y: e.clientY, elId: el.id });
                  }}
                >
                  {el.kind === "text" ? (
                    isEditing ? (
                      <div className={s.textShell} style={textShellStyles}>
                        {editingRich ? (
                          <div
                            className={s.textarea}
                            ref={richEditRef}
                            dir="ltr"
                            contentEditable
                            suppressContentEditableWarning
                            style={textStyles}
                            onMouseUp={captureSelection}
                            onKeyUp={captureSelection}
                            onInput={(ev) => {
                              const target = ev.currentTarget;
                              const html = target.innerHTML;
                              if (
                                /<(b|strong|i|em|u|span|font)\b/i.test(html) ||
                                /style\s*=/.test(html)
                              ) {
                                setEditingWasRich(true);
                              }
                              setEditingValue(html);
                            }}
                            onBlur={() => {
                              if (suppressBlurRef.current) {
                                richEditRef.current?.focus();
                                return;
                              }
                              stopEditing(true, el);
                            }}
                            onKeyDown={(ev) => {
                              if (ev.key === "Escape") {
                                ev.preventDefault();
                                stopEditing(false, el);
                              }
                              if (ev.key === "Enter" && !ev.metaKey && !ev.ctrlKey) {
                                ev.preventDefault();
                                document.execCommand("insertHTML", false, "<br/>");
                                if (richEditRef.current) {
                                  setEditingValue(richEditRef.current.innerHTML);
                                }
                              }
                              if (ev.key === "Enter" && ev.metaKey) {
                                ev.preventDefault();
                                stopEditing(true, el);
                              }
                            }}
                          />
                        ) : (
                          <textarea
                            className={s.textarea}
                            autoFocus
                            ref={textareaRef}
                            style={textStyles}
                            dir="ltr"
                            value={editingValue}
                            onChange={(ev) => setEditingValue(ev.target.value)}
                            onBlur={() => {
                              if (suppressBlurRef.current) return;
                              stopEditing(true, el);
                            }}
                            onKeyDown={(ev) => {
                              if (ev.key === "Escape") {
                                ev.preventDefault();
                                stopEditing(false, el);
                              }
                              if (ev.key === "Enter" && ev.metaKey) {
                                ev.preventDefault();
                                stopEditing(true, el);
                              }
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className={s.textShell} style={textShellStyles}>
                        <div
                          className={s.text}
                          style={textStyles}
                          dangerouslySetInnerHTML={{
                            __html: isRich
                              ? el.content
                              : escapeHtml(el.content).replace(/\n/g, "<br/>"),
                          }}
                          onMouseDown={(ev) => {
                            if (editingId) {
                              ev.stopPropagation();
                            }
                          }}
                        />
                      </div>
                    )
                  ) : (
                    <img src={el.src} className={s.img} draggable={false} />
                  )}

                  {selected && !isEditing && (
                    <>
                      <div
                        className={`${s.handle} ${s.tl}`}
                        onMouseDown={(e) => startResize(e, el.id, "tl")}
                      />
                      <div
                        className={`${s.handle} ${s.tr}`}
                        onMouseDown={(e) => startResize(e, el.id, "tr")}
                      />
                      <div
                        className={`${s.handle} ${s.bl}`}
                        onMouseDown={(e) => startResize(e, el.id, "bl")}
                      />
                      <div
                        className={`${s.handle} ${s.br}`}
                        onMouseDown={(e) => startResize(e, el.id, "br")}
                      />

                      {/* middle handles */}
                      <div
                        className={`${s.handle} ${s.tm}`}
                        onMouseDown={(e) => startResize(e, el.id, "tm")}
                      />
                      <div
                        className={`${s.handle} ${s.bm}`}
                        onMouseDown={(e) => startResize(e, el.id, "bm")}
                      />
                      <div
                        className={`${s.handle} ${s.ml}`}
                        onMouseDown={(e) => startResize(e, el.id, "ml")}
                      />
                      <div
                        className={`${s.handle} ${s.mr}`}
                        onMouseDown={(e) => startResize(e, el.id, "mr")}
                      />
                    </>
                  )}
                </div>
              );
            })}
          {textMenu && activeSlide ? (
            <div
              className={s.menuPopover}
              style={{ left: textMenu.x, top: textMenu.y }}
              onMouseDown={(e) => {
                const target = e.target as HTMLElement;
                const tag = target.tagName;
                const isFormControl =
                  tag === "INPUT" || tag === "SELECT" || tag === "OPTION" || tag === "TEXTAREA";
                suppressBlurRef.current = true;
                window.setTimeout(() => {
                  suppressBlurRef.current = false;
                }, 0);
                if (editingId && editingRich) {
                  captureSelection();
                }
                if (!isFormControl) {
                  e.preventDefault();
                }
                e.stopPropagation();
              }}
            >
              {(() => {
                const el = activeSlide.elements.find(
                  (item) => item.id === textMenu.elId && item.kind === "text",
                );
                if (!el || el.kind !== "text") return null;
                return (
                  <TextContextMenu
                    color={el.backgroundColor ?? "#ffffff"}
                    textColor={el.color}
                    fontSize={el.fontSize}
                    fontFamily={el.fontFamily}
                    borderColor={el.borderColor ?? "#111"}
                    borderWidth={el.borderWidth ?? 0}
                    onChange={(color) => {
                      dispatch(
                        updateTextBackground({
                          slideId: activeSlide.id,
                          elId: el.id,
                          backgroundColor: color === "#ffffff" ? null : color,
                        }),
                      );
                    }}
                    onTextColorChange={(color) =>
                      dispatch(updateTextColor({ slideId: activeSlide.id, elId: el.id, color }))
                    }
                    onBorderColorChange={(color) =>
                      dispatch(
                        updateTextBorder({
                          slideId: activeSlide.id,
                          elId: el.id,
                          borderColor: color,
                        }),
                      )
                    }
                    onBorderWidthChange={(width) =>
                      dispatch(
                        updateTextBorder({
                          slideId: activeSlide.id,
                          elId: el.id,
                          borderWidth: width,
                        }),
                      )
                    }
                    onClear={() =>
                      dispatch(
                        updateTextBackground({
                          slideId: activeSlide.id,
                          elId: el.id,
                          backgroundColor: null,
                        }),
                      )
                    }
                    onFontSizeChange={(size) => {
                      if (editingId === el.id && editingRich && applyRichFontSize(size)) return;
                      dispatch(
                        updateTextFontSize({
                          slideId: activeSlide.id,
                          elId: el.id,
                          fontSize: size,
                        }),
                      );
                    }}
                    onFontFamilyChange={(family) =>
                      dispatch(
                        updateTextFontFamily({
                          slideId: activeSlide.id,
                          elId: el.id,
                          fontFamily: family,
                        }),
                      )
                    }
                    onTextAlignChange={(align) =>
                      dispatch(
                        updateTextAlign({
                          slideId: activeSlide.id,
                          elId: el.id,
                          textAlign: align,
                        }),
                      )
                    }
                    onToggleBold={() => {
                      if (editingId === el.id && editingRich && applyRichCommand("bold")) return;
                      dispatch(
                        updateTextStyle({
                          slideId: activeSlide.id,
                          elId: el.id,
                          bold: !el.bold,
                        }),
                      );
                    }}
                    onToggleItalic={() => {
                      if (editingId === el.id && editingRich && applyRichCommand("italic")) return;
                      dispatch(
                        updateTextStyle({
                          slideId: activeSlide.id,
                          elId: el.id,
                          italic: !el.italic,
                        }),
                      );
                    }}
                    onToggleUnderline={() => {
                      if (editingId === el.id && editingRich && applyRichCommand("underline"))
                        return;
                      dispatch(
                        updateTextStyle({
                          slideId: activeSlide.id,
                          elId: el.id,
                          underline: !el.underline,
                        }),
                      );
                    }}
                  />
                );
              })()}
            </div>
          ) : null}
          {imageMenu && activeSlide ? (
            <div
              className={s.menuPopover}
              style={{ left: imageMenu.x, top: imageMenu.y }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {(() => {
                const el = activeSlide.elements.find(
                  (item) => item.id === imageMenu.elId && item.kind === "image",
                );
                if (!el || el.kind !== "image") return null;
                return (
                  <ImageContextMenu
                    onReplace={(file) => {
                      onReplaceImageFile(el.id, file);
                      setImageMenu(null);
                    }}
                  />
                );
              })()}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
