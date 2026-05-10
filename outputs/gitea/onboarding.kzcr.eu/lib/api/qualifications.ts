import { api } from '../api'

export type QualificationSearchType = 'nrzp' | 'rodne_cislo'

export interface QualificationWorker {
  nrzpCislo: number | null
  jmeno: string | null
  prijmeni: string | null
  datumNarozeni: number | null
  statniObcanstvi: string | null
}

export interface QualificationItem {
  nrzpCislo: number | null
  typZpusobilosti: string | null
  obor: string | null
  odbornost: string | null
}

export interface QualificationLookupResult {
  searchType: QualificationSearchType
  queryMasked: string | null
  applicantId: string | null
  worker: QualificationWorker | null
  workers: QualificationWorker[]
  qualifications: {
    odborneZpusobilosti: QualificationItem[]
    specializovaneZpusobilosti: QualificationItem[]
    zvlastniOdborneZpusobilosti: QualificationItem[]
  }
  counts: {
    workers: number
    odborneZpusobilosti: number
    specializovaneZpusobilosti: number
    zvlastniOdborneZpusobilosti: number
  }
  upstream: {
    status: number | null
    success: number | null
    stav: string | null
    message: string | null
    error: string | null
    operation: string | null
  }
}

export interface QualificationLookupPayload {
  searchType: QualificationSearchType
  query: string
  applicantId?: string | null
}

export const lookupQualification = async (payload: QualificationLookupPayload): Promise<QualificationLookupResult> => {
  return api<QualificationLookupResult>('/admin/qualifications/lookup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
}
