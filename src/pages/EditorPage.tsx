import React from "react";
import TitleBar from "../components/TitleBar/TitleBar";
import SlideList from "../components/SlideList/SlideList";
import Workspace from "../components/Workspace/Workspace";
import Toolbar from "../components/Toolbar/Toolbar";

type EditorPageProps = {
  userEmail?: string | null;
  appwriteDataConfigured: boolean;
  saveStatus: "idle" | "saving" | "saved";
  saveError: string | null;
  authError: string | null;
  authBusy: boolean;
  onDashboard: () => void;
  onLogout: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddSlide: () => void;
  onDeleteSlide: () => void;
  onAddText: () => void;
  onAddImageFile: (file: File) => void;
  onDeleteSelected: () => void;
  onSetBgColor: (c: string) => void;
  onSetBgNone: () => void;
  onOpenPlayer: () => void;
};

export default function EditorPage({
  userEmail,
  appwriteDataConfigured,
  saveStatus,
  saveError,
  authError,
  authBusy,
  onDashboard,
  onLogout,
  onUndo,
  onRedo,
  onAddSlide,
  onDeleteSlide,
  onAddText,
  onAddImageFile,
  onDeleteSelected,
  onSetBgColor,
  onSetBgNone,
  onOpenPlayer,
}: EditorPageProps) {
  return (
    <div className="page">
      <div className="editor-topbar">
        <div className="editor-title">
          <TitleBar />
        </div>
        <div className="editor-controls">
          <Toolbar
            onUndo={onUndo}
            onRedo={onRedo}
            onAddSlide={onAddSlide}
            onDeleteSlide={onDeleteSlide}
            onAddText={onAddText}
            onAddImageFile={onAddImageFile}
            onDeleteSelected={onDeleteSelected}
            onSetBgColor={onSetBgColor}
            onSetBgNone={onSetBgNone}
            onOpenPlayer={onOpenPlayer}
          />
        </div>
      </div>
      <div className="auth-status editor-status">
        <span>Signed in as {userEmail}</span>
        <button className="auth-ghost" onClick={onDashboard}>
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
        <button className="auth-ghost" onClick={onLogout} disabled={authBusy}>
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
}
