import React from "react";
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
  return (
    <div className="dashboard-page">
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Your presentations</h1>
          <div className="dash-subtitle">Signed in as: {user?.email}</div>
        </div>
        <div className="dash-actions">
          <button className="dash-btn" onClick={onLogout} disabled={authBusy}>
            Sign out
          </button>
          <button className="dash-btn-primary" onClick={onOpenCreate}>
            New presentation
          </button>
        </div>
      </div>

      {!appwriteDataConfigured ? (
        <div className="dash-error">Appwrite DB/Storage is not configured.</div>
      ) : null}
      {listError ? <div className="dash-error">{listError}</div> : null}
      {listLoading ? <div className="dash-loading">Loading...</div> : null}

      {!listLoading && presentations.length === 0 ? (
        <div className="dash-empty">
          <div className="dash-empty-title">No presentations yet</div>
          <div className="dash-empty-note">Create a new presentation to get started.</div>
          <button className="dash-btn-primary" onClick={onOpenCreate}>
            Create presentation
          </button>
        </div>
      ) : (
        <div className="dash-grid">
          {presentations.map((item) => (
            <div className="dash-card" key={item.id}>
              <div className="dash-card-title">{item.title || "Untitled"}</div>
              <div className="dash-meta">Updated: {formatUpdatedAt(item.updatedAt)}</div>
              <div className="dash-card-actions">
                <button className="dash-btn" onClick={() => onOpenPresentation(item.id)}>
                  Open
                </button>
                <button className="dash-btn-ghost" onClick={() => onOpenRename(item.id, item.title)}>
                  Rename
                </button>
                <button className="dash-btn-danger" onClick={() => onDelete(item.id)}>
                  Delete
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
              {modalMode === "create" ? "Create presentation" : "Rename presentation"}
            </div>
            <label className="modal-row">
              <span>Title</span>
              <input
                className="modal-input"
                value={newTitle}
                onChange={(e) => onNewTitleChange(e.target.value)}
                placeholder={placeholderTitle}
              />
            </label>
            <div className="modal-actions">
              <button className="dash-btn" onClick={onCloseModal}>
                Cancel
              </button>
              {modalMode === "create" ? (
                <button className="dash-btn-primary" onClick={onCreate}>
                  Create
                </button>
              ) : (
                <button className="dash-btn-primary" onClick={onRename}>
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
