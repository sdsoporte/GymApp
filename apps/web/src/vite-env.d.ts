/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ASSETS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
