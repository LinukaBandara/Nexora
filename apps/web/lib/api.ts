// Thin wrapper over fetch. Every call goes through /api/proxy, a
// same-origin Next.js route that attaches the access token server-side
// from an HttpOnly cookie - the browser never has direct access to the
// token, so it can't be read by injected JS. See app/api/proxy and
// docs/frontend.md for the reasoning and the latency tradeoff this costs.

export class ApiError extends Error {
  correlationId?: string;
  status: number;

  constructor(message: string, status: number, correlationId?: string) {
    super(message);
    this.status = status;
    this.correlationId = correlationId;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  // path arrives as e.g. "/api/v1/inventory/products?search=x" - strip the
  // "/api/v1" prefix since the proxy route re-adds it against the real
  // backend, and route everything through our own origin instead.
  const proxiedPath = path.replace(/^\/api\/v1/, "/api/proxy");

  const response = await fetch(proxiedPath, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store", // dashboard data must always reflect current DB state
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    let correlationId: string | undefined;
    try {
      const body = await response.json();
      message = body.message ?? message;
      correlationId = body.correlationId;
    } catch {
      // response wasn't JSON - fall back to the generic message above
    }
    throw new ApiError(message, response.status, correlationId);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}
