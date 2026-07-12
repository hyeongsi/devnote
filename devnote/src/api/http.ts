export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type StatusMessages = Partial<Record<number, string>>;

interface ApiRequestOptions<TBody = unknown> {
  method?: string;
  body?: TBody;
  withCredentials?: boolean;
  headers?: HeadersInit;
  request?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  statusMessages?: StatusMessages;
  errorMessage: string;
}

export async function apiRequest<TResponse, TBody = unknown>(
  url: string,
  options: ApiRequestOptions<TBody>,
): Promise<TResponse> {
  const request = options.request ?? fetch;
  const response = await request(url, buildRequestInit(options));
  const statusMessage = options.statusMessages?.[response.status];

  if (statusMessage) {
    throw new ApiError(statusMessage, response.status);
  }

  if (!response.ok) {
    throw new ApiError(`${options.errorMessage} (${response.status})`, response.status);
  }

  if (response.status === 204 || response.headers?.get('content-length') === '0') {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

export function isApiErrorWithStatus(error: unknown, status: number): error is ApiError {
  return error instanceof ApiError && error.status === status;
}

function buildRequestInit<TBody>(options: ApiRequestOptions<TBody>): RequestInit | undefined {
  const init: RequestInit = {};

  if (options.method) {
    init.method = options.method;
  }

  if (options.withCredentials) {
    init.credentials = 'include';
  }

  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
    init.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  } else if (options.headers) {
    init.headers = options.headers;
  }

  return Object.keys(init).length > 0 ? init : undefined;
}
