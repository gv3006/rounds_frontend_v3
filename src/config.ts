/* Runtime configuration, read once from Vite env variables (see .env.example). */

export type ApiMode = 'mock' | 'http';

export interface AppConfig {
  /** `mock` serves the fictional dataset + localStorage; `http` talks to the Rounds REST API. */
  apiMode: ApiMode;
  /** Base URL of the Rounds API (no trailing slash). Required when apiMode is `http`. */
  apiBaseUrl: string;
  europePmcBaseUrl: string;
  requestTimeoutMs: number;
  /** Artificial delay for every mock call, to exercise loading and pending states. */
  mockLatencyMs: number;
}

const env = import.meta.env;
const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return v !== undefined && v !== '' && Number.isFinite(n) && n >= 0 ? n : fallback;
};
const stripSlash = (s: string) => s.replace(/\/+$/, '');

export const config: AppConfig = {
  apiMode: env.VITE_API_MODE === 'http' ? 'http' : 'mock',
  apiBaseUrl: stripSlash(env.VITE_API_BASE_URL || ''),
  europePmcBaseUrl: stripSlash(env.VITE_EUROPEPMC_BASE_URL || 'https://www.ebi.ac.uk/europepmc/webservices/rest'),
  requestTimeoutMs: num(env.VITE_REQUEST_TIMEOUT_MS, 11500),
  mockLatencyMs: num(env.VITE_MOCK_LATENCY_MS, 0),
};
