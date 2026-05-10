import { useState } from 'react'
import toast from 'react-hot-toast'
import { createApplicantNote, scheduleInterview, type Applicant, type ApplicantNote } from '@/lib/api/applicants'
import { createEmployeeFromApplicant } from '@/lib/api/employees'
import { useAdminApplicants } from '@/hooks/admin/useAdminApplicants'
import { type InterviewData } from '../components/ApplicantHeader'

export const useApplicantActions = (
    applicant: Applicant | null, 
    fetchApplicantDetails: () => Promise<void>,
    setNotes: React.Dispatch<React.SetStateAction<ApplicantNote[]>>
) => {
    const { updateStatus, addNote } = useAdminApplicants()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isAddingNote, setIsAddingNote] = useState(false)
    const [rejectionNotes, setRejectionNotes] = useState("")
    const [newNote, setNewNote] = useState("")

    const handleStatusChange = async (newStatus: string, notes: string = '') => {
        if (!applicant) return

        try {
            setIsSubmitting(true)
            
            // Use the admin hook instead of direct API call
            const success = await updateStatus(
                applicant.id, 
                newStatus, 
                notes || `Status změněn na ${getStatusDisplayName(newStatus)}`
            )
            
            if (success) {
                toast.success(`Status změněn na ${getStatusDisplayName(newStatus)}`)
                await fetchApplicantDetails() // Refresh local data
            } else {
                throw new Error('Update failed')
            }
        } catch (err) {
            console.error('Error updating status:', err)
            toast.error('Nepodařilo se aktualizovat status')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleApprove = async (workflowId: string, startDate: string, notes?: string) => {
        if (!applicant) return

        if (!workflowId || !startDate) {
            toast.error('Vyberte workflow a datum nástupu')
            return
        }

        try {
            setIsSubmitting(true)
            
            // Create employee from applicant
            const employee = await createEmployeeFromApplicant({
                applicant_id: applicant.id,
                onboarding_workflow_id: workflowId,
                start_date: startDate,
                notes: notes || 'Zaměstnanec vytvořen ze schváleného uchazeče'
            })

            // Update applicant status using admin hook
            await updateStatus(
                applicant.id, 
                'accepted',
                `Uchazeč byl schválen a vytvořen jako zaměstnanec (ID: ${employee.id})`
            )

            // Show success message with generated password
            if (employee.generated_password) {
                toast.success(
                    `Zaměstnanec byl úspěšně vytvořen!\nVygenerované heslo: ${employee.generated_password}\n\nPošlete ho zaměstnanci bezpečným způsobem.`, 
                    { duration: 10000 }
                )
            } else {
                toast.success('Uchazeč byl úspěšně schválen a zaměstnanec vytvořen')
            }
            
            await fetchApplicantDetails() // Refresh data
        } catch (err) {
            console.error('Error approving applicant:', err)
            toast.error('Nepodařilo se vytvořit zaměstnance')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleReject = async () => {
        if (!applicant) return

        try {
            setIsSubmitting(true)
            
            // Use admin hook instead of direct API call
            const success = await updateStatus(
                applicant.id, 
                'rejected',
                rejectionNotes || 'Uchazeč byl zamítnut'
            )
            
            if (success) {
                toast.success('Uchazeč byl úspěšně zamítnut')
                await fetchApplicantDetails() // Refresh local data
            } else {
                throw new Error('Update failed')
            }
        } catch (err) {
            console.error('Error rejecting applicant:', err)
            toast.error('Nepodařilo se zamítnout uchazeče')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleScheduleInterview = async (data: InterviewData) => {
        if (!applicant) return

        try {
            setIsSubmitting(true)

            // Send interview invitation email
            const result = await scheduleInterview(applicant.id, {
                dateTime: data.dateTime,
                location: data.location,
                locationType: data.locationType,
                participants: data.participants,
                notes: data.notes
            })

            if (result.success) {
                // Update applicant status
                await updateStatus(
                    applicant.id,
                    'interview_scheduled',
                    `Pohovor naplánován na ${new Date(data.dateTime).toLocaleString('cs-CZ')} - ${data.location}`
                )

                toast.success('Pohovor byl naplánován a pozvánka odeslána na email uchazeče')
                await fetchApplicantDetails() // Refresh local data
            } else {
                throw new Error(result.message || 'Failed to schedule interview')
            }
        } catch (err) {
            console.error('Error scheduling interview:', err)
            toast.error(err instanceof Error ? err.message : 'Nepodařilo se naplánovat pohovor')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAddNote = async () => {
        if (!newNote.trim() || !applicant) return

        try {
            setIsAddingNote(true)
            const createdNote = await createApplicantNote(applicant.id, {
                note: newNote
            })

            setNotes(prev => [createdNote, ...prev])
            setNewNote("")
            toast.success('Poznámka byla přidána')
        } catch (err) {
            console.error('Error creating note:', err)
            toast.error('Nepodařilo se přidat poznámku')
        } finally {
            setIsAddingNote(false)
        }
    }

    const getStatusDisplayName = (status: string) => {
        switch (status) {
            case 'submitted': return 'Odesláno'
            case 'under_review': return 'Posuzováno'
            case 'interview_scheduled': return 'Pohovor naplánován'
            case 'interview_completed': return 'Pohovor dokončen'
            case 'accepted': return 'Přijato'
            case 'rejected': return 'Zamítnuto'
            case 'withdrawn': return 'Staženo'
            default: return status
        }
    }

    return {
        isSubmitting,
        isAddingNote,
        rejectionNotes,
        setRejectionNotes,
        newNote,
        setNewNote,
        handleStatusChange,
        handleApprove,
        handleReject,
        handleScheduleInterview,
        handleAddNote,
        getStatusDisplayName
    }
}
