"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pagination } from "@/components/hr-admin-ui"
import { PlusCircle, Search, Edit, Trash2, Filter, Loader2, Download, FileText, List } from "lucide-react"
import { getAllJobRolesAdmin, JobRole, JobRolesResponse, JobRoleClassification, createJobRole, updateJobRole, deleteJobRole, getAllClassifications } from "@/lib/api/job-roles"
import { getAllOrganizations, Organization } from "@/lib/api/organizations"
import { useDebounce } from "@/hooks/useDebounce"
import toast from "react-hot-toast"
import ProtectedRoute from "@/components/ProtectedRoute"
import Link from "next/link"
import { ADMIN_ONLY_AND_SUPER_ADMIN_ROLES } from "@/lib/authorizedPersonAccess"

export default function AdminJobRolesPage() {
  const [jobRoles, setJobRoles] = useState<JobRole[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [classifications, setClassifications] = useState<JobRoleClassification[]>([])
  const [pagination, setPagination] = useState<JobRolesResponse['pagination'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrganization, setSelectedOrganization] = useState("all")
  const [selectedClassification, setSelectedClassification] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingJobRole, setEditingJobRole] = useState<JobRole | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    organization_id: "",
    classification_code: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingJobRole, setDeletingJobRole] = useState<string | null>(null)

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    fetchJobRoles()
  }, [currentPage, pageSize, debouncedSearchTerm, selectedOrganization, selectedClassification])

  const loadInitialData = async () => {
    try {
      const [orgsResponse, classificationsData] = await Promise.all([
        getAllOrganizations(),
        getAllClassifications()
      ])
      setOrganizations(orgsResponse.data)
      setClassifications(classificationsData)
    } catch (err) {
      console.error('Failed to load initial data:', err)
    }
  }

  const fetchJobRoles = async () => {
    try {
      setLoading(true)
      setError(null)

      const query = {
        page: currentPage - 1, // Convert to 0-based for backend
        limit: pageSize,
        q: debouncedSearchTerm || undefined,
        org: selectedOrganization !== "all" ? selectedOrganization : undefined,
        classification: selectedClassification !== "all" ? selectedClassification : undefined
      }

      const response = await getAllJobRolesAdmin(query)
      setJobRoles(response.data)
      setPagination({
        ...response.pagination,
        page: response.pagination.page + 1 // Convert back to 1-based for UI
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při načítání pracovních rolí")
      console.error('Error fetching job roles:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const handleFilterChange = () => {
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    handleFilterChange()
  }

  const handleOrganizationChange = (value: string) => {
    setSelectedOrganization(value)
    handleFilterChange()
  }

  const handleClassificationChange = (value: string) => {
    setSelectedClassification(value)
    handleFilterChange()
  }

  const openCreateDialog = () => {
    setEditingJobRole(null)
    setFormData({
      name: "",
      description: "",
      organization_id: "",
      classification_code: ""
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (jobRole: JobRole) => {
    setEditingJobRole(jobRole)
    setFormData({
      name: jobRole.name,
      description: jobRole.description || "",
      organization_id: jobRole.organization_id,
      classification_code: jobRole.classification_code || ""
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.organization_id) {
      toast.error("Název a organizace jsou povinné")
      return
    }

    try {
      setIsSubmitting(true)
      
      if (editingJobRole) {
        await updateJobRole(editingJobRole.id, formData)
        toast.success("Pracovní role byla úspěšně aktualizována")
      } else {
        await createJobRole(formData)
        toast.success("Pracovní role byla úspěšně vytvořena")
      }
      
      setIsDialogOpen(false)
      fetchJobRoles()
    } catch (err) {
      console.error('Failed to save job role:', err)
      toast.error("Chyba při ukládání pracovní role")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (jobRole: JobRole) => {
    if (!confirm(`Opravdu chcete smazat pracovní roli "${jobRole.name}"? Tato akce je nevratná.`)) {
      return
    }

    try {
      setDeletingJobRole(jobRole.id)
      await deleteJobRole(jobRole.id)
      toast.success(`Pracovní role "${jobRole.name}" byla úspěšně smazána`)
      fetchJobRoles()
    } catch (err) {
      console.error('Failed to delete job role:', err)
      toast.error('Chyba při mazání pracovní role. Zkuste to prosím znovu.')
    } finally {
      setDeletingJobRole(null)
    }
  }

  const renderJobRolesTable = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Název role</TableHead>
            <TableHead>Organizace</TableHead>
            <TableHead>Zařazení</TableHead>
            <TableHead>Popis</TableHead>
            <TableHead className="text-right">Akce</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="mt-2 text-muted-foreground">Načítání pracovních rolí...</p>
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                <p className="text-red-600">{error}</p>
                <Button variant="outline" onClick={fetchJobRoles} className="mt-2">
                  Zkusit znovu
                </Button>
              </TableCell>
            </TableRow>
          ) : jobRoles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                <p className="text-muted-foreground">Žádné pracovní role nenalezeny</p>
              </TableCell>
            </TableRow>
          ) : (
            jobRoles.map((jobRole) => (
              <TableRow key={jobRole.id}>
                <TableCell className="font-medium">{jobRole.name}</TableCell>
                <TableCell>{jobRole.organization_name || "-"}</TableCell>
                <TableCell>{jobRole.classification_label || "-"}</TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate" title={jobRole.description}>
                    {jobRole.description || "-"}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/admin/job-roles/${jobRole.id}/specifications`} prefetch={false}>
                      <Button variant="ghost" size="sm" title="Specifikace">
                        <List className="h-4 w-4" />
                        <span className="sr-only">Specifikace</span>
                      </Button>
                    </Link>
                    <Link href={`/admin/job-roles/${jobRole.id}/documents`} prefetch={false}>
                      <Button variant="ghost" size="sm" title="Dokumenty">
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">Dokumenty</span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(jobRole)}
                      title="Upravit"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Upravit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(jobRole)}
                      disabled={deletingJobRole === jobRole.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Smazat"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Smazat</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <ProtectedRoute requiredRoles={[...ADMIN_ONLY_AND_SUPER_ADMIN_ROLES]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pracovní role</h1>
            <p className="text-muted-foreground">Správa všech pracovních rolí v systému</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchJobRoles} disabled={loading}>
              <Download className="mr-2 h-4 w-4" />
              {loading ? 'Načítá...' : 'Obnovit'}
            </Button>
            <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
              <PlusCircle className="mr-2 h-4 w-4" />
              Přidat pracovní roli
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              Přehled pracovních rolí {pagination && `(${pagination.total})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-end mb-6">
              <div className="flex-1 space-y-2">
                <label htmlFor="search" className="text-sm font-medium">
                  Vyhledat
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Hledat podle názvu, popisu..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-[200px] space-y-2">
                <label htmlFor="classification" className="text-sm font-medium">
                  Zařazení
                </label>
                <Select value={selectedClassification} onValueChange={handleClassificationChange}>
                  <SelectTrigger id="classification">
                    <SelectValue placeholder="Všechna zařazení" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všechna zařazení</SelectItem>
                    {classifications.map((classification) => (
                      <SelectItem key={classification.code} value={classification.code}>
                        {classification.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-[200px] space-y-2">
                <label htmlFor="organization" className="text-sm font-medium">
                  Organizace
                </label>
                <Select value={selectedOrganization} onValueChange={handleOrganizationChange}>
                  <SelectTrigger id="organization">
                    <SelectValue placeholder="Všechny organizace" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všechny organizace</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => {
                  handleSearchChange("")
                  handleOrganizationChange("all")
                  handleClassificationChange("all")
                }}
              >
                <Filter className="h-4 w-4" />
                <span className="sr-only">Vymazat filtry</span>
              </Button>
            </div>

            {renderJobRolesTable()}

            {pagination && (
              <div className="mt-4">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  pageSize={pagination.limit}
                  totalItems={pagination.total}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  disabled={loading}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingJobRole ? 'Upravit pracovní roli' : 'Přidat novou pracovní roli'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Název role *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Např. Zdravotní sestra"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organizace *</Label>
                <Select
                  value={formData.organization_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, organization_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte organizaci" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classification">Zařazení</Label>
                <Select
                  value={formData.classification_code || "none"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, classification_code: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte zařazení" />
                  </SelectTrigger>
                  <SelectContent>
                    {classifications.map((classification) => (
                      <SelectItem key={classification.code} value={classification.code}>
                        {classification.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Popis</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Volitelný popis pracovní role..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Zrušit
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Ukládám...' : (editingJobRole ? 'Aktualizovat' : 'Vytvořit')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
