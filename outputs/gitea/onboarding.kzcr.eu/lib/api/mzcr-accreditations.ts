import { api } from '../api'

export type MzcrAccreditationValidity = 'valid' | 'all' | 'invalid'

export interface MzcrAccreditation {
  id_akreditace: number
  organization_id: string
  organization_name: string | null
  organization_seat_location: string | null
  specialty_type: string | null
  specialty_type_label_cs: string | null
  specialty_id: string | null
  specialty_name: string | null
  source_category_codes: string[]
  workplace_type_ids: number[]
  workplace_type_names: string[]
  valid_from: string | null
  valid_to: string | null
  revoked_at: string | null
  expired_at: string | null
  places_count: number | null
  is_full: boolean | null
  is_stale: boolean
  is_currently_valid: boolean
  last_synced_at: string
}

export interface MzcrAccreditationListParams {
  page?: number
  limit?: number
  organizationId?: string
  validity?: MzcrAccreditationValidity
  specialtyType?: string
  q?: string
}

export interface MzcrAccreditationsResponse {
  data: MzcrAccreditation[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface MzcrAccreditationMeta {
  specialtyTypes: Array<{
    value: string
    label: string
  }>
}

const appendParam = (params: URLSearchParams, key: string, value: unknown) => {
  if (value === undefined || value === null || value === '' || value === 'all') return
  params.append(key, String(value))
}

export const getMzcrAccreditations = async (
  filters: MzcrAccreditationListParams = {}
): Promise<MzcrAccreditationsResponse> => {
  const params = new URLSearchParams()
  appendParam(params, 'page', filters.page)
  appendParam(params, 'limit', filters.limit)
  appendParam(params, 'organizationId', filters.organizationId)
  appendParam(params, 'validity', filters.validity)
  appendParam(params, 'specialtyType', filters.specialtyType)
  appendParam(params, 'q', filters.q)

  const queryString = params.toString()
  return api<MzcrAccreditationsResponse>(
    `/admin/mzcr-accreditations${queryString ? `?${queryString}` : ''}`
  )
}

export const getMzcrAccreditationMeta = async (): Promise<MzcrAccreditationMeta> => {
  return api<MzcrAccreditationMeta>('/admin/mzcr-accreditations/meta')
}
