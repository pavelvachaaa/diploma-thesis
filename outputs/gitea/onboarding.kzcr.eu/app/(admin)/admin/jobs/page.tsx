"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { PlusCircle, Edit, Trash2, Eye, Play, Square, Download, Archive, Copy } from "lucide-react"
import { useRouter } from "next/navigation"
import { AdminPageErrorBoundary, AdminComponentErrorBoundary, AdminTable, AdminFilters } from "@/components/admin"
import { useAdminJobs } from "@/hooks/admin"
import { getAllOrganizations, Organization } from "@/lib/api/organizations"
import { getAllContractTypes, ContractType } from "@/lib/api/contract-types"
import { updateJobStatus, duplicateJob, getAllJobPostingStatuses, type Job, type JobPostingStatus } from "@/lib/api/jobs"
import { getAllClassifications, type JobRoleClassification } from "@/lib/api/job-roles"
import { useDebounce } from "@/hooks/useDebounce"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import toast from "react-hot-toast"
import { formatDate } from "../applicants/[id]/utils/statusUtils"
import type { TableColumn, FilterDefinition } from "@/components/admin"
import { useAuth } from "@/context/AuthContext"
import { getAdminAccessConfig } from "@/lib/authorizedPersonAccess"

// ===================================================================
// TYPES
// ===================================================================

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface Filters {
  organization: string
  contractType: string
  status: string
  classification: string
}

type JobStatus = 'draft' | 'active' | 'expired' | 'archived' | 'end'

// ===================================================================
// CONSTANTS
// ===================================================================

const STATUS_CONFIG: Record<JobStatus, { label: string; className: string }> = {
  draft: {
    label: "Koncept",
    className: "bg-amber-50 text-amber-700 hover:bg-amber-50 hover:text-amber-700",
  },
  active: {
    label: "Aktivní",
    className: "bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700",
  },
  archived: {
    label: "Archivováno",
    className: "bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700",
  },
  expired: {
    label: "Vypršelo",
    className: "bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700",
  },
  end: {
    label: "Ukončeno",
    className: "bg-gray-50 text-gray-700 hover:bg-gray-50 hover:text-gray-700",
  },
}

// Define which status transitions are allowed
const STATUS_ACTIONS: Record<JobStatus, Array<{ targetStatus: 'active' | 'end' | 'archived'; icon: typeof Play; colorClass: string; label: string }>> = {
  draft: [
    { targetStatus: 'active', icon: Play, colorClass: "text-green-600 hover:text-green-700 hover:bg-green-50", label: "Aktivovat" },
    { targetStatus: 'archived', icon: Archive, colorClass: "text-blue-600 hover:text-blue-700 hover:bg-blue-50", label: "Archivovat" },
  ],
  active: [
    { targetStatus: 'end', icon: Square, colorClass: "text-gray-600 hover:text-gray-700 hover:bg-gray-50", label: "Ukončit" },
    { targetStatus: 'archived', icon: Archive, colorClass: "text-blue-600 hover:text-blue-700 hover:bg-blue-50", label: "Archivovat" },
  ],
  end: [
    { targetStatus: 'active', icon: Play, colorClass: "text-green-600 hover:text-green-700 hover:bg-green-50", label: "Aktivovat" },
    { targetStatus: 'archived', icon: Archive, colorClass: "text-blue-600 hover:text-blue-700 hover:bg-blue-50", label: "Archivovat" },
  ],
  expired: [
    { targetStatus: 'archived', icon: Archive, colorClass: "text-blue-600 hover:text-blue-700 hover:bg-blue-50", label: "Archivovat" },
  ],
  archived: [], // No actions for archived
}

// ===================================================================
// MAIN COMPONENT
// ===================================================================

export default function AdminJobsPage() {
  const router = useRouter()
  const { roles } = useAuth()
  const adminAccess = getAdminAccessConfig(roles)
  const readOnlyAdmin = adminAccess.authorizedPersonOnly
  const jobCapabilities = adminAccess.capabilities.jobs
  const {
    getAllJobs,
    deleteExistingJob,
    isJobLoading,
    getJobError,
    isActionLoading,
  } = useAdminJobs()

  const [jobs, setJobs] = useState<Job[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [contractTypes, setContractTypes] = useState<ContractType[]>([])
  const [jobStatuses, setJobStatuses] = useState<JobPostingStatus[]>([])
  const [classifications, setClassifications] = useState<JobRoleClassification[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<Filters>({
    organization: 'all',
    contractType: 'all',
    status: 'all',
    classification: 'all'
  })
  const [currentPage, setCurrentPage] = useState(0)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // ===================================================================
  // DATA LOADING
  // ===================================================================

  const loadInitialData = useCallback(async () => {
    try {
      if (readOnlyAdmin) {
        const [contractTypesData, statusesData] = await Promise.all([
          getAllContractTypes(),
          getAllJobPostingStatuses(),
        ])

        setOrganizations([])
        setContractTypes(contractTypesData)
        setJobStatuses(statusesData)
        setClassifications([])
        return
      }

      const [orgsResponse, contractTypesData, statusesData, classificationsData] = await Promise.all([
        getAllOrganizations(),
        getAllContractTypes(),
        getAllJobPostingStatuses(),
        getAllClassifications()
      ])
      setOrganizations(orgsResponse.data)
      setContractTypes(contractTypesData)
      setJobStatuses(statusesData)
      setClassifications(classificationsData)
    } catch (err) {
      console.error('Failed to load initial data:', err)
      toast.error('Chyba při načítání dat')
    }
  }, [readOnlyAdmin])

  const loadJobs = useCallback(async () => {
    const query = {
      page: currentPage,
      limit: 10,
      q: debouncedSearchTerm || undefined,
      org: filters.organization !== "all" ? filters.organization : undefined,
      contractType: filters.contractType !== "all" ? filters.contractType : undefined,
      status: filters.status !== "all" ? filters.status : undefined,
      classification: filters.classification !== "all" ? filters.classification : undefined,
      sortBy: sortConfig?.key,
      sortOrder: sortConfig?.direction
    }

    const response = await getAllJobs(query)
    setJobs(response.data)
    setPagination(response.pagination)
  }, [currentPage, debouncedSearchTerm, filters, sortConfig, getAllJobs])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  // ===================================================================
  // MEMOIZED BADGE RENDERER
  // ===================================================================

  const getStatusBadge = useCallback((status: string) => {
    const config = STATUS_CONFIG[status as JobStatus] || {
      label: status,
      className: "bg-gray-50 text-gray-700"
    }

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    )
  }, [])

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================

  const handleStatusUpdate = useCallback(async (jobId: string, newStatus: 'draft' | 'active' | 'end' | 'archived') => {
    try {
      await updateJobStatus(jobId, newStatus)

      // Optimistic update
      setJobs(prevJobs =>
        prevJobs.map(job =>
          job.id === jobId ? { ...job, status: newStatus } : job
        )
      )
      toast.success('Stav pozice byl úspěšně aktualizován')
    } catch (err) {
      console.error('Failed to update job status:', err)
      toast.error('Chyba při aktualizaci stavu pozice')
      // Reload on error to ensure consistency
      loadJobs()
    }
  }, [loadJobs])

  const handleDuplicateJob = useCallback(async (jobId: string, jobTitle: string) => {
    try {
      const newJob = await duplicateJob(jobId)
      toast.success(`Nabídka práce "${jobTitle}" byla úspěšně duplikována`)
      // Redirect to edit page of the new job
      router.push(`/admin/jobs/${newJob.id}/edit`)
    } catch (err) {
      console.error('Failed to duplicate job:', err)
      toast.error('Chyba při duplikaci nabídky práce')
    }
  }, [router])

  const handleDeleteJob = useCallback(async (jobId: string, jobTitle: string) => {
    if (!confirm(`Opravdu chcete smazat nabídku práce "${jobTitle}"? Tato akce je nevratná.`)) {
      return
    }

    const success = await deleteExistingJob(jobId)
    if (success) {
      toast.success(`Nabídka práce "${jobTitle}" byla úspěšně smazána`)
      loadJobs()
    } else {
      toast.error('Chyba při mazání nabídky práce. Zkuste to prosím znovu.')
    }
  }, [deleteExistingJob, loadJobs])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleFiltersChange = useCallback((newFilters: Record<string, string>) => {
    setFilters(newFilters as Filters)
    setCurrentPage(0) // Reset to first page when filters change
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    setCurrentPage(0)
  }, [])

  const handleSort = useCallback((key: string) => {
    setSortConfig((currentSort) => {
      if (currentSort?.key === key) {
        // Toggle direction or clear sort
        return currentSort.direction === 'asc'
          ? { key, direction: 'desc' }
          : null
      }
      // New sort column, default to ascending
      return { key, direction: 'asc' }
    })
  }, [])

  // ===================================================================
  // MEMOIZED STATUS ACTIONS RENDERER
  // ===================================================================

  const getStatusActions = useCallback((job: Job) => {
    const actions = STATUS_ACTIONS[job.status as JobStatus]

    if (!actions || actions.length === 0) return null
    if (!jobCapabilities.canChangeStatus) return null

    return (
      <>
        {actions.map((actionConfig) => {
          const Icon = actionConfig.icon
          return (
            <Button
              key={actionConfig.targetStatus}
              variant="ghost"
              size="sm"
              onClick={() => handleStatusUpdate(job.id, actionConfig.targetStatus)}
              disabled={isActionLoading(`update_${job.id}`)}
              className={actionConfig.colorClass}
              title={actionConfig.label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          )
        })}
      </>
    )
  }, [handleStatusUpdate, isActionLoading, jobCapabilities.canChangeStatus])

  // ===================================================================
  // MEMOIZED TABLE COLUMNS
  // ===================================================================

  const jobColumns: TableColumn<Job>[] = useMemo(() => [
    {
      key: 'title',
      title: 'Název pozice',
      sortable: true
    },
    {
      key: 'organization_name',
      title: 'Nemocnice',
      render: (value) => value || '-'
    },
    {
      key: 'department',
      title: 'Oddělení',
      render: (value) => value || '-'
    },
    {
      key: 'contract_type_label',
      title: 'Typ',
      render: (value) => value || '-'
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'publish_date',
      title: 'Zveřejněno',
      sortable: true,
      render: (value) => value ? formatDate(value) : '-'
    },
    {
      key: 'created_by',
      title: 'Autor',
      render: (_, job) => {
        if (job.created_by_name && job.created_by_surname) {
          return `${job.created_by_name} ${job.created_by_surname}`
        }
        return '-'
      }
    },
    {
      key: 'actions',
      title: 'Akce',
      className: 'text-right',
      render: (_, job) => (
        <div className="flex justify-end gap-1">
          {getStatusActions(job)}
          <Link href={`/admin/jobs/${job.id}`} prefetch={false}>
            <Button variant="ghost" size="sm" title="Zobrazit detail">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          {jobCapabilities.canEdit && job.status !== 'archived' && (
            <Link href={`/admin/jobs/${job.id}/edit`} prefetch={false}>
              <Button variant="ghost" size="sm" title="Upravit">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
          )}
          {(jobCapabilities.canDuplicate || jobCapabilities.canDelete) && (
            <>
              {jobCapabilities.canDuplicate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDuplicateJob(job.id, job.title)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  title="Duplikovat"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              {jobCapabilities.canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteJob(job.id, job.title)}
                  disabled={isActionLoading(`delete_${job.id}`)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Smazat"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      )
    }
  ], [getStatusBadge, getStatusActions, handleDuplicateJob, handleDeleteJob, isActionLoading, jobCapabilities.canDelete, jobCapabilities.canDuplicate, jobCapabilities.canEdit])

  // ===================================================================
  // MEMOIZED FILTER DEFINITIONS
  // ===================================================================

  const filterDefinitions: FilterDefinition[] = useMemo(() => {
    const filters: FilterDefinition[] = []

    if (jobCapabilities.canCreate) {
      filters.push(
        {
          key: 'organization',
          label: 'Závod',
          type: 'select',
          options: [
            { value: 'all', label: 'Všechny závody' },
            ...organizations.map(org => ({ value: org.id, label: org.name }))
          ],
          defaultValue: 'all'
        },
        {
          key: 'classification',
          label: 'Zařazení',
          type: 'select',
          options: [
            { value: 'all', label: 'Všechna zařazení' },
            ...classifications.map(c => ({ value: c.code, label: c.label }))
          ],
          defaultValue: 'all'
        }
      )
    }

    filters.push(
      {
        key: 'contractType',
        label: 'Typ úvazku',
        type: 'select',
        options: [
          { value: 'all', label: 'Všechny typy' },
          ...contractTypes.map(ct => ({ value: ct.code, label: ct.description }))
        ],
        defaultValue: 'all'
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'all', label: 'Všechny stavy' },
          ...jobStatuses.map(status => ({ value: status.code, label: status.label }))
        ],
        defaultValue: 'all'
      }
    )

    return filters
  }, [jobCapabilities.canCreate, organizations, classifications, contractTypes, jobStatuses])

  // ===================================================================
  // RENDER
  // ===================================================================

  return (
    <AdminPageErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pracovní nabídky</h1>
            <p className="text-muted-foreground">Správa všech pracovních nabídek v systému</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadJobs} disabled={isJobLoading('list')}>
              <Download className="mr-2 h-4 w-4" />
              {isJobLoading('list') ? 'Načítá...' : 'Obnovit'}
            </Button>
            {jobCapabilities.canCreate && (
              <Link href="/admin/jobs/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Přidat nabídku práce
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Error Display */}
        {getJobError('list') && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {getJobError('list')}
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              Přehled nabídek {pagination && `(${pagination.total})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <AdminComponentErrorBoundary componentName="JobFilters">
              <AdminFilters
                filters={filterDefinitions}
                values={filters}
                onChange={handleFiltersChange}
                searchPlaceholder="Hledat podle názvu, oddělení..."
                searchValue={searchTerm}
                onSearchChange={handleSearchChange}
                variant="inline"
              />
            </AdminComponentErrorBoundary>
            <div className="p-2"></div>
            {/* Jobs Table */}
            <AdminComponentErrorBoundary componentName="JobsTable">
              <AdminTable
                data={jobs}
                columns={jobColumns}
                loading={isJobLoading('list')}
                error={getJobError('list') || undefined}
                sortConfig={sortConfig}
                onSort={handleSort}
                pagination={pagination ? {
                  page: pagination.page,
                  limit: pagination.limit,
                  total: pagination.total,
                  totalPages: pagination.totalPages
                } : undefined}
                onPageChange={handlePageChange}
                emptyMessage="Žádné nabídky práce nenalezeny"
              />
            </AdminComponentErrorBoundary>
          </CardContent>
        </Card>
      </div>
    </AdminPageErrorBoundary>
  )
}
