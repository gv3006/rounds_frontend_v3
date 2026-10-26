/* The single API instance the UI uses. Switch adapters with VITE_API_MODE (see .env.example). */
import { config } from '../config';
import { createHttpApi } from './http';
import { createMockApi } from './mock';
import type { RoundsApi } from './types';

export const api: RoundsApi =
  config.apiMode === 'http'
    ? createHttpApi({ baseUrl: config.apiBaseUrl, timeoutMs: config.requestTimeoutMs })
    : createMockApi({ latencyMs: config.mockLatencyMs });

export { ApiError, describeError } from './errors';
export { searchEuropePmc, textQuery } from './europepmc';
export type * from './types';
