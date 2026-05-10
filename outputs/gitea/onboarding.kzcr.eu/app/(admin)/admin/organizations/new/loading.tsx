import OrganizationPageHeader from '../components/OrganizationPageHeader'
import OrganizationFormSkeleton from '../components/OrganizationFormSkeleton'

export default function OrganizationNewLoading() {
  return (
    <div className="space-y-6">
      <OrganizationPageHeader
        backHref="/admin/organizations"
        backLabel="Zpět na seznam"
        title="Nová organizace"
        subtitle="Vytvořte novou organizaci v systému"
      />
      <OrganizationFormSkeleton />
    </div>
  )
}
