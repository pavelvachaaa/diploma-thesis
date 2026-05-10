import { api } from '../api'

export interface OutboxEvent {
  id: string
  event_type: string
  aggregate_type: string | null
  aggregate_id: string | null
  payload: Record<string, unknown>
  status: 'pending' | 'processing' | 'sent' | 'dead'
  attempts: number
  max_attempts: number
  last_error: string | null
  result_meta: Record<string, unknown> | null
  idempotency_key: string | null
  locked_by: string | null
  locked_at: string | null
  created_at: string
  updated_at: string
}

export interface OutboxSummaryItem {
  status: string
  event_type: string
  count: number
}

export interface OutboxDeadReason {
  last_error: unknown
  count: number
}

export interface OutboxSummaryResponse {
  summary: OutboxSummaryItem[]
  deadReasons: OutboxDeadReason[]
}

export interface GetOutboxEventsParams {
  page?: number
  limit?: number
  status?: string
  event_type?: string
}

export interface OutboxEventsResponse {
  data: OutboxEvent[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ReplayRequest {
  execute: boolean
  ids?: string[]
  eventType?: string
  limit?: number
}

export interface ReplayResponse {
  mode: string
  selection: unknown
  matchedCount: number
  replayedCount: number
  events: OutboxEvent[]
}

export const getOutboxSummary = async (): Promise<OutboxSummaryResponse> => {
  return api<OutboxSummaryResponse>('/admin/outbox/summary')
}

export const getOutboxEvents = async (
  params: GetOutboxEventsParams = {}
): Promise<OutboxEventsResponse> => {
  const queryParams = new URLSearchParams()

  if (params.page !== undefined) queryParams.append('page', params.page.toString())
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString())
  if (params.status) queryParams.append('status', params.status)
  if (params.event_type) queryParams.append('event_type', params.event_type)

  const queryString = queryParams.toString()
  const url = `/admin/outbox/events${queryString ? `?${queryString}` : ''}`
  return api<OutboxEventsResponse>(url)
}

export const replayDeadEvents = async (body: ReplayRequest): Promise<ReplayResponse> => {
  return api<ReplayResponse>('/admin/outbox/replay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}
