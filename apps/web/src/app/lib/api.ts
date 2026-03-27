const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() ?? '';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, headers, ...rest } = options;
  const hasBody = body !== undefined;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      ...(hasBody ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: hasBody ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (!response.ok) {
    const errBody = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(errBody?.error ?? `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function wsUrl(path: string): string {
  const url = API_BASE_URL
    ? new URL(API_BASE_URL)
    : new URL(window.location.origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = path;
  return url.toString();
}
