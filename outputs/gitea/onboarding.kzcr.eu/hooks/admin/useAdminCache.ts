'use client'

import { useCallback, useRef } from 'react'
import { useAdminContext } from '@/context/AdminContext'

// Cache configuration
interface CacheConfig {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of cached items
  persistToStorage?: boolean // Whether to persist to localStorage
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  hits: number
}

// Default cache configuration
const DEFAULT_CACHE_CONFIG: Required<CacheConfig> = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  persistToStorage: false
}

export function useAdminCache() {
  const { state } = useAdminContext()
  const cacheStats = useRef({
    hits: 0,
    misses: 0,
    evictions: 0,
    lastCleanup: Date.now()
  })

  // Get cache key with query serialization
  const getCacheKey = useCallback((entityType: string, key: string, query?: any) => {
    if (!query) return key
    const queryString = JSON.stringify(query, Object.keys(query).sort())
    return `${key}_${Buffer.from(queryString).toString('base64').slice(0, 10)}`
  }, [])

  // Check if cache entry is valid
  const isCacheValid = useCallback((entry: CacheEntry<any>): boolean => {
    return Date.now() - entry.timestamp <= entry.ttl
  }, [])

  // Get from cache with TTL check
  const getFromCache = useCallback(<T>(
    entityType: keyof typeof state.cache,
    key: string,
    config: CacheConfig = {}
  ): T | null => {
    const cache = state.cache[entityType]
    const entry = cache.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      cacheStats.current.misses++
      return null
    }

    if (!isCacheValid(entry)) {
      cache.delete(key)
      cacheStats.current.misses++
      return null
    }

    entry.hits++
    cacheStats.current.hits++
    return entry.data
  }, [state.cache, isCacheValid])

  // Set to cache with TTL and size management
  const setToCache = useCallback(<T>(
    entityType: keyof typeof state.cache,
    key: string,
    data: T,
    config: CacheConfig = {}
  ): void => {
    const finalConfig = { ...DEFAULT_CACHE_CONFIG, ...config }
    const cache = state.cache[entityType]

    // Remove expired entries first
    cleanupExpiredEntries(cache)

    // Check size limit and evict if necessary
    if (cache.size >= finalConfig.maxSize) {
      evictLRU(cache, Math.floor(finalConfig.maxSize * 0.2)) // Remove 20% of entries
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: finalConfig.ttl,
      hits: 0
    }

    cache.set(key, entry)

    // Persist to localStorage if configured
    if (finalConfig.persistToStorage) {
      try {
        const storageKey = `admin_cache_${entityType}_${key}`
        localStorage.setItem(storageKey, JSON.stringify(entry))
      } catch (error) {
        console.warn('Failed to persist cache entry to localStorage:', error)
      }
    }
  }, [state.cache])

  // Clean up expired entries
  const cleanupExpiredEntries = useCallback((cache: Map<string, any>) => {
    const now = Date.now()
    const expired: string[] = []

    cache.forEach((entry, key) => {
      if (!isCacheValid(entry)) {
        expired.push(key)
      }
    })

    expired.forEach(key => {
      cache.delete(key)
      cacheStats.current.evictions++
    })
  }, [isCacheValid])

  // Evict least recently used entries
  const evictLRU = useCallback((cache: Map<string, any>, count: number) => {
    const entries = Array.from(cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => {
        // Sort by hits (ascending) then by timestamp (ascending)
        if (a.entry.hits !== b.entry.hits) {
          return a.entry.hits - b.entry.hits
        }
        return a.entry.timestamp - b.entry.timestamp
      })

    for (let i = 0; i < Math.min(count, entries.length); i++) {
      cache.delete(entries[i].key)
      cacheStats.current.evictions++
    }
  }, [])

  // Bulk cache operations
  const bulkSetCache = useCallback(<T>(
    entityType: keyof typeof state.cache,
    items: Record<string, T>,
    config: CacheConfig = {}
  ): void => {
    Object.entries(items).forEach(([key, data]) => {
      setToCache(entityType, key, data, config)
    })
  }, [setToCache])

  // Cache with function (memoization pattern)
  const cacheWith = useCallback(async <T>(
    entityType: keyof typeof state.cache,
    key: string,
    fetchFn: () => Promise<T>,
    config: CacheConfig = {}
  ): Promise<T> => {
    // Try to get from cache first
    const cached = getFromCache<T>(entityType, key, config)
    if (cached !== null) {
      return cached
    }

    // Fetch and cache the result
    try {
      const data = await fetchFn()
      setToCache(entityType, key, data, config)
      return data
    } catch (error) {
      // Don't cache errors, let them bubble up
      throw error
    }
  }, [getFromCache, setToCache])

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const totalEntries = Object.values(state.cache).reduce((sum, cache) => sum + cache.size, 0)
    const { hits, misses } = cacheStats.current
    const hitRate = hits + misses > 0 ? hits / (hits + misses) : 0

    return {
      totalEntries,
      hitRate: Math.round(hitRate * 100),
      hits: cacheStats.current.hits,
      misses: cacheStats.current.misses,
      evictions: cacheStats.current.evictions,
      cachesByType: Object.keys(state.cache).reduce((acc, type) => {
        acc[type] = state.cache[type as keyof typeof state.cache].size
        return acc
      }, {} as Record<string, number>)
    }
  }, [state.cache])

  // Clear cache for entity type or all
  const clearCache = useCallback((entityType?: keyof typeof state.cache) => {
    if (entityType) {
      state.cache[entityType].clear()
    } else {
      Object.values(state.cache).forEach(cache => cache.clear())
    }
    
    // Reset stats
    cacheStats.current = {
      hits: 0,
      misses: 0,
      evictions: 0,
      lastCleanup: Date.now()
    }
  }, [state.cache])

  // Periodic cleanup (call this from useEffect)
  const scheduleCleanup = useCallback(() => {
    const cleanup = () => {
      Object.values(state.cache).forEach(cleanupExpiredEntries)
      cacheStats.current.lastCleanup = Date.now()
    }

    const interval = setInterval(cleanup, 60000) // Run every minute
    
    return () => clearInterval(interval)
  }, [state.cache, cleanupExpiredEntries])

  // Load from localStorage on init
  const loadFromStorage = useCallback((entityType: keyof typeof state.cache) => {
    try {
      const prefix = `admin_cache_${entityType}_`
      const keys = Object.keys(localStorage).filter(key => key.startsWith(prefix))
      
      keys.forEach(storageKey => {
        try {
          const entry = JSON.parse(localStorage.getItem(storageKey) || '{}')
          if (entry.data && entry.timestamp && isCacheValid(entry)) {
            const cacheKey = storageKey.replace(prefix, '')
            state.cache[entityType].set(cacheKey, entry)
          } else {
            localStorage.removeItem(storageKey)
          }
        } catch (error) {
          localStorage.removeItem(storageKey)
        }
      })
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error)
    }
  }, [state.cache, isCacheValid])

  return {
    // Core cache operations
    getFromCache,
    setToCache,
    bulkSetCache,
    cacheWith,
    
    // Cache management
    clearCache,
    getCacheStats,
    scheduleCleanup,
    loadFromStorage,
    
    // Utilities
    getCacheKey,
    isCacheValid
  }
}

// Performance monitoring hook
export function useAdminPerformance() {
  const performanceMarks = useRef<Map<string, number>>(new Map())

  const startTiming = useCallback((key: string) => {
    performanceMarks.current.set(key, performance.now())
  }, [])

  const endTiming = useCallback((key: string): number => {
    const startTime = performanceMarks.current.get(key)
    if (startTime === undefined) {
      console.warn(`No start mark found for key: ${key}`)
      return 0
    }

    const duration = performance.now() - startTime
    performanceMarks.current.delete(key)

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`Slow operation detected: ${key} took ${Math.round(duration)}ms`)
    }

    return duration
  }, [])

  const measureAsync = useCallback(async <T>(
    key: string,
    asyncFn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> => {
    startTiming(key)
    try {
      const result = await asyncFn()
      const duration = endTiming(key)
      return { result, duration }
    } catch (error) {
      endTiming(key)
      throw error
    }
  }, [startTiming, endTiming])

  return {
    startTiming,
    endTiming,
    measureAsync
  }
}