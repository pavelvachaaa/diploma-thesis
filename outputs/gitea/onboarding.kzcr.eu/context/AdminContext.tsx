"use client"

import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react'

// Types for admin state management
export interface AdminState {
  // Cache for frequently accessed data
  cache: {
    employees: Map<string, any>
    applicants: Map<string, any>
    jobs: Map<string, any>
    workflows: Map<string, any>
    forms: Map<string, any>
    organizations: Map<string, any>
  }
  // Loading states for different operations
  loading: {
    employees: Set<string>
    applicants: Set<string>
    jobs: Set<string>
    workflows: Set<string>
    forms: Set<string>
    organizations: Set<string>
  }
  // Error states
  errors: {
    employees: Map<string, string>
    applicants: Map<string, string>
    jobs: Map<string, string>
    workflows: Map<string, string>
    forms: Map<string, string>
    organizations: Map<string, string>
  }
  // UI state
  ui: {
    selectedItems: Set<string>
    filters: Record<string, any>
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null
    pagination: { page: number; limit: number }
  }
}

type AdminAction = 
  | { type: 'SET_LOADING'; entityType: keyof AdminState['loading']; id: string; loading: boolean }
  | { type: 'SET_CACHE'; entityType: keyof AdminState['cache']; id: string; data: any }
  | { type: 'SET_ERROR'; entityType: keyof AdminState['errors']; id: string; error: string | null }
  | { type: 'CLEAR_CACHE'; entityType?: keyof AdminState['cache'] }
  | { type: 'CLEAR_CACHE_PATTERN'; entityType: keyof AdminState['cache']; pattern: string }
  | { type: 'SET_UI_STATE'; key: keyof AdminState['ui']; value: any }
  | { type: 'TOGGLE_SELECTION'; id: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'BULK_SET_CACHE'; entityType: keyof AdminState['cache']; items: Record<string, any> }

const initialState: AdminState = {
  cache: {
    employees: new Map(),
    applicants: new Map(),
    jobs: new Map(),
    workflows: new Map(),
    forms: new Map(),
    organizations: new Map(),
  },
  loading: {
    employees: new Set(),
    applicants: new Set(),
    jobs: new Set(),
    workflows: new Set(),
    forms: new Set(),
    organizations: new Set(),
  },
  errors: {
    employees: new Map(),
    applicants: new Map(),
    jobs: new Map(),
    workflows: new Map(),
    forms: new Map(),
    organizations: new Map(),
  },
  ui: {
    selectedItems: new Set(),
    filters: {},
    sortConfig: null,
    pagination: { page: 0, limit: 10 },
  },
}

function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'SET_LOADING': {
      const newLoading = new Set(state.loading[action.entityType])
      if (action.loading) {
        newLoading.add(action.id)
      } else {
        newLoading.delete(action.id)
      }
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.entityType]: newLoading,
        },
      }
    }

    case 'SET_CACHE': {
      const newCache = new Map(state.cache[action.entityType])
      newCache.set(action.id, action.data)
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.entityType]: newCache,
        },
      }
    }

    case 'BULK_SET_CACHE': {
      const newCache = new Map(state.cache[action.entityType])
      Object.entries(action.items).forEach(([id, data]) => {
        newCache.set(id, data)
      })
      return {
        ...state,
        cache: {
          ...state.cache,
          [action.entityType]: newCache,
        },
      }
    }

    case 'SET_ERROR': {
      const newErrors = new Map(state.errors[action.entityType])
      if (action.error) {
        newErrors.set(action.id, action.error)
      } else {
        newErrors.delete(action.id)
      }
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.entityType]: newErrors,
        },
      }
    }

    case 'CLEAR_CACHE': {
      if (action.entityType) {
        return {
          ...state,
          cache: {
            ...state.cache,
            [action.entityType]: new Map(),
          },
        }
      }
      return {
        ...state,
        cache: {
          employees: new Map(),
          applicants: new Map(),
          jobs: new Map(),
          workflows: new Map(),
          forms: new Map(),
          organizations: new Map(),
        },
      }
    }

    case 'CLEAR_CACHE_PATTERN': {
      const { entityType, pattern } = action
      const currentCache = state.cache[entityType]
      const newCache = new Map()
      
      // Keep only entries that don't match the pattern
      for (const [key, value] of currentCache) {
        if (!key.startsWith(pattern)) {
          newCache.set(key, value)
        }
      }
      
      return {
        ...state,
        cache: {
          ...state.cache,
          [entityType]: newCache,
        },
      }
    }

    case 'SET_UI_STATE': {
      return {
        ...state,
        ui: {
          ...state.ui,
          [action.key]: action.value,
        },
      }
    }

    case 'TOGGLE_SELECTION': {
      const newSelection = new Set(state.ui.selectedItems)
      if (newSelection.has(action.id)) {
        newSelection.delete(action.id)
      } else {
        newSelection.add(action.id)
      }
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedItems: newSelection,
        },
      }
    }

    case 'CLEAR_SELECTION': {
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedItems: new Set(),
        },
      }
    }

    default:
      return state
  }
}

interface AdminContextType {
  state: AdminState
  dispatch: React.Dispatch<AdminAction>
  // Helper functions
  setLoading: (entityType: keyof AdminState['loading'], id: string, loading: boolean) => void
  setCache: (entityType: keyof AdminState['cache'], id: string, data: any) => void
  bulkSetCache: (entityType: keyof AdminState['cache'], items: Record<string, any>) => void
  setError: (entityType: keyof AdminState['errors'], id: string, error: string | null) => void
  clearCache: (entityType?: keyof AdminState['cache']) => void
  clearCachePattern: (entityType: keyof AdminState['cache'], pattern: string) => void
  getFromCache: (entityType: keyof AdminState['cache'], id: string) => any
  isLoading: (entityType: keyof AdminState['loading'], id: string) => boolean
  getError: (entityType: keyof AdminState['errors'], id: string) => string | null
  toggleSelection: (id: string) => void
  clearSelection: () => void
  setFilters: (filters: Record<string, any>) => void
  setSortConfig: (config: { key: string; direction: 'asc' | 'desc' } | null) => void
  setPagination: (pagination: { page: number; limit: number }) => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(adminReducer, initialState)

  const setLoading = useCallback((entityType: keyof AdminState['loading'], id: string, loading: boolean) => {
    dispatch({ type: 'SET_LOADING', entityType, id, loading })
  }, [])

  const setCache = useCallback((entityType: keyof AdminState['cache'], id: string, data: any) => {
    dispatch({ type: 'SET_CACHE', entityType, id, data })
  }, [])

  const bulkSetCache = useCallback((entityType: keyof AdminState['cache'], items: Record<string, any>) => {
    dispatch({ type: 'BULK_SET_CACHE', entityType, items })
  }, [])

  const setError = useCallback((entityType: keyof AdminState['errors'], id: string, error: string | null) => {
    dispatch({ type: 'SET_ERROR', entityType, id, error })
  }, [])

  const clearCache = useCallback((entityType?: keyof AdminState['cache']) => {
    dispatch({ type: 'CLEAR_CACHE', entityType })
  }, [])

  const clearCachePattern = useCallback((entityType: keyof AdminState['cache'], pattern: string) => {
    dispatch({ type: 'CLEAR_CACHE_PATTERN', entityType, pattern })
  }, [])

  const getFromCache = useCallback((entityType: keyof AdminState['cache'], id: string) => {
    return state.cache[entityType].get(id)
  }, [state.cache])

  const isLoading = useCallback((entityType: keyof AdminState['loading'], id: string) => {
    return state.loading[entityType].has(id)
  }, [state.loading])

  const getError = useCallback((entityType: keyof AdminState['errors'], id: string) => {
    return state.errors[entityType].get(id) || null
  }, [state.errors])

  const toggleSelection = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_SELECTION', id })
  }, [])

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' })
  }, [])

  const setFilters = useCallback((filters: Record<string, any>) => {
    dispatch({ type: 'SET_UI_STATE', key: 'filters', value: filters })
  }, [])

  const setSortConfig = useCallback((config: { key: string; direction: 'asc' | 'desc' } | null) => {
    dispatch({ type: 'SET_UI_STATE', key: 'sortConfig', value: config })
  }, [])

  const setPagination = useCallback((pagination: { page: number; limit: number }) => {
    dispatch({ type: 'SET_UI_STATE', key: 'pagination', value: pagination })
  }, [])

  const value: AdminContextType = {
    state,
    dispatch,
    setLoading,
    setCache,
    bulkSetCache,
    setError,
    clearCache,
    clearCachePattern,
    getFromCache,
    isLoading,
    getError,
    toggleSelection,
    clearSelection,
    setFilters,
    setSortConfig,
    setPagination,
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdminContext() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdminContext must be used within an AdminProvider')
  }
  return context
}