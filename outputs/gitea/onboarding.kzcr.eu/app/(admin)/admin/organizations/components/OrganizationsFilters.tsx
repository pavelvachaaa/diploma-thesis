'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/useDebounce'

interface OrganizationsFiltersProps {
  initialSearch: string
}

export default function OrganizationsFilters({ initialSearch }: OrganizationsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(initialSearch)
  const debouncedSearch = useDebounce(search, 500)

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (debouncedSearch) {
      params.set('search', debouncedSearch)
    } else {
      params.delete('search')
    }

    // Reset to page 0 on search
    params.delete('page')

    // Prevent infinite loops by comparing the new query string to the current one
    const currentQuery = searchParams.toString()
    const newQuery = params.toString()

    if (currentQuery !== newQuery) {
      startTransition(() => {
        router.push(`?${newQuery}`)
      })
    }
  }, [debouncedSearch, router, searchParams])

  return (
    <div className="mb-6">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Hledat podle názvu..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={isPending}
        />
      </div>
    </div>
  )
}