"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Clock, AlertCircle } from "lucide-react"
import {
  getInterviewById,
  getStatusHistory,
  type Interview,
  type StatusHistoryEntry
} from "@/lib/api/interviews"
import InterviewHeader from "./components/InterviewHeader"
import InterviewInfo from "./components/InterviewInfo"
import InterviewParticipants from "./components/InterviewParticipants"
import InterviewAttachments from "./components/InterviewAttachments"
import InterviewTimeline from "./components/InterviewTimeline"
import { useAuth } from "@/context/AuthContext"
import { getAdminAccessConfig } from "@/lib/authorizedPersonAccess"

export default function InterviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { roles } = useAuth()
  const adminAccess = getAdminAccessConfig(roles)
  const readOnlyAdmin = adminAccess.authorizedPersonOnly

  const [interview, setInterview] = useState<Interview | null>(null)
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInterviewDetails()
  }, [id])

  const fetchInterviewDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const [interviewData, historyData] = await Promise.all([
        getInterviewById(id),
        getStatusHistory(id).catch(() => []) // Optional, don't fail if history fails
      ])

      setInterview(interviewData)
      setStatusHistory(historyData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nepodařilo se načíst údaje pohovoru'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInterviewUpdated = () => {
    fetchInterviewDetails()
    toast.success('Pohovor byl aktualizován')
  }

  const handleInterviewCancelled = () => {
    toast.success('Pohovor byl zrušen')
    router.push('/admin/interviews')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Načítání údajů pohovoru...</p>
        </div>
      </div>
    )
  }

  if (error || !interview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Chyba při načítání</h2>
          <p className="text-muted-foreground mb-4">{error || 'Pohovor nebyl nalezen'}</p>
          <button
            onClick={() => router.push('/admin/interviews')}
            className="text-primary hover:underline"
          >
            ← Zpět na seznam pohovorů
          </button>
        </div>
      </div>
    )
  }

  return (
    <>

      <InterviewHeader
        interview={interview}
        onUpdate={handleInterviewUpdated}
        onCancel={handleInterviewCancelled}
        readOnly={readOnlyAdmin}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">

        {/* Left column: Main Interview details (Spans 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <InterviewInfo interview={interview} readOnly={readOnlyAdmin} />
        </div>


        {/* Right column: Timeline, Participants, and Attachments (Spans 1/3) */}
        <div className="space-y-6">

          <InterviewTimeline
            statusHistory={statusHistory}
            interview={interview}
          />

          <InterviewParticipants
            interviewId={interview.id}
            initialParticipants={interview.participants || []}
            interviewStatus={interview.status}
            readOnly={readOnlyAdmin}
          />

          <InterviewAttachments
            interviewId={interview.id}
            initialAttachments={interview.attachments || []}
            interviewStatus={interview.status}
            readOnly={readOnlyAdmin}
          />
        </div>
      </div>
    </>
  )
}
