"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AdminPageErrorBoundary, AdminComponentErrorBoundary, AdminTable, AdminFilters } from "@/components/admin"
import { Download, Trash2, FileText, Eye, Mail, Phone, Building2, Briefcase, Calendar, MessageSquare, Brain, Loader2, RefreshCw } from "lucide-react"
import { useDebounce } from "@/hooks/useDebounce"
import type { TableColumn, FilterDefinition } from "@/components/admin"
import { api, downloadFile } from "@/lib/api"
import toast from "react-hot-toast"
import { useAuth } from "@/context/AuthContext"
import { getAdminAccessConfig } from "@/lib/authorizedPersonAccess"

interface JobSeeker {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    organization_ids: string[]
    organization_names: string[]
    preferred_position_name: string | null
    message: string | null
    cv_filename: string | null
    cv_original_filename: string | null
    cv_file_path: string | null
    cv_mime_type: string | null
    cv_file_size: number | null
    additional_attachments: JobSeekerAttachment[]
    gdpr_consent: boolean
    submitted_at: string
}

interface JobSeekerAttachment {
    id: string
    file_id: string
    position: number
    uploaded_at: string
    file_path: string
    original_filename: string
    mime_type: string
    file_size: number | null
    bucket: string | null
}

interface CVAnalysisStatus {
    id?: string
    job_seeker_id: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    error_message?: string | null
    evaluation_score?: number | null
    skills?: string[]
    summary?: string | null
    processed_at?: string | null
}

interface JobSeekersResponse {
    data: JobSeeker[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
    }
}

interface PaginationInfo {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

export default function AdminJobSeekersPage() {
    const { roles } = useAuth()
    const adminAccess = getAdminAccessConfig(roles)
    const seekerCapabilities = adminAccess.capabilities.seekers
    const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([])
    const [pagination, setPagination] = useState<PaginationInfo | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [filters, setFilters] = useState({
        organization: 'all'
    })
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize] = useState(10)
    const [allOrganizations, setAllOrganizations] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedSeeker, setSelectedSeeker] = useState<JobSeeker | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [cvAnalysisStatus, setCvAnalysisStatus] = useState<CVAnalysisStatus | null>(null)
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null)

    const debouncedSearchTerm = useDebounce(searchTerm, 500)

    useEffect(() => {
        loadJobSeekers()
    }, [currentPage, pageSize, debouncedSearchTerm, filters])

    useEffect(() => {
        loadInitialData()
    }, [])

    const loadInitialData = async () => {
        try {
            // Get all data without pagination to build filter options
            const response = await api<JobSeekersResponse>('/admin/job-seekers?limit=1000')
            if (response) {
                const uniqueOrgs = [...new Set(response.data.flatMap(js => js.organization_names || []))]
                setAllOrganizations(uniqueOrgs)
            }
        } catch (err) {
            console.error('Failed to load filter data:', err)
        }
    }

    const loadJobSeekers = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const params = new URLSearchParams({
                page: String(currentPage + 1),
                limit: String(pageSize),
            })

            if (debouncedSearchTerm) {
                params.append('search', debouncedSearchTerm)
            }

            if (filters.organization !== 'all') {
                params.append('organization', filters.organization)
            }

            const response = await api<JobSeekersResponse>(`/admin/job-seekers?${params}`)
            if (response) {
                setJobSeekers(response.data)
                setPagination(response.pagination)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load job seekers')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleFiltersChange = (newFilters: { organization: string }) => {
        setFilters(newFilters)
        setCurrentPage(0)
    }

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        setCurrentPage(0)
    }

    const handleDownloadCV = async (seeker: JobSeeker) => {
        if (!seeker.cv_file_path) {
            toast.error("Tento uchazeč nenahrál životopis")
            return
        }

        try {
            await downloadFile(
                `/admin/job-seekers/${seeker.id}/cv`,
                seeker.cv_original_filename || 'cv.pdf'
            )
            toast.success("Životopis byl stažen")
        } catch (err) {
            console.error('CV download error:', err)
            toast.error("Nepodařilo se stáhnout životopis")
        }
    }

    const handleDownloadAttachment = async (seeker: JobSeeker, attachment: JobSeekerAttachment) => {
        try {
            await downloadFile(
                `/admin/job-seekers/${seeker.id}/attachments/${attachment.id}/download`,
                attachment.original_filename || 'attachment'
            )
            toast.success("Příloha byla stažena")
        } catch (err) {
            console.error('Attachment download error:', err)
            toast.error("Nepodařilo se stáhnout přílohu")
        }
    }

    const handleDeleteClick = (seeker: JobSeeker) => {
        if (window.confirm(`Opravdu chcete smazat zájemce ${seeker.first_name} ${seeker.last_name}? Tato akce je nevratná.`)) {
            handleDeleteConfirm(seeker)
        }
    }

    const handleDeleteConfirm = async (seeker: JobSeeker) => {
        try {
            await api(`/admin/job-seekers/${seeker.id}`, {
                method: 'DELETE'
            })

            toast.success("Zájemce byl smazán")
            loadJobSeekers()
        } catch {
            toast.error("Nepodařilo se smazat zájemce")
        }
    }

    const handleViewDetails = async (seeker: JobSeeker) => {
        setSelectedSeeker(seeker)
        setIsDialogOpen(true)
        setCvAnalysisStatus(null)

        // Load CV analysis if seeker has CV
        if (seeker.cv_file_path) {
            setIsLoadingAnalysis(true)
            try {
                const analysis = await api<CVAnalysisStatus>(`/admin/job-seekers/${seeker.id}/cv-analysis`)
                setCvAnalysisStatus(analysis)
            } catch {
                // No analysis yet - that's ok
                setCvAnalysisStatus(null)
            } finally {
                setIsLoadingAnalysis(false)
            }
        }
    }

    const handleTriggerAnalysis = async (seeker: JobSeeker) => {
        if (!seeker.cv_file_path) {
            toast.error("Tento zájemce nemá nahraný životopis")
            return
        }

        setIsAnalyzing(seeker.id)
        try {
            const result = await api<{ success: boolean; message: string }>(`/admin/job-seekers/${seeker.id}/cv-analysis/reanalyze`, {
                method: 'POST'
            })

            if (result.success) {
                toast.success("Analýza CV byla zahájena")
                // Update status to pending
                setCvAnalysisStatus({ job_seeker_id: seeker.id, status: 'pending' })
            } else {
                toast.error(result.message || "Nepodařilo se spustit analýzu")
            }
        } catch (err) {
            console.error('Analysis trigger error:', err)
            toast.error("Nepodařilo se spustit analýzu CV")
        } finally {
            setIsAnalyzing(null)
        }
    }

    // Polling for CV analysis status when pending/processing
    useEffect(() => {
        if (isDialogOpen && selectedSeeker && cvAnalysisStatus &&
            (cvAnalysisStatus.status === 'pending' || cvAnalysisStatus.status === 'processing')) {
            const pollInterval = setInterval(async () => {
                try {
                    const analysis = await api<CVAnalysisStatus>(`/admin/job-seekers/${selectedSeeker.id}/cv-analysis`)
                    setCvAnalysisStatus(analysis)
                    if (analysis.status === 'completed' || analysis.status === 'failed') {
                        clearInterval(pollInterval)
                    }
                } catch (err) {
                    console.error('Analysis polling error:', err)
                }
            }, 3000)

            return () => clearInterval(pollInterval)
        }
    }, [isDialogOpen, selectedSeeker?.id, cvAnalysisStatus?.status])

    // Define columns for AdminTable
    const seekerColumns: TableColumn<JobSeeker>[] = [
        {
            key: 'first_name',
            title: 'Jméno',
            sortable: true,
            render: (_, seeker) => `${seeker.first_name} ${seeker.last_name}`
        },
        {
            key: 'email',
            title: 'Email',
            sortable: true
        },
        {
            key: 'phone',
            title: 'Telefon',
            render: (value) => value || '-'
        },
        {
            key: 'organization_names',
            title: 'Lokality',
            render: (_value, seeker) => seeker.organization_names?.length
                ? seeker.organization_names.join(', ')
                : '-'
        },
        {
            key: 'preferred_position_name',
            title: 'Pozice',
            render: (value) => value || '-'
        },
        {
            key: 'message',
            title: 'Zpráva',
            render: (value) => value ? (
                <div className="max-w-xs truncate text-sm text-muted-foreground" title={value}>
                    {value.length > 50 ? `${value.substring(0, 50)}...` : value}
                </div>
            ) : (
                <span className="text-muted-foreground text-sm">-</span>
            )
        },
        {
            key: 'cv_original_filename',
            title: 'Životopis',
            render: (value) => value ? (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                    <FileText className="h-3 w-3 mr-1" />
                    Nahráno
                </Badge>
            ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-500">
                    Bez CV
                </Badge>
            )
        },
        {
            key: 'additional_attachments',
            title: 'Další přílohy',
            render: (_value, seeker) => {
                const count = seeker.additional_attachments?.length || 0
                if (count === 0) {
                    return <span className="text-muted-foreground text-sm">0</span>
                }
                return (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {count}
                    </Badge>
                )
            }
        },
        {
            key: 'submitted_at',
            title: 'Odesláno',
            render: (value) => value ? new Date(value).toLocaleDateString('cs-CZ', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '-'
        },
        {
            key: 'actions',
            title: 'Akce',
            className: 'text-right',
            render: (_, seeker) => (
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(seeker)}
                        title="Zobrazit detail"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    {seeker.cv_file_path && (
                        <>
                            {seekerCapabilities.canReanalyzeCv && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleTriggerAnalysis(seeker)}
                                    disabled={isAnalyzing === seeker.id}
                                    title="Analyzovat CV"
                                >
                                    {isAnalyzing === seeker.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Brain className="h-4 w-4 text-purple-600" />
                                    )}
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadCV(seeker)}
                                title="Stáhnout životopis"
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    {seekerCapabilities.canDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(seeker)}
                            title="Smazat zájemce"
                        >
                            <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
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
        }
    ]

    return (
        <AdminPageErrorBoundary>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Databáze zájemců</h1>
                        <p className="text-muted-foreground">Správa databáze potenciálních uchazečů</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={loadJobSeekers} disabled={isLoading}>
                            <Download className="mr-2 h-4 w-4" />
                            {isLoading ? 'Načítá...' : 'Obnovit'}
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
                            Přehled zájemců {pagination && `(${pagination.total})`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <AdminComponentErrorBoundary componentName="JobSeekerFilters">
                            <AdminFilters
                                filters={filterDefinitions}
                                values={filters}
                                onChange={handleFiltersChange}
                                searchPlaceholder="Hledat podle jména, emailu, telefonu..."
                                searchValue={searchTerm}
                                onSearchChange={handleSearchChange}
                                variant="inline"
                            />
                        </AdminComponentErrorBoundary>

                        {/* Job Seekers Table */}
                        <AdminComponentErrorBoundary componentName="JobSeekersTable">
                            <AdminTable
                                data={jobSeekers}
                                columns={seekerColumns}
                                loading={isLoading}
                                error={error || undefined}
                                pagination={pagination ? {
                                    page: pagination.page - 1,
                                    limit: pagination.limit,
                                    total: pagination.total,
                                    totalPages: pagination.totalPages
                                } : undefined}
                                onPageChange={handlePageChange}
                                emptyMessage="Žádní zájemci nenalezeni"
                            />
                        </AdminComponentErrorBoundary>
                    </CardContent>
                </Card>
            </div>

            {/* Job Seeker Detail Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detail zájemce</DialogTitle>
                        <DialogDescription>
                            Kompletní informace o zájemci o zaměstnání
                        </DialogDescription>
                    </DialogHeader>

                    {selectedSeeker && (
                        <div className="space-y-6">
                            {/* Personal Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Jméno a příjmení</label>
                                    <p className="text-base font-medium mt-1">
                                        {selectedSeeker.first_name} {selectedSeeker.last_name}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        Email
                                    </label>
                                    <p className="text-base mt-1">
                                        <a href={`mailto:${selectedSeeker.email}`} className="text-blue-600 hover:underline">
                                            {selectedSeeker.email}
                                        </a>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        Telefon
                                    </label>
                                    <p className="text-base mt-1">
                                        <a href={`tel:${selectedSeeker.phone}`} className="text-blue-600 hover:underline">
                                            {selectedSeeker.phone}
                                        </a>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        Preferované lokality
                                    </label>
                                    <p className="text-base mt-1">
                                        {selectedSeeker.organization_names?.length
                                            ? selectedSeeker.organization_names.join(', ')
                                            : '-'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Briefcase className="h-4 w-4" />
                                        Preferovaná pozice
                                    </label>
                                    <p className="text-base mt-1">
                                        {selectedSeeker.preferred_position_name || '-'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Datum odeslání
                                    </label>
                                    <p className="text-base mt-1">
                                        {new Date(selectedSeeker.submitted_at).toLocaleDateString('cs-CZ', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Životopis
                                    </label>
                                    <div className="mt-1">
                                        {selectedSeeker.cv_file_path ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDownloadCV(selectedSeeker)}
                                                className="text-sm"
                                            >
                                                <Download className="h-3 w-3 mr-2" />
                                                {selectedSeeker.cv_original_filename}
                                            </Button>
                                        ) : (
                                            <Badge variant="outline" className="bg-gray-50 text-gray-500">
                                                Bez CV
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {selectedSeeker.additional_attachments?.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                                        <FileText className="h-4 w-4" />
                                        Další přílohy ({selectedSeeker.additional_attachments.length})
                                    </label>
                                    <div className="space-y-2">
                                        {selectedSeeker.additional_attachments.map((attachment) => (
                                            <Button
                                                key={attachment.id}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDownloadAttachment(selectedSeeker, attachment)}
                                                className="w-full justify-start text-sm"
                                            >
                                                <Download className="h-3 w-3 mr-2" />
                                                {attachment.original_filename}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Message */}
                            {selectedSeeker.message && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                                        <MessageSquare className="h-4 w-4" />
                                        Zpráva od zájemce
                                    </label>
                                    <div className="bg-muted/50 rounded-lg p-4 border">
                                        <p className="text-base whitespace-pre-wrap">{selectedSeeker.message}</p>
                                    </div>
                                </div>
                            )}

                            {/* CV Analysis Section */}
                            {selectedSeeker.cv_file_path && (
                                <div className="pt-4 border-t">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Brain className="h-4 w-4" />
                                            AI analýza životopisu
                                        </label>
                                        {seekerCapabilities.canReanalyzeCv && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleTriggerAnalysis(selectedSeeker)}
                                                disabled={isAnalyzing === selectedSeeker.id || cvAnalysisStatus?.status === 'pending' || cvAnalysisStatus?.status === 'processing'}
                                            >
                                                {isAnalyzing === selectedSeeker.id || cvAnalysisStatus?.status === 'pending' || cvAnalysisStatus?.status === 'processing' ? (
                                                    <>
                                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                        Analyzuje...
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw className="h-3 w-3 mr-1" />
                                                        {cvAnalysisStatus?.status === 'completed' ? 'Přeanalyzovat' : 'Analyzovat'}
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>

                                    {isLoadingAnalysis ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Načítám analýzu...
                                        </div>
                                    ) : cvAnalysisStatus ? (
                                        <div className="bg-muted/50 rounded-lg p-4 border space-y-3">
                                            {/* Status */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">Status:</span>
                                                {cvAnalysisStatus.status === 'pending' && (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                        Čeká na zpracování
                                                    </Badge>
                                                )}
                                                {cvAnalysisStatus.status === 'processing' && (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                        Analyzuje se
                                                    </Badge>
                                                )}
                                                {cvAnalysisStatus.status === 'completed' && (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                                        Dokončeno
                                                    </Badge>
                                                )}
                                                {cvAnalysisStatus.status === 'failed' && (
                                                    <Badge variant="outline" className="bg-red-50 text-red-700">
                                                        Chyba: {cvAnalysisStatus.error_message || 'Neznámá chyba'}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Score */}
                                            {cvAnalysisStatus.status === 'completed' && cvAnalysisStatus.evaluation_score !== null && cvAnalysisStatus.evaluation_score !== undefined && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-muted-foreground">Hodnocení:</span>
                                                    <span className={`text-lg font-bold ${
                                                        cvAnalysisStatus.evaluation_score >= 70 ? 'text-green-600' :
                                                        cvAnalysisStatus.evaluation_score >= 40 ? 'text-amber-600' : 'text-red-600'
                                                    }`}>
                                                        {cvAnalysisStatus.evaluation_score}/100
                                                    </span>
                                                </div>
                                            )}

                                            {/* Skills */}
                                            {cvAnalysisStatus.status === 'completed' && cvAnalysisStatus.skills && cvAnalysisStatus.skills.length > 0 && (
                                                <div>
                                                    <span className="text-sm text-muted-foreground">Dovednosti:</span>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {cvAnalysisStatus.skills.slice(0, 8).map((skill, i) => (
                                                            <Badge key={i} variant="secondary" className="text-xs">
                                                                {skill}
                                                            </Badge>
                                                        ))}
                                                        {cvAnalysisStatus.skills.length > 8 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                +{cvAnalysisStatus.skills.length - 8}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Summary */}
                                            {cvAnalysisStatus.status === 'completed' && cvAnalysisStatus.summary && (
                                                <div>
                                                    <span className="text-sm text-muted-foreground">Shrnutí:</span>
                                                    <p className="text-sm mt-1 line-clamp-3">{cvAnalysisStatus.summary}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-muted/50 rounded-lg p-4 border text-center">
                                            <Brain className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            <p className="text-sm text-muted-foreground">
                                                CV zatím nebylo analyzováno. Klikněte na &quot;Analyzovat&quot; pro spuštění AI analýzy.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* GDPR Consent */}
                            <div className="pt-4 border-t">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Badge variant={selectedSeeker.gdpr_consent ? "default" : "secondary"}>
                                        {selectedSeeker.gdpr_consent ? "✓" : "✗"}
                                    </Badge>
                                    GDPR souhlas udělen
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-2 pt-4 border-t">
                                {selectedSeeker.cv_file_path && (
                                    <Button
                                        variant="outline"
                                        onClick={() => handleDownloadCV(selectedSeeker)}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Stáhnout CV
                                    </Button>
                                )}
                                {seekerCapabilities.canDelete && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            setIsDialogOpen(false)
                                            handleDeleteClick(selectedSeeker)
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Smazat
                                    </Button>
                                )}
                                <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                                    Zavřít
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Toast Container */}
            <div id="toast-container" />

        </AdminPageErrorBoundary>
    )
}
