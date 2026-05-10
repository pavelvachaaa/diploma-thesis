"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Users, Download, Eye, UserCheck, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AdminPageErrorBoundary, AdminComponentErrorBoundary, AdminTable, AdminFilters } from "@/components/admin"
import { useAdminEmployees } from "@/hooks/admin"
import { useDebounce } from "@/hooks/useDebounce"
import { type Employee, type EmployeeRole, type EmployeesQuery } from "@/lib/api/employees"
import { getAllOrganizations, type Organization } from "@/lib/api/organizations"
import { formatDate } from "../applicants/[id]/utils/statusUtils"
import type { TableColumn, FilterDefinition } from "@/components/admin"


export default function AdminEmployeesPage() {
    const {
        getAllEmployeesList,
        getEmployeeRolesList,
        refreshEmployees,
        isEmployeeLoading,
        getEmployeeError,
        isActionLoading,
        getActionError
    } = useAdminEmployees()
    
    const [employees, setEmployees] = useState<Employee[]>([])
    const [pagination, setPagination] = useState<any>(null)
    const [roles, setRoles] = useState<EmployeeRole[]>([])
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [filters, setFilters] = useState({
        role: 'all',
        organization: 'all'
    })
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize] = useState(10)

    const debouncedSearchTerm = useDebounce(searchTerm, 500)

    useEffect(() => {
        loadEmployees()
    }, [currentPage, pageSize, debouncedSearchTerm, filters])

    useEffect(() => {
        loadRoles()
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
            page: currentPage + 1, // Convert from 0-based to 1-based
            limit: pageSize,
            search: debouncedSearchTerm || undefined,
            role: filters.role !== "all" ? filters.role : undefined,
            excludeRole: filters.role === "all" ? 'user' : undefined,
            organization: filters.organization !== "all" ? filters.organization : undefined
        }
        
        const response = await getAllEmployeesList(query)
        if (response) {
            setEmployees(response.data)
            setPagination(response.pagination)
        }
    }

    const loadRoles = async () => {
        const rolesData = await getEmployeeRolesList()
        if (rolesData) {
            setRoles(rolesData)
        }
    }

    const forceRefreshEmployees = async () => {
        const query: EmployeesQuery = {
            page: currentPage + 1, // Convert from 0-based to 1-based
            limit: pageSize,
            search: debouncedSearchTerm || undefined,
            role: filters.role !== "all" ? filters.role : undefined,
            excludeRole: filters.role === "all" ? 'user' : undefined,
            organization: filters.organization !== "all" ? filters.organization : undefined
        }
        
        console.log('🔄 Force refreshing employees with query:', query)
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
        setCurrentPage(0) // Reset to first page when filters change
    }

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        setCurrentPage(0)
    }


    const getRoleBadge = (role: string) => {
        const roleMap = {
            super_admin: { label: "Super administrátor", className: "bg-violet-50 text-violet-700 hover:bg-violet-50 hover:text-violet-700" },
            admin: { label: "Administrátor", className: "bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700" },
            hr: { label: "HR", className: "bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700" },
            authorized_person: { label: "Oprávněná osoba", className: "bg-amber-50 text-amber-700 hover:bg-amber-50 hover:text-amber-700" },
            user: { label: "Zaměstnanec", className: "bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700" }
        }
        
        const config = roleMap[role as keyof typeof roleMap] || { label: role, className: "bg-gray-50 text-gray-700" }
        
        return (
            <Badge variant="outline" className={config.className}>
                {config.label}
            </Badge>
        )
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

    // Define columns for AdminTable
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
            key: 'role_name',
            title: 'Role',
            render: (value) => value ? getRoleBadge(value) : '-'
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
                <Link href={`/admin/employees/${employee.id}`} prefetch={false}>
                    <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                    </Button>
                </Link>
            )
        }
    ]

    // Filter definitions for AdminFilters
    const filterDefinitions: FilterDefinition[] = [
        {
            key: 'role',
            label: 'Role',
            type: 'select',
            options: [
                { value: 'all', label: 'Všechny role' },
                ...roles.filter(role => role.name !== 'user').map(role => ({ value: role.name, label: role.description || role.name }))
            ],
            defaultValue: 'all'
        },
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
                        <h1 className="text-2xl font-bold tracking-tight">Zaměstnanci</h1>
                        <p className="text-muted-foreground">Správa zaměstnanců v systému</p>
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

                {/* Error Display */}
                {getEmployeeError('list') && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                        {getEmployeeError('list')}
                    </div>
                )}

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>
                            Přehled zaměstnanců {pagination && `(${pagination.total})`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <AdminComponentErrorBoundary componentName="EmployeeFilters">
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

                        {/* Employees Table */}
                        <AdminComponentErrorBoundary componentName="EmployeesTable">
                            <AdminTable
                                data={employees}
                                columns={employeeColumns}
                                loading={isEmployeeLoading('list')}
                                error={getEmployeeError('list')}
                                pagination={pagination ? {
                                    page: pagination.page - 1, // Convert from 1-based to 0-based
                                    limit: pagination.limit,
                                    total: pagination.total,
                                    totalPages: pagination.totalPages
                                } : undefined}
                                onPageChange={handlePageChange}
                                emptyMessage="Žádní zaměstnanci nenalezeni"
                            />
                        </AdminComponentErrorBoundary>
                    </CardContent>
                </Card>
            </div>
        </AdminPageErrorBoundary>
    )
}
