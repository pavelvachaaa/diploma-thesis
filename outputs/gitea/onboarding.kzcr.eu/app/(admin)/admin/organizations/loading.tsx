import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Building } from 'lucide-react'

/**
 * Page-level loading state for organizations page.
 * Shown while server component is fetching data.
 *
 * Automatically used by Next.js when page.tsx is loading.
 */
export default function OrganizationsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-primary animate-pulse" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Card skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search input skeleton */}
          <Skeleton className="h-10 w-full" />

          {/* Table skeleton */}
          <div className="rounded-md border p-4">
            <Skeleton className="h-64 w-full" />
          </div>

          {/* Pagination skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
