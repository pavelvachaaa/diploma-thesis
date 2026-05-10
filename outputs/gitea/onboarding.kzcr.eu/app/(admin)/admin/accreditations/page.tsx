"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { AdminComponentErrorBoundary, AdminFilters, AdminPageErrorBoundary, AdminTable } from "@/components/admin"
import type { FilterDefinition, TableColumn } from "@/components/admin"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ADMIN_OPERATOR_AND_SUPER_ADMIN_ROLES } from "@/lib/authorizedPersonAccess"
import { getAllOrganizations, type Organization } from "@/lib/api/organizations"
import {
  getMzcrAccreditationMeta,
  getMzcrAccreditations,
  type MzcrAccreditation,
  type MzcrAccreditationsResponse,
} from "@/lib/api/mzcr-accreditations"
import { useDebounce } from "@/hooks/useDebounce"

const DEFAULT_FILTERS = {
  organizationId: "all",
  validity: "valid",
  specialtyType: "all",
}

const formatDate = (value?: string | null) => {
  if (!value) return "-"
  return new Intl.DateTimeFormat("cs-CZ").format(new Date(value))
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "-"
  return new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

const yesNoBadgeClass = (value: unknown) => (
  value
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-yellow-200 bg-yellow-50 text-yellow-800"
)

const validityBadgeClass = (value: unknown) => (
  value
    ? "border-green-200 bg-green-50 text-green-700"
    : "border-slate-200 bg-slate-50 text-slate-700"
)

export default function MzcrAccreditationsPage() {
  const [accreditations, setAccreditations] = useState<MzcrAccreditation[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [specialtyTypes, setSpecialtyTypes] = useState<Array<{ value: string; label: string }>>([])
  const [pagination, setPagination] = useState<MzcrAccreditationsResponse["pagination"] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(25)

  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const loadMetadata = useCallback(async () => {
    try {
      const [organizationsResponse, meta] = await Promise.all([
        getAllOrganizations({ limit: 100 }),
        getMzcrAccreditationMeta(),
      ])
      setOrganizations(organizationsResponse.data)
      setSpecialtyTypes(meta.specialtyTypes)
    } catch (err) {
      console.error("Failed to load MZCR accreditation metadata:", err)
    }
  }, [])

  const loadAccreditations = useCallback(async () => {
    try {
      setLoading(true)
      setError(undefined)

      const response = await getMzcrAccreditations({
        page: currentPage,
        limit: pageSize,
        organizationId: filters.organizationId,
        validity: filters.validity as "valid" | "all" | "invalid",
        specialtyType: filters.specialtyType,
        q: debouncedSearchTerm,
      })

      setAccreditations(response.data)
      setPagination(response.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při načítání akreditací")
      setAccreditations([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearchTerm, filters, pageSize])

  useEffect(() => {
    loadMetadata()
  }, [loadMetadata])

  useEffect(() => {
    loadAccreditations()
  }, [loadAccreditations])

  const handleFiltersChange = (newFilters: Record<string, string | undefined>) => {
    setFilters({
      organizationId: newFilters.organizationId || "all",
      validity: newFilters.validity || "valid",
      specialtyType: newFilters.specialtyType || "all",
    })
    setCurrentPage(0)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(0)
  }

  const filterDefinitions: FilterDefinition[] = useMemo(() => [
    {
      key: "organizationId",
      label: "Organizace",
      type: "select",
      defaultValue: "all",
      options: [
        { value: "all", label: "Všechny organizace" },
        ...organizations.map((organization) => ({
          value: organization.id,
          label: organization.name,
        })),
      ],
    },
    {
      key: "validity",
      label: "Platnost",
      type: "select",
      defaultValue: "valid",
      options: [
        { value: "valid", label: "Pouze platné" },
        { value: "all", label: "Všechny" },
        { value: "invalid", label: "Neplatné" },
      ],
    },
    {
      key: "specialtyType",
      label: "Typ specializace",
      type: "select",
      defaultValue: "all",
      options: [
        { value: "all", label: "Všechny typy" },
        ...specialtyTypes.map((type) => ({
          value: type.value,
          label: type.label,
        })),
      ],
    },
  ], [organizations, specialtyTypes])

  const columns: TableColumn<MzcrAccreditation>[] = [
    {
      key: "organization_name",
      title: "Organizace",
      width: "220px",
      className: "w-[220px]",
      render: (_value, item) => (
        <div className="min-w-0">
          <div className="truncate font-medium" title={item.organization_name || undefined}>
            {item.organization_name || "-"}
          </div>
          {item.organization_seat_location && (
            <div className="text-xs text-muted-foreground">{item.organization_seat_location}</div>
          )}
        </div>
      ),
    },
    {
      key: "specialty_type_label_cs",
      title: "Typ specializace",
      width: "180px",
      className: "w-[180px]",
      render: (value) => (
        <span className="block truncate" title={value || undefined}>
          {value || "-"}
        </span>
      ),
    },
    {
      key: "specialty_name",
      title: "Specializace",
      width: "260px",
      className: "w-[260px]",
      render: (value) => (
        <span className="block truncate font-medium" title={value || undefined}>
          {value || "-"}
        </span>
      ),
    },
    {
      key: "workplace_type_names",
      title: "Typ pracoviště",
      width: "240px",
      className: "w-[240px]",
      render: (_value, item) => {
        const names = item.workplace_type_names || []
        if (names.length === 0) {
          return <span className="text-muted-foreground">-</span>
        }

        return (
          <div className="flex min-w-0 flex-wrap gap-1">
            {names.map((name) => (
              <Badge
                key={name}
                variant="outline"
                className="min-w-0 max-w-full shrink border-slate-200 bg-slate-50 text-slate-700"
                title={name}
              >
                <span className="min-w-0 truncate">{name}</span>
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      key: "valid_from",
      title: "Platnost od",
      width: "120px",
      className: "w-[120px] whitespace-nowrap",
      render: (value) => formatDate(value),
    },
    {
      key: "valid_to",
      title: "Platnost do",
      width: "120px",
      className: "w-[120px] whitespace-nowrap",
      render: (value) => formatDate(value),
    },
    {
      key: "is_full",
      title: "Úplná",
      width: "100px",
      className: "w-[100px]",
      render: (value) => (
        <Badge variant="outline" className={yesNoBadgeClass(value)}>
          {value ? "Ano" : "Ne"}
        </Badge>
      ),
    },
    {
      key: "is_currently_valid",
      title: "Stav",
      width: "110px",
      className: "w-[110px]",
      render: (value) => (
        <Badge variant="outline" className={validityBadgeClass(value)}>
          {value ? "Platná" : "Neplatná"}
        </Badge>
      ),
    },
    {
      key: "last_synced_at",
      title: "Synchronizace",
      width: "170px",
      className: "w-[170px] whitespace-nowrap",
      render: (value) => formatDateTime(value),
    },
  ]

  return (
    <ProtectedRoute requiredRoles={[...ADMIN_OPERATOR_AND_SUPER_ADMIN_ROLES]}>
      <AdminPageErrorBoundary>
        <div className="min-w-0 space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Akreditace</h1>
            <p className="text-muted-foreground">
              Přehled akreditací MZČR synchronizovaných pro Krajskou zdravotní.
            </p>
          </div>

          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <CardTitle>
                Přehled akreditací {pagination && `(${pagination.total})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="min-w-0">
              <AdminComponentErrorBoundary componentName="MzcrAccreditationFilters">
                <AdminFilters
                  filters={filterDefinitions}
                  values={filters}
                  onChange={handleFiltersChange}
                  searchValue={searchTerm}
                  onSearchChange={handleSearchChange}
                  searchPlaceholder="Hledat podle názvu specializace..."
                  variant="inline"
                  onReset={() => {
                    setFilters(DEFAULT_FILTERS)
                    setSearchTerm("")
                    setCurrentPage(0)
                  }}
                />
              </AdminComponentErrorBoundary>

              <AdminComponentErrorBoundary componentName="MzcrAccreditationTable">
                <div className="mt-6 min-w-0">
                  <AdminTable
                    data={accreditations}
                    columns={columns}
                    loading={loading}
                    error={error}
                    pagination={pagination || undefined}
                    onPageChange={setCurrentPage}
                    getItemId={(item) => String(item.id_akreditace)}
                    emptyMessage="Žádné akreditace nenalezeny"
                    className="[&_table]:min-w-[1240px] [&_table]:table-fixed"
                  />
                </div>
              </AdminComponentErrorBoundary>
            </CardContent>
          </Card>
        </div>
      </AdminPageErrorBoundary>
    </ProtectedRoute>
  )
}
