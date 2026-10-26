/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_EUROPEPMC_BASE_URL?: string;
  readonly VITE_REQUEST_TIMEOUT_MS?: string;
  readonly VITE_MOCK_LATENCY_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
