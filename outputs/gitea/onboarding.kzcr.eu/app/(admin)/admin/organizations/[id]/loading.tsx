import OrganizationPageHeader from '../components/OrganizationPageHeader'
import OrganizationDetailSkeleton from '../components/OrganizationDetailSkeleton'

export default function OrganizationDetailLoading() {
  return (
    <div className="space-y-6">
      <OrganizationPageHeader
        backHref="/admin/organizations"
        backLabel="Zpět na seznam"
        title=""
        subtitle="Detail organizace"
        loading
      />
      <OrganizationDetailSkeleton />
    </div>
  )
}
