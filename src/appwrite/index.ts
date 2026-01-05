import { ID, Permission, Query, Role } from "appwrite";
import { account, appwriteConfigured, client, databases, storage } from "./client";

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID as string | undefined;
const presentationsCollectionId =
  import.meta.env.VITE_APPWRITE_PRESENTATIONS_COLLECTION_ID as string | undefined;
const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID as string | undefined;

export {
  account,
  appwriteConfigured,
  client,
  databases,
  storage,
  databaseId,
  presentationsCollectionId,
  bucketId,
  ID,
  Permission,
  Role,
  Query,
};
