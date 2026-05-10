"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminPageErrorBoundary, AdminComponentErrorBoundary, AdminTable, AdminFilters } from "@/components/admin"
import { useAdminWorkflows } from "@/hooks/admin"
import { Workflow, Plus, Eye, Edit, Copy, Trash2, Settings, Download, Loader2 } from "lucide-react"
import Link from "next/link"
import { 
  OnboardingWorkflow, 
  createFromTemplate,
  getWorkflowTemplates
} from "@/lib/api/workflows"
import { getAllOrganizations, Organization } from "@/lib/api/organizations"
import { useDebounce } from "@/hooks/useDebounce"
import toast from "react-hot-toast"
import type { TableColumn, FilterDefinition } from "@/components/admin"

export default function WorkflowsPage() {
  const { 
    getAllWorkflows,
    refreshWorkflows,
    createNewWorkflow,
    updateExistingWorkflow,
    deleteExistingWorkflow,
    isWorkflowLoading,
    getWorkflowError,
    isActionLoading,
    getActionError
  } = useAdminWorkflows()
  
  const [workflows, setWorkflows] = useState<OnboardingWorkflow[]>([])
  const [templates, setTemplates] = useState<OnboardingWorkflow[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    organization: 'all',
    type: 'all' // 'workflows' or 'templates'
  })
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(10)
  const [activeTab, setActiveTab] = useState("workflows")

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<OnboardingWorkflow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    organization_id: "",
    is_template: false
  })

  // Template form data
  const [templateFormData, setTemplateFormData] = useState({
    selectedTemplate: "",
    name: "",
    description: "",
    organization_id: ""
  })

  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadWorkflows()
  }, [currentPage, pageSize, debouncedSearchTerm, filters, activeTab])

  const loadInitialData = async () => {
    try {
      const orgsResponse = await getAllOrganizations()
      setOrganizations(orgsResponse.data)
      
      // Load templates for template dialog - get all templates without organization filter
      const templatesData = await getWorkflowTemplates()
      setTemplates(templatesData)
    } catch (err) {
      console.error('Failed to load initial data:', err)
    }
  }

  const buildCurrentQuery = () => {
    // Build query step by step with validation
    const query: any = {
      page: currentPage, // Backend expects 0-based pages
      limit: pageSize
    }
    
    // Validate and add search term
    if (debouncedSearchTerm && 
        typeof debouncedSearchTerm === 'string' && 
        debouncedSearchTerm.trim() !== '' &&
        debouncedSearchTerm !== 'undefined') {
      query.q = debouncedSearchTerm.trim()
    }
    
    // Validate and add organization filter - be extra careful here
    const orgFilter = filters?.organization
    if (orgFilter && 
        typeof orgFilter === 'string' && 
        orgFilter !== "all" && 
        orgFilter !== "undefined" && 
        orgFilter !== 'null' &&
        orgFilter.trim() !== "" &&
        orgFilter.length > 0) {
      // Double check it's a valid UUID format or 'all'
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(orgFilter)) {
        query.org = orgFilter
        console.log('✅ Adding valid org filter:', orgFilter)
      } else {
        console.warn('❌ Invalid org filter format, skipping:', orgFilter)
      }
    }
    
    // Add template filter
    if (activeTab === "templates") {
      query.template = true
    } else if (activeTab === "workflows") {
      query.template = false
    }
    
    return query
  }

  const loadWorkflows = async (forceRefresh = false) => {
    const query = buildCurrentQuery()
    
    try {
      console.log('🔄 Loading workflows with validated query:', JSON.stringify(query, null, 2))
      console.log('🔍 Filters state:', JSON.stringify(filters, null, 2))
      console.log('🔄 Force refresh:', forceRefresh)
      
      const response = forceRefresh 
        ? await refreshWorkflows(query)
        : await getAllWorkflows(query)
        
      if (response) {
        if (activeTab === "templates") {
          setTemplates(response.data)
        } else {
          setWorkflows(response.data)
        }
        setPagination(response.pagination)
        console.log('✅ Successfully loaded workflows:', response.data.length, 'items')
      }
    } catch (error) {
      console.error('❌ Error loading workflows:', error)
      console.error('💥 Query that caused error:', JSON.stringify(query, null, 2))
      console.error('🔧 Current filters:', JSON.stringify(filters, null, 2))
      console.error('📍 Active tab:', activeTab)
      
      // Set empty data on error to prevent UI issues
      if (activeTab === "templates") {
        setTemplates([])
      } else {
        setWorkflows([])
      }
      setPagination(null)
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

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setCurrentPage(0)
  }

  const openCreateDialog = () => {
    setFormData({
      name: "",
      description: "",
      organization_id: "",
      is_template: activeTab === "templates"
    })
    setIsCreateDialogOpen(true)
  }

  const openEditDialog = (workflow: OnboardingWorkflow) => {
    setFormData({
      name: workflow.name,
      description: workflow.description || "",
      organization_id: workflow.organization_id,
      is_template: workflow.is_template
    })
    setSelectedWorkflow(workflow)
    setIsEditDialogOpen(true)
  }

  const openTemplateDialog = () => {
    setTemplateFormData({
      selectedTemplate: "",
      name: "",
      description: "",
      organization_id: ""
    })
    setIsTemplateDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Název workflow je povinný")
      return
    }
    
    if (!formData.organization_id) {
      toast.error("Vyberte organizaci")
      return
    }

    try {
      setIsSubmitting(true)
      
      const newWorkflow = await createNewWorkflow(formData)
      if (newWorkflow) {
        toast.success("Workflow bylo úspěšně vytvořeno")
        setIsCreateDialogOpen(false)
        // Force reload to show new workflow
        await loadWorkflows(true)
        // If we created a template, also reload templates
        if (formData.is_template) {
          const templatesData = await getWorkflowTemplates()
          setTemplates(templatesData)
        }
      }
    } catch (err) {
      console.error('Failed to create workflow:', err)
      toast.error("Chyba při vytváření workflow")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async () => {
    if (!selectedWorkflow) return

    if (!formData.name.trim()) {
      toast.error("Název workflow je povinný")
      return
    }
    
    if (!formData.organization_id) {
      toast.error("Vyberte organizaci")
      return
    }

    try {
      setIsSubmitting(true)
      
      const success = await updateExistingWorkflow(selectedWorkflow.id, formData)
      if (success) {
        toast.success("Workflow bylo úspěšně aktualizováno")
        setIsEditDialogOpen(false)
        // Force reload to show updated workflow
        await loadWorkflows(true)
        // If template status changed, reload templates too
        if (formData.is_template || selectedWorkflow.is_template) {
          const templatesData = await getWorkflowTemplates()
          setTemplates(templatesData)
        }
      }
    } catch (err) {
      console.error('Failed to update workflow:', err)
      toast.error("Chyba při aktualizaci workflow")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTemplateSubmit = async () => {
    if (!templateFormData.selectedTemplate) {
      toast.error("Vyberte šablonu")
      return
    }
    
    if (!templateFormData.name.trim()) {
      toast.error("Název workflow je povinný")
      return
    }
    
    if (!templateFormData.organization_id) {
      toast.error("Vyberte organizaci")
      return
    }

    try {
      setIsSubmitting(true)
      
      await createFromTemplate(templateFormData.selectedTemplate, {
        name: templateFormData.name,
        description: templateFormData.description,
        organization_id: templateFormData.organization_id,
        is_template: false
      })
      toast.success("Workflow bylo úspěšně vytvořeno ze šablony")
      setIsTemplateDialogOpen(false)
      // Force reload to show new workflow
      await loadWorkflows(true)
    } catch (err) {
      console.error('Failed to create workflow from template:', err)
      toast.error("Chyba při vytváření workflow ze šablony")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (workflow: OnboardingWorkflow) => {
    if (!confirm(`Opravdu chcete smazat workflow "${workflow.name}"? Tato akce je nevratná.`)) {
      return
    }

    const success = await deleteExistingWorkflow(workflow.id)
    if (success) {
      toast.success(`Workflow "${workflow.name}" bylo úspěšně smazáno`)
      // Force reload to update the list
      await loadWorkflows(true)
      // If we deleted a template, reload templates too
      if (workflow.is_template) {
        const templatesData = await getWorkflowTemplates()
        setTemplates(templatesData)
      }
    } else {
      toast.error('Chyba při mazání workflow')
    }
  }

  const getStatusBadge = (workflow: OnboardingWorkflow) => {
    const badges: React.ReactElement[] = []
    
    if (workflow.is_template) {
      badges.push(
        <Badge key="template" variant="outline" className="bg-purple-50 text-purple-700">
          Šablona
        </Badge>
      )
    }
    
    if (workflow.is_active) {
      badges.push(
        <Badge key="active" variant="outline" className="bg-green-50 text-green-700">
          Aktivní
        </Badge>
      )
    } else {
      badges.push(
        <Badge key="inactive" variant="outline" className="bg-gray-50 text-gray-700">
          Neaktivní
        </Badge>
      )
    }
    
    return <div className="flex gap-1">{badges}</div>
  }

  // Define columns for AdminTable
  const workflowColumns: TableColumn<OnboardingWorkflow>[] = [
    {
      key: 'name',
      title: 'Název workflow',
      sortable: true,
      render: (value, workflow) => (
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-blue-500" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'organization_name',
      title: 'Organizace',
      render: (value) => value || '-'
    },
    {
      key: 'description',
      title: 'Popis',
      render: (value) => value || '-'
    },
    {
      key: 'created_at',
      title: 'Vytvořeno',
      render: (value) => new Date(value).toLocaleDateString('cs-CZ')
    },
    {
      key: 'status',
      title: 'Status', 
      render: (_, workflowRow) => getStatusBadge(workflowRow)
    },
    {
      key: 'actions',
      title: 'Akce',
      className: 'text-right',
      render: (_, workflow) => (
        <div className="flex justify-end gap-1">
          <Link href={`/admin/workflows/${workflow.id}`} prefetch={false}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/admin/workflows/${workflow.id}/builder`} prefetch={false}>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => openEditDialog(workflow)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleDelete(workflow)}
            disabled={isActionLoading(`delete_${workflow.id}`)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  // Filter definitions for AdminFilters
  const filterDefinitions: FilterDefinition[] = [
    {
      key: 'organization',
      label: 'Organizace',
      type: 'select',
      options: [
        { value: 'all', label: 'Všechny organizace' },
        ...organizations.map(org => ({ value: org.id, label: org.name }))
      ],
      defaultValue: 'all'
    }
  ]

  const currentData = activeTab === "templates" ? templates : workflows

  return (
    <AdminPageErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Správa onboardingových workflow</h1>
          <p className="text-muted-foreground">Vytvářejte a spravujte workflow pro zaučování nových zaměstnanců</p>
        </div>

        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Tabs defaultValue="workflows" value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="workflows">Aktivní workflow</TabsTrigger>
                <TabsTrigger value="templates">Šablony</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => loadWorkflows(true)} disabled={isWorkflowLoading('list')}>
              <Download className="mr-2 h-4 w-4" />
              {isWorkflowLoading('list') ? 'Načítá...' : 'Obnovit'}
            </Button>
            
            {activeTab === "workflows" && (
              <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={openTemplateDialog} className="gap-2">
                    <Copy className="h-4 w-4" />
                    Ze šablony
                  </Button>
                </DialogTrigger>
              </Dialog>
            )}

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  {activeTab === "templates" ? "Nová šablona" : "Nové workflow"}
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        {/* Error Display */}
        {getWorkflowError('list') && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {getWorkflowError('list')}
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              {activeTab === "templates" ? "Šablony workflow" : "Aktivní workflow"} {pagination?.total ? `(${pagination.total})` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <AdminComponentErrorBoundary componentName="WorkflowFilters">
              <AdminFilters
                filters={filterDefinitions}
                values={filters}
                onChange={handleFiltersChange}
                searchPlaceholder="Hledat podle názvu workflow..."
                searchValue={searchTerm}
                onSearchChange={handleSearchChange}
                variant="inline"
              />
            </AdminComponentErrorBoundary>

            {/* Workflows Table */}
            <AdminComponentErrorBoundary componentName="WorkflowsTable">
              <AdminTable
                data={currentData}
                columns={workflowColumns}
                loading={isWorkflowLoading('list')}
                error={getWorkflowError('list')}
                pagination={pagination ? {
                  page: pagination.page, // Backend returns page that matches currentPage (0-based)
                  limit: pagination.limit,
                  total: pagination.total,
                  totalPages: pagination.totalPages
                } : undefined}
                onPageChange={handlePageChange}
                emptyMessage={activeTab === "templates" ? "Žádné šablony nenalezeny" : "Žádná workflow nenalezena"}
              />
            </AdminComponentErrorBoundary>
          </CardContent>
        </Card>

        {/* Create Workflow Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {activeTab === "templates" ? "Vytvořit novou šablonu" : "Vytvořit nové workflow"}
              </DialogTitle>
              <DialogDescription>
                {activeTab === "templates" 
                  ? "Vytvořte šablonu workflow, kterou můžete později použít pro různé pozice."
                  : "Vytvořte nové workflow pro onboarding zaměstnanců."
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="workflowName" className="text-sm font-medium">
                  Název workflow *
                </label>
                <Input 
                  id="workflowName" 
                  placeholder="Např. Onboarding lékaře - Kardiologie"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="organization" className="text-sm font-medium">
                  Organizace *
                </label>
                <Select 
                  value={formData.organization_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, organization_id: value }))}
                >
                  <SelectTrigger id="organization">
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
                <label className="text-sm font-medium">Popis (volitelné)</label>
                <Textarea 
                  placeholder="Stručný popis workflow"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {activeTab !== "templates" && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="isTemplate" 
                      checked={formData.is_template}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, is_template: checked as boolean }))
                      }
                    />
                    <label htmlFor="isTemplate" className="text-sm">
                      Použít jako šablonu pro budoucí workflow
                    </label>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Zrušit
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vytvářím...
                  </>
                ) : (
                  'Vytvořit workflow'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Workflow Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upravit workflow</DialogTitle>
              <DialogDescription>
                Upravte základní informace o workflow.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="editWorkflowName" className="text-sm font-medium">
                  Název workflow *
                </label>
                <Input 
                  id="editWorkflowName" 
                  placeholder="Např. Onboarding lékaře - Kardiologie"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="editOrganization" className="text-sm font-medium">
                  Organizace *
                </label>
                <Select 
                  value={formData.organization_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, organization_id: value }))}
                >
                  <SelectTrigger id="editOrganization">
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
                <label className="text-sm font-medium">Popis (volitelné)</label>
                <Textarea 
                  placeholder="Stručný popis workflow"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="editIsTemplate" 
                    checked={formData.is_template}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_template: checked as boolean }))
                    }
                  />
                  <label htmlFor="editIsTemplate" className="text-sm">
                    Použít jako šablonu pro budoucí workflow
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Zrušit
              </Button>
              <Button 
                onClick={handleEditSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ukládám...
                  </>
                ) : (
                  'Uložit změny'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create from Template Dialog */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Vytvořit workflow ze šablony</DialogTitle>
              <DialogDescription>
                Vyberte šablonu a vytvořte z ní nové workflow.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="template" className="text-sm font-medium">
                  Vyberte šablonu *
                </label>
                <Select 
                  value={templateFormData.selectedTemplate} 
                  onValueChange={(value) => setTemplateFormData(prev => ({ ...prev, selectedTemplate: value }))}
                >
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Vyberte šablonu" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="templateWorkflowName" className="text-sm font-medium">
                  Název nového workflow *
                </label>
                <Input 
                  id="templateWorkflowName" 
                  placeholder="Např. Onboarding lékaře - Kardiologie"
                  value={templateFormData.name}
                  onChange={(e) => setTemplateFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="templateOrganization" className="text-sm font-medium">
                  Organizace *
                </label>
                <Select 
                  value={templateFormData.organization_id} 
                  onValueChange={(value) => setTemplateFormData(prev => ({ ...prev, organization_id: value }))}
                >
                  <SelectTrigger id="templateOrganization">
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
                <label className="text-sm font-medium">Popis (volitelné)</label>
                <Textarea 
                  placeholder="Stručný popis workflow"
                  value={templateFormData.description}
                  onChange={(e) => setTemplateFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsTemplateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Zrušit
              </Button>
              <Button 
                onClick={handleTemplateSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vytvářím...
                  </>
                ) : (
                  'Vytvořit ze šablony'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminPageErrorBoundary>
  )
}