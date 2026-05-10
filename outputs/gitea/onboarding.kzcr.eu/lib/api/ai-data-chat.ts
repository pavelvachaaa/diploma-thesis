const BASE_URL = process.env.NODE_ENV === "production"
    ? (process.env.NEXT_PUBLIC_BASE_API_URL_PROD || 'https://onboarding.kzcr.eu/hrbackend/api/v1')
    : (process.env.NEXT_PUBLIC_BASE_API_URL_DEV || 'http://localhost:3322/api/v1');

export interface QueryResultData {
    explanation: string
    type: "table" | "number"
    data: Record<string, unknown>[]
    sql: string
    rowCount: number
}

export interface DataChatMessage {
    role: "user" | "assistant"
    content: string
    queryResult?: QueryResultData
}

export interface DataChatStreamCallbacks {
    onStatus: (message: string) => void
    onResult: (result: QueryResultData) => void
    onError: (error: string) => void
    onDone: () => void
}

export interface HistoryEntry {
    role: "user" | "assistant"
    content: string
    sql?: string
}

export async function streamDataQuery(
    question: string,
    callbacks: DataChatStreamCallbacks,
    signal?: AbortSignal,
    history?: HistoryEntry[],
): Promise<void> {
    let response: Response
    try {
        response = await fetch(`${BASE_URL}/admin/ai-data-chat/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ question, history: history || [] }),
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
        } else if (response.status === 403) {
            callbacks.onError('Nemáte oprávnění')
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
                            case 'status':
                                callbacks.onStatus(data.message)
                                break
                            case 'result':
                                callbacks.onResult(data as QueryResultData)
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

        callbacks.onDone()
    } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        callbacks.onError('Spojení s AI službou bylo přerušeno')
    }
}
