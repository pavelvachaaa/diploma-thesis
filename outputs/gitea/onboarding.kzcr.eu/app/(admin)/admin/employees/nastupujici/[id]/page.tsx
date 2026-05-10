"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    Clock,
    Circle,
    Paperclip,
    Download,
    Upload,
    RotateCcw,
    FileText,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Mail,
    Phone,
    MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import toast from "react-hot-toast"
import { getEmployeeById, getEmployeeApplicantData, type Employee, type EmployeeApplicantData } from "@/lib/api/employees"
import { getEmployeeOnboardingDashboard, getEmployeeStepResponses } from "@/lib/api/admin-employee-onboarding"
import { DeleteEmployeeButton } from "@/components/hr-admin-ui/DeleteEmployeeButton"
import { EmployeeAuditLogs } from "../../components/EmployeeAuditLogs"
import {
    getEmployeeDocuments,
    updateDocumentStatus,
    downloadEmployeeDocument,
    uploadDocumentForEmployee,
    type UserDocument,
} from "@/lib/api/employee-documents"
import { downloadAttachment } from "@/lib/api/applicants"
import type { OnboardingDashboard, OnboardingStep } from "@/lib/api/employee_onboarding"

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(dateString: string | null | undefined) {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("cs-CZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}

function formatDateTime(dateString: string | null | undefined) {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleString("cs-CZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

function formatFileSize(bytes: number | null | undefined) {
    if (!bytes) return ""
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    return `${Math.round(bytes / 1024)} KB`
}

const educationLabels: Record<string, string> = {
    elementary: "Základní",
    secondary: "Střední",
    higher: "Vyšší odborné",
    bachelor: "Bakalářské",
    master: "Magisterské",
    doctorate: "Doktorské",
}

const experienceLabels: Record<string, string> = {
    none: "Žádné",
    less_than_1: "Méně než 1 rok",
    "1_to_3": "1–3 roky",
    "3_to_5": "3–5 let",
    "5_to_10": "5–10 let",
    more_than_10: "Více než 10 let",
}

function stepTypeLabel(type: string) {
    const map: Record<string, string> = {
        form: "Formulář",
        document: "Dokument",
        info: "Informace",
        acknowledgement: "Potvrzení",
        task: "Úkol",
    }
    return map[type] ?? type
}

// ─── sub-components ─────────────────────────────────────────────────────────

function InitialsAvatar({ name, surname }: { name: string; surname: string }) {
    const initials = `${name?.[0] ?? ""}${surname?.[0] ?? ""}`.toUpperCase()
    return (
        <div className="h-14 w-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold flex-shrink-0 select-none">
            {initials}
        </div>
    )
}

function FilenameChip({ filename }: { filename: string }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            <Paperclip className="h-3 w-3" />
            {filename}
        </span>
    )
}

function StepStatusDot({ status }: { status: string }) {
    if (status === "completed")
        return <div className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200 flex-shrink-0" />
    if (status === "in_progress")
        return <div className="h-3 w-3 rounded-full bg-indigo-500 ring-2 ring-indigo-200 flex-shrink-0 animate-pulse" />
    return <div className="h-3 w-3 rounded-full bg-slate-300 flex-shrink-0" />
}

function StepStatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string }> = {
        completed: { label: "Dokončen", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
        in_progress: { label: "Probíhá", cls: "bg-indigo-50 text-indigo-700 border-indigo-100" },
        not_started: { label: "Nezahájen", cls: "bg-slate-100 text-slate-500 border-slate-200" },
        skipped: { label: "Přeskočen", cls: "bg-slate-100 text-slate-400 border-slate-200" },
    }
    const entry = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-500 border-slate-200" }
    return <Badge className={`text-xs border ${entry.cls}`}>{entry.label}</Badge>
}

// ─── inline form responses viewer ───────────────────────────────────────────

interface InlineResponsesProps {
    employeeId: string
    stepId: string
}

function InlineFormResponses({ employeeId, stepId }: InlineResponsesProps) {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        getEmployeeStepResponses(employeeId, stepId)
            .then(setData)
            .catch((e) => setError(e instanceof Error ? e.message : "Chyba"))
            .finally(() => setLoading(false))
    }, [employeeId, stepId])

    if (loading)
        return (
            <div className="mt-3 pl-6">
                <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
            </div>
        )
    if (error)
        return <p className="mt-3 pl-6 text-xs text-rose-500">{error}</p>
    if (!data?.form?.fields?.length)
        return <p className="mt-3 pl-6 text-xs text-slate-400">Formulář neobsahuje žádná pole.</p>

    const responses = data.userStepProgress?.form_response ?? {}
    return (
        <div className="mt-3 pl-6 space-y-2">
            {data.form.fields.map((field: any) => {
                const val = responses[field.id]
                const empty = val === null || val === undefined || val === ""
                return (
                    <div key={field.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                        <p className="text-xs font-medium text-slate-500">{field.label}</p>
                        <p className="mt-0.5 text-sm text-slate-800">
                            {empty ? (
                                <span className="italic text-slate-400">Nevyplněno</span>
                            ) : field.type === "checkbox" ? (
                                val ? (
                                    <span className="flex items-center gap-1 text-emerald-600">
                                        <CheckCircle className="h-3.5 w-3.5" /> Ano
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-rose-500">
                                        <XCircle className="h-3.5 w-3.5" /> Ne
                                    </span>
                                )
                            ) : field.type === "date" ? (
                                new Date(val).toLocaleDateString("cs-CZ")
                            ) : (
                                String(val)
                            )}
                        </p>
                    </div>
                )
            })}
        </div>
    )
}

// ─── document card border / status helpers ──────────────────────────────────

function docBorderClass(doc: UserDocument) {
    if (!doc.file_path) return "border-l-4 border-l-amber-300 border border-amber-100 bg-amber-50/20"
    switch (doc.status) {
        case "approved": return "border-l-4 border-l-emerald-300 border border-slate-100 bg-emerald-50/20"
        case "rejected": return "border-l-4 border-l-rose-300 border border-slate-100 bg-rose-50/20"
        default: return "border-l-4 border-l-slate-300 border border-slate-100 bg-white"
    }
}

function docStatusBadge(doc: UserDocument) {
    if (!doc.file_path)
        return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs">Čeká na nahrání</Badge>
    switch (doc.status) {
        case "approved": return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs">Schváleno</Badge>
        case "rejected": return <Badge className="bg-rose-50 text-rose-700 border border-rose-100 text-xs">Zamítnuto</Badge>
        default: return <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-xs">Čeká na schválení</Badge>
    }
}

function docStatusIcon(doc: UserDocument) {
    if (!doc.file_path) return <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
    switch (doc.status) {
        case "approved": return <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
        case "rejected": return <XCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
        default: return <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
    }
}

function attachmentStatusBadge(status: string) {
    const map: Record<string, { label: string; cls: string }> = {
        pending: { label: "Čeká", cls: "bg-amber-50 text-amber-700 border-amber-200" },
        approved: { label: "Schváleno", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
        rejected: { label: "Zamítnuto", cls: "bg-rose-50 text-rose-700 border-rose-100" },
    }
    const entry = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-500 border-slate-200" }
    return <Badge className={`text-xs border ${entry.cls}`}>{entry.label}</Badge>
}

// ─── loading skeleton ────────────────────────────────────────────────────────

function PageSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-24 rounded-2xl bg-slate-100" />
            <div className="h-20 rounded-2xl bg-slate-100" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <div className="h-48 rounded-2xl bg-slate-100" />
                    <div className="h-32 rounded-2xl bg-slate-100" />
                </div>
                <div className="lg:col-span-2 h-80 rounded-2xl bg-slate-100" />
            </div>
            <div className="h-48 rounded-2xl bg-slate-100" />
        </div>
    )
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function NastupujiciDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [employee, setEmployee] = useState<Employee | null>(null)
    const [applicantData, setApplicantData] = useState<EmployeeApplicantData | null>(null)
    const [dashboard, setDashboard] = useState<OnboardingDashboard | null>(null)
    const [documents, setDocuments] = useState<UserDocument[]>([])

    // Timeline expand state
    const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

    // Document dialog state
    const [selectedDoc, setSelectedDoc] = useState<UserDocument | null>(null)
    const [dialogAction, setDialogAction] = useState<"approve" | "reject" | "reset" | null>(null)
    const [notes, setNotes] = useState("")
    const [isUpdating, setIsUpdating] = useState(false)
    const [uploadingDocId, setUploadingDocId] = useState<string | null>(null)

    // ── data loading ─────────────────────────────────────────────────────────

    const loadAll = async () => {
        try {
            setLoading(true)
            setError(null)
            const [emp, dash, docs] = await Promise.all([
                getEmployeeById(id),
                getEmployeeOnboardingDashboard(id).catch(() => null),
                getEmployeeDocuments(id).catch(() => []),
            ])
            setEmployee(emp)
            setDashboard(dash)
            setDocuments(docs)

            if (emp.applicant_id) {
                getEmployeeApplicantData(id)
                    .then(setApplicantData)
                    .catch(() => { /* no applicant data */ })
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Nepodařilo se načíst data zaměstnance")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadAll() }, [id])

    const refreshDocs = async () => {
        const docs = await getEmployeeDocuments(id).catch(() => documents)
        setDocuments(docs)
    }

    // ── document actions ──────────────────────────────────────────────────────

    const handleStatusUpdate = async () => {
        if (!selectedDoc || !dialogAction) return
        try {
            setIsUpdating(true)
            const status = dialogAction === "approve" ? "approved" : dialogAction === "reject" ? "rejected" : "pending"
            await updateDocumentStatus(selectedDoc.id, { status, notes: notes.trim() || undefined })
            toast.success(
                dialogAction === "approve" ? "Dokument byl schválen" :
                dialogAction === "reject" ? "Dokument byl zamítnut" :
                "Stav dokumentu byl resetován"
            )
            setSelectedDoc(null)
            setDialogAction(null)
            setNotes("")
            await refreshDocs()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Chyba při aktualizaci stavu dokumentu")
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDocDownload = async (doc: UserDocument) => {
        try {
            await downloadEmployeeDocument(id, doc.document_id, doc.original_name)
        } catch {
            toast.error("Nepodařilo se stáhnout dokument")
        }
    }

    const handleUpload = async (documentId: string, file: File) => {
        setUploadingDocId(documentId)
        try {
            await uploadDocumentForEmployee(id, documentId, file)
            toast.success("Dokument byl nahrán")
            await refreshDocs()
        } catch {
            toast.error("Nepodařilo se nahrát dokument")
        } finally {
            setUploadingDocId(null)
        }
    }

    const openDialog = (doc: UserDocument, action: "approve" | "reject" | "reset") => {
        setSelectedDoc(doc)
        setDialogAction(action)
        setNotes("")
    }

    // ── toggle timeline step ──────────────────────────────────────────────────

    const toggleStep = (stepId: string) => {
        setExpandedSteps((prev) => {
            const next = new Set(prev)
            if (next.has(stepId)) next.delete(stepId)
            else next.add(stepId)
            return next
        })
    }

    // ── render ────────────────────────────────────────────────────────────────

    if (loading) return <PageSkeleton />

    if (error) {
        return (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
                <p className="text-rose-700">{error}</p>
                <Button variant="outline" onClick={loadAll}>Zkusit znovu</Button>
            </div>
        )
    }

    if (!employee) return null

    const progress = dashboard?.progress
    const steps: OnboardingStep[] = dashboard?.steps ?? []
    const applicant = applicantData?.applicant
    const attachments = applicantData?.attachments ?? []

    const stepsCompleted = progress?.steps.completed ?? 0
    const stepsTotal = progress?.steps.total ?? 0
    const docsUploaded = progress?.documents.uploaded ?? 0
    const docsTotal = progress?.documents.total ?? 0
    const overallPct = Math.round(progress?.overall_progress ?? 0)

    return (
        <div className="space-y-6">
            {/* ── 1. Header strip ─────────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm px-6 py-5">
                <div className="flex items-start gap-4">
                    {/* back */}
                    <Link href="/admin/employees/nastupujici" className="mt-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500 hover:text-slate-700">
                            <ArrowLeft className="h-4 w-4" />
                            Nastupující
                        </Button>
                    </Link>

                    {/* avatar + info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <InitialsAvatar name={employee.name} surname={employee.surname} />
                        <div className="min-w-0">
                            <h1 className="text-xl font-semibold text-slate-900">
                                {employee.name} {employee.surname}
                            </h1>
                            <p className="text-sm text-slate-500 truncate">
                                {employee.email}
                                {employee.organization_name && (
                                    <span className="ml-2 text-slate-400">· {employee.organization_name}</span>
                                )}
                            </p>
                            {dashboard?.user?.start_date && (
                                <span className="inline-flex items-center mt-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 font-medium">
                                    Nástup: {formatDate(dashboard.user.start_date)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* actions + active badge */}
                    <div className="flex flex-shrink-0 items-center gap-3">
                        <DeleteEmployeeButton
                            employeeId={employee.id}
                            employeeName={`${employee.name} ${employee.surname}`}
                            redirectPath="/admin/employees/nastupujici"
                        />
                        {employee.is_active ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100">Aktivní</Badge>
                        ) : (
                            <Badge className="bg-slate-100 text-slate-500 border border-slate-200">Neaktivní</Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* ── 2. Progress hero ─────────────────────────────────────────── */}
            {progress && (
                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm px-6 py-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-700">Celkový postup</span>
                        <span className="text-sm font-semibold text-indigo-600">{overallPct} %</span>
                    </div>
                    {/* progress bar */}
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${overallPct}%` }}
                        />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                        <span>Kroky: <strong className="text-slate-700">{stepsCompleted}/{stepsTotal}</strong></span>
                        <span>Dokumenty: <strong className="text-slate-700">{docsUploaded}/{docsTotal}</strong></span>
                        {dashboard?.user?.workflow_name && (
                            <span>Workflow: <strong className="text-slate-700">{dashboard.user.workflow_name}</strong></span>
                        )}
                    </div>
                </div>
            )}

            {/* ── 3. Two-column content ────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* left — application info */}
                <div className="space-y-4">
                    {/* Přihláška */}
                    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <div className="px-5 pt-5 pb-4 border-b border-slate-50">
                            <h2 className="font-semibold text-slate-800">Přihláška</h2>
                        </div>
                        <div className="px-5 py-4 space-y-3 text-sm">
                            {applicant ? (
                                <>
                                    {applicant.job_title && (
                                        <div>
                                            <p className="text-slate-400 text-xs">Pozice</p>
                                            <p className="font-semibold text-slate-800 mt-0.5">{applicant.job_title}</p>
                                        </div>
                                    )}
                                    {applicant.applied_at && (
                                        <div>
                                            <p className="text-slate-400 text-xs">Datum přihlášky</p>
                                            <p className="text-slate-700 mt-0.5">{formatDate(applicant.applied_at)}</p>
                                        </div>
                                    )}
                                    {applicant.organization_name && (
                                        <div>
                                            <p className="text-slate-400 text-xs">Organizace</p>
                                            <p className="text-slate-700 mt-0.5">{applicant.organization_name}</p>
                                        </div>
                                    )}
                                    {applicant.current_status_name && (
                                        <div>
                                            <p className="text-slate-400 text-xs">Stav</p>
                                            <Badge className="mt-0.5 bg-slate-100 text-slate-600 border border-slate-200 text-xs">
                                                {applicant.current_status_name}
                                            </Badge>
                                        </div>
                                    )}

                                    {(applicant.education || applicant.experience || applicant.field) && (
                                        <hr className="border-slate-100" />
                                    )}

                                    {applicant.education && (
                                        <div>
                                            <p className="text-slate-400 text-xs">Vzdělání</p>
                                            <p className="text-slate-700 mt-0.5">{educationLabels[applicant.education] ?? applicant.education}</p>
                                        </div>
                                    )}
                                    {applicant.experience && (
                                        <div>
                                            <p className="text-slate-400 text-xs">Zkušenosti</p>
                                            <p className="text-slate-700 mt-0.5">{experienceLabels[applicant.experience] ?? applicant.experience}</p>
                                        </div>
                                    )}
                                    {applicant.field && (
                                        <div>
                                            <p className="text-slate-400 text-xs">Oblast</p>
                                            <p className="text-slate-700 mt-0.5">{applicant.field}</p>
                                        </div>
                                    )}
                                    {applicant.last_employer && (
                                        <div>
                                            <p className="text-slate-400 text-xs">Poslední zaměstnavatel</p>
                                            <p className="text-slate-700 mt-0.5">{applicant.last_employer}</p>
                                        </div>
                                    )}
                                    {applicant.last_position && (
                                        <div>
                                            <p className="text-slate-400 text-xs">Poslední pozice</p>
                                            <p className="text-slate-700 mt-0.5">{applicant.last_position}</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-slate-400 italic">Žádná data z přihlášky</p>
                            )}
                        </div>
                    </div>

                    {/* Kontakt */}
                    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <div className="px-5 pt-5 pb-4 border-b border-slate-50">
                            <h2 className="font-semibold text-slate-800">Kontakt</h2>
                        </div>
                        <div className="px-5 py-4 space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{employee.email}</span>
                            </div>
                            {employee.phone && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                    <span>{employee.phone}</span>
                                </div>
                            )}
                            {applicant?.city && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                    <span>
                                        {[applicant.address, applicant.city, applicant.zip]
                                            .filter(Boolean)
                                            .join(", ")}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* right — timeline */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div className="px-5 pt-5 pb-4 border-b border-slate-50">
                        <h2 className="font-semibold text-slate-800">Průběh onboardingu</h2>
                    </div>
                    <div className="px-5 py-4">
                        {steps.length === 0 ? (
                            <p className="text-slate-400 italic py-6 text-center">Žádné onboardingové kroky</p>
                        ) : (
                            <div className="space-y-0">
                                {steps.map((step, idx) => {
                                    const isLast = idx === steps.length - 1
                                    const isExpanded = expandedSteps.has(step.user_step_id)
                                    const isForm = step.step_type === "form"
                                    const canExpand = isForm && step.status === "completed"
                                    return (
                                        <div key={step.user_step_id} className="flex gap-4">
                                            {/* dot + connector */}
                                            <div className="flex flex-col items-center pt-1">
                                                <StepStatusDot status={step.status} />
                                                {!isLast && (
                                                    <div className={`w-px flex-1 mt-1 ${step.status === "completed" ? "bg-emerald-200" : "bg-slate-100"}`} style={{ minHeight: "2rem" }} />
                                                )}
                                            </div>

                                            {/* step card */}
                                            <div className="flex-1 pb-5">
                                                <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-slate-800 leading-snug">{step.title}</p>
                                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                                <Badge variant="outline" className="text-xs text-slate-500 border-slate-200">
                                                                    {stepTypeLabel(step.step_type)}
                                                                </Badge>
                                                                <StepStatusBadge status={step.status} />
                                                                {step.completed_at && (
                                                                    <span className="text-xs text-slate-400">
                                                                        {formatDateTime(step.completed_at)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {canExpand && (
                                                            <button
                                                                onClick={() => toggleStep(step.user_step_id)}
                                                                className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                                                            >
                                                                {isExpanded ? (
                                                                    <><ChevronUp className="h-3.5 w-3.5" />Skrýt odpovědi</>
                                                                ) : (
                                                                    <><ChevronDown className="h-3.5 w-3.5" />Zobrazit odpovědi</>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* inline form responses */}
                                                {isExpanded && (
                                                    <InlineFormResponses employeeId={id} stepId={step.user_step_id} />
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── 4. Documents section ─────────────────────────────────────── */}
            <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="px-5 pt-5 pb-4 border-b border-slate-50 flex items-center gap-2">
                    <h2 className="font-semibold text-slate-800">Onboardingové dokumenty</h2>
                    {documents.length > 0 && (
                        <Badge variant="outline" className="text-xs">{documents.length}</Badge>
                    )}
                </div>
                <div className="px-5 py-4">
                    {documents.length === 0 ? (
                        <p className="py-8 text-center text-slate-400 italic">Žádné požadované dokumenty</p>
                    ) : (
                        <div className="space-y-3">
                            {documents.map((doc) => (
                                <div key={doc.id ?? doc.document_id} className={`rounded-xl p-4 ${docBorderClass(doc)}`}>
                                    <div className="flex items-start justify-between gap-3 flex-wrap">
                                        {/* info */}
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {docStatusIcon(doc)}
                                                <span className="font-medium text-slate-800 text-sm">{doc.document_name}</span>
                                                {doc.required && (
                                                    <Badge className="text-xs bg-red-50 text-red-700 border border-red-200">Povinný</Badge>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                {docStatusBadge(doc)}
                                                {doc.document_type && <span>{doc.document_type}</span>}
                                                {doc.uploaded_at && <span>Nahrán: {formatDateTime(doc.uploaded_at)}</span>}
                                            </div>
                                            {/* filename chip */}
                                            {doc.original_filename && (
                                                <div className="pt-1">
                                                    <FilenameChip filename={doc.original_filename} />
                                                    {doc.file_size && (
                                                        <span className="ml-2 text-xs text-slate-400">{formatFileSize(doc.file_size)}</span>
                                                    )}
                                                </div>
                                            )}
                                            {doc.status === "rejected" && doc.review_notes && (
                                                <p className="text-xs text-rose-600 mt-1">Důvod: {doc.review_notes}</p>
                                            )}
                                        </div>

                                        {/* actions */}
                                        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                                            {/* upload */}
                                            {!doc.file_path ? (
                                                <label
                                                    className={`cursor-pointer inline-flex items-center gap-2 rounded-md border-2 border-dashed border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors ${uploadingDocId === doc.document_id ? "opacity-50 pointer-events-none" : ""}`}
                                                >
                                                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden"
                                                        disabled={uploadingDocId === doc.document_id}
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) { await handleUpload(doc.document_id, file); e.target.value = "" }
                                                        }}
                                                    />
                                                    {uploadingDocId === doc.document_id ? (
                                                        <><span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-700 border-t-transparent" />Nahrávám...</>
                                                    ) : (
                                                        <><Upload className="h-4 w-4" />Nahrát</>
                                                    )}
                                                </label>
                                            ) : (
                                                <label
                                                    className={`cursor-pointer inline-flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 h-8 w-8 transition-colors ${uploadingDocId === doc.document_id ? "opacity-50 pointer-events-none" : ""}`}
                                                    title="Nahrát znovu"
                                                >
                                                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden"
                                                        disabled={uploadingDocId === doc.document_id}
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) { await handleUpload(doc.document_id, file); e.target.value = "" }
                                                        }}
                                                    />
                                                    {uploadingDocId === doc.document_id
                                                        ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                        : <RotateCcw className="h-3 w-3" />}
                                                </label>
                                            )}

                                            {/* download */}
                                            {doc.file_path && (
                                                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handleDocDownload(doc)}>
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            )}

                                            {/* approve / reject / reset */}
                                            {doc.file_path && (
                                                <>
                                                    {doc.status !== "approved" && (
                                                        <Button size="sm" onClick={() => openDialog(doc, "approve")}
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                                            <CheckCircle className="h-4 w-4 mr-1" />Schválit
                                                        </Button>
                                                    )}
                                                    {doc.status !== "rejected" && (
                                                        <Button size="sm" variant="outline" onClick={() => openDialog(doc, "reject")}
                                                            className="text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50">
                                                            <XCircle className="h-4 w-4 mr-1" />Zamítnout
                                                        </Button>
                                                    )}
                                                    {doc.status !== "pending" && (
                                                        <Button size="sm" variant="outline" onClick={() => openDialog(doc, "reset")}>
                                                            <RotateCcw className="h-4 w-4 mr-1" />Reset
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── 5. Application attachments ───────────────────────────────── */}
            {employee.applicant_id && attachments.length > 0 && (
                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div className="px-5 pt-5 pb-4 border-b border-slate-50 flex items-center gap-2">
                        <h2 className="font-semibold text-slate-800">Přílohy přihlášky</h2>
                        <Badge variant="outline" className="text-xs">{attachments.length}</Badge>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                        {attachments.map((att) => (
                            <div key={att.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                                <div className="flex items-start gap-3 min-w-0">
                                    <FileText className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{att.original_filename}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            {attachmentStatusBadge(att.status)}
                                            <span className="text-xs text-slate-400">
                                                Nahráno: {formatDateTime(att.uploaded_at)}
                                                {att.file_size ? ` · ${formatFileSize(att.file_size)}` : ""}
                                            </span>
                                        </div>
                                        {att.review_notes && (
                                            <p className="text-xs text-rose-600 mt-1">Poznámka: {att.review_notes}</p>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-shrink-0 h-8 gap-1"
                                    onClick={() => downloadAttachment(att.id, att.original_filename)}
                                >
                                    <Download className="h-4 w-4" />
                                    Stáhnout
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {employee?.id && (
                <EmployeeAuditLogs employeeId={employee.id} />
            )}

            {/* ── document status dialog ───────────────────────────────────── */}
            <Dialog
                open={!!selectedDoc && !!dialogAction}
                onOpenChange={() => { setSelectedDoc(null); setDialogAction(null); setNotes("") }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {dialogAction === "approve" && `Schválit dokument: ${selectedDoc?.document_name}`}
                            {dialogAction === "reject" && `Zamítnout dokument: ${selectedDoc?.document_name}`}
                            {dialogAction === "reset" && `Resetovat stav dokumentu: ${selectedDoc?.document_name}`}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogAction === "approve" && "Dokument bude označen jako schválený."}
                            {dialogAction === "reject" && "Doporučujeme přidat poznámku s důvodem zamítnutí."}
                            {dialogAction === "reset" && "Dokument bude resetován na stav čeká na schválení."}
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <Label htmlFor="dlg-notes">Poznámka (volitelné)</Label>
                        <Textarea
                            id="dlg-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={dialogAction === "reject" ? "Uveďte důvod zamítnutí..." : "Přidejte poznámku..."}
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setSelectedDoc(null); setDialogAction(null); setNotes("") }} disabled={isUpdating}>
                            Zrušit
                        </Button>
                        <Button
                            onClick={handleStatusUpdate}
                            disabled={isUpdating}
                            className={
                                dialogAction === "approve" ? "bg-indigo-600 hover:bg-indigo-700" :
                                dialogAction === "reject" ? "bg-rose-600 hover:bg-rose-700" : ""
                            }
                        >
                            {isUpdating ? "Zpracovává se..." : "Potvrdit"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
