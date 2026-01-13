import React from "react";
import { useI18n } from "../translations";
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
  onAddSlideFromTemplate: (templateId: string) => void;
  onAddText: () => void;
  onAddImageFile: (file: File) => void;
  onExportPdf: () => void;
  onExportJson: () => void;
  onImportJsonFile: (file: File) => void;
  onSetBgImageFile: (file: File) => void;
  onAlignElements: (axis: "x" | "y", mode: "start" | "center" | "end") => void;
  onDeleteAny: () => void;
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
  onAddSlideFromTemplate,
  onAddText,
  onAddImageFile,
  onExportPdf,
  onExportJson,
  onImportJsonFile,
  onSetBgImageFile,
  onAlignElements,
  onDeleteAny,
  onSetBgColor,
  onSetBgNone,
  onOpenPlayer,
}: EditorPageProps) {
  const { lang, setLang, t } = useI18n();
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
            onAddSlideFromTemplate={onAddSlideFromTemplate}
            onAddText={onAddText}
            onAddImageFile={onAddImageFile}
            onExportPdf={onExportPdf}
            onExportJson={onExportJson}
            onImportJsonFile={onImportJsonFile}
            onSetBgImageFile={onSetBgImageFile}
            onAlignElements={onAlignElements}
            onDeleteAny={onDeleteAny}
            onSetBgColor={onSetBgColor}
            onSetBgNone={onSetBgNone}
            onOpenPlayer={onOpenPlayer}
          />
        </div>
      </div>
      <div className="auth-status editor-status">
        <span>
          {t("editor.signedInAs")} {userEmail}
        </span>
        <button className="auth-ghost" onClick={onDashboard}>
          {t("editor.dashboard")}
        </button>
        <button
          className="auth-ghost"
          onClick={() => setLang(lang === "ru" ? "en" : "ru")}
        >
          {t("lang.toggle")}
        </button>

        {appwriteDataConfigured ? (
          saveStatus === "saving" ? (
            <span>{t("editor.saving")}</span>
          ) : saveStatus === "saved" ? (
            <span>{t("editor.saved")}</span>
          ) : null
        ) : (
          <span className="auth-error-inline">{t("editor.notConfigured")}</span>
        )}
        <button className="auth-ghost" onClick={onLogout} disabled={authBusy}>
          {t("editor.signOut")}
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


