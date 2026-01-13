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
  onNewTitleChange: (value: string) => void;
  onCloseModal: () => void;
  onCreate: () => void;
  onRename: () => void;
  onLogout: () => void;
  onOpenCreate: () => void;
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
  onNewTitleChange,
  onCloseModal,
  onCreate,
  onRename,
  onLogout,
  onOpenCreate,
  onOpenPresentation,
  onOpenRename,
  onDelete,
  formatUpdatedAt,
}: DashboardPageProps) {
  const { t } = useI18n();
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
            <div className="dash-card" key={item.id}>
              <div className="dash-card-title">{item.title || t("dashboard.untitled")}</div>
              <div className="dash-meta">
                {t("dashboard.updated")} {formatUpdatedAt(item.updatedAt)}
              </div>
              <div className="dash-card-actions">
                <button className="dash-btn" onClick={() => onOpenPresentation(item.id)}>
                  {t("dashboard.open")}
                </button>
                <button className="dash-btn-ghost" onClick={() => onOpenRename(item.id, item.title)}>
                  {t("dashboard.rename")}
                </button>
                <button className="dash-btn-danger" onClick={() => onDelete(item.id)}>
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


