"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Edit, Eye, Mail, FileText, UserCheck, UserX, Clock, Loader2, Archive, Copy, UserPlus, Users, Sparkles, Brain } from "lucide-react"
import { getJobDetailAdmin, getJobApplicants, updateApplicantStatus, sendEmailToApplicant, updateJobStatus, duplicateJob, getMatchingJobSeekers, type Job, type MatchingJobSeeker } from "@/lib/api/jobs"
import { formatDate } from "../../applicants/[id]/utils/statusUtils"
import { AddApplicantDialog } from "@/components/admin"
import { api } from "@/lib/api"
import { createApplicant } from "@/lib/api/applicants"
import toast from "react-hot-toast"
import { useAuth } from "@/context/AuthContext"
import { getAdminAccessConfig } from "@/lib/authorizedPersonAccess"
import AuthorizedPeopleSection from "../components/AuthorizedPeopleSection"

interface Applicant {
  id: string
  name: string
  surname: string
  email: string
  phone: string
  education?: string
  experience?: string
  current_status?: string
  created_at: string
  applied_at: string
  updated_at: string
  cv_analysis_status?: 'pending' | 'processing' | 'completed' | 'failed' | null
  cv_analysis_score?: number | null
  cv_analysis_processed_at?: string | null
}

interface JobSeeker {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  organization_ids: string[]
  organization_names: string[]
  preferred_position_name?: string | null
  message: string | null
  cv_file_path: string | null
  cv_original_filename: string | null
  gdpr_consent: boolean
  submitted_at: string
}

const statusMap = {
  submitted: { label: "Odesláno", className: "bg-blue-50 text-blue-700", icon: FileText },
  under_review: { label: "Posuzováno", className: "bg-yellow-50 text-yellow-700", icon: Clock },
  interview_scheduled: { label: "Pohovor naplánován", className: "bg-purple-50 text-purple-700", icon: Clock },
  interview_completed: { label: "Pohovor dokončen", className: "bg-indigo-50 text-indigo-700", icon: UserCheck },
  accepted: { label: "Přijato", className: "bg-green-50 text-green-700", icon: UserCheck },
  rejected: { label: "Zamítnuto", className: "bg-red-50 text-red-700", icon: UserX },
  withdrawn: { label: "Staženo", className: "bg-gray-50 text-gray-700", icon: UserX }
}

export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string
  const { roles } = useAuth()
  const adminAccess = getAdminAccessConfig(roles)
  const readOnlyAdmin = adminAccess.authorizedPersonOnly

  const [job, setJob] = useState<Job | null>(null)
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  
  // Dialog states
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [statusNotes, setStatusNotes] = useState("")
  const [emailType, setEmailType] = useState("")
  const [customMessage, setCustomMessage] = useState("")

  // Job Seekers Dialog states
  const [seekersDialogOpen, setSeekersDialogOpen] = useState(false)
  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([])
  const [loadingSeekers, setLoadingSeekers] = useState(false)
  const [selectedSeekerId, setSelectedSeekerId] = useState<string>("")
  const [convertingSeeker, setConvertingSeeker] = useState(false)
  const [seekersSearch, setSeekersSearch] = useState("")
  const [seekersPage, setSeekersPage] = useState(1)
  const [seekersPagination, setSeekersPagination] = useState<{
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  } | null>(null)

  // AI Suggestions Dialog states
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiMatches, setAiMatches] = useState<MatchingJobSeeker[]>([])
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'processing' | 'completed' | 'error'>('idle')
  const [aiError, setAiError] = useState<string | null>(null)
  const [selectedAiSeekerId, setSelectedAiSeekerId] = useState<string>("")
  const [convertingAiSeeker, setConvertingAiSeeker] = useState(false)

  useEffect(() => {
    if (jobId) {
      fetchJobDetails()
      fetchApplicants()
    }
  }, [jobId])

  const fetchJobDetails = async () => {
    try {
      setLoading(true)
      const jobData = await getJobDetailAdmin(jobId)
      setJob(jobData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při načítání detailu nabídky práce")
    } finally {
      setLoading(false)
    }
  }

  const fetchApplicants = async () => {
    try {
      const applicantsData = await getJobApplicants(jobId)
      setApplicants(applicantsData)
    } catch (err) {
      console.error('Error fetching applicants:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      className: "bg-gray-50 text-gray-700",
      icon: FileText 
    }
    const Icon = config.icon
    
    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getJobStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Aktivní", className: "bg-green-50 text-green-700" },
      draft: { label: "Koncept", className: "bg-amber-50 text-amber-700" },
      end: { label: "Ukončeno", className: "bg-gray-50 text-gray-700" },
      archived: { label: "Archivováno", className: "bg-blue-50 text-blue-700" },
      expired: { label: "Vypršelo", className: "bg-red-50 text-red-700" }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "bg-gray-50 text-gray-700"
    }

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const handleStatusUpdate = async (applicant: Applicant) => {
    setSelectedApplicant(applicant)
    setNewStatus(applicant.current_status || "")
    setStatusNotes("")
    setStatusDialogOpen(true)
  }

  const handleArchiveJob = async () => {
    if (!job) return

    if (!confirm(`Opravdu chcete archivovat pozici "${job.title}"?`)) {
      return
    }

    try {
      await updateJobStatus(jobId, 'archived')
      setJob({ ...job, status: 'archived' })
      toast.success('Pozice byla úspěšně archivována')
    } catch (err) {
      console.error('Failed to archive job:', err)
      toast.error('Chyba při archivaci pozice')
    }
  }

  const handleDuplicateJob = async () => {
    if (!job) return

    try {
      const newJob = await duplicateJob(jobId)
      toast.success('Pozice byla úspěšně duplikována')
      // Redirect to edit page of the new job
      router.push(`/admin/jobs/${newJob.id}/edit`)
    } catch (err) {
      console.error('Failed to duplicate job:', err)
      toast.error('Chyba při duplikaci pozice')
    }
  }

  const confirmStatusUpdate = async () => {
    if (!selectedApplicant || !newStatus) return

    try {
      setUpdatingStatus(selectedApplicant.id)
      await updateApplicantStatus(jobId, selectedApplicant.id, newStatus, statusNotes)
      
      // Update local state
      setApplicants(prev => 
        prev.map(app => 
          app.id === selectedApplicant.id 
            ? { ...app, current_status: newStatus }
            : app
        )
      )
      
      setStatusDialogOpen(false)
      setSelectedApplicant(null)
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const confirmSendEmail = async () => {
    if (!selectedApplicant || !emailType) return

    try {
      setSendingEmail(selectedApplicant.id)
      await sendEmailToApplicant(jobId, selectedApplicant.id, emailType, customMessage)
      setEmailDialogOpen(false)
      setSelectedApplicant(null)
    } catch (err) {
      console.error('Failed to send email:', err)
    } finally {
      setSendingEmail(null)
    }
  }

  const fetchJobSeekers = async (page: number = 1, search: string = "") => {
    if (!job) return

    setLoadingSeekers(true)

    try {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('limit', '10')
      if (job.organization_name) {
        params.append('organization', job.organization_name)
      }
      if (job.job_role_name) {
        params.append('preferredPosition', job.job_role_name)
      }
      if (search) {
        params.append('search', search)
      }

      const response = await api<{
        data: JobSeeker[]
        pagination: {
          page: number
          limit: number
          total: number
          totalPages: number
          hasNext: boolean
          hasPrev: boolean
        }
      }>(`/admin/job-seekers?${params}`)

      setJobSeekers(response.data || [])
      setSeekersPagination(response.pagination)
    } catch (err) {
      console.error('Failed to load job seekers:', err)
      toast.error('Nepodařilo se načíst zájemce')
    } finally {
      setLoadingSeekers(false)
    }
  }

  const handleOpenSeekersDialog = async () => {
    if (!job) return

    setSeekersDialogOpen(true)
    setSelectedSeekerId("")
    setSeekersSearch("")
    setSeekersPage(1)
    fetchJobSeekers(1, "")
  }

  // Debounce search
  useEffect(() => {
    if (seekersDialogOpen) {
      const timeoutId = setTimeout(() => {
        fetchJobSeekers(seekersPage, seekersSearch)
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }, [seekersSearch, seekersDialogOpen])

  const handleSeekersSearch = (value: string) => {
    setSeekersSearch(value)
    setSeekersPage(1)
  }

  const handleSeekersPageChange = (newPage: number) => {
    setSeekersPage(newPage)
    fetchJobSeekers(newPage, seekersSearch)
  }

  const handleConvertSeeker = async () => {
    if (!selectedSeekerId || !job) {
      toast.error('Vyberte zájemce')
      return
    }

    const seeker = jobSeekers.find(s => s.id === selectedSeekerId)
    if (!seeker) return

    setConvertingSeeker(true)
    try {
      const formData = new FormData()
      formData.append("name", seeker.first_name)
      formData.append("surname", seeker.last_name)
      formData.append("email", seeker.email)
      formData.append("phone", seeker.phone)
      formData.append("job_posting_id", jobId)
      formData.append("organization_id", job.organization_id)
      formData.append("gdpr_consent", "true")
      formData.append("job_seeker_id", seeker.id) // Pass seeker ID to copy CV

      // Add message as address if exists (truncate to 250 chars due to db limit)
      if (seeker.message) {
        const truncatedMessage = seeker.message.length > 250
          ? seeker.message.substring(0, 250) + "..."
          : seeker.message
        formData.append("address", truncatedMessage)
      }

      await createApplicant(formData)

      toast.success(`${seeker.first_name} ${seeker.last_name} byl převeden na uchazeče`)
      setSeekersDialogOpen(false)
      setSelectedSeekerId("")

      // Refresh applicants list
      fetchApplicants()
    } catch (err) {
      console.error('Convert error:', err)
      toast.error('Nepodařilo se převést zájemce na uchazeče')
    } finally {
      setConvertingSeeker(false)
    }
  }

  // AI Suggestions functions
  const fetchAiSuggestions = async () => {
    if (!job) return

    setAiStatus('loading')
    setAiError(null)

    try {
      const response = await getMatchingJobSeekers(jobId, { limit: 20, threshold: 0.3 })

      if (response.status === 'completed' && response.matches) {
        setAiMatches(response.matches)
        setAiStatus('completed')
      } else if (response.status === 'pending' || response.status === 'processing') {
        setAiStatus('processing')
        // Start polling
      }
    } catch (err) {
      console.error('Failed to fetch AI suggestions:', err)
      setAiError('Nepodařilo se načíst AI doporučení')
      setAiStatus('error')
    }
  }

  const handleOpenAiDialog = async () => {
    setAiDialogOpen(true)
    setSelectedAiSeekerId("")
    setAiMatches([])
    fetchAiSuggestions()
  }

  // Polling for AI suggestions when processing
  useEffect(() => {
    if (aiDialogOpen && aiStatus === 'processing') {
      const pollInterval = setInterval(async () => {
        try {
          const response = await getMatchingJobSeekers(jobId, { limit: 20, threshold: 0.3 })
          if (response.status === 'completed' && response.matches) {
            setAiMatches(response.matches)
            setAiStatus('completed')
            clearInterval(pollInterval)
          }
        } catch (err) {
          console.error('Polling error:', err)
        }
      }, 3000)

      return () => clearInterval(pollInterval)
    }
  }, [aiDialogOpen, aiStatus, jobId])

  const handleConvertAiSeeker = async () => {
    if (!selectedAiSeekerId || !job) {
      toast.error('Vyberte zájemce')
      return
    }

    const seeker = aiMatches.find(s => s.job_seeker_id === selectedAiSeekerId)
    if (!seeker) return

    setConvertingAiSeeker(true)
    try {
      const formData = new FormData()
      formData.append("name", seeker.first_name)
      formData.append("surname", seeker.last_name)
      formData.append("email", seeker.email)
      formData.append("phone", seeker.phone)
      formData.append("job_posting_id", jobId)
      formData.append("organization_id", job.organization_id)
      formData.append("gdpr_consent", "true")
      formData.append("job_seeker_id", seeker.job_seeker_id)

      await createApplicant(formData)

      toast.success(`${seeker.first_name} ${seeker.last_name} byl převeden na uchazeče`)
      setAiDialogOpen(false)
      setSelectedAiSeekerId("")

      // Refresh applicants list
      fetchApplicants()
    } catch (err) {
      console.error('Convert error:', err)
      toast.error('Nepodařilo se převést zájemce na uchazeče')
    } finally {
      setConvertingAiSeeker(false)
    }
  }

  const getSimilarityColor = (score: number) => {
    if (score >= 0.7) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 0.5) return 'bg-amber-100 text-amber-800 border-amber-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getScoreBadge = (applicant: Applicant) => {
    // No CV uploaded or no analysis record
    if (!applicant.cv_analysis_status) {
      return <span className="text-xs text-muted-foreground">-</span>
    }

    // Analysis in progress
    if (applicant.cv_analysis_status === 'pending' || applicant.cv_analysis_status === 'processing') {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          {applicant.cv_analysis_status === 'pending' ? 'Čeká' : 'Analyzuje'}
        </Badge>
      )
    }

    // Analysis failed
    if (applicant.cv_analysis_status === 'failed') {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Chyba
        </Badge>
      )
    }

    // Analysis completed - show score
    if (applicant.cv_analysis_status === 'completed') {
      if (applicant.cv_analysis_score === null || applicant.cv_analysis_score === undefined) {
        return <span className="text-xs text-muted-foreground">N/A</span>
      }

      const score = applicant.cv_analysis_score
      let colorClass = 'bg-red-50 text-red-700 border-red-200'
      if (score >= 70) colorClass = 'bg-green-50 text-green-700 border-green-200'
      else if (score >= 40) colorClass = 'bg-amber-50 text-amber-700 border-amber-200'

      return (
        <Badge variant="outline" className={colorClass}>
          <Brain className="h-3 w-3 mr-1" />
          {score}/100
        </Badge>
      )
    }

    return <span className="text-xs text-muted-foreground">-</span>
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/jobs">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-red-600">Chyba</h1>
            <p className="text-muted-foreground">{error || "Nabídka práce nebyla nalezena"}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/jobs">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
            <p className="text-muted-foreground">{job.organization_name} • {job.department}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`https://kariera.kzcr.eu/jobs/${job.id}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Zobrazit na webu
            </Button>
          </Link>
          {!readOnlyAdmin && (
            <>
              <Button variant="outline" onClick={handleDuplicateJob}>
                <Copy className="mr-2 h-4 w-4" />
                Duplikovat
              </Button>
              {job.status !== 'archived' && (
                <Button variant="outline" onClick={handleArchiveJob}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archivovat
                </Button>
              )}
              {job.status !== 'archived' && (
                <Link href={`/admin/jobs/${job.id}/edit`}>
                  <Button>
                    <Edit className="mr-2 h-4 w-4" />
                    Upravit
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Detail nabídky práce</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
                  <div className="mt-1">{getJobStatusBadge(job.status)}</div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Typ úvazku</h4>
                  <p className="mt-1">{job.contract_type_label || "-"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Datum zveřejnění</h4>
                  <p className="mt-1">{job.publish_date ? formatDate(job.publish_date) : "-"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Datum ukončení</h4>
                  <p className="mt-1">{job.expire_date ? formatDate(job.expire_date) : "-"}</p>
                </div>
              </div>
              
              {job.short_description && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Stručný popis</h4>
                  <p className="mt-1">{job.short_description}</p>
                </div>
              )}
              
              {job.description && (
                <div>
                  <div className="mt-1 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: job.description }} />
                </div>
              )}

              {job.sections && Object.keys(job.sections).length > 0 && (
                <div className="space-y-4">
                  {Object.entries(job.sections).map(([sectionName, items]) => (
                    <div key={sectionName}>
                      <h4 className="font-medium text-sm text-muted-foreground capitalize">
                        {sectionName === 'duties' ? 'Náplň práce' : 
                         sectionName === 'requirements' ? 'Požadavky' :
                         sectionName === 'benefits' ? 'Nabízíme' : sectionName}
                      </h4>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        {(items as string[]).map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kontaktní informace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Email</h4>
                  <p className="mt-1">{job.contact_email || "-"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Telefon</h4>
                  <p className="mt-1">{job.contact_phone || "-"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Akreditované oddělení</h4>
                  <p className="mt-1">{job.is_department_accredited ? 'Ano' : 'Ne'}</p>
                </div>
                {(job.salary_min || job.salary_max) && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Plat</h4>
                    <p className="mt-1">
                      {job.salary_min && job.salary_max 
                        ? `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} Kč`
                        : job.salary_min 
                        ? `od ${job.salary_min.toLocaleString()} Kč`
                        : job.salary_max 
                        ? `do ${job.salary_max.toLocaleString()} Kč`
                        : "-"
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <AuthorizedPeopleSection
              value={job.authorized_people || []}
              onChange={() => {}}
              readOnly
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Uchazeči ({applicants.length})</CardTitle>
          {!readOnlyAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleOpenAiDialog}>
                <Sparkles className="mr-2 h-4 w-4" />
                AI doporučení
              </Button>
              <Button variant="outline" onClick={handleOpenSeekersDialog}>
                <Users className="mr-2 h-4 w-4" />
                Z databáze zájemců
              </Button>
              <AddApplicantDialog
                preselectedJobId={jobId}
                preselectedOrganizationId={job?.organization_id}
                onSuccess={fetchApplicants}
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jméno</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>AI skóre</TableHead>
                  <TableHead>Přihlášeno</TableHead>
                  <TableHead className="text-right">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">Žádní uchazeči zatím</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  applicants.map((applicant) => (
                    <TableRow key={applicant.id}>
                      <TableCell className="font-medium">
                        {applicant.name} {applicant.surname}
                      </TableCell>
                      <TableCell>{applicant.email}</TableCell>
                      <TableCell>{applicant.phone}</TableCell>
                      <TableCell>
                        {getStatusBadge(applicant.current_status || 'submitted')}
                      </TableCell>
                      <TableCell>
                        {getScoreBadge(applicant)}
                      </TableCell>
                      <TableCell>{formatDate(applicant.applied_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Link href={`/admin/applicants/${applicant.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Zobrazit detail uchazeče</span>
                            </Button>
                          </Link>
                          {!readOnlyAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusUpdate(applicant)}
                              disabled={updatingStatus === applicant.id}
                            >
                              <UserCheck className="h-4 w-4" />
                              <span className="sr-only">Změnit status</span>
                            </Button>
                          )}
                          {/* <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendEmail(applicant)}
                            disabled={sendingEmail === applicant.id}
                          >
                            <Mail className="h-4 w-4" />
                            <span className="sr-only">Poslat email</span>
                          </Button> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={!readOnlyAdmin && statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Změnit status uchazeče</DialogTitle>
            <DialogDescription>
              {selectedApplicant && `${selectedApplicant.name} ${selectedApplicant.surname} - ${selectedApplicant.email}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Nový status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Odesláno</SelectItem>
                  <SelectItem value="under_review">Posuzováno</SelectItem>
                  <SelectItem value="interview_scheduled">Pohovor naplánován</SelectItem>
                  <SelectItem value="interview_completed">Pohovor dokončen</SelectItem>
                  <SelectItem value="accepted">Přijato</SelectItem>
                  <SelectItem value="rejected">Zamítnuto</SelectItem>
                  <SelectItem value="withdrawn">Staženo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Poznámky (volitelné)</Label>
              <Textarea
                id="notes"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Přidejte poznámku k této změně..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                Zrušit
              </Button>
              <Button onClick={confirmStatusUpdate} disabled={!newStatus || updatingStatus === selectedApplicant?.id}>
                {updatingStatus === selectedApplicant?.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ukládání...
                  </>
                ) : (
                  'Uložit'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Poslat email uchazeči</DialogTitle>
            <DialogDescription>
              {selectedApplicant && `${selectedApplicant.name} ${selectedApplicant.surname} - ${selectedApplicant.email}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailType">Typ emailu</Label>
              <Select value={emailType} onValueChange={setEmailType}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte typ emailu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interview_invitation">Pozvánka na pohovor</SelectItem>
                  <SelectItem value="acceptance">Přijetí do zaměstnání</SelectItem>
                  <SelectItem value="rejection">Zamítnutí žádosti</SelectItem>
                  <SelectItem value="custom">Vlastní zpráva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customMessage">Vlastní zpráva (volitelné)</Label>
              <Textarea
                id="customMessage"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Přidejte vlastní zprávu..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                Zrušit
              </Button>
              <Button onClick={confirmSendEmail} disabled={!emailType || sendingEmail === selectedApplicant?.id}>
                {sendingEmail === selectedApplicant?.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Odesílání...
                  </>
                ) : (
                  'Odeslat email'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Seekers Dialog */}
      <Dialog open={!readOnlyAdmin && seekersDialogOpen} onOpenChange={setSeekersDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Vybrat z databáze zájemců</DialogTitle>
            <DialogDescription>
              Vyberte zájemce z databáze a převeďte je na uchazeče o tuto pozici
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 text-sm text-muted-foreground">
            Filtrováno podle pozice: <span className="font-medium text-foreground">{job?.job_role_name || 'Není přiřazena'}</span>
          </div>

          {/* Search Bar */}
          <div className="px-6">
            <Input
              placeholder="Hledat podle jména, emailu, telefonu..."
              value={seekersSearch}
              onChange={(e) => handleSeekersSearch(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-6">
            {loadingSeekers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : jobSeekers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Pro organizaci {job?.organization_name} nejsou k dispozici žádní zájemci
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {jobSeekers.map((seeker) => (
                  <div
                    key={seeker.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedSeekerId === seeker.id ? 'bg-blue-50 border-blue-300' : ''
                    }`}
                    onClick={() => setSelectedSeekerId(seeker.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {seeker.first_name} {seeker.last_name}
                          </h4>
                          {seeker.cv_file_path && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              <FileText className="h-3 w-3 mr-1" />
                              CV
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {seeker.email}
                          </span>
                          <span>{seeker.phone}</span>
                        </div>
                        {seeker.message && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {seeker.message}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          Pozice: {seeker.preferred_position_name || 'Neuvedena'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Odesláno: {new Date(seeker.submitted_at).toLocaleDateString('cs-CZ', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      {selectedSeekerId === seeker.id && (
                        <div className="ml-4">
                          <UserCheck className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {seekersPagination && seekersPagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Stránka {seekersPage} z {seekersPagination.totalPages} ({seekersPagination.total} celkem)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSeekersPageChange(seekersPage - 1)}
                  disabled={!seekersPagination.hasPrev || loadingSeekers}
                >
                  Předchozí
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSeekersPageChange(seekersPage + 1)}
                  disabled={!seekersPagination.hasNext || loadingSeekers}
                >
                  Další
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t px-6 pb-6">
            <Button
              variant="outline"
              onClick={() => setSeekersDialogOpen(false)}
              disabled={convertingSeeker}
            >
              Zrušit
            </Button>
            <Button
              onClick={handleConvertSeeker}
              disabled={!selectedSeekerId || convertingSeeker || loadingSeekers}
            >
              {convertingSeeker ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Převádím...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Převést na uchazeče
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Suggestions Dialog */}
      <Dialog open={!readOnlyAdmin && aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI doporučení kandidátů
            </DialogTitle>
            <DialogDescription>
              Zájemci seřazení podle shody jejich životopisu s požadavky pozice
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6">
            {aiStatus === 'loading' && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <p className="mt-3 text-muted-foreground">Načítám doporučení...</p>
              </div>
            )}

            {aiStatus === 'processing' && (
              <div className="flex flex-col items-center justify-center py-12">
                <Brain className="h-12 w-12 text-purple-500 animate-pulse" />
                <h3 className="mt-4 font-medium text-lg">Generuji embedding pozice</h3>
                <p className="mt-2 text-muted-foreground text-center max-w-md">
                  AI analyzuje popis pozice a porovnává ho s životopisy v databázi.
                  Toto může trvat několik sekund.
                </p>
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Automaticky se aktualizuje</span>
                </div>
              </div>
            )}

            {aiStatus === 'error' && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-red-500 mb-3">⚠️</div>
                <p className="text-muted-foreground">{aiError}</p>
                <Button variant="outline" onClick={fetchAiSuggestions} className="mt-4">
                  Zkusit znovu
                </Button>
              </div>
            )}

            {aiStatus === 'completed' && aiMatches.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-center">
                  Nenalezeny žádné odpovídající životopisy v databázi zájemců.
                </p>
              </div>
            )}

            {aiStatus === 'completed' && aiMatches.length > 0 && (
              <div className="space-y-2">
                {aiMatches.map((seeker, index) => (
                  <div
                    key={seeker.job_seeker_id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedAiSeekerId === seeker.job_seeker_id ? 'bg-purple-50 border-purple-300' : ''
                    }`}
                    onClick={() => setSelectedAiSeekerId(seeker.job_seeker_id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground w-6">
                            #{index + 1}
                          </span>
                          <h4 className="font-medium">
                            {seeker.first_name} {seeker.last_name}
                          </h4>
                          <Badge
                            variant="outline"
                            className={getSimilarityColor(seeker.similarity_score)}
                          >
                            {Math.round(seeker.similarity_score * 100)}% shoda
                          </Badge>
                          {seeker.cv_file_path && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              <FileText className="h-3 w-3 mr-1" />
                              CV
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground ml-6">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {seeker.email}
                          </span>
                          <span>{seeker.phone}</span>
                        </div>
                        {seeker.skills && seeker.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 ml-6">
                            {seeker.skills.slice(0, 5).map((skill, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {seeker.skills.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{seeker.skills.length - 5}
                              </Badge>
                            )}
                          </div>
                        )}
                        {seeker.summary && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2 ml-6">
                            {seeker.summary}
                          </p>
                        )}
                      </div>
                      {selectedAiSeekerId === seeker.job_seeker_id && (
                        <div className="ml-4">
                          <UserCheck className="h-5 w-5 text-purple-600" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center gap-2 pt-4 border-t px-6 pb-6">
            <div className="text-sm text-muted-foreground">
              {aiStatus === 'completed' && aiMatches.length > 0 && (
                <span>{aiMatches.length} doporučených kandidátů</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setAiDialogOpen(false)}
                disabled={convertingAiSeeker}
              >
                Zrušit
              </Button>
              <Button
                onClick={handleConvertAiSeeker}
                disabled={!selectedAiSeekerId || convertingAiSeeker || aiStatus !== 'completed'}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {convertingAiSeeker ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Převádím...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Převést na uchazeče
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
