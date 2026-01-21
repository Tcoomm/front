import { useCallback } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { Models } from "appwrite";
import type { Presentation } from "../../types";
import type { PresentationListItem } from "./usePresentationList";
import { deserializePresentation, serializePresentation } from "../serializePresentation";
import { parsePresentationJson } from "../../import/parsePresentationJson";
import { ID, Permission, Role } from "../index";
import Ajv from "ajv";
import { presentationSchema } from "../schemas/presentationSchema";

const ajv = new Ajv({ allErrors: true, strict: false });
const validatePresentation = ajv.compile(presentationSchema);

type UsePresentationStorageOptions = {
  user: Models.User<Models.Preferences> | null;
  appwriteConfigured: boolean;
  appwriteDataConfigured: boolean;
  databases: import("appwrite").Databases;
  storage: import("appwrite").Storage;
  databaseId: string | undefined;
  presentationsCollectionId: string | undefined;
  bucketId: string | undefined;
  t: (key: string) => string;
  lang: "ru" | "en";
  setSaveError: (message: string | null) => void;
  setListError: (message: string | null) => void;
  setPresentations: Dispatch<SetStateAction<PresentationListItem[]>>;
  setActivePresentationId: (id: string | null) => void;
  activePresentationId: string | null;
  lastSavedRef: RefObject<string>;
  dispatchLoadPresentation: (presentation: Presentation) => void;
  navigate: (path: string) => void;
  isEditor: boolean;
  isPlayer: boolean;
};

function getErrorMessage(err: unknown) {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: unknown }).message ?? "Unknown error");
  }
  return "Unknown error";
}

export function usePresentationStorage({
  user,
  appwriteConfigured,
  appwriteDataConfigured,
  databases,
  storage,
  databaseId,
  presentationsCollectionId,
  bucketId,
  t,
  lang,
  setSaveError,
  setListError,
  setPresentations,
  setActivePresentationId,
  activePresentationId,
  lastSavedRef,
  dispatchLoadPresentation,
  navigate,
  isEditor,
  isPlayer,
}: UsePresentationStorageOptions) {
  const getUserPermissions = useCallback(
    (currentUser: Models.User<Models.Preferences>) => [
      Permission.read(Role.user(currentUser.$id)),
      Permission.write(Role.user(currentUser.$id)),
    ],
    [],
  );

  const getPresentationForExport = useCallback(
    async (id: string) => {
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
        const unpacked = await deserializePresentation(raw);
        const result = parsePresentationJson(unpacked, lang);
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
    },
    [
      appwriteConfigured,
      appwriteDataConfigured,
      databases,
      databaseId,
      presentationsCollectionId,
      t,
      lang,
      setListError,
      user,
    ],
  );

  const uploadImage = useCallback(
    async (file: File): Promise<string | null> => {
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
    },
    [user, appwriteDataConfigured, storage, bucketId, getUserPermissions, setSaveError, t],
  );

  const openPresentation = useCallback(
    async (id: string) => {
      if (!appwriteConfigured || !appwriteDataConfigured) return;
      setSaveError(null);
      try {
        const doc = await databases.getDocument(databaseId!, presentationsCollectionId!, id);
        const raw = (doc as { data?: string }).data;
        if (typeof raw !== "string") {
          setSaveError("Saved presentation is missing data.");
          return;
        }
        let parsed: Presentation;
        const unpacked = await deserializePresentation(raw);
        try {
          parsed = JSON.parse(unpacked) as Presentation;
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
        dispatchLoadPresentation(parsed);
        if (!isEditor && !isPlayer) {
          navigate(`/editor/${doc.$id}`);
        }
      } catch (err) {
        setSaveError(getErrorMessage(err));
      }
    },
    [
      appwriteConfigured,
      appwriteDataConfigured,
      databases,
      databaseId,
      presentationsCollectionId,
      setSaveError,
      user,
      lastSavedRef,
      setActivePresentationId,
      dispatchLoadPresentation,
      isEditor,
      isPlayer,
      navigate,
    ],
  );

  const renamePresentation = useCallback(
    async (id: string, title: string) => {
      if (!appwriteConfigured || !appwriteDataConfigured) return false;
      setListError(null);
      try {
        const doc = await databases.getDocument(databaseId!, presentationsCollectionId!, id);
        const raw = (doc as { data?: string }).data;
        if (typeof raw !== "string") {
          setListError("Saved presentation is missing data.");
          return false;
        }
        let parsed: Presentation;
        const unpacked = await deserializePresentation(raw);
        try {
          parsed = JSON.parse(unpacked) as Presentation;
        } catch {
          setListError("Saved presentation is not valid JSON.");
          return false;
        }
        if (!parsed.ownerId && user) {
          parsed.ownerId = user.$id;
        }
        parsed.id = doc.$id;
        parsed.title = title;
        const payload = await serializePresentation(JSON.stringify(parsed));
        await databases.updateDocument(databaseId!, presentationsCollectionId!, id, {
          data: payload,
        });
        setPresentations((prev) =>
          prev.map((item) => (item.id === id ? { ...item, title } : item)),
        );
        return true;
      } catch (err) {
        setListError(getErrorMessage(err));
        return false;
      }
    },
    [
      appwriteConfigured,
      appwriteDataConfigured,
      databases,
      databaseId,
      presentationsCollectionId,
      setListError,
      user,
      setPresentations,
    ],
  );

  const deletePresentation = useCallback(
    async (id: string) => {
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
    },
    [
      appwriteConfigured,
      appwriteDataConfigured,
      databases,
      databaseId,
      presentationsCollectionId,
      setListError,
      setPresentations,
      activePresentationId,
      setActivePresentationId,
    ],
  );

  return {
    getUserPermissions,
    getPresentationForExport,
    uploadImage,
    openPresentation,
    renamePresentation,
    deletePresentation,
  };
}
