export const API_BASE_URL = (process.env.NODE_ENV === "production"
  ? process.env.NEXT_PUBLIC_BASE_API_URL_PROD || 'https://onboarding.kzcr.eu/hrbackend/api/v1'
  : process.env.NEXT_PUBLIC_BASE_API_URL_DEV || 'http://localhost:3322/api/v1').trim();

type ApiErrorBody = {
    error?: string;
    message?: string;
    code?: string;
};

export class ApiError extends Error {
    status?: number;
    code?: string;

    constructor(message: string, options: { status?: number; code?: string } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = options.status;
        this.code = options.code;
    }
}

async function parseErrorBody(response: Response): Promise<{ message: string; code?: string }> {
    const rawBody = await response.text().catch(() => '');

    if (!rawBody) {
        return { message: 'Někde nastala chyba' };
    }

    try {
        const body = JSON.parse(rawBody) as ApiErrorBody;

        return {
            message: body.error || body.message || 'Někde nastala chyba',
            code: body.code,
        };
    } catch {
        return { message: rawBody };
    }
}

export function generateIdempotencyKey(): string {
    return crypto.randomUUID()
}

export async function api<T>(
    path: string,
    options: RequestInit = {},
    timeout = 10000
): Promise<T> {
    const { cache = 'no-store', signal, ...rest } = options;

    const response = await fetch(`${API_BASE_URL}${path}`, {
        credentials: 'include',
        cache,
        signal: signal ?? AbortSignal.timeout(timeout),
        ...rest,
    });

    if (!response.ok) {
        const { message, code } = await parseErrorBody(response);
        throw new ApiError(message || 'Někde nastala chyba', {
            status: response.status,
            code,
        });
    }

    return response.json() as Promise<T>;
}

export function jsonRequest<T>(
    path: string,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body?: Record<string, unknown>,
    options: RequestInit = {}
): Promise<T> {
    return api<T>(path, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        body: JSON.stringify(body),
        ...options,
    });
}
