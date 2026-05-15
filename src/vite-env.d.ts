/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API origin, e.g. `http://192.168.1.7:8000`, or `auto` — see `src/lib/api-base-url.ts`. */
  readonly VITE_API_BASE_URL?: string
  /** Used only when `VITE_API_BASE_URL` is empty or `auto`. Default `8000`. */
  readonly VITE_API_PORT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
