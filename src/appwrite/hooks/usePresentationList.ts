import { useCallback, useEffect, useState } from "react";
import type { Models } from "appwrite";
import type { Presentation } from "../../types";
import { Query } from "../index";

type PresentationListItem = { id: string; title: string; updatedAt: string };

type UsePresentationListOptions = {
  user: Models.User<Models.Preferences> | null;
  isDashboard: boolean;
  appwriteConfigured: boolean;
  appwriteDataConfigured: boolean;
  databases: import("appwrite").Databases;
  databaseId: string | undefined;
  presentationsCollectionId: string | undefined;
};

function getErrorMessage(err: unknown) {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: unknown }).message ?? "Unknown error");
  }
  return "Unknown error";
}

export function usePresentationList({
  user,
  isDashboard,
  appwriteConfigured,
  appwriteDataConfigured,
  databases,
  databaseId,
  presentationsCollectionId,
}: UsePresentationListOptions) {
  const [presentations, setPresentations] = useState<PresentationListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    if (!user || !appwriteConfigured || !appwriteDataConfigured || !databaseId || !presentationsCollectionId) {
      return;
    }
    setListLoading(true);
    setListError(null);
    try {
      const docs = await databases.listDocuments(databaseId, presentationsCollectionId, [
        Query.orderDesc("$updatedAt"),
        Query.limit(50),
      ]);
      const next = docs.documents
        .map((doc) => {
          const raw = (doc as { data?: string }).data;
          let title = "Untitled";
          let ownerId: string | undefined;
          if (typeof raw === "string") {
            try {
              const parsed = JSON.parse(raw) as Presentation;
              if (typeof parsed.title === "string") title = parsed.title;
              if (typeof parsed.ownerId === "string") ownerId = parsed.ownerId;
            } catch {
              // ignore parse errors for list
            }
          }
          return { id: doc.$id, title, updatedAt: doc.$updatedAt, ownerId };
        })
        .filter((item) => !item.ownerId || item.ownerId === user.$id)
        .map(({ id, title, updatedAt }) => ({ id, title, updatedAt }));
      setPresentations(next);
    } catch (err) {
      setListError(getErrorMessage(err));
    } finally {
      setListLoading(false);
    }
  }, [user, appwriteConfigured, appwriteDataConfigured, databaseId, presentationsCollectionId, databases]);

  useEffect(() => {
    if (!isDashboard) return;
    void loadList();
  }, [isDashboard, loadList]);

  return {
    presentations,
    setPresentations,
    listLoading,
    listError,
    setListError,
    reloadList: loadList,
  };
}
