import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    ArrowLeft,
    Calendar,
    UserPlus,
    CheckCircle,
    Clock,
    Mail,
    XCircle,
} from "lucide-react"
import { type Applicant } from "@/lib/api/applicants"
import { OnboardingWorkflow } from "@/lib/api/workflows"
import { FileUpload } from "@/components/ui/file-upload"
import CreateInterviewDialog from "@/app/(admin)/admin/interviews/components/CreateInterviewDialog"

export interface InterviewData {
    dateTime: string
    location: string
    locationType: string
    participants: string
    notes: string
}

interface ApplicantHeaderProps {
    applicant: Applicant
    readOnly?: boolean
    canSendEmail?: boolean
    canScheduleInterview?: boolean
    canMutateApplicant?: boolean
    isSubmitting: boolean
    rejectionNotes: string
    setRejectionNotes: (value: string) => void
    isApproveDialogOpen: boolean
    setIsApproveDialogOpen: (value: boolean) => void
    isRejectDialogOpen: boolean
    setIsRejectDialogOpen: (value: boolean) => void
    handleApprove: (workflowId: string, startDate: string, notes?: string) => Promise<void>
    handleReject: () => Promise<void>
    handleStatusChange: (status: string, notes?: string) => Promise<void>
    availableWorkflows: OnboardingWorkflow[]
    selectedWorkflow: string
    setSelectedWorkflow: (value: string) => void
    startDate: string
    setStartDate: (value: string) => void
    approvalNotes: string
    setApprovalNotes: (value: string) => void
    isEmailDialogOpen: boolean
    setIsEmailDialogOpen: (value: boolean) => void
    emailText: string
    setEmailText: (value: string) => void
    handleSendEmail: () => Promise<void>
    isSendingEmail: boolean
    setEmailAttachments: React.Dispatch<React.SetStateAction<File[]>>
}

export default function ApplicantHeader({
    applicant,
    readOnly = false,
    canSendEmail = false,
    canScheduleInterview = false,
    canMutateApplicant = false,
    isSubmitting,
    rejectionNotes,
    setRejectionNotes,
    isApproveDialogOpen,
    setIsApproveDialogOpen,
    isRejectDialogOpen,
    setIsRejectDialogOpen,
    handleApprove,
    handleReject,
    handleStatusChange,
    availableWorkflows,
    selectedWorkflow,
    setSelectedWorkflow,
    startDate,
    setStartDate,
    approvalNotes,
    setApprovalNotes,
    isEmailDialogOpen,
    setIsEmailDialogOpen,
    emailText,
    setEmailText,
    handleSendEmail,
    isSendingEmail,
    setEmailAttachments
}: ApplicantHeaderProps) {
    const router = useRouter()
    const [createInterviewOpen, setCreateInterviewOpen] = useState(false)
    const canShowActions = canSendEmail || canScheduleInterview || canMutateApplicant

    const handleInterviewSuccess = (interviewId: string) => {
        setCreateInterviewOpen(false)
        router.push(`/admin/interviews/${interviewId}`)
    }

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Link href="/admin/applicants" className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Detail uchazeče</h1>
            </div>
            {canShowActions && (
                <div className="flex gap-2">
                    {canSendEmail && (
                        <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Mail className="h-4 w-4" />
                                    Odeslat email
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Odeslat email uchazeči</DialogTitle>
                                    <DialogDescription>
                                        Napište zprávu pro uchazeče {applicant.name} {applicant.surname} ({applicant.email})
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label htmlFor="emailMessage" className="text-sm font-medium">
                                            Zpráva
                                        </label>
                                        <Textarea
                                            id="emailMessage"
                                            placeholder="Napište svou zprávu uchazeči..."
                                            value={emailText}
                                            onChange={(e) => setEmailText(e.target.value)}
                                            rows={6}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="attachments" className="text-sm font-medium">
                                            Přílohy
                                        </label>
                                        <FileUpload
                                            onFilesChange={setEmailAttachments}
                                            multiple={true}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                                        Zrušit
                                    </Button>
                                    <Button
                                        onClick={handleSendEmail}
                                        disabled={isSendingEmail || !emailText.trim()}
                                        className="gap-2"
                                    >
                                        <Mail className="h-4 w-4" />
                                        {isSendingEmail ? "Odesílání..." : "Odeslat email"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    {canMutateApplicant && (
                        <>
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => handleStatusChange('under_review', 'Přihláška předána k posouzení')}
                                disabled={isSubmitting}
                            >
                                <Clock className="h-4 w-4" />
                                Posuzováno
                            </Button>
                            {canScheduleInterview && (
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => setCreateInterviewOpen(true)}
                                >
                                    <Calendar className="h-4 w-4" />
                                    Naplánovat pohovor
                                </Button>
                            )}

                            <CreateInterviewDialog
                                open={createInterviewOpen}
                                onOpenChange={setCreateInterviewOpen}
                                onSuccess={handleInterviewSuccess}
                                preSelectedApplicant={applicant}
                            />


                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => handleStatusChange('interview_completed', 'Pohovor byl dokončen')}
                                disabled={isSubmitting}
                            >
                                <CheckCircle className="h-4 w-4" />
                                Pohovor dokončen
                            </Button>

                            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Zamítnout
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Zamítnout uchazeče</DialogTitle>
                                        <DialogDescription>Opravdu chcete zamítnout tohoto uchazeče? Tato akce je nevratná.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <label htmlFor="reason" className="text-sm font-medium">
                                                Důvod zamítnutí
                                            </label>
                                            <Textarea
                                                id="reason"
                                                placeholder="Zadejte důvod zamítnutí..."
                                                value={rejectionNotes}
                                                onChange={(e) => setRejectionNotes(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="notify" className="text-sm font-medium">
                                                Notifikovat uchazeče
                                            </label>
                                            <Select defaultValue="yes">
                                                <SelectTrigger id="notify">
                                                    <SelectValue placeholder="Vyberte možnost" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="yes">Ano, odeslat email</SelectItem>
                                                    <SelectItem value="no">Ne, nenotifikovat</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                                            Zrušit
                                        </Button>
                                        <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
                                            {isSubmitting ? "Zpracování..." : "Zamítnout uchazeče"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    )}




                    {canMutateApplicant && (
                        <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                                    <UserPlus className="h-4 w-4" />
                                    Schválit a vytvořit zaměstnance
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Schválit uchazeče</DialogTitle>
                                    <DialogDescription>
                                        Schválením uchazeče vytvoříte nového zaměstnance a zahájíte proces onboardingu.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label htmlFor="startDate" className="text-sm font-medium">
                                            Datum nástupu *
                                        </label>
                                        <input
                                            type="date"
                                            id="startDate"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="onboardingWorkflow" className="text-sm font-medium">
                                            Onboarding workflow *
                                        </label>
                                        <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                                            <SelectTrigger id="onboardingWorkflow">
                                                <SelectValue placeholder="Vyberte workflow" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableWorkflows.map((workflow) => (
                                                    <SelectItem key={workflow.id} value={workflow.id}>
                                                        {workflow.name}
                                                        {workflow.description && ` - ${workflow.description}`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Workflow na základě pracovní pozice: <strong>{applicant.job_title}</strong>
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="approvalNotes" className="text-sm font-medium">
                                            Poznámky k schválení
                                        </label>
                                        <Textarea
                                            id="approvalNotes"
                                            placeholder="Zadejte poznámky k schválení a nástupu..."
                                            value={approvalNotes}
                                            onChange={(e) => setApprovalNotes(e.target.value)}
                                        />
                                    </div>

                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <h4 className="text-sm font-medium text-blue-900 mb-2">Shrnutí vytvoření zaměstnance</h4>
                                        <div className="text-xs text-blue-700 space-y-1">
                                            <div><strong>Jméno:</strong> {applicant.name} {applicant.surname}</div>
                                            <div><strong>Email:</strong> {applicant.email}</div>
                                            <div><strong>Telefon:</strong> {applicant.phone}</div>
                                            <div><strong>Pozice:</strong> {applicant.job_title}</div>
                                            <div><strong>Organizace:</strong> {applicant.organization_name}</div>
                                        </div>
                                        <p className="text-xs text-blue-600 mt-2">
                                            • Automaticky se vytvoří uživatelský účet s vygenerovaným heslem<br />
                                            • Nastaví se globální role &quot;Zaměstnanec&quot; a přístup do organizace<br />
                                            • Spustí se vybraný onboarding workflow
                                        </p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
                                        Zrušit
                                    </Button>
                                    <Button
                                        onClick={() => handleApprove(selectedWorkflow, startDate, approvalNotes)}
                                        disabled={isSubmitting || !selectedWorkflow || !startDate}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {isSubmitting ? "Vytváření zaměstnance..." : "Schválit a vytvořit zaměstnance"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            )}
        </div>
    )
}
