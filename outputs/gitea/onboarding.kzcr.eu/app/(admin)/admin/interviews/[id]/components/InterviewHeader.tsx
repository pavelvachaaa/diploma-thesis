"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, XCircle, CheckCircle, AlertCircle } from "lucide-react"
import type { Interview } from "@/lib/api/interviews"
import { getStatusBadgeClass, getStatusLabel, getStatusIcon } from "../../utils/interviewUtils"
import EditInterviewDialog from "./EditInterviewDialog"
import CancelInterviewDialog from "./CancelInterviewDialog"
import CompleteInterviewDialog from "./CompleteInterviewDialog"

interface InterviewHeaderProps {
  interview: Interview
  onUpdate: () => void
  onCancel: () => void
  readOnly?: boolean
}

export default function InterviewHeader({ interview, onUpdate, onCancel, readOnly = false }: InterviewHeaderProps) {
  const router = useRouter()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)

  const StatusIcon = getStatusIcon(interview.status)

  const canEdit = !readOnly && interview.status !== 'cancelled' && interview.status !== 'completed'
  const canCancel = !readOnly && interview.status !== 'cancelled' && interview.status !== 'completed'
  const canComplete = !readOnly && interview.status !== 'cancelled' && interview.status !== 'completed'

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/interviews')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zpět
          </Button>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{interview.title}</h1>
              <Badge variant="outline" className={getStatusBadgeClass(interview.status)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {getStatusLabel(interview.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {interview.applicant_name} {interview.applicant_surname}
              {interview.job_title && ` • ${interview.job_title}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Upravit
            </Button>
          )}

          {canComplete && (
            <Button
              variant="outline"
              onClick={() => setIsCompleteDialogOpen(true)}
              className="text-green-600 hover:text-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Dokončit
            </Button>
          )}

          {canCancel && (
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(true)}
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Zrušit
            </Button>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {!readOnly && (
        <EditInterviewDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          interview={interview}
          onSuccess={onUpdate}
        />
      )}

      {!readOnly && (
        <CancelInterviewDialog
          isOpen={isCancelDialogOpen}
          onOpenChange={setIsCancelDialogOpen}
          interview={interview}
          onSuccess={onCancel}
        />
      )}

      {!readOnly && (
        <CompleteInterviewDialog
          isOpen={isCompleteDialogOpen}
          onOpenChange={setIsCompleteDialogOpen}
          interview={interview}
          onSuccess={onUpdate}
        />
      )}
    </>
  )
}
