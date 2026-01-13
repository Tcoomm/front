import React from "react";
import { useI18n } from "../../translations";
import type { Models } from "appwrite";
import "../styles/dashboard.css";

type PresentationListItem = { id: string; title: string; updatedAt: string };

type DashboardPageProps = {
  user: Models.User<Models.Preferences> | null;
  appwriteDataConfigured: boolean;
  listLoading: boolean;
  listError: string | null;
  presentations: PresentationListItem[];
  authBusy: boolean;
  isModalOpen: boolean;
  modalMode: "create" | "rename";
  newTitle: string;
  placeholderTitle: string;
  selectedPresentationId: string | null;
  onNewTitleChange: (value: string) => void;
  onCloseModal: () => void;
  onCreate: () => void;
  onRename: () => void;
  onLogout: () => void;
  onOpenCreate: () => void;
  onExportPdf: () => void;
  onExportJson: () => void;
  onImportJsonFile: (file: File) => void;
  onSelectPresentation: (id: string) => void;
  onOpenPresentation: (id: string) => void;
  onOpenRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  formatUpdatedAt: (value: string) => string;
};

export default function DashboardPage({
  user,
  appwriteDataConfigured,
  listLoading,
  listError,
  presentations,
  authBusy,
  isModalOpen,
  modalMode,
  newTitle,
  placeholderTitle,
  selectedPresentationId,
  onNewTitleChange,
  onCloseModal,
  onCreate,
  onRename,
  onLogout,
  onOpenCreate,
  onExportPdf,
  onExportJson,
  onImportJsonFile,
  onSelectPresentation,
  onOpenPresentation,
  onOpenRename,
  onDelete,
  formatUpdatedAt,
}: DashboardPageProps) {
  const { t } = useI18n();
  const [exportOpen, setExportOpen] = React.useState(false);
  const [exportPos, setExportPos] = React.useState<{ left: number; top: number } | null>(null);
  const exportBtnRef = React.useRef<HTMLButtonElement | null>(null);
  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onImportJsonFile(file);
    e.target.value = "";
  }
  function toggleExportMenu() {
    setExportOpen((prev) => {
      const next = !prev;
      if (next && exportBtnRef.current) {
        const rect = exportBtnRef.current.getBoundingClientRect();
        setExportPos({ left: rect.left, top: rect.bottom + 6 });
      } else if (!next) {
        setExportPos(null);
      }
      return next;
    });
  }
  return (
    <div className="dashboard-page">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">{t("dashboard.title")}</h1>
          <div className="dash-subtitle">
            {t("dashboard.signedInAs")} {user?.email}
          </div>
        </div>
        <div className="dash-actions">
          <div className="dash-menu-wrap">
            <button
              className="dash-btn"
              ref={exportBtnRef}
              onClick={toggleExportMenu}
              disabled={!selectedPresentationId}
            >
              {t("toolbar.export")}
            </button>
            {exportOpen && exportPos && (
              <div
                className="dash-menu"
                style={{ left: exportPos.left, top: exportPos.top }}
                onMouseLeave={() => setExportOpen(false)}
              >
                <button
                  className="dash-menu-item"
                  onClick={() => {
                    onExportPdf();
                    setExportOpen(false);
                  }}
                >
                  {t("toolbar.export.pdf")}
                </button>
                <button
                  className="dash-menu-item"
                  onClick={() => {
                    onExportJson();
                    setExportOpen(false);
                  }}
                >
                  {t("toolbar.export.json")}
                </button>
              </div>
            )}
          </div>
          <label className="dash-btn dash-file-btn">
            <input
              className="dash-file-input"
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
            />
            {t("toolbar.import.json")}
          </label>
          <button className="dash-btn" onClick={onLogout} disabled={authBusy}>
            {t("dashboard.signOut")}
          </button>
          <button className="dash-btn-primary" onClick={onOpenCreate}>
            {t("dashboard.newPresentation")}
          </button>
        </div>
      </div>

      {!appwriteDataConfigured ? (
        <div className="dash-error">{t("dashboard.notConfigured")}</div>
      ) : null}
      {listError ? <div className="dash-error">{listError}</div> : null}
      {listLoading ? <div className="dash-loading">{t("dashboard.loading")}</div> : null}

      {!listLoading && presentations.length === 0 ? (
        <div className="dash-empty">
          <div className="dash-empty-title">{t("dashboard.empty.title")}</div>
          <div className="dash-empty-note">{t("dashboard.empty.note")}</div>
          <button className="dash-btn-primary" onClick={onOpenCreate}>
            {t("dashboard.empty.create")}
          </button>
        </div>
      ) : (
        <div className="dash-grid">
          {presentations.map((item) => (
            <div
              className={`dash-card ${selectedPresentationId === item.id ? "selected" : ""}`}
              key={item.id}
              onClick={() => onSelectPresentation(item.id)}
            >
              <div className="dash-card-title">{item.title || t("dashboard.untitled")}</div>
              <div className="dash-meta">
                {t("dashboard.updated")} {formatUpdatedAt(item.updatedAt)}
              </div>
              <div className="dash-card-actions">
                <button
                  className="dash-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPresentation(item.id);
                  }}
                >
                  {t("dashboard.open")}
                </button>
                <button
                  className="dash-btn-ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenRename(item.id, item.title);
                  }}
                >
                  {t("dashboard.rename")}
                </button>
                <button
                  className="dash-btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                >
                  {t("dashboard.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen ? (
        <div className="modal-backdrop" onClick={onCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              {modalMode === "create"
                ? t("dashboard.modal.createTitle")
                : t("dashboard.modal.renameTitle")}
            </div>
            <label className="modal-row">
              <span>{t("dashboard.modal.titleLabel")}</span>
              <input
                className="modal-input"
                value={newTitle}
                onChange={(e) => onNewTitleChange(e.target.value)}
                placeholder={placeholderTitle}
              />
            </label>
            <div className="modal-actions">
              <button className="dash-btn" onClick={onCloseModal}>
                {t("dashboard.modal.cancel")}
              </button>
              {modalMode === "create" ? (
                <button className="dash-btn-primary" onClick={onCreate}>
                  {t("dashboard.modal.create")}
                </button>
              ) : (
                <button className="dash-btn-primary" onClick={onRename}>
                  {t("dashboard.modal.save")}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


