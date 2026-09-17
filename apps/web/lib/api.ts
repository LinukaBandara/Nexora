import { demoResponse } from "./demo-data";

export class ApiError extends Error {
  correlationId?: string;
  status: number;

  constructor(message: string, status: number, correlationId?: string) {
    super(message);
    this.correlationId = correlationId;
    this.status = status;
  }
}

function demoFallback(path: string, method: string) {
  const withoutPrefix = path.replace(/^\/api\/v1\/?/, "");
  const [pathname, search = ""] = withoutPrefix.split("?");
  return demoResponse(pathname.split("/").filter(Boolean), search ? `?${search}` : "", method);
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const proxiedPath = path.replace(/^\/api\/v1/, "/api/proxy");
  const method = options.method ?? "GET";

  try {
    const response = await fetch(proxiedPath, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status >= 500) return demoFallback(path, method) as T;

      let message = `Request failed (${response.status})`;
      let correlationId: string | undefined;
      try {
        const body = await response.json();
        message = body.message ?? message;
        correlationId = body.correlationId;
      } catch {
        // response wasn't JSON - keep the generic message
      }
      throw new ApiError(message, response.status, correlationId);
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    return demoFallback(path, method) as T;
  }
}

export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}
