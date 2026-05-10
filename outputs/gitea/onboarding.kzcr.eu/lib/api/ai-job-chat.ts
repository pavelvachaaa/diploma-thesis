const BASE_URL = process.env.NODE_ENV === "production"
    ? (process.env.NEXT_PUBLIC_BASE_API_URL_PROD || 'https://onboarding.kzcr.eu/hrbackend/api/v1')
    : (process.env.NEXT_PUBLIC_BASE_API_URL_DEV || 'http://localhost:3322/api/v1');

export interface JobDraft {
    title: string
    description: string
    duties: string[]
    requirements: string[]
    benefits: string[]
    department: string
    contract_type: string
}

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

export interface StreamCallbacks {
    onToken: (token: string) => void
    onDone: () => void
    onError: (error: string) => void
}

async function streamSSE(
    url: string,
    body: Record<string, unknown>,
    callbacks: StreamCallbacks,
    signal?: AbortSignal,
): Promise<void> {
    let response: Response
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
            signal,
        })
    } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        callbacks.onError('Nepodařilo se připojit k AI službě')
        return
    }

    if (!response.ok) {
        if (response.status === 401) {
            callbacks.onError('Nejste přihlášeni')
        } else {
            callbacks.onError(`AI služba vrátila chybu: ${response.status}`)
        }
        return
    }

    const reader = response.body?.getReader()
    if (!reader) {
        callbacks.onError('Streaming není podporován')
        return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            let currentEvent: string | null = null

            for (const line of lines) {
                if (line.startsWith('event: ')) {
                    currentEvent = line.slice(7).trim()
                } else if (line.startsWith('data: ') && currentEvent) {
                    const dataStr = line.slice(6)
                    try {
                        const data = JSON.parse(dataStr)

                        switch (currentEvent) {
                            case 'token':
                                callbacks.onToken(data.token)
                                break
                            case 'error':
                                callbacks.onError(data.error || 'Neznámá chyba')
                                break
                            case 'done':
                                callbacks.onDone()
                                return
                        }
                    } catch {
                        // Skip unparseable data
                    }
                    currentEvent = null
                } else if (line === '') {
                    currentEvent = null
                }
            }
        }

        // Stream ended without done event
        callbacks.onDone()
    } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        callbacks.onError('Spojení s AI službou bylo přerušeno')
    }
}

export async function streamAIJobChat(
    messages: ChatMessage[],
    callbacks: StreamCallbacks,
    signal?: AbortSignal,
    existingOfferText?: string,
): Promise<void> {
    const body: Record<string, unknown> = { messages }
    if (existingOfferText) {
        body.existing_offer_text = existingOfferText
    }
    return streamSSE(`${BASE_URL}/admin/ai-job-chat/stream`, body, callbacks, signal)
}

export async function streamRefineText(
    text: string,
    fieldType: string,
    callbacks: StreamCallbacks,
    signal?: AbortSignal,
    jobTitle?: string,
): Promise<void> {
    const body: Record<string, unknown> = { text, field_type: fieldType }
    if (jobTitle) {
        body.job_title = jobTitle
    }
    return streamSSE(`${BASE_URL}/admin/ai-job-chat/refine`, body, callbacks, signal)
}

export async function extractJobFromText(offerText: string): Promise<JobDraft> {
    const response = await fetch(`${BASE_URL}/admin/ai-job-chat/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ offer_text: offerText }),
    })

    if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(text || `Chyba při extrakci: ${response.status}`)
    }

    return response.json()
}
