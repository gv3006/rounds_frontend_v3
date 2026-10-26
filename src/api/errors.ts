/** Error raised by any API adapter. `status` 0 = network failure or timeout. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** Short, user-facing explanation for a failed request. */
export function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return err.code === 'timeout' ? 'The server took too long to respond.' : 'Couldn’t reach the server.';
    if (err.status === 401) return 'Please sign in again.';
    if (err.status === 403) return 'You don’t have permission to do that.';
    if (err.status === 404) return 'That item no longer exists.';
    if ([400, 409, 413, 422].includes(err.status)) return err.message || 'Some details weren’t accepted.';
    if (err.status === 429) return 'Too many requests. Wait a moment and try again.';
    return 'Something went wrong on our side.';
  }
  return 'Something went wrong.';
}
