import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

/**
 * Loading skeleton for organizations table.
 * Server component (no "use client" needed) - used in Suspense fallback.
 *
 * @example
 * <Suspense fallback={<OrganizationsTableSkeleton />}>
 *   <OrganizationsTable data={data} />
 * </Suspense>
 */
export default function OrganizationsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Název</TableHead>
              <TableHead>Kód sídla</TableHead>
              <TableHead>Adresa</TableHead>
              <TableHead>Kontaktní e-mail</TableHead>
              <TableHead>Akce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-24" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  )
}
