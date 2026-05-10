import OrganizationPageHeader from '../../components/OrganizationPageHeader'
import OrganizationFormSkeleton from '../../components/OrganizationFormSkeleton'

export default function OrganizationEditLoading() {
  return (
    <div className="space-y-6">
      <OrganizationPageHeader
        backHref="/admin/organizations"
        backLabel="Zpět na detail"
        title="Upravit organizaci"
        subtitle="Upravte základní informace organizace"
      />
      <OrganizationFormSkeleton />
    </div>
  )
}
