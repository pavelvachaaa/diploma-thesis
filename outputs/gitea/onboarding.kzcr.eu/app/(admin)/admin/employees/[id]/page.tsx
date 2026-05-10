"use client"

import { useState, useEffect, use } from "react"
import { CheckCircle, XCircle, Clock, RotateCcw } from "lucide-react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { ADMIN_ONLY_AND_SUPER_ADMIN_ROLES } from "@/lib/authorizedPersonAccess"
import { AdminPageErrorBoundary, AdminComponentErrorBoundary } from "@/components/admin/AdminErrorBoundary"
import { getEmployeeById, getEmployeeApplicantData, type Employee, type EmployeeApplicantData } from "@/lib/api/employees"
import { formatDate } from "../../applicants/[id]/utils/statusUtils"
import { getDocumentStatuses, updateAttachmentStatus, createApplicantNote, downloadAttachment } from "@/lib/api/applicants"
import type { DocumentStatus } from "@/lib/api/applicants"

// Import component parts
import { EmployeeHeader } from "./components/EmployeeHeader"
import { EmployeeBasicInfo } from "./components/EmployeeBasicInfo"
import { EmployeeApplicantInfo } from "./components/EmployeeApplicantInfo"
import DocumentApprovalSection from "./components/DocumentApprovalSection"
import { EmployeeAuditLogs } from "../components/EmployeeAuditLogs"

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [applicantData, setApplicantData] = useState<EmployeeApplicantData | null>(null)
    const [hasApplicantData, setHasApplicantData] = useState<boolean | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // State for ApplicantTabs functionality
    const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus[]>([])
    const [newNote, setNewNote] = useState('')
    const [isAddingNote, setIsAddingNote] = useState(false)

    useEffect(() => {
        fetchEmployeeDetails()
        fetchDocumentStatuses()
    }, [id])

    const fetchEmployeeDetails = async () => {
        try {
            setLoading(true)
            setError(null)

            // First get basic employee info
            const employeeData = await getEmployeeById(id)
            setEmployee(employeeData)

            // Then try to get applicant data if employee has applicant_id
            if (employeeData.applicant_id) {
                try {
                    const applicantDataResult = await getEmployeeApplicantData(id)
                    setApplicantData(applicantDataResult)
                    setHasApplicantData(true)
                } catch (applicantErr) {
                    console.log('No applicant data found for employee:', applicantErr)
                    setHasApplicantData(false)
                }
            } else {
                setHasApplicantData(false)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nepodařilo se načíst údaje zaměstnance')
            console.error('Error fetching employee details:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchDocumentStatuses = async () => {
        try {
            const statuses = await getDocumentStatuses()
            setDocumentStatuses(statuses)
        } catch (err) {
            console.error('Error fetching document statuses:', err)
        }
    }

    const handleUpdateAttachmentStatus = async (attachmentId: string, status: string, notes?: string) => {
        try {
            await updateAttachmentStatus(attachmentId, {
                status,
                review_notes: notes
            })
            // Refresh applicant data to get updated attachment status
            if (employee?.applicant_id) {
                const updatedData = await getEmployeeApplicantData(id)
                setApplicantData(updatedData)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nepodařilo se aktualizovat stav dokumentu')
        }
    }

    const handleRefresh = async () => {
        // Force re-fetch employee data
        await fetchEmployeeDetails()
    }

    const handleAddNote = async () => {
        if (!newNote.trim() || !applicantData?.applicant.id) return

        try {
            setIsAddingNote(true)
            await createApplicantNote(applicantData.applicant.id, {
                note: newNote.trim()
            })
            setNewNote('')
            // Refresh applicant data to get updated notes
            const updatedData = await getEmployeeApplicantData(id)
            setApplicantData(updatedData)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nepodařilo se přidat poznámku')
        } finally {
            setIsAddingNote(false)
        }
    }

    const handleDownloadAttachment = async (attachmentId: string, filename: string) => {
        try {
            await downloadAttachment(attachmentId, filename)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nepodařilo se stáhnout soubor')
        }
    }


    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getStatusDisplayName = (status: string) => {
        switch (status) {
            case "submitted":
                return "Odeslána"
            case "under_review":
                return "Posuzována"
            case "interview_scheduled":
                return "Pohovor naplánován"
            case "interview_completed":
                return "Pohovor dokončen"
            case "accepted":
                return "Přijata"
            case "rejected":
                return "Zamítnuta"
            case "withdrawn":
                return "Stažena"
            default:
                return status
        }
    }

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "submitted":
                return "bg-blue-50 text-blue-700"
            case "under_review":
                return "bg-amber-50 text-amber-700"
            case "interview_scheduled":
            case "interview_completed":
                return "bg-purple-50 text-purple-700"
            case "accepted":
                return "bg-green-50 text-green-700"
            case "rejected":
                return "bg-red-50 text-red-700"
            case "withdrawn":
                return "bg-gray-50 text-gray-700"
            default:
                return "bg-gray-50 text-gray-700"
        }
    }

    const getDocumentStatusIcon = (status: string) => {
        switch (status) {
            case "approved":
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case "pending":
                return <Clock className="h-4 w-4 text-amber-500" />
            case "rejected":
                return <XCircle className="h-4 w-4 text-red-500" />
            case "needs_revision":
                return <RotateCcw className="h-4 w-4 text-orange-500" />
            default:
                return <Clock className="h-4 w-4 text-amber-500" />
        }
    }

    // Early returns handled by individual components now

    return (
        <ProtectedRoute requiredRoles={[...ADMIN_ONLY_AND_SUPER_ADMIN_ROLES]}>
            <AdminPageErrorBoundary>
                <div className="space-y-6">
                    {/* Header */}
                    <AdminComponentErrorBoundary componentName="EmployeeHeader">
                        <EmployeeHeader
                            employee={employee}
                            loading={loading}
                            error={error}
                            onRefresh={handleRefresh}
                        />
                    </AdminComponentErrorBoundary>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* Basic Employee Info */}
                        <AdminComponentErrorBoundary componentName="EmployeeBasicInfo">
                            <EmployeeBasicInfo 
                                employee={employee} 
                                loading={loading} 
                                error={error} 
                            />
                        </AdminComponentErrorBoundary>

                    </div>

                    {employee?.id && (
                        <AdminComponentErrorBoundary componentName="EmployeeAuditLogs">
                            <EmployeeAuditLogs employeeId={employee.id} />
                        </AdminComponentErrorBoundary>
                    )}

                </div>
            </AdminPageErrorBoundary>
        </ProtectedRoute>
    )
}
