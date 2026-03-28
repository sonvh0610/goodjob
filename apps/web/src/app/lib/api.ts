const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() ?? '';

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

function toReadableError(
  value: unknown,
  fallback: string,
  path?: string
): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (!value || typeof value !== 'object') {
    return fallback;
  }

  if (Array.isArray(value)) {
    const messages = value
      .map((item) => toReadableError(item, '', path))
      .filter((message) => message.length > 0);
    return messages.length > 0 ? messages.join(', ') : fallback;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.message === 'string' && record.message.trim().length > 0) {
    return record.message.trim();
  }

  if (path === undefined) {
    const nestedError = record.error;
    if (nestedError !== undefined) {
      const nestedMessage = toReadableError(nestedError, '', 'error');
      if (nestedMessage.length > 0) {
        return nestedMessage;
      }
    }
  }

  const formErrors = Array.isArray(record.formErrors)
    ? record.formErrors
        .map((item) => toReadableError(item, '', path))
        .filter((message) => message.length > 0)
    : [];

  const fieldErrors = record.fieldErrors;
  if (fieldErrors && typeof fieldErrors === 'object' && !Array.isArray(fieldErrors)) {
    const perFieldMessages = Object.entries(fieldErrors as Record<string, unknown>)
      .flatMap(([fieldName, fieldValue]) => {
        if (!Array.isArray(fieldValue)) {
          return [];
        }
        return fieldValue
          .map((item) => toReadableError(item, '', path))
          .filter((message) => message.length > 0)
          .map((message) => `${fieldName}: ${message}`);
      });
    if (formErrors.length > 0 || perFieldMessages.length > 0) {
      return [...formErrors, ...perFieldMessages].join('; ');
    }
  }

  const values = Object.values(record);
  const nestedValues = values
    .map((item) => toReadableError(item, '', path))
    .filter((message) => message.length > 0);
  if (nestedValues.length > 0) {
    return nestedValues.join('; ');
  }

  return fallback;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, headers, ...rest } = options;
  const hasBody = body !== undefined;

  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    headers: {
      ...(hasBody ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: hasBody ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => null);
    throw new Error(toReadableError(errBody, `Request failed (${response.status})`));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function wsUrl(path: string): string {
  const baseUrl = API_BASE_URL
    ? new URL(API_BASE_URL, window.location.origin)
    : new URL(window.location.origin);
  const url = new URL(baseUrl.toString());
  const basePath = baseUrl.pathname.endsWith('/')
    ? baseUrl.pathname.slice(0, -1)
    : baseUrl.pathname;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `${basePath}${normalizedPath}`.replace(/\/{2,}/g, '/');
  return url.toString();
}
