import { useEffect } from "react";
import type { MutableRefObject } from "react";
import type { Models } from "appwrite";
import type { Presentation } from "../../types";

type UseAutoSaveOptions = {
  user: Models.User<Models.Preferences> | null;
  presentation: Presentation;
  isEditor: boolean;
  appwriteConfigured: boolean;
  appwriteDataConfigured: boolean;
  databases: import("appwrite").Databases;
  databaseId: string | undefined;
  presentationsCollectionId: string | undefined;
  getUserPermissions: (currentUser: Models.User<Models.Preferences>) => string[];
  setSaveStatus: (status: "idle" | "saving" | "saved") => void;
  setSaveError: (message: string | null) => void;
  saveTimeoutRef: MutableRefObject<number | null>;
  lastSavedRef: MutableRefObject<string>;
};

function getErrorMessage(err: unknown) {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: unknown }).message ?? "Unknown error");
  }
  return "Unknown error";
}

function isNotFound(err: unknown) {
  if (!err || typeof err !== "object" || !("code" in err)) return false;
  return Number((err as { code?: unknown }).code) === 404;
}

export function useAutoSave({
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
}: UseAutoSaveOptions) {
  useEffect(() => {
    if (!user || !appwriteConfigured || !appwriteDataConfigured) return;
    if (!isEditor) return;
    const payload = JSON.stringify(presentation);
    if (payload === lastSavedRef.current) return;

    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    const presentationId = presentation.id;
    const permissions = getUserPermissions(user);

    saveTimeoutRef.current = window.setTimeout(() => {
      const persist = async () => {
        setSaveStatus("saving");
        setSaveError(null);
        try {
          try {
            await databases.updateDocument(databaseId!, presentationsCollectionId!, presentationId, {
              data: payload,
            });
          } catch (err) {
            if (isNotFound(err)) {
              await databases.createDocument(
                databaseId!,
                presentationsCollectionId!,
                presentationId,
                { data: payload },
                permissions
              );
            } else {
              throw err;
            }
          }
          lastSavedRef.current = payload;
          setSaveStatus("saved");
        } catch (err) {
          setSaveStatus("idle");
          setSaveError(getErrorMessage(err));
        }
      };
      void persist();
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
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
  ]);
}
