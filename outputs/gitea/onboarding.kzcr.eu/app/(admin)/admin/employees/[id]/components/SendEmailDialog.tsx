'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Send, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { sendEmailToEmployee } from '@/lib/api/employees'
import { FileUpload } from '@/components/ui/file-upload'

interface SendEmailDialogProps {
  employeeId: string
  employeeName: string
  employeeEmail: string
}

export function SendEmailDialog({ employeeId, employeeName, employeeEmail }: SendEmailDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  })
  const [attachments, setAttachments] = useState<File[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error('Prosím vyplňte předmět i zprávu')
      return
    }

    setIsLoading(true)
    try {
      const payload = new FormData()
      payload.append('subject', formData.subject.trim())
      payload.append('message', formData.message.trim())
      attachments.forEach(file => {
        payload.append('attachments', file)
      })

      const response = await sendEmailToEmployee(employeeId, payload)

      if (response.success) {
        toast.success('Email byl úspěšně odeslán')
        setFormData({ subject: '', message: '' })
        setAttachments([])
        setIsOpen(false)
      } else {
        throw new Error(response.error || response.message || 'Nepodařilo se odeslat email')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error(error instanceof Error ? error.message : 'Nepodařilo se odeslat email')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Mail className="h-4 w-4 mr-2" />
          Odeslat email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Odeslat email zaměstnanci</DialogTitle>
          <DialogDescription>
            Odešlete zprávu na email: <strong>{employeeEmail}</strong>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipient" className="text-right">
                Příjemce
              </Label>
              <div className="col-span-3">
                <Input
                  id="recipient"
                  value={`${employeeName} (${employeeEmail})`}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Předmět *
              </Label>
              <div className="col-span-3">
                <Input
                  id="subject"
                  placeholder="Zadejte předmět zprávy..."
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="message" className="text-right pt-2">
                Zpráva *
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="message"
                  placeholder="Napište svou zprávu..."
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  disabled={isLoading}
                  rows={6}
                  className="resize-none"
                />
              </div>
            </div>
             <div className="grid grid-cols-4 items-start gap-4">
               <Label htmlFor="attachments" className="text-right pt-2">
                 Přílohy
               </Label>
               <div className="col-span-3">
                 <FileUpload onFilesChange={setAttachments} multiple={true} />
               </div>
             </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Zrušit
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Odesílání...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Odeslat email
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}