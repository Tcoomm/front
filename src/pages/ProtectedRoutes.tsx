import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Ajv from "ajv";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import type { Models } from "appwrite";
import type { Presentation } from "../types";
import { makeSlide, uid } from "../types";
import {
  addImage,
  addSlide,
  addText,
  loadPresentation,
  removeElement,
  removeSlide,
  setSlideBackground,
  undo,
  redo,
  selectPresentation,
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
import TitleBar from "../components/TitleBar/TitleBar";
import SlideList from "../components/SlideList/SlideList";
import Workspace from "../components/Workspace/Workspace";
import Toolbar from "../components/Toolbar/Toolbar";
import DashboardPage from "../appwrite/components/DashboardPage";
import { usePresentationList } from "../appwrite/hooks/usePresentationList";
import { useAutoSave } from "../appwrite/hooks/useAutoSave";
import { usePlayerControls } from "../hooks/usePlayerControls";
import { useAuthContext } from "../appwrite/auth/AuthContext";

const ajv = new Ajv({ allErrors: true, strict: false });
const validatePresentation = ajv.compile(presentationSchema);
const SLIDE_WIDTH = 1200;
const SLIDE_HEIGHT = 675;

export default function ProtectedRoutes() {
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

  function onDeleteSlide() {
    dispatch(removeSlide());
  }

  function onAddText() {
    if (!activeSlide) return;
    dispatch(addText({ slideId: activeSlide.id, text: "Title" }));
  }

  async function onAddImage(file: File) {
    if (!activeSlide) return;
    if (!user) {
      setSaveError("Sign in to upload images.");
      return;
    }
    if (!appwriteDataConfigured) {
      setSaveError("Appwrite storage is not configured.");
      return;
    }
    setSaveError(null);
    try {
      const permissions = getUserPermissions(user);
      const created = await storage.createFile(bucketId!, ID.unique(), file, permissions);
      const src = storage.getFileView(bucketId!, created.$id);
      const srcString = String(src);
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
    } catch (err) {
      setSaveError(getErrorMessage(err));
    }
  }

  function onDeleteElement() {
    if (!activeSlide || selectedIds.length === 0) return;
    const idsToRemove = [...selectedIds];
    idsToRemove.forEach((id) => {
      dispatch(removeElement({ slideId: activeSlide.id, elId: id }));
    });
  }

  function onSetBgColor(c: string) {
    if (!activeSlide) return;
    dispatch(setSlideBackground({ slideId: activeSlide.id, bg: { kind: "color", value: c } }));
  }

  function onSetBgNone() {
    if (!activeSlide) return;
    dispatch(setSlideBackground({ slideId: activeSlide.id, bg: { kind: "none" } }));
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
      const code = e.code.toLowerCase(); // layout-agnostic (KeyZ/KeyY)
      const modifier = e.ctrlKey || e.metaKey;
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

  useEffect(() => {
    if (!isEditor) return;
    function onDeleteKey(e: KeyboardEvent) {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (presentation.selection.elementIds.length === 0) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      e.preventDefault();
      onDeleteElement();
    }
    window.addEventListener("keydown", onDeleteKey);
    return () => window.removeEventListener("keydown", onDeleteKey);
  }, [isEditor, presentation.selection.elementIds.length]);

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
          <h1 className="auth-title">Appwrite is not configured</h1>
          <p className="auth-note">
            Set <code>VITE_APPWRITE_ENDPOINT</code> and <code>VITE_APPWRITE_PROJECT_ID</code> in your env.
          </p>
        </div>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Loading session...</h1>
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
      onOpenPresentation={openPresentation}
      onOpenRename={openRenameModal}
      onDelete={handleDelete}
      formatUpdatedAt={formatUpdatedAt}
    />
  );

  const editorView = (
    <div className="page">
      <div className="editor-topbar">
        <div className="editor-title">
          <TitleBar />
        </div>
        <div className="editor-controls">
          <Toolbar
            onUndo={() => dispatch(undo())}
            onRedo={() => dispatch(redo())}
            onAddSlide={onAddSlide}
            onDeleteSlide={onDeleteSlide}
            onAddText={onAddText}
            onAddImageFile={onAddImage}
            onDeleteSelected={onDeleteElement}
            onSetBgColor={onSetBgColor}
            onSetBgNone={onSetBgNone}
            onOpenPlayer={() => navigate(playerRoute)}
          />
        </div>
      </div>
      <div className="auth-status editor-status">
        <span>Signed in as {user?.email}</span>
        <button className="auth-ghost" onClick={() => navigate("/dashboard")}>
          Dashboard
        </button>

        {appwriteDataConfigured ? (
          saveStatus === "saving" ? (
            <span>Saving...</span>
          ) : saveStatus === "saved" ? (
            <span>Saved</span>
          ) : null
        ) : (
          <span className="auth-error-inline">Appwrite DB/Storage is not configured.</span>
        )}
        <button className="auth-ghost" onClick={handleLogout} disabled={authBusy}>
          Sign out
        </button>
        {saveError ? <span className="auth-error-inline">{saveError}</span> : null}
        {authError ? <span className="auth-error-inline">{authError}</span> : null}
      </div>

      <div className="grid editor-grid">
        <SlideList />

        <Workspace />
      </div>
    </div>
  );

  const totalSlides = presentation.slides.length;
  const currentSlide = presentation.slides[playerIndex] ?? null;
  const playerBackground: React.CSSProperties = {};
  if (currentSlide?.background.kind === "color") {
    playerBackground.backgroundColor = currentSlide.background.value;
  } else if (currentSlide?.background.kind === "image") {
    playerBackground.backgroundImage = `url(${currentSlide.background.src})`;
    playerBackground.backgroundSize = "cover";
    playerBackground.backgroundPosition = "center";
  }

  const playerView = (
    <div className="player-page">
      <div className="player-top">
        <div className="player-actions">
          <span className="player-counter">
            {Math.min(playerIndex + 1, totalSlides)}/{totalSlides || 1}
          </span>
          <button className="player-btn" onClick={() => navigate(editorRoute)}>
            Back to editor
          </button>
        </div>
      </div>
      <div className="player-stage" ref={playerStageRef}>
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
        <button
          className="player-btn"
          onClick={() => setPlayerIndex((prev) => Math.max(0, prev - 1))}
          disabled={playerIndex <= 0}
        >
          Prev
        </button>
        <button
          className="player-btn-primary"
          onClick={() => setPlayerIndex((prev) => Math.min(totalSlides - 1, prev + 1))}
          disabled={playerIndex >= totalSlides - 1}
        >
          Next
        </button>
      </div>
    </div>
  );

  if (restoring && (isEditor || isPlayer)) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-title">Loading presentation...</h1>
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
