import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Ajv from "ajv";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import type { Models } from "appwrite";
import type { Presentation } from "../types";
import { cloneElement, makeSlide, uid } from "../types";
import {
  addImage,
  addSlide,
  addSlideFromTemplate,
  addText,
  alignElements,
  updateImageSrc,
  duplicateElements,
  loadPresentation,
  pasteElements,
  removeElement,
  removeSlide,
  setSlideBackground,
  undo,
  redo,
  selectPresentation,
  selectSlide,
} from "../store";
import {
  appwriteConfigured,
  ID,
  databases,
  storage,
  databaseId,
  presentationsCollectionId,
  bucketId,
  Permission,
  Role,
} from "../appwrite";
import { presentationSchema } from "../appwrite/schemas/presentationSchema";
import DashboardPage from "../appwrite/components/DashboardPage";
import EditorPage from "./EditorPage";
import PlayerPage from "./PlayerPage";
import { usePresentationList } from "../appwrite/hooks/usePresentationList";
import { useAutoSave } from "../appwrite/hooks/useAutoSave";
import { usePlayerControls } from "../hooks/usePlayerControls";
import { useEditorHotkeys } from "../hooks/useEditorHotkeys";
import { useAuthContext } from "../appwrite/auth/AuthContext";
import { useI18n } from "../translations";
import { downloadPresentationJson } from "../export/downloadPresentationJson";
import { openPdfExport } from "../export/openPdfExport";
import { parsePresentationJson, prepareImportedPresentation } from "../import/parsePresentationJson";

const ajv = new Ajv({ allErrors: true, strict: false });
const validatePresentation = ajv.compile(presentationSchema);
const SLIDE_WIDTH = 1200;
const SLIDE_HEIGHT = 675;

export default function ProtectedRoutes() {
  const { t, lang } = useI18n();
  const presentation = useSelector(selectPresentation);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, authReady, authBusy, authError, handleLogout } = useAuthContext();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [newTitle, setNewTitle] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePresentationId, setActivePresentationId] = useState<string | null>(null);
  const [dashboardSelectedId, setDashboardSelectedId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const playerStageRef = useRef<HTMLDivElement | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const lastSavedRef = useRef<string>("");
  const modalModeRef = useRef<"create" | "rename">("create");
  const renameTargetRef = useRef<string | null>(null);
  const loadingPresentationRef = useRef<string | null>(null);
  const lastRouteLoadRef = useRef<string | null>(null);

  const isDashboard = location.pathname === "/dashboard";
  const isEditor = location.pathname.startsWith("/editor");
  const isPlayer = location.pathname.startsWith("/player");
  const routeMatch = location.pathname.match(/^\/(?:editor|player)\/([^/]+)$/);
  const routePresentationId = routeMatch ? routeMatch[1] : null;
  const currentPresentationId = activePresentationId || presentation.id || null;
  const effectivePresentationId = routePresentationId || currentPresentationId || null;
  const hasPresentation = Boolean(currentPresentationId || routePresentationId);
  const storedPresentationId = typeof window !== "undefined" ? localStorage.getItem("presentationId") : null;
  const editorRoute = effectivePresentationId ? `/editor/${effectivePresentationId}` : "/editor";
  const playerRoute = effectivePresentationId ? `/player/${effectivePresentationId}` : "/player";

  const activeSlide = useMemo(() => {
    const id = presentation.selection.slideId;
    return id ? presentation.slides.find((s) => s.id === id) ?? null : null;
  }, [presentation]);

  const selectedIds = presentation.selection.elementIds;
  const appwriteDataConfigured = Boolean(databaseId && presentationsCollectionId && bucketId);
  const {
    presentations,
    setPresentations,
    listLoading,
    listError,
    setListError,
  } = usePresentationList({
    user,
    isDashboard,
    appwriteConfigured,
    appwriteDataConfigured,
    databases,
    databaseId,
    presentationsCollectionId,
  });
  useEffect(() => {
    if (!dashboardSelectedId) return;
    if (presentations.some((item) => item.id === dashboardSelectedId)) return;
    setDashboardSelectedId(null);
  }, [presentations, dashboardSelectedId]);
  const getUserPermissions = useCallback(
    (currentUser: Models.User<Models.Preferences>) => [
      Permission.read(Role.user(currentUser.$id)),
      Permission.write(Role.user(currentUser.$id)),
    ],
    []
  );
  const { playerIndex, setPlayerIndex, playerScale } = usePlayerControls({
    isPlayer,
    slides: presentation.slides,
    selectionSlideId: presentation.selection.slideId ?? null,
    slideWidth: SLIDE_WIDTH,
    slideHeight: SLIDE_HEIGHT,
    onExit: () => navigate(editorRoute),
  });
  useAutoSave({
    user,
    presentation,
    isEditor,
    appwriteConfigured,
    appwriteDataConfigured,
    databases,
    databaseId,
    presentationsCollectionId,
    getUserPermissions,
    setSaveStatus,
    setSaveError,
    saveTimeoutRef,
    lastSavedRef,
  });

  function onAddSlide() {
    dispatch(addSlide());
  }

  function onAddSlideFromTemplate(templateId: string) {
    dispatch(addSlideFromTemplate({ templateId }));
  }

  function onDeleteSlide() {
    if (!activeSlide) return;
    if (activeSlide.elements.length) {
      const ok = window.confirm(
        `Delete slide "${activeSlide.name ?? "Slide"}" with ${activeSlide.elements.length} elements?`
      );
      if (!ok) return;
    }
    dispatch(removeSlide());
  }

  function onAddText() {
    if (!activeSlide) return;
    dispatch(addText({ slideId: activeSlide.id, text: "Title" }));
  }

  function onExportPdf() {
    openPdfExport(presentation, SLIDE_WIDTH, SLIDE_HEIGHT);
  }

  function onExportJson() {
    downloadPresentationJson(presentation);
  }

  async function getPresentationForExport(id: string) {
    if (!appwriteConfigured || !appwriteDataConfigured) {
      setListError(t("dashboard.notConfigured"));
      return null;
    }
    try {
      const doc = await databases.getDocument(databaseId!, presentationsCollectionId!, id);
      const raw = (doc as { data?: string }).data;
      if (typeof raw !== "string") {
        setListError("Saved presentation is missing data.");
        return null;
      }
      const result = parsePresentationJson(raw, lang);
      if (!result.ok) {
        setListError(result.error);
        return null;
      }
      if (result.presentation.ownerId && result.presentation.ownerId !== user?.$id) {
        setListError("You are not authorized to open this presentation.");
        return null;
      }
      return result.presentation;
    } catch (err) {
      setListError(getErrorMessage(err));
      return null;
    }
  }

  async function onDashboardExportPdf() {
    if (!dashboardSelectedId) return;
    const pres = await getPresentationForExport(dashboardSelectedId);
    if (!pres) return;
    openPdfExport(pres, SLIDE_WIDTH, SLIDE_HEIGHT);
  }

  async function onDashboardExportJson() {
    if (!dashboardSelectedId) return;
    const pres = await getPresentationForExport(dashboardSelectedId);
    if (!pres) return;
    downloadPresentationJson(pres);
  }

  async function onImportJsonFile(file: File) {
    const content = await file.text();
    const result = parsePresentationJson(content, lang);
    if (!result.ok) {
      setSaveError(result.error);
      return;
    }
    const fallbackTitle = file.name.replace(/\.json$/i, "");
    const imported = prepareImportedPresentation(result.presentation, fallbackTitle);
    if (user) {
      imported.ownerId = user.$id;
    }
    setSaveError(null);
    lastSavedRef.current = "";
    setActivePresentationId(imported.id);
    if (typeof window !== "undefined") {
      localStorage.setItem("presentationId", imported.id);
    }
    dispatch(loadPresentation(imported));
    navigate(`/editor/${imported.id}`);
  }

  async function uploadImage(file: File): Promise<string | null> {
    if (!user) {
      setSaveError(t("upload.signIn"));
      return null;
    }
    if (!appwriteDataConfigured) {
      setSaveError(t("upload.notConfigured"));
      return null;
    }
    setSaveError(null);
    try {
      const permissions = getUserPermissions(user);
      const created = await storage.createFile(bucketId!, ID.unique(), file, permissions);
      const src = storage.getFileView(bucketId!, created.$id);
      return String(src);
    } catch (err) {
      setSaveError(getErrorMessage(err));
      return null;
    }
  }

  function getSelectedImageId() {
    if (!activeSlide) return null;
    for (const id of selectedIds) {
      const el = activeSlide.elements.find((item) => item.id === id && item.kind === "image");
      if (el) return el.id;
    }
    return null;
  }

  async function onAddImage(file: File) {
    if (!activeSlide) return;
    const srcString = await uploadImage(file);
    if (!srcString) return;
    const size = await new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, SLIDE_WIDTH / img.naturalWidth, SLIDE_HEIGHT / img.naturalHeight);
        resolve({
          width: Math.round(img.naturalWidth * scale),
          height: Math.round(img.naturalHeight * scale),
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ width: 320, height: 220 });
      };
      img.src = url;
    });
    const position = {
      x: Math.max(0, Math.round((SLIDE_WIDTH - size.width) / 2)),
      y: Math.max(0, Math.round((SLIDE_HEIGHT - size.height) / 2)),
    };
    dispatch(addImage({ slideId: activeSlide.id, src: srcString, size, position }));
  }


  function onDeleteElement() {
    if (!activeSlide || selectedIds.length === 0) return;
    const idsToRemove = [...selectedIds];
    idsToRemove.forEach((id) => {
      dispatch(removeElement({ slideId: activeSlide.id, elId: id }));
    });
  }

  function getSelectedElements() {
    if (!activeSlide) return [];
    const set = new Set(selectedIds);
    return activeSlide.elements.filter((el) => set.has(el.id)).map(cloneElement);
  }

  function onSetBgColor(c: string) {
    if (!activeSlide) return;
    dispatch(setSlideBackground({ slideId: activeSlide.id, bg: { kind: "color", value: c } }));
  }

  function onSetBgNone() {
    if (!activeSlide) return;
    dispatch(setSlideBackground({ slideId: activeSlide.id, bg: { kind: "none" } }));
  }

  function onAlignElements(axis: "x" | "y", mode: "start" | "center" | "end") {
    if (!activeSlide) return;
    if (presentation.selection.elementIds.length === 0) return;
    dispatch(
      alignElements({
        slideId: activeSlide.id,
        elementIds: presentation.selection.elementIds,
        axis,
        mode,
        relativeTo: "slide",
      }),
    );
  }

  async function onSetBgImage(file: File) {
    if (!activeSlide) return;
    const srcString = await uploadImage(file);
    if (!srcString) return;
    dispatch(setSlideBackground({ slideId: activeSlide.id, bg: { kind: "image", src: srcString } }));
  }

  useEffect(() => {
    if (!user) {
      setSaveStatus("idle");
      setSaveError(null);
      lastSavedRef.current = "";
      setActivePresentationId(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("presentationId");
      }
    }
  }, [user]);

  useEffect(() => {
    if (!routePresentationId) return;
    if (!user || !appwriteConfigured || !appwriteDataConfigured) return;
    if (routePresentationId === currentPresentationId) return;
    if (loadingPresentationRef.current === routePresentationId) return;
    if (lastRouteLoadRef.current === routePresentationId) return;
    lastRouteLoadRef.current = routePresentationId;
    setRestoring(true);
    const load = async () => {
      await openPresentation(routePresentationId);
      setRestoring(false);
    };
    void load();
  }, [
    routePresentationId,
    user,
    appwriteConfigured,
    appwriteDataConfigured,
    currentPresentationId,
  ]);

  useEffect(() => {
    if (!user || !appwriteConfigured || !appwriteDataConfigured) return;
    if (!isEditor && !isPlayer) return;
    if (routePresentationId) return;
    if (activePresentationId) return;
    if (!storedPresentationId) return;
    let cancelled = false;
    setRestoring(true);
    const restore = async () => {
      await openPresentation(storedPresentationId);
      if (!cancelled) setRestoring(false);
    };
    void restore();
    return () => {
      cancelled = true;
    };
  }, [
    user,
    appwriteConfigured,
    appwriteDataConfigured,
    isEditor,
    isPlayer,
    activePresentationId,
    storedPresentationId,
  ]);

  useEffect(() => {
    if (!user) return;
    if (!isEditor && !isPlayer) return;
    if (activePresentationId) return;
    if (!presentation.id) return;
    setActivePresentationId(presentation.id);
  }, [user, isEditor, isPlayer, activePresentationId, presentation.id]);

  useEffect(() => {
    if (!user) return;
    function onKey(e: KeyboardEvent) {
      const code = e.code.toLowerCase();
      const modifier = e.ctrlKey || e.metaKey; // добавил поддержку Cmd на Mac
      const isUndo = modifier && code === "keyz" && !e.shiftKey;
      const isRedo = modifier && (code === "keyy" || (code === "keyz" && e.shiftKey));
      if (isUndo) {
        e.preventDefault();
        dispatch(undo());
      } else if (isRedo) {
        e.preventDefault();
        dispatch(redo());
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch, user]);

  function getErrorMessage(err: unknown) {
    if (err && typeof err === "object" && "message" in err) {
      return String((err as { message?: unknown }).message ?? "Unknown error");
    }
    return "Unknown error";
  }

  useEditorHotkeys({
    isEditor,
    slides: presentation.slides,
    activeSlideId: activeSlide?.id ?? null,
    selectedElementIds: selectedIds,
    getSelectedElements,
    onSelectSlide: (id) => dispatch(selectSlide(id)),
    onDeleteElements: onDeleteElement,
    onDeleteSlide: onDeleteSlide,
    onDuplicateElements: () => {
      if (!activeSlide || !selectedIds.length) return;
      dispatch(duplicateElements({ slideId: activeSlide.id, elementIds: selectedIds }));
    },
    onPasteElements: (elements) => {
      if (!activeSlide || !elements.length) return;
      dispatch(pasteElements({ slideId: activeSlide.id, elements }));
    },
  });

  function getDefaultTitle() {
    const base = "Presentation";
    let max = 0;
    presentations.forEach((item) => {
      const match = new RegExp(`^${base} (\\d+)$`).exec(item.title);
      if (match) {
        const num = Number(match[1]);
        if (!Number.isNaN(num)) max = Math.max(max, num);
      }
    });
    return `${base} ${max + 1}`;
  }

  function makeNewPresentation(title: string): Presentation {
    const slide = makeSlide("Slide");
    return {
      id: uid(),
      title,
      ownerId: user?.$id,
      slides: [slide],
      selection: { slideId: slide.id, elementIds: [] },
    };
  }

  async function openPresentation(id: string) {
    if (!appwriteConfigured || !appwriteDataConfigured) return;
    setSaveError(null);
    try {
      loadingPresentationRef.current = id;
      const doc = await databases.getDocument(databaseId!, presentationsCollectionId!, id);
      const raw = (doc as { data?: string }).data;
      if (typeof raw !== "string") {
        setSaveError("Saved presentation is missing data.");
        return;
      }
      let parsed: Presentation;
      try {
        parsed = JSON.parse(raw) as Presentation;
      } catch {
        setSaveError("Saved presentation is not valid JSON.");
        return;
      }
      if (!validatePresentation(parsed)) {
        setSaveError("Saved presentation failed validation.");
        return;
      }
      if (parsed.ownerId && parsed.ownerId !== user?.$id) {
        setSaveError("You are not authorized to open this presentation.");
        return;
      }
      if (!parsed.ownerId && user) {
        parsed.ownerId = user.$id;
      }
      parsed.id = doc.$id;
      lastSavedRef.current = "";
      setActivePresentationId(doc.$id);
      if (typeof window !== "undefined") {
        localStorage.setItem("presentationId", doc.$id);
      }
      dispatch(loadPresentation(parsed));
      if (!isEditor && !isPlayer) {
        navigate(`/editor/${doc.$id}`);
      }
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      if (loadingPresentationRef.current === id) {
        loadingPresentationRef.current = null;
      }
    }
  }

  function openCreateModal() {
    modalModeRef.current = "create";
    renameTargetRef.current = null;
    setNewTitle("");
    setIsModalOpen(true);
  }

  function openRenameModal(id: string, currentTitle: string) {
    modalModeRef.current = "rename";
    renameTargetRef.current = id;
    setNewTitle(currentTitle);
    setIsModalOpen(true);
  }

  function closeModal() {
    setNewTitle("");
    renameTargetRef.current = null;
    setIsModalOpen(false);
  }

  async function handleCreate() {
    const title = newTitle.trim() || getDefaultTitle();
    const next = makeNewPresentation(title);
    lastSavedRef.current = "";
    setActivePresentationId(next.id);
    if (typeof window !== "undefined") {
      localStorage.setItem("presentationId", next.id);
    }
    dispatch(loadPresentation(next));
    navigate(`/editor/${next.id}`);
    closeModal();
  }

  async function handleRename() {
    if (!appwriteConfigured || !appwriteDataConfigured) return;
    const id = renameTargetRef.current;
    if (!id) return;
    const title = newTitle.trim();
    if (!title) return;
    setListError(null);
    try {
      const doc = await databases.getDocument(databaseId!, presentationsCollectionId!, id);
      const raw = (doc as { data?: string }).data;
      if (typeof raw !== "string") {
        setListError("Saved presentation is missing data.");
        return;
      }
      let parsed: Presentation;
      try {
        parsed = JSON.parse(raw) as Presentation;
      } catch {
        setListError("Saved presentation is not valid JSON.");
        return;
      }
      if (!parsed.ownerId && user) {
        parsed.ownerId = user.$id;
      }
      parsed.id = doc.$id;
      parsed.title = title;
      const payload = JSON.stringify(parsed);
      await databases.updateDocument(databaseId!, presentationsCollectionId!, id, { data: payload });
      setPresentations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, title } : item))
      );
      closeModal();
    } catch (err) {
      setListError(getErrorMessage(err));
    }
  }

  async function handleDelete(id: string) {
    if (!appwriteConfigured || !appwriteDataConfigured) return;
    setListError(null);
    try {
      await databases.deleteDocument(databaseId!, presentationsCollectionId!, id);
      setPresentations((prev) => prev.filter((item) => item.id !== id));
      if (activePresentationId === id) {
        setActivePresentationId(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("presentationId");
        }
      }
    } catch (err) {
      setListError(getErrorMessage(err));
    }
  }

  function formatUpdatedAt(value: string) {
    try {
      return new Date(value).toLocaleString("ru-RU");
    } catch {
      return value;
    }
  }

  if (!appwriteConfigured) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">{t("auth.notConfigured.title")}</h1>
          <p className="auth-note">
            {t("auth.notConfigured.note")}
          </p>
        </div>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">{t("auth.loadingSession")}</h1>
        </div>
      </div>
    );
  }

  const dashboardView = (
    <DashboardPage
      user={user}
      appwriteDataConfigured={appwriteDataConfigured}
      listLoading={listLoading}
      listError={listError}
      presentations={presentations}
      authBusy={authBusy}
      isModalOpen={isModalOpen}
      modalMode={modalModeRef.current}
      newTitle={newTitle}
      placeholderTitle={getDefaultTitle()}
      onNewTitleChange={setNewTitle}
      onCloseModal={closeModal}
      onCreate={handleCreate}
      onRename={handleRename}
      onLogout={handleLogout}
      onOpenCreate={openCreateModal}
      onExportPdf={onDashboardExportPdf}
      onExportJson={onDashboardExportJson}
      onImportJsonFile={onImportJsonFile}
      selectedPresentationId={dashboardSelectedId}
      onSelectPresentation={setDashboardSelectedId}
      onOpenPresentation={openPresentation}
      onOpenRename={openRenameModal}
      onDelete={handleDelete}
      formatUpdatedAt={formatUpdatedAt}
    />
  );

  const editorView = (
    <EditorPage
      userEmail={user?.email ?? null}
      appwriteDataConfigured={appwriteDataConfigured}
      saveStatus={saveStatus}
      saveError={saveError}
      authError={authError}
      authBusy={authBusy}
      onDashboard={() => navigate("/dashboard")}
      onLogout={handleLogout}
      onUndo={() => dispatch(undo())}
      onRedo={() => dispatch(redo())}
      onAddSlide={onAddSlide}
      onAddSlideFromTemplate={onAddSlideFromTemplate}
      onAddText={onAddText}
      onAddImageFile={onAddImage}
      onSetBgImageFile={onSetBgImage}
      onAlignElements={onAlignElements}
      onDeleteAny={() => {
        if (presentation.selection.elementIds.length > 0) {
          onDeleteElement();
        } else {
          onDeleteSlide();
        }
      }}
      onSetBgColor={onSetBgColor}
      onSetBgNone={onSetBgNone}
      onOpenPlayer={() => navigate(playerRoute)}
    />
  );

  const totalSlides = presentation.slides.length;
  const currentSlide = presentation.slides[playerIndex] ?? null;
  const playerView = (
    <PlayerPage
      currentSlide={currentSlide}
      playerIndex={playerIndex}
      totalSlides={totalSlides}
      playerScale={playerScale}
      stageRef={playerStageRef}
      onBack={() => navigate(editorRoute)}
      onPrev={() => setPlayerIndex((prev) => Math.max(0, prev - 1))}
      onNext={() => setPlayerIndex((prev) => Math.min(totalSlides - 1, prev + 1))}
    />
  );

  if (restoring && (isEditor || isPlayer)) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">{t("routes.loadingPresentation")}</h1>
        </div>
      </div>
    );
  }

  const editorElement = user ? (
    hasPresentation ? (
      editorView
    ) : (
      <Navigate to="/dashboard" replace />
    )
  ) : (
    <Navigate to="/login" replace />
  );
  const playerElement = user ? (
    hasPresentation ? (
      playerView
    ) : (
      <Navigate to="/dashboard" replace />
    )
  ) : (
    <Navigate to="/login" replace />
  );

  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route path="/dashboard" element={user ? dashboardView : <Navigate to="/login" replace />} />
      <Route path="/editor" element={editorElement} />
      <Route path="/editor/:id" element={editorElement} />
      <Route path="/player" element={playerElement} />
      <Route path="/player/:id" element={playerElement} />
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}


