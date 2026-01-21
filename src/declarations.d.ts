declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT?: string;
  readonly VITE_APPWRITE_PROJECT_ID?: string;
  readonly VITE_APPWRITE_DATABASE_ID?: string;
  readonly VITE_APPWRITE_PRESENTATIONS_COLLECTION_ID?: string;
  readonly VITE_APPWRITE_BUCKET_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
