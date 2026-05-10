import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function OrganizationDetailSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Základní informace</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Název organizace</dt>
            <Skeleton className="h-5 w-48 mt-1" />
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Kód sídla</dt>
            <Skeleton className="h-5 w-16 mt-1" />
          </div>

          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Adresa</dt>
            <Skeleton className="h-5 w-full mt-1" />
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Kontaktní e-mail</dt>
            <Skeleton className="h-5 w-56 mt-1" />
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
