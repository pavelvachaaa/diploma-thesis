import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Organization, ContractType, JobRole, JobRoleClassification } from '@/types/job';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

interface CachedData<T> {
  data: T;
  timestamp: number;
}

function getCachedData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = sessionStorage.getItem(key);
    if (cached) {
      const { data, timestamp }: CachedData<T> = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
      sessionStorage.removeItem(key);
    }
  } catch {
    // Invalid cache data
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;

  const cachedData: CachedData<T> = {
    data,
    timestamp: Date.now()
  };
  sessionStorage.setItem(key, JSON.stringify(cachedData));
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: unknown;
}

function unwrapArrayResponse<T>(response: T[] | PaginatedResponse<T>): T[] {
  return Array.isArray(response) ? response : response.data;
}

function useCachedApi<Raw, Result = Raw>(
  cacheKey: string,
  endpoint: string,
  extractData?: (response: Raw) => Result
) {
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const cached = getCachedData<Result>(cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    api<Raw>(endpoint, { signal: controller.signal })
      .then(d => {
        const result = (extractData ? extractData(d) : d) as Result;
        setData(result);
        setCachedData(cacheKey, result);
        setError(null);
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [cacheKey, endpoint]);

  return { data, loading, error };
}

export function useOrganizations() {
  const { data, loading, error } = useCachedApi<PaginatedResponse<Organization>>(
    'organizations',
    '/organizations'
  );
  return { organizations: data?.data ?? [], loading, error };
}

export function useContractTypes() {
  const { data, loading, error } = useCachedApi<ContractType[]>('contractTypes', '/contract_types');
  return { contractTypes: data ?? [], loading, error };
}

export function useJobRoles(organizationId?: string) {
  const cacheKey = organizationId ? `jobRoles-${organizationId}` : 'jobRoles-all';
  const endpoint = organizationId
    ? `/job_roles/organization/${organizationId}`
    : '/job_roles';
  const { data, loading, error } = useCachedApi<JobRole[] | PaginatedResponse<JobRole>, JobRole[]>(
    cacheKey,
    endpoint,
    unwrapArrayResponse
  );
  return { jobRoles: data ?? [], loading, error };
}

export function useJobRoleNames() {
  const { data, loading, error } = useCachedApi<string[]>('jobRoleNames', '/job_roles/unique');
  return { jobRoleNames: data ?? [], loading, error };
}

export function useClassifications() {
  const { data, loading, error } = useCachedApi<JobRoleClassification[]>('classifications', '/job_roles/classifications');
  return { classifications: data ?? [], loading, error };
}
