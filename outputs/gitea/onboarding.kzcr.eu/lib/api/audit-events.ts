import { api } from '../api'

export interface AuditEvent {
  id: string
  occurred_at: string
  request_id: string | null
  source: string | null
  category: string | null
  action: string | null
  status: 'success' | 'failure' | string
  actor_user_id: string | null
  actor_email: string | null
  actor_roles: string[] | null
  organization_id: string | null
  method: string | null
  path: string | null
  resource_type: string | null
  resource_id: string | null
  target: string | null
  status_code: number | null
  ip: string | null
  user_agent: string | null
  metadata: Record<string, unknown> | null
  before_state: unknown
  after_state: unknown
  error_message: string | null
}

export interface GetAuditEventsParams {
  page?: number
  limit?: number
  actorUserId?: string
  category?: string
  action?: string
  status?: string
  resourceType?: string
  resourceId?: string
  dateFrom?: string
  dateTo?: string
}

export interface AuditEventsResponse {
  data: AuditEvent[]
  page: number
  limit: number
  total: number
}

export const getAuditEvents = async (
  params: GetAuditEventsParams = {}
): Promise<AuditEventsResponse> => {
  const queryParams = new URLSearchParams()

  if (params.page !== undefined) queryParams.append('page', params.page.toString())
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString())
  if (params.actorUserId) queryParams.append('actorUserId', params.actorUserId)
  if (params.category) queryParams.append('category', params.category)
  if (params.action) queryParams.append('action', params.action)
  if (params.status) queryParams.append('status', params.status)
  if (params.resourceType) queryParams.append('resourceType', params.resourceType)
  if (params.resourceId) queryParams.append('resourceId', params.resourceId)
  if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom)
  if (params.dateTo) queryParams.append('dateTo', params.dateTo)

  const queryString = queryParams.toString()
  const url = `/admin/audit-events${queryString ? `?${queryString}` : ''}`
  return api<AuditEventsResponse>(url)
}
