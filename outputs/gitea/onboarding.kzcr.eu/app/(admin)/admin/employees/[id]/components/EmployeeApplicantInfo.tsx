'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import ApplicantTabs from '../../../applicants/[id]/components/ApplicantTabs'
import type { EmployeeApplicantData } from '@/lib/api/employees'
import type { DocumentStatus } from '@/lib/api/applicants'

interface EmployeeApplicantInfoProps {
  applicantData: EmployeeApplicantData | null
  hasApplicantData: boolean | null
  loading?: boolean
  error?: string
  
  // ApplicantTabs props
  documentStatuses: DocumentStatus[]
  newNote: string
  setNewNote: (note: string) => void
  isAddingNote: boolean
  handleAddNote: () => void
  handleDownloadAttachment: (attachmentId: string, filename: string) => void
  handleUpdateAttachmentStatus: (attachmentId: string, status: string, notes?: string) => void
  
  // Utility functions
  getStatusDisplayName: (status: string) => string
  getStatusBadgeClass: (status: string) => string
  formatDate: (date: string) => string
  formatFileSize: (bytes: number) => string
  getDocumentStatusIcon: (status: string) => React.ReactNode
}

const getEducationLabel = (education: string) => {
  const labels: Record<string, string> = {
    'elementary': 'Základní',
    'secondary': 'Střední',
    'higher': 'Vyšší odborné',
    'bachelor': 'Bakalářské',
    'master': 'Magisterské',
    'doctorate': 'Doktorské'
  }
  return labels[education] || education
}

const getExperienceLabel = (experience: string) => {
  const labels: Record<string, string> = {
    'none': 'Žádné',
    'less_than_1': 'Méně než 1 rok',
    '1_to_3': '1-3 roky',
    '3_to_5': '3-5 let',
    '5_to_10': '5-10 let',
    'more_than_10': 'Více než 10 let'
  }
  return labels[experience] || experience
}

export function EmployeeApplicantInfo({
  applicantData,
  hasApplicantData,
  loading,
  error,
  documentStatuses,
  newNote,
  setNewNote,
  isAddingNote,
  handleAddNote,
  handleDownloadAttachment,
  handleUpdateAttachmentStatus,
  getStatusDisplayName,
  getStatusBadgeClass,
  formatDate,
  formatFileSize,
  getDocumentStatusIcon
}: EmployeeApplicantInfoProps) {
  
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Skeleton for ApplicantTabs */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Card>
            <CardContent className="pt-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full mb-4" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-red-600">
            Chyba při načítání dat z přihlášky: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (hasApplicantData === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Informace o přihlášce</CardTitle>
          <CardDescription>
            Tento zaměstnanec nemá propojená data z přihlášky
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              Žádné údaje z přihlášky
            </h3>
            <p className="text-muted-foreground">
              Tento zaměstnanec nebyl vytvořen z přihlášky nebo data nejsou dostupná.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!applicantData) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p>Načítání dat z přihlášky...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Applicant Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Údaje z přihlášky</CardTitle>
          <CardDescription>
            Informace z původní přihlášky tohoto zaměstnance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applicantData.applicant.address && (
              <div>
                <h4 className="mb-2 font-medium">Adresa</h4>
                <span className="text-sm">
                  {applicantData.applicant.address}, {applicantData.applicant.city} {applicantData.applicant.zip}
                </span>
              </div>
            )}

            {applicantData.applicant.education && (
              <div>
                <h4 className="mb-2 font-medium">Vzdělání</h4>
                <p className="text-sm">{getEducationLabel(applicantData.applicant.education)}</p>
              </div>
            )}

            {applicantData.applicant.field && (
              <div>
                <h4 className="mb-2 font-medium">Oblast</h4>
                <p className="text-sm">{applicantData.applicant.field}</p>
              </div>
            )}

            {applicantData.applicant.experience && (
              <div>
                <h4 className="mb-2 font-medium">Zkušenosti</h4>
                <p className="text-sm">{getExperienceLabel(applicantData.applicant.experience)}</p>
              </div>
            )}

            {applicantData.applicant.last_employer && (
              <div>
                <h4 className="mb-2 font-medium">Poslední zaměstnavatel</h4>
                <p className="text-sm">{applicantData.applicant.last_employer}</p>
              </div>
            )}

            {applicantData.applicant.last_position && (
              <div>
                <h4 className="mb-2 font-medium">Poslední pozice</h4>
                <p className="text-sm">{applicantData.applicant.last_position}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full ApplicantTabs with editing capabilities */}
      <ApplicantTabs
        attachments={applicantData.attachments}
        statusHistory={applicantData.history}
        notes={applicantData.notes}
        newNote={newNote}
        setNewNote={setNewNote}
        isAddingNote={isAddingNote}
        handleAddNote={handleAddNote}
        handleDownloadAttachment={handleDownloadAttachment}
        handleUpdateAttachmentStatus={handleUpdateAttachmentStatus}
        documentStatuses={documentStatuses}
        getStatusDisplayName={getStatusDisplayName}
        getStatusBadgeClass={getStatusBadgeClass}
        formatDate={formatDate}
        formatFileSize={formatFileSize}
        getDocumentStatusIcon={getDocumentStatusIcon}
      />
    </div>
  )
}