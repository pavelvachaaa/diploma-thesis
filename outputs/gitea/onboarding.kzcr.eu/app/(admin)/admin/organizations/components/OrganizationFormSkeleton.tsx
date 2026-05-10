import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'

export default function OrganizationFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Základní informace</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Název organizace <span className="text-red-500">*</span></Label>
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <Label>Kód sídla</Label>
          <Skeleton className="h-10 w-full" />
          <p className="text-sm text-gray-500">Maximálně 3 znaky</p>
        </div>

        <div className="space-y-2">
          <Label>Adresa</Label>
          <Skeleton className="h-20 w-full" />
        </div>

        <div className="space-y-2">
          <Label>Kontaktní e-mail</Label>
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}
