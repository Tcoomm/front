import { Account, Client, Databases, Storage } from "appwrite";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT as string | undefined;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID as string | undefined;

const appwriteConfigured = Boolean(endpoint && projectId);

const client = new Client();
if (appwriteConfigured) {
  client.setEndpoint(endpoint!).setProject(projectId!);
}

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

export { account, appwriteConfigured, client, databases, storage };
