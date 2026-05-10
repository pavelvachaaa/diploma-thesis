import { Suspense } from 'react'
import { Building, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminPageErrorBoundary } from '@/components/admin'
import { requireAuth } from '@/lib/server/auth'
import { getOrganizationsServer } from '@/lib/server/organizations'
import OrganizationsFilters from './components/OrganizationsFilters'
import OrganizationsTable from './components/OrganizationsTable'
import OrganizationsTableSkeleton from './components/OrganizationsTableSkeleton'

/**
 * Organizations admin page - Server Component with RSC pattern
 */
export default async function AdminOrganizationsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  // 1. Authenticate user (redirects to /login if not authenticated)
  const user = await requireAuth(['super_admin'])
  const isSuperAdmin = user.roles.includes('super_admin')
  const canEdit = isSuperAdmin

  // 2. Parse URL search params (Next.js 15 requires await)
  const params = await searchParams
  const currentPage = parseInt(params.page || '0')
  const searchTerm = params.search || ''

  // 3. Fetch organizations data on server (cached for 60 seconds)
  const { data: organizations, pagination } = await getOrganizationsServer({
    page: currentPage,

    limit: 50,
    search: searchTerm
  })

  return (
    <AdminPageErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Správa organizací</h1>
              <p className="text-sm text-gray-600 mt-1">
                Přehled a správa organizací v systému
              </p>
            </div>
          </div>
          {isSuperAdmin && (
            <Link href="/admin/organizations/new">
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Nová organizace
              </Button>
            </Link>
          )}
        </div>

        {/* Main card */}
        <Card>
          <CardHeader>
            <CardTitle>Seznam organizací ({pagination.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search filter (client component for input handling) */}
            <OrganizationsFilters initialSearch={searchTerm} />

            {/* Table with Suspense boundary for progressive loading */}
            <Suspense fallback={<OrganizationsTableSkeleton />}>
              <OrganizationsTable
                organizations={organizations}
                pagination={pagination}
                currentPage={currentPage}
                isSuperAdmin={isSuperAdmin}
                canEdit={canEdit}
              />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </AdminPageErrorBoundary>
  )
}

// Metadata for SEO and browser tab
export const metadata = {
  title: 'Správa organizací',
  description: 'Přehled a správa organizací v systému'
}

export const dynamic = 'force-dynamic';
