"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminPageErrorBoundary, AdminComponentErrorBoundary, AdminTable, AdminFilters } from "@/components/admin"
import { useAdminApplicants } from "@/hooks/admin"
import { Search, UserPlus, Filter, Download, Eye, Edit } from "lucide-react"
import { type Applicant, type ApplicantsQuery } from "@/lib/api/applicants"
import { useDebounce } from "@/hooks/useDebounce"
import type { TableColumn, FilterDefinition } from "@/components/admin"
import { useAuth } from "@/context/AuthContext"
import { getAdminAccessConfig } from "@/lib/authorizedPersonAccess"

export default function AdminApplicantsPage() {
    const { roles } = useAuth()
    const adminAccess = getAdminAccessConfig(roles)
    const readOnlyAdmin = adminAccess.authorizedPersonOnly
    const { 
        getAllApplicantsList,
        refreshApplicants,
        isApplicantLoading,
        getApplicantError,
    } = useAdminApplicants()
    
    const [applicants, setApplicants] = useState<Applicant[]>([])
    const [pagination, setPagination] = useState<any>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [filters, setFilters] = useState({
        organization: 'all',
        position: 'all',
        status: 'all'
    })
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize] = useState(10)
    const [allOrganizations, setAllOrganizations] = useState<string[]>([])
    const [allPositions, setAllPositions] = useState<string[]>([])

    const debouncedSearchTerm = useDebounce(searchTerm, 500)

    useEffect(() => {
        loadApplicants()
    }, [currentPage, pageSize, debouncedSearchTerm, filters])

    useEffect(() => {
        loadInitialData()
    }, [])

    const loadInitialData = async () => {
        try {
            // Get all data without pagination to build filter options
            const response = await getAllApplicantsList({ limit: 1000 })
            if (response) {
                const uniqueOrgs = [...new Set(response.data.map(a => a.organization_name))]
                const uniquePos = [...new Set(response.data.map(a => a.job_title))]
                setAllOrganizations(uniqueOrgs)
                setAllPositions(uniquePos)
            }
        } catch (err) {
            console.error('Failed to load filter data:', err)
        }
    }

    const loadApplicants = async () => {
        const query: ApplicantsQuery = {
            page: currentPage + 1, // Convert from 0-based to 1-based
            limit: pageSize,
            search: debouncedSearchTerm || undefined,
            organization: filters.organization !== "all" ? filters.organization : undefined,
            status: filters.status !== "all" ? getStatusFromTab(filters.status) : undefined
        }
        
        const response = await getAllApplicantsList(query)
        if (response) {
            setApplicants(response.data)
            setPagination(response.pagination)
        }
    }

    const forceRefreshApplicants = async () => {
        const query: ApplicantsQuery = {
            page: currentPage + 1, // Convert from 0-based to 1-based
            limit: pageSize,
            search: debouncedSearchTerm || undefined,
            organization: filters.organization !== "all" ? filters.organization : undefined,
            status: filters.status !== "all" ? getStatusFromTab(filters.status) : undefined
        }
        
        const response = await refreshApplicants(query)
        if (response) {
            setApplicants(response.data)
            setPagination(response.pagination)
        }
    }

    const getStatusFromTab = (tab: string) => {
        switch (tab) {
            case "submitted": return "submitted"
            case "under_review": return "under_review"
            case "interview": return "interview_scheduled,interview_completed"
            case "accepted": return "accepted"
            default: return undefined
        }
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleFiltersChange = (newFilters: any) => {
        setFilters(newFilters)
        setCurrentPage(0) // Reset to first page when filters change
    }

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        setCurrentPage(0)
    }

    const getStatusBadge = (status: string) => {
        const statusMap = {
            submitted: { label: "Odesláno", className: "bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700" },
            under_review: { label: "Posuzováno", className: "bg-yellow-50 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-700" },
            interview_scheduled: { label: "Pohovor naplánován", className: "bg-purple-50 text-purple-700 hover:bg-purple-50 hover:text-purple-700" },
            interview_completed: { label: "Pohovor dokončen", className: "bg-indigo-50 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-700" },
            accepted: { label: "Přijato", className: "bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700" },
            rejected: { label: "Zamítnuto", className: "bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700" }
        }
        
        const config = statusMap[status as keyof typeof statusMap] || { label: status, className: "bg-gray-50 text-gray-700" }
        
        return (
            <Badge variant="outline" className={config.className}>
                {config.label}
            </Badge>
        )
    }

    // Define columns for AdminTable
    const applicantColumns: TableColumn<Applicant>[] = [
        {
            key: 'name',
            title: 'Jméno',
            sortable: true,
            render: (value, applicant) => `${applicant.name} ${applicant.surname}`
        },
        {
            key: 'email',
            title: 'Email',
            sortable: true
        },
        {
            key: 'job_title',
            title: 'Pozice',
            render: (value) => value || '-'
        },
        {
            key: 'organization_name',
            title: 'Nemocnice',
            render: (value) => value || '-'
        },
        {
            key: 'current_status',
            title: 'Status',
            render: (value) => getStatusBadge(value)
        },
        {
            key: 'applied_at',
            title: 'Přihlášen',
            render: (value) => value ? new Date(value).toLocaleDateString('cs-CZ') : '-'
        },
        {
            key: 'actions',
            title: 'Akce',
            className: 'text-right',
            render: (_, applicant) => (
                <div className="flex justify-end gap-1">
                    <Link href={`/admin/applicants/${applicant.id}`} prefetch={false}>
                        <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    {!readOnlyAdmin && (
                        <Link href={`/admin/applicants/${applicant.id}/edit`} prefetch={false}>
                            <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </Link>
                    )}
                </div>
            )
        }
    ]

    // Filter definitions for AdminFilters
    const filterDefinitions: FilterDefinition[] = [
        {
            key: 'organization',
            label: 'Nemocnice',
            type: 'select',
            options: [
                { value: 'all', label: 'Všechny nemocnice' },
                ...allOrganizations.map(org => ({ value: org, label: org }))
            ],
            defaultValue: 'all'
        },
        {
            key: 'position', 
            label: 'Pozice',
            type: 'select',
            options: [
                { value: 'all', label: 'Všechny pozice' },
                ...allPositions.map(pos => ({ value: pos, label: pos }))
            ],
            defaultValue: 'all'
        },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'all', label: 'Všechny stavy' },
                { value: 'submitted', label: 'Odesláno' },
                { value: 'under_review', label: 'Posuzováno' },
                { value: 'interview', label: 'Pohovor' },
                { value: 'accepted', label: 'Přijato' }
            ],
            defaultValue: 'all'
        }
    ]

    return (
        <AdminPageErrorBoundary>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Uchazeči</h1>
                        <p className="text-muted-foreground">Správa uchazečů o zaměstnání</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={forceRefreshApplicants} disabled={isApplicantLoading('list')}>
                            <Download className="mr-2 h-4 w-4" />
                            {isApplicantLoading('list') ? 'Načítá...' : 'Obnovit'}
                        </Button>
                    </div>
                </div>

                {/* Error Display */}
                {getApplicantError('list') && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                        {getApplicantError('list')}
                    </div>
                )}

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>
                            Přehled uchazečů {pagination && `(${pagination.total})`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <AdminComponentErrorBoundary componentName="ApplicantFilters">
                            <AdminFilters
                                filters={filterDefinitions}
                                values={filters}
                                onChange={handleFiltersChange}
                                searchPlaceholder="Hledat podle jména, pozice..."
                                searchValue={searchTerm}
                                onSearchChange={handleSearchChange}
                                variant="inline"
                            />
                        </AdminComponentErrorBoundary>

                        {/* Applicants Table */}
                        <AdminComponentErrorBoundary componentName="ApplicantsTable">
                            <AdminTable
                                data={applicants}
                                columns={applicantColumns}
                                loading={isApplicantLoading('list')}
                                error={getApplicantError('list')}
                                pagination={pagination ? {
                                    page: pagination.page - 1, // Convert from 1-based to 0-based
                                    limit: pagination.limit,
                                    total: pagination.total,
                                    totalPages: pagination.totalPages
                                } : undefined}
                                onPageChange={handlePageChange}
                                emptyMessage="Žádní uchazeči nenalezeni"
                            />
                        </AdminComponentErrorBoundary>
                    </CardContent>
                </Card>
            </div>
        </AdminPageErrorBoundary>
    )
}
