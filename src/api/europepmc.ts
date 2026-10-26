/* Europe PMC REST search: the public literature source behind the "Live" feed and paper search.
   Called directly from the browser today; a backend may proxy or cache it later. */
import { config } from '../config';
import type { EuropePmcRecord } from '../types';
import { ApiError } from './errors';

export interface EuropePmcPage {
  results: EuropePmcRecord[];
  hitCount: number;
}

export async function searchEuropePmc(query: string, { page = 1, pageSize = 25 }: { page?: number; pageSize?: number } = {}): Promise<EuropePmcPage> {
  const params = new URLSearchParams({ query, format: 'json', pageSize: String(pageSize), page: String(page), resultType: 'core' });
  const ctl = new AbortController(),
    timer = setTimeout(() => ctl.abort(), config.requestTimeoutMs);
  try {
    const r = await fetch(config.europePmcBaseUrl + '/search?' + params, { signal: ctl.signal });
    if (!r.ok) throw new ApiError(r.status, 'europepmc_' + r.status, 'HTTP ' + r.status);
    const data = await r.json();
    return { results: (data.resultList?.result || []).filter((p: EuropePmcRecord) => p.title), hitCount: data.hitCount || 0 };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, ctl.signal.aborted ? 'timeout' : 'network', ctl.signal.aborted ? 'Request timed out' : String((err as Error)?.message || err));
  } finally {
    clearTimeout(timer);
  }
}

/** Free-text search wrapped in Europe PMC syntax, restricted to MEDLINE. */
export const textQuery = (text: string) => `(SRC:MED) AND (${text.replace(/[()\[\]{}:"]/g, ' ').trim() || 'medicine'})`;
