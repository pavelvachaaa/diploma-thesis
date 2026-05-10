import { API_BASE_URL } from './api-base-url'

export function generateIdempotencyKey(): string {
    return crypto.randomUUID()
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        credentials: 'include', // include cookies
        cache: 'no-store',      // prevent caching TODO: Udělat to optional
    });

    // Handle responses with no content (like 204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
        if (!response.ok) {
            throw new Error('Někde nastala chyba');
        }
        return undefined as T;
    }

    const contentType = response.headers.get('content-type') || '';
    const responseText = await response.text();

    if (!responseText) {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return undefined as T;
    }

    let data: Record<string, unknown> | undefined;
    
    // Check if response is actually JSON
    if (contentType.includes('application/json')) {
        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('JSON parsing failed:', jsonError);
            throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
        }
    } else {
        if (!response.ok) {
            throw new Error(responseText || `HTTP ${response.status}: ${response.statusText}`);
        }
        throw new Error(`Expected JSON but got: ${contentType}. Response: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
        const errorBody = data as { error?: string; message?: string } | undefined
        throw new Error(errorBody?.error || errorBody?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
}

export async function downloadFile(path: string, filename: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/octet-stream',
        }
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Nejste oprávněni stáhnout tento soubor');
        }
        if (response.status === 404) {
            throw new Error('Soubor nebyl nalezen');
        }
        throw new Error('Chyba při stahování souboru');
    }

    // Create blob from response
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}
