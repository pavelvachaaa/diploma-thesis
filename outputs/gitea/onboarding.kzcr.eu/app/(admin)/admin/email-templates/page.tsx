'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, Loader2, Mail } from 'lucide-react'
import {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  type EmailTemplate,
  type CreateEmailTemplateData,
} from '@/lib/api/email_templates'
import toast from 'react-hot-toast'

const TEMPLATE_TYPES = [
  { value: 'interview_cancellation', label: 'Zrušení pohovoru' },
]

const emptyForm: CreateEmailTemplateData = {
  name: '',
  type: 'interview_cancellation',
  subject: '',
  body: '',
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [form, setForm] = useState<CreateEmailTemplateData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const data = await getEmailTemplates()
      setTemplates(data)
    } catch (error) {
      toast.error('Nepodařilo se načíst šablony')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingTemplate(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setForm({
      name: template.name,
      type: template.type,
      subject: template.subject || '',
      body: template.body,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.body.trim()) {
      toast.error('Název a text šablony jsou povinné')
      return
    }

    setSaving(true)
    try {
      if (editingTemplate) {
        const updated = await updateEmailTemplate(editingTemplate.id, form)
        setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t))
        toast.success('Šablona aktualizována')
      } else {
        const created = await createEmailTemplate(form)
        setTemplates(prev => [created, ...prev])
        toast.success('Šablona vytvořena')
      }
      setDialogOpen(false)
    } catch (error) {
      toast.error('Nepodařilo se uložit šablonu')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tuto šablonu?')) return
    setDeletingId(id)
    try {
      await deleteEmailTemplate(id)
      setTemplates(prev => prev.filter(t => t.id !== id))
      toast.success('Šablona smazána')
    } catch (error) {
      toast.error('Nepodařilo se smazat šablonu')
    } finally {
      setDeletingId(null)
    }
  }

  const getTypeLabel = (type: string) =>
    TEMPLATE_TYPES.find(t => t.value === type)?.label || type

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">E-mailové šablony</h1>
          <p className="text-muted-foreground">Spravujte šablony pro e-maily zasílané uchazečům</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nová šablona
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Žádné šablony</p>
            <p className="text-muted-foreground text-sm mt-1">
              Vytvořte šablonu e-mailu pro rychlé zrušení pohovoru.
            </p>
            <Button className="mt-4" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Vytvořit šablonu
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map(template => (
            <Card key={template.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getTypeLabel(template.type)}
                      {template.subject && ` · Předmět: ${template.subject}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(template)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      disabled={deletingId === template.id}
                    >
                      {deletingId === template.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4 text-destructive" />
                      }
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                  {template.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Upravit šablonu' : 'Nová šablona'}
            </DialogTitle>
            <DialogDescription>
              Šablona textu pro e-mail odesílaný uchazečům.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Název šablony *</Label>
              <Input
                id="tpl-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="např. Standardní zrušení"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Typ šablony</Label>
              <Select
                value={form.type}
                onValueChange={val => setForm(f => ({ ...f, type: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-subject">Předmět e-mailu (volitelné)</Label>
              <Input
                id="tpl-subject"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Zrušení pohovoru"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-body">Text šablony *</Label>
              <Textarea
                id="tpl-body"
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                rows={6}
                placeholder="Text e-mailu, který bude odeslán uchazeči..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Zrušit
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTemplate ? 'Uložit změny' : 'Vytvořit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
