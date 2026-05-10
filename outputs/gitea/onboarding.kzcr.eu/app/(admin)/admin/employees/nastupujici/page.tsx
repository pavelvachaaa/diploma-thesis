"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Users, Download, Eye, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminPageErrorBoundary, AdminComponentErrorBoundary, AdminTable, AdminFilters } from "@/components/admin"
import { useAdminEmployees } from "@/hooks/admin"
import { useDebounce } from "@/hooks/useDebounce"
import { type Employee, type EmployeesQuery } from "@/lib/api/employees"
import { getAllOrganizations, type Organization } from "@/lib/api/organizations"
import { formatDate } from "../../applicants/[id]/utils/statusUtils"
import type { TableColumn, FilterDefinition } from "@/components/admin"


export default function NastupujiciPage() {
    const {
        getAllEmployeesList,
        refreshEmployees,
        isEmployeeLoading,
        getEmployeeError,
    } = useAdminEmployees()

    const [employees, setEmployees] = useState<Employee[]>([])
    const [pagination, setPagination] = useState<any>(null)
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [filters, setFilters] = useState({
        organization: 'all'
    })
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize] = useState(10)

    const debouncedSearchTerm = useDebounce(searchTerm, 500)

    useEffect(() => {
        loadEmployees()
    }, [currentPage, pageSize, debouncedSearchTerm, filters])

    useEffect(() => {
        loadOrganizations()
    }, [])

    const loadOrganizations = async () => {
        try {
            const response = await getAllOrganizations()
            setOrganizations(response.data)
        } catch (err) {
            console.error('Failed to load organizations:', err)
        }
    }

    const loadEmployees = async () => {
        const query: EmployeesQuery = {
            page: currentPage + 1,
            limit: pageSize,
            search: debouncedSearchTerm || undefined,
            role: 'user',
            organization: filters.organization !== "all" ? filters.organization : undefined
        }

        const response = await getAllEmployeesList(query)
        if (response) {
            setEmployees(response.data)
            setPagination(response.pagination)
        }
    }

    const forceRefreshEmployees = async () => {
        const query: EmployeesQuery = {
            page: currentPage + 1,
            limit: pageSize,
            search: debouncedSearchTerm || undefined,
            role: 'user',
            organization: filters.organization !== "all" ? filters.organization : undefined
        }

        const response = await refreshEmployees(query)
        if (response) {
            setEmployees(response.data)
            setPagination(response.pagination)
        }
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleFiltersChange = (newFilters: any) => {
        setFilters(newFilters)
        setCurrentPage(0)
    }

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        setCurrentPage(0)
    }

    const getStatusIcon = (isActive: boolean) => {
        return isActive ? (
            <div className="flex items-center gap-1">
                <UserCheck className="h-4 w-4 text-green-500" />
                <span className="text-green-700 text-sm">Aktivní</span>
            </div>
        ) : (
            <div className="flex items-center gap-1">
                <UserX className="h-4 w-4 text-red-500" />
                <span className="text-red-700 text-sm">Neaktivní</span>
            </div>
        )
    }

    const employeeColumns: TableColumn<Employee>[] = [
        {
            key: 'name',
            title: 'Jméno',
            sortable: true,
            render: (value, employee) => (
                <div className="flex flex-col">
                    <span className="font-medium">{employee.name} {employee.surname}</span>
                    {employee.phone && (
                        <span className="text-sm text-muted-foreground">{employee.phone}</span>
                    )}
                </div>
            )
        },
        {
            key: 'email',
            title: 'Email',
            sortable: true
        },
        {
            key: 'organization_name',
            title: 'Organizace',
            render: (value) => value || 'Nepřiřazena'
        },
        {
            key: 'is_active',
            title: 'Status',
            render: (value) => getStatusIcon(value)
        },
        {
            key: 'created_at',
            title: 'Registrován',
            render: (value) => value ? formatDate(value) : '-'
        },
        {
            key: 'actions',
            title: 'Akce',
            className: 'text-right',
            render: (_, employee) => (
                <Link href={`/admin/employees/nastupujici/${employee.id}`} prefetch={false}>
                    <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                    </Button>
                </Link>
            )
        }
    ]

    const filterDefinitions: FilterDefinition[] = [
        {
            key: 'organization',
            label: 'Organizace',
            type: 'select',
            options: [
                { value: 'all', label: 'Všechny organizace' },
                ...organizations.map(org => ({ value: org.name, label: org.name }))
            ],
            defaultValue: 'all'
        }
    ]

    return (
        <AdminPageErrorBoundary>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Nastupující zaměstnanci</h1>
                        <p className="text-muted-foreground">Přehled zaměstnanců v procesu onboardingu</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={forceRefreshEmployees} disabled={isEmployeeLoading('list')}>
                            <Download className="mr-2 h-4 w-4" />
                            {isEmployeeLoading('list') ? 'Načítá...' : 'Obnovit'}
                        </Button>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="text-sm text-muted-foreground">
                                Celkem: {pagination?.total || 0}
                            </span>
                        </div>
                    </div>
                </div>

                {getEmployeeError('list') && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                        {getEmployeeError('list')}
                    </div>
                )}

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>
                            Nastupující zaměstnanci {pagination && `(${pagination.total})`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AdminComponentErrorBoundary componentName="NastupujiciFilters">
                            <AdminFilters
                                filters={filterDefinitions}
                                values={filters}
                                onChange={handleFiltersChange}
                                searchPlaceholder="Hledat podle jména, emailu..."
                                searchValue={searchTerm}
                                onSearchChange={handleSearchChange}
                                variant="inline"
                            />
                        </AdminComponentErrorBoundary>

                        <AdminComponentErrorBoundary componentName="NastupujiciTable">
                            <AdminTable
                                data={employees}
                                columns={employeeColumns}
                                loading={isEmployeeLoading('list')}
                                error={getEmployeeError('list')}
                                pagination={pagination ? {
                                    page: pagination.page - 1,
                                    limit: pagination.limit,
                                    total: pagination.total,
                                    totalPages: pagination.totalPages
                                } : undefined}
                                onPageChange={handlePageChange}
                                emptyMessage="Žádní nastupující zaměstnanci nenalezeni"
                            />
                        </AdminComponentErrorBoundary>
                    </CardContent>
                </Card>
            </div>
        </AdminPageErrorBoundary>
    )
}
