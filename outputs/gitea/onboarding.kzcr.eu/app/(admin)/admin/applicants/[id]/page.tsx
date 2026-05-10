"use client"

import { useState, useEffect, use } from "react"
import toast, { Toaster } from 'react-hot-toast'
import { Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getApplicantById, getApplicantHistory, getApplicantAttachments, getApplicantNotes, downloadAttachment, updateAttachmentStatus, getDocumentStatuses, sendEmailToApplicant, getCVAnalysis, triggerCVReanalysis, type Applicant, type StatusHistoryEntry, type Attachment, type ApplicantNote, type DocumentStatus, type CVAnalysis } from "@/lib/api/applicants"
import { getJobById } from "@/lib/api/jobs"
import { getJobRoleWorkflows, type OnboardingWorkflow } from "@/lib/api/workflows"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useApplicantActions } from "./hooks/useApplicantActions"
import ApplicantHeader from "./components/ApplicantHeader"
import ApplicantInfo from "./components/ApplicantInfo"
import ApplicantTabs from "./components/ApplicantTabs"
import { getStatusBadgeClass, formatDate, formatFileSize } from "./utils/statusUtils"
import { useAuth } from "@/context/AuthContext"
import { ADMIN_SHELL_ROLES, getAdminAccessConfig } from "@/lib/authorizedPersonAccess"

export default function ApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [applicant, setApplicant] = useState<Applicant | null>(null)
    const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([])
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [notes, setNotes] = useState<ApplicantNote[]>([])
    const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
    const [availableWorkflows, setAvailableWorkflows] = useState<OnboardingWorkflow[]>([])
    const [selectedWorkflow, setSelectedWorkflow] = useState("")
    const [startDate, setStartDate] = useState("")
    const [approvalNotes, setApprovalNotes] = useState("")
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
    const [emailText, setEmailText] = useState("")
    const [isSendingEmail, setIsSendingEmail] = useState(false)
    const [emailAttachments, setEmailAttachments] = useState<File[]>([])
    const [cvAnalysis, setCvAnalysis] = useState<CVAnalysis | null>(null)
    const [isCVAnalysisLoading, setIsCVAnalysisLoading] = useState(false)
    const [isReanalyzing, setIsReanalyzing] = useState(false)
    const { roles } = useAuth()
    const adminAccess = getAdminAccessConfig(roles)
    const readOnlyAdmin = adminAccess.authorizedPersonOnly
    const applicantCapabilities = adminAccess.capabilities.applicants
    const canViewCvAnalysis = adminAccess.capabilities.applicants.canViewCvAnalysis

    // Fetch CV analysis with optional polling for pending/processing states
    const fetchCVAnalysis = async () => {
        if (!canViewCvAnalysis) {
            setCvAnalysis(null)
            return
        }

        setIsCVAnalysisLoading(true)
        try {
            const data = await getCVAnalysis(id)
            setCvAnalysis(data)
        } finally {
            setIsCVAnalysisLoading(false)
        }
    }

    useEffect(() => {
        fetchApplicantDetails()
    }, [canViewCvAnalysis, id])

    // Polling for CV analysis when status is pending or processing
    useEffect(() => {
        if (!canViewCvAnalysis) {
            return
        }

        if (cvAnalysis?.status === 'pending' || cvAnalysis?.status === 'processing') {
            const pollInterval = setInterval(() => {
                getCVAnalysis(id).then(data => {
                    setCvAnalysis(data)
                    // Stop polling when completed or failed
                    if (data?.status === 'completed' || data?.status === 'failed') {
                        clearInterval(pollInterval)
                    }
                })
            }, 3000) // Poll every 3 seconds

            return () => clearInterval(pollInterval)
        }
    }, [canViewCvAnalysis, cvAnalysis?.status, id])

    const fetchApplicantDetails = async () => {
        try {
            setLoading(true)
            setError(null)

            const [applicantData, historyData, attachmentsData, notesData, statusesData] = await Promise.all([
                getApplicantById(id),
                getApplicantHistory(id),
                getApplicantAttachments(id),
                getApplicantNotes(id),
                getDocumentStatuses()
            ])

            setApplicant(applicantData)
            setStatusHistory(historyData)
            setAttachments(attachmentsData)
            setNotes(notesData)
            setDocumentStatuses(statusesData)

            if (canViewCvAnalysis) {
                fetchCVAnalysis()
            } else {
                setCvAnalysis(null)
            }

            // Fetch job details and workflows if we have a job posting ID
            if (applicantData.job_posting_id) {
                try {
                    const jobData = await getJobById(applicantData.job_posting_id)
                    if (jobData.job_role_id) {
                        const workflows = await getJobRoleWorkflows(jobData.job_role_id)
                        setAvailableWorkflows(workflows)
                        
                        // Auto-select the first workflow if available
                        if (workflows.length > 0) {
                            setSelectedWorkflow(workflows[0].id)
                        }
                    }
                } catch (workflowErr) {
                    console.warn('Could not fetch workflows for job role:', workflowErr)
                    // Don't show error to user, just log it
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nepodařilo se načíst údaje uchazeče')
            console.error('Error fetching applicant details:', err)
        } finally {
            setLoading(false)
        }
    }

    // Set default start date to tomorrow
    useEffect(() => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        setStartDate(tomorrow.toISOString().split('T')[0])
    }, [])

    // Use the custom hook for all applicant actions
    const {
        isSubmitting,
        isAddingNote,
        rejectionNotes,
        setRejectionNotes,
        newNote,
        setNewNote,
        handleStatusChange,
        handleApprove,
        handleReject,
        handleAddNote,
        getStatusDisplayName
    } = useApplicantActions(applicant, fetchApplicantDetails, setNotes)

    const handleDownloadAttachment = async (attachmentId: string, filename: string) => {
        try {
            await downloadAttachment(attachmentId, filename)
            toast.success(`Soubor ${filename} byl stažen`)
        } catch (error) {
            console.error('Download error:', error)
            toast.error(error instanceof Error ? error.message : 'Chyba při stahování souboru')
        }
    }

    const handleUpdateAttachmentStatus = async (attachmentId: string, status: string, notes?: string) => {
        if (!applicantCapabilities.canManageAttachmentStatus) {
            toast.error('Nemáte oprávnění měnit stav příloh')
            return
        }

        try {
            await updateAttachmentStatus(attachmentId, { status, review_notes: notes })
            toast.success('Status dokumentu byl aktualizován')
            
            // Refresh attachments to show updated status
            const updatedAttachments = await getApplicantAttachments(id)
            setAttachments(updatedAttachments)
        } catch (error) {
            console.error('Status update error:', error)
            toast.error(error instanceof Error ? error.message : 'Chyba při aktualizaci statusu')
        }
    }

    const handleSendEmail = async () => {
        if (!applicantCapabilities.canSendEmail) {
            toast.error('Nemáte oprávnění odesílat email uchazeči')
            return
        }

        if (!emailText.trim()) {
            toast.error('Zpráva nemůže být prázdná')
            return
        }

        try {
            setIsSendingEmail(true)
            
            const formData = new FormData()
            formData.append('message', emailText)
            emailAttachments.forEach(file => {
                formData.append('attachments', file)
            })

            const result = await sendEmailToApplicant(id, formData)
            
            if (result.success) {
                toast.success('Email byl odeslán uchazeči')
                setIsEmailDialogOpen(false)
                setEmailText("")
                setEmailAttachments([]) // Reset attachments
            } else {
                toast.error(result.message || 'Chyba při odesílání emailu')
            }
        } catch (error) {
            console.error('Email send error:', error)
            toast.error(error instanceof Error ? error.message : 'Chyba při odesílání emailu')
        } finally {
            setIsSendingEmail(false)
        }
    }

    const handleReanalyze = async () => {
        try {
            setIsReanalyzing(true)
            const result = await triggerCVReanalysis(id)
            if (result.success) {
                toast.success('Reanalýza CV byla zahájena. Výsledky budou k dispozici za chvíli.')
            } else {
                toast.error(result.message || 'Nepodařilo se spustit reanalýzu')
            }
        } catch (error) {
            console.error('Reanalysis error:', error)
            toast.error(error instanceof Error ? error.message : 'Chyba při spuštění reanalýzy')
        } finally {
            setIsReanalyzing(false)
        }
    }

    const handleAddNoteGuarded = async () => {
        if (!applicantCapabilities.canManageNotes) {
            toast.error('Nemáte oprávnění přidávat poznámky')
            return
        }

        await handleAddNote()
    }

    if (loading) {
        return (
            <ProtectedRoute requiredRoles={[...ADMIN_SHELL_ROLES]}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p>Načítání údajů uchazeče...</p>
                    </div>
                </div>
            </ProtectedRoute>
        )
    }

    if (error || !applicant) {
        return (
            <ProtectedRoute requiredRoles={[...ADMIN_SHELL_ROLES]}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 mb-4">{error || 'Uchazeč nebyl nalezen'}</p>
                        <Button onClick={() => window.history.back()}>
                            Zpět na seznam uchazečů
                        </Button>
                    </div>
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute requiredRoles={[...ADMIN_SHELL_ROLES]}>
            <Toaster position="top-right" />
            <div className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

                <ApplicantHeader
                    applicant={applicant}
                    readOnly={readOnlyAdmin}
                    canSendEmail={applicantCapabilities.canSendEmail}
                    canScheduleInterview={applicantCapabilities.canScheduleInterview}
                    canMutateApplicant={applicantCapabilities.canMutate}
                    isSubmitting={isSubmitting}
                    rejectionNotes={rejectionNotes}
                    setRejectionNotes={setRejectionNotes}
                    isApproveDialogOpen={isApproveDialogOpen}
                    setIsApproveDialogOpen={setIsApproveDialogOpen}
                    isRejectDialogOpen={isRejectDialogOpen}
                    setIsRejectDialogOpen={setIsRejectDialogOpen}
                    handleApprove={handleApprove}
                    handleReject={handleReject}
                    handleStatusChange={handleStatusChange}
                    availableWorkflows={availableWorkflows}
                    selectedWorkflow={selectedWorkflow}
                    setSelectedWorkflow={setSelectedWorkflow}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    approvalNotes={approvalNotes}
                    setApprovalNotes={setApprovalNotes}
                    isEmailDialogOpen={isEmailDialogOpen}
                    setIsEmailDialogOpen={setIsEmailDialogOpen}
                    emailText={emailText}
                    setEmailText={setEmailText}
                    handleSendEmail={handleSendEmail}
                    isSendingEmail={isSendingEmail}
                    setEmailAttachments={setEmailAttachments}
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <ApplicantInfo
                        applicant={applicant}
                        getStatusDisplayName={getStatusDisplayName}
                        getStatusBadgeClass={getStatusBadgeClass}
                        formatDate={formatDate}
                    />

                <ApplicantTabs
                    attachments={attachments}
                    statusHistory={statusHistory}
                    notes={notes}
                    readOnly={readOnlyAdmin}
                        canManageNotes={applicantCapabilities.canManageNotes}
                        canManageAttachmentStatus={applicantCapabilities.canManageAttachmentStatus}
                    newNote={newNote}
                        setNewNote={setNewNote}
                        isAddingNote={isAddingNote}
                        handleAddNote={handleAddNoteGuarded}
                        handleDownloadAttachment={handleDownloadAttachment}
                        handleUpdateAttachmentStatus={handleUpdateAttachmentStatus}
                        documentStatuses={documentStatuses}
                        getStatusDisplayName={getStatusDisplayName}
                        getStatusBadgeClass={getStatusBadgeClass}
                    formatDate={formatDate}
                    formatFileSize={formatFileSize}
                    cvAnalysis={cvAnalysis}
                    isCVAnalysisLoading={canViewCvAnalysis ? isCVAnalysisLoading : false}
                    onReanalyze={canViewCvAnalysis ? handleReanalyze : undefined}
                    isReanalyzing={canViewCvAnalysis ? isReanalyzing : false}
                />
                </div>
            </div>
        </ProtectedRoute>
    )
}
