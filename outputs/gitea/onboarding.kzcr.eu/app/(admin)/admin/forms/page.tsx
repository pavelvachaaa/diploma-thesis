"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminPageErrorBoundary, AdminComponentErrorBoundary, AdminTable, AdminFilters } from "@/components/admin"
import { useAdminForms } from "@/hooks/admin"
import { useDebounce } from "@/hooks/useDebounce"
import { Plus, Edit3, Eye, Save, FileText, Download } from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/api"
import type { TableColumn, FilterDefinition } from "@/components/admin"

interface OnboardingStep {
  id: string
  title: string
  description?: string
  step_type: 'info' | 'ack' | 'form' | 'quiz'
  metadata: any
  form?: any
  form_status?: 'draft' | 'published'
  is_mandatory: boolean
  order_index: number
  organization_id: string
  days_from_start: number
  duration_days: number
  auto_assign: boolean
  instructions?: string
}

export default function AdminFormsPage() {
  const {
    getAllFormsAdmin,
    refreshForms,
    isFormLoading,
    getFormError,
    isActionLoading,
    getActionError
  } = useAdminForms()
  
  const [steps, setSteps] = useState<OnboardingStep[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    step_type: 'all',
    is_mandatory: 'all',
    form_status: 'all'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  useEffect(() => {
    loadSteps()
  }, [debouncedSearchTerm, filters])

  const loadSteps = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // For now, fetch using the original API until we have a proper admin endpoint
      const data = await api('/admin/onboarding/steps/forms')
      let allSteps = data.steps || []
      
      // Apply filters
      if (debouncedSearchTerm) {
        allSteps = allSteps.filter((step: OnboardingStep) => 
          step.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          (step.description && step.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
        )
      }
      
      if (filters.step_type !== 'all') {
        allSteps = allSteps.filter((step: OnboardingStep) => step.step_type === filters.step_type)
      }
      
      if (filters.is_mandatory !== 'all') {
        allSteps = allSteps.filter((step: OnboardingStep) => 
          step.is_mandatory === (filters.is_mandatory === 'true')
        )
      }
      
      if (filters.form_status !== 'all') {
        allSteps = allSteps.filter((step: OnboardingStep) => 
          (step.form_status || 'draft') === filters.form_status
        )
      }
      
      setSteps(allSteps)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load steps')
    } finally {
      setLoading(false)
    }
  }

  const forceRefreshForms = async () => {
    await loadSteps()
  }

  const getStepTypeIcon = (stepType: string) => {
    switch (stepType) {
      case 'form': return <Edit3 className="h-4 w-4 text-blue-500" />
      case 'info': return <FileText className="h-4 w-4 text-gray-500" />
      case 'ack': return <Save className="h-4 w-4 text-green-500" />
      case 'quiz': return <Edit3 className="h-4 w-4 text-purple-500" />
      default: return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStepTypeBadge = (stepType: string) => {
    const typeMap = {
      form: { label: "Formulář", className: "bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700" },
      info: { label: "Informace", className: "bg-gray-50 text-gray-700 hover:bg-gray-50 hover:text-gray-700" },
      ack: { label: "Potvrzení", className: "bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700" },
      quiz: { label: "Kvíz", className: "bg-purple-50 text-purple-700 hover:bg-purple-50 hover:text-purple-700" }
    }
    
    const config = typeMap[stepType as keyof typeof typeMap] || { label: stepType, className: "bg-gray-50 text-gray-700" }
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getStatusBadge = (status?: string) => {
    const actualStatus = status || 'draft'
    const statusMap = {
      published: { label: "Publikován", className: "bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700" },
      draft: { label: "Koncept", className: "bg-yellow-50 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-700" }
    }
    
    const config = statusMap[actualStatus as keyof typeof statusMap] || { label: actualStatus, className: "bg-gray-50 text-gray-700" }
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getMandatoryBadge = (isMandatory: boolean) => {
    return isMandatory ? (
      <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700">
        Povinný
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 hover:bg-gray-50 hover:text-gray-700">
        Volitelný
      </Badge>
    )
  }

  const getFormInfo = (step: OnboardingStep) => {
    const form = step.form || step.metadata?.form
    if (!form || !form.fields) {
      return { fieldCount: 0, requiredCount: 0, hasForm: false }
    }
    
    const fieldCount = form.fields.length
    const requiredCount = form.fields.filter((f: any) => f.required).length
    
    return { fieldCount, requiredCount, hasForm: true }
  }

  const handlePageChange = (page: number) => {
    // Not needed for this simple list, but keeping for consistency
  }

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  // Define columns for AdminTable
  const formColumns: TableColumn<OnboardingStep>[] = [
    {
      key: 'title',
      title: 'Název',
      sortable: true,
      render: (value, step) => (
        <div className="flex items-center gap-3">
          {getStepTypeIcon(step.step_type)}
          <div>
            <div className="font-medium">{value}</div>
            {step.description && (
              <div className="text-sm text-muted-foreground mt-1">
                {step.description.length > 60 ? `${step.description.substring(0, 60)}...` : step.description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'step_type',
      title: 'Typ',
      render: (value) => getStepTypeBadge(value)
    },
    {
      key: 'is_mandatory',
      title: 'Povinnost',
      render: (value) => getMandatoryBadge(value)
    },
    {
      key: 'form_status',
      title: 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'order_index',
      title: 'Pořadí',
      sortable: true,
      className: 'text-center',
      render: (value) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          {value}
        </Badge>
      )
    },
    {
      key: 'form',
      title: 'Pole formuláře',
      className: 'text-center',
      render: (value, step) => {
        const { fieldCount, requiredCount, hasForm } = getFormInfo(step)
        return hasForm ? (
          <div className="flex gap-2 justify-center">
            <Badge variant="outline">{fieldCount} polí</Badge>
            {requiredCount > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700">
                {requiredCount} povinných
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Bez formuláře</span>
        )
      }
    },
    {
      key: 'actions',
      title: 'Akce',
      className: 'text-right',
      render: (_, step) => (
        <div className="flex justify-end gap-1">
          <Link href={`/admin/forms/${step.id}/preview`} prefetch={false}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/admin/forms/${step.id}/edit`} prefetch={false}>
            <Button variant="ghost" size="sm">
              <Edit3 className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )
    }
  ]

  // Filter definitions for AdminFilters
  const filterDefinitions: FilterDefinition[] = [
    {
      key: 'step_type',
      label: 'Typ kroku',
      type: 'select',
      options: [
        { value: 'all', label: 'Všechny typy' },
        { value: 'form', label: 'Formulář' },
        { value: 'info', label: 'Informace' },
        { value: 'ack', label: 'Potvrzení' },
        { value: 'quiz', label: 'Kvíz' }
      ],
      defaultValue: 'all'
    },
    {
      key: 'is_mandatory',
      label: 'Povinnost',
      type: 'select',
      options: [
        { value: 'all', label: 'Všechny' },
        { value: 'true', label: 'Povinné' },
        { value: 'false', label: 'Volitelné' }
      ],
      defaultValue: 'all'
    },
    {
      key: 'form_status',
      label: 'Status publikace',
      type: 'select',
      options: [
        { value: 'all', label: 'Všechny stavy' },
        { value: 'published', label: 'Publikováno' },
        { value: 'draft', label: 'Koncept' }
      ],
      defaultValue: 'all'
    }
  ]

  return (
    <AdminPageErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Správa formulářů</h1>
            <p className="text-muted-foreground">Upravte formuláře pro jednotlivé kroky onboarding procesu</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={forceRefreshForms} disabled={loading}>
              <Download className="mr-2 h-4 w-4" />
              {loading ? 'Načítá...' : 'Obnovit'}
            </Button>
            <Button asChild>
              <Link href="/admin/forms/simple-builder">
                <Plus className="h-4 w-4 mr-2" />
                Nový formulář
              </Link>
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>
              Přehled formulářů ({steps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <AdminComponentErrorBoundary componentName="FormFilters">
              <AdminFilters
                filters={filterDefinitions}
                values={filters}
                onChange={handleFiltersChange}
                searchPlaceholder="Hledat podle názvu, popisu..."
                searchValue={searchTerm}
                onSearchChange={handleSearchChange}
                variant="inline"
              />
            </AdminComponentErrorBoundary>

            {/* Forms Table */}
            <AdminComponentErrorBoundary componentName="FormsTable">
              <AdminTable
                data={steps}
                columns={formColumns}
                loading={loading}
                error={error}
                emptyMessage="Žádné formuláře nenalezeny"
              />
            </AdminComponentErrorBoundary>
          </CardContent>
        </Card>
      </div>
    </AdminPageErrorBoundary>
  )
}