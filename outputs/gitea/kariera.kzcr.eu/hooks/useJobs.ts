import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Job, JobFilters } from '@/types/job';

const JOBS_CACHE_KEY = 'jobsCache';

interface JobsCacheData {
    jobs: Job[];
    currentPage: number;
    hasMore: boolean;
    filters: JobFilters | undefined;
}

function getCachedJobs(filters: JobFilters | undefined): JobsCacheData | null {
    if (typeof window === 'undefined') return null;
    try {
        const cached = sessionStorage.getItem(JOBS_CACHE_KEY);
        if (cached) {
            const data: JobsCacheData = JSON.parse(cached);
            if (JSON.stringify(data.filters) === JSON.stringify(filters)) {
                return data;
            }
        }
    } catch {
        // Invalid cache
    }
    return null;
}

function setCachedJobs(data: JobsCacheData): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(JOBS_CACHE_KEY, JSON.stringify(data));
}

function buildEndpoint(filters: JobFilters | undefined, page: number): string {
    const queryParams = new URLSearchParams();
    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.set(key, value.toString());
            }
        });
    }
    queryParams.set('page', page.toString());
    const queryString = queryParams.toString();
    return `/jobs${queryString ? `?${queryString}` : ''}`;
}

export function useJobs(filters?: JobFilters) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);

    const fetchJobs = useCallback(async (page: number = 0, resetJobs: boolean = true, signal?: AbortSignal) => {
        try {
            setLoading(true);
            const endpoint = buildEndpoint(filters, page);
            const data = await api<Job[]>(endpoint, { signal });

            if (resetJobs) {
                setJobs(data);
            } else {
                setJobs(prev => [...prev, ...data]);
            }

            setHasMore(data.length > 0);
            setCurrentPage(page);
            setError(null);

            // Update cache
            if (resetJobs) {
                setCachedJobs({ jobs: data, currentPage: page, hasMore: data.length > 0, filters });
            }
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return;
            setError(err instanceof Error ? err.message : 'Nepodařilo se načíst nabídky');
            if (resetJobs) {
                setJobs([]);
            }
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const controller = new AbortController();

        // Try to restore from cache
        const cached = getCachedJobs(filters);
        if (cached) {
            setJobs(cached.jobs);
            setCurrentPage(cached.currentPage);
            setHasMore(cached.hasMore);
            setLoading(false);

            // Keep UX fast with cached data, but always revalidate in background
            // so newly imported postings appear without manual storage clear.
            fetchJobs(0, true, controller.signal);
            return () => controller.abort();
        }

        setCurrentPage(0);
        fetchJobs(0, true, controller.signal);

        return () => controller.abort();
    }, [fetchJobs]);

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            const nextPage = currentPage + 1;
            const controller = new AbortController();
            fetchJobs(nextPage, false, controller.signal).then(() => {
                // Update cache with accumulated jobs
                setJobs(current => {
                    setCachedJobs({ jobs: current, currentPage: nextPage, hasMore, filters });
                    return current;
                });
            });
        }
    }, [fetchJobs, loading, hasMore, currentPage, filters]);

    const refetch = useCallback(() => {
        setCurrentPage(0);
        fetchJobs(0, true);
    }, [fetchJobs]);

    return {
        jobs,
        loading,
        error,
        hasMore,
        currentPage,
        loadMore,
        refetch
    };
}

export function useJob(id: string | number) {
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchJob = async () => {
            try {
                setLoading(true);
                const data = await api<Job>(`/jobs/${id}`, { signal: controller.signal });
                setJob(data);
                setError(null);
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return;
                setError(err instanceof Error ? err.message : 'Nepodařílo se načíst nabídku');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchJob();
        }

        return () => controller.abort();
    }, [id]);

    return { job, loading, error };
}
