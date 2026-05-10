"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  Save, 
  Plus, 
  Trash2, 
  Eye, 
  ArrowUp, 
  ArrowDown, 
  Settings, 
  AlertCircle,
  FileText
} from "lucide-react"
import toast from "react-hot-toast"
import { api } from "@/lib/api"
// Removed drag-and-drop to avoid import issues

// Define types locally to avoid complex import paths
type FieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox';

interface FormFieldOption {
  value: string;
  label: string;
}

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: FormFieldOption[];
  visibleIf?: {
    field: string;
    equals: string | number | boolean;
  };
}

interface OnboardingForm {
  id: string;
  schemaVersion: number;
  title?: string;
  description?: string;
  fields: FormField[];
  ui?: {
    layout?: 'one_column' | 'two_column';
    groups?: Array<{title: string; fieldIds: string[]}>;
  };
  validation?: {
    uniqueKeys?: string[];
    customRules?: string[];
  };
}

interface StepInfo {
  id: string
  title: string
  description: string
  step_type: string
  form_status: string
}

export default function FormEditPage() {
  const params = useParams()
  const router = useRouter()
  const stepId = params.stepId as string

  const [stepInfo, setStepInfo] = useState<StepInfo | null>(null)
  const [form, setForm] = useState<OnboardingForm>({
    id: `step-${stepId}`,
    schemaVersion: 1,
    title: '',
    description: '',
    fields: [],
    ui: {
      layout: 'one_column',
      groups: []
    },
    validation: {
      uniqueKeys: [],
      customRules: []
    }
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStepForm()
  }, [stepId])

  const fetchStepForm = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await api(`/admin/onboarding/steps/${stepId}/form`)
      
      // If the form has data, use it; otherwise keep the default empty form
      if (data && Object.keys(data).length > 0 && data.fields) {
        setForm(data)
      }
      
      // Also fetch basic step info for context
      fetchStepInfo()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load form')
    } finally {
      setLoading(false)
    }
  }

  const fetchStepInfo = async () => {
    try {
      const data = await api(`/admin/onboarding/steps/forms`)
      const step = data.steps?.find((s: any) => s.id === stepId)
      if (step) {
        setStepInfo({
          id: step.id,
          title: step.title,
          description: step.description,
          step_type: step.step_type,
          form_status: step.form_status
        })
      }
    } catch (err) {
      console.warn('Failed to load step info:', err)
    }
  }

  const handleSaveForm = async (status: 'draft' | 'published' = 'published') => {
    try {
      setSaving(true)
      
      await api(`/admin/onboarding/steps/${stepId}/form`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          form,
          form_status: status
        })
      })

      toast.success(`Formulář byl uložen jako ${status === 'published' ? 'publikovaný' : 'koncept'}`)
      
      if (status === 'published') {
        router.push('/admin/forms')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save form'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'Nové pole',
      required: false,
      placeholder: ''
    }
    
    setForm(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }))
  }

  const updateField = (index: number, updates: Partial<FormField>) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === index ? { ...field, ...updates } : field
      )
    }))
  }

  const removeField = (index: number) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }))
  }

  const moveField = (fromIndex: number, toIndex: number) => {
    setForm(prev => {
      const fields = [...prev.fields]
      const [removed] = fields.splice(fromIndex, 1)
      fields.splice(toIndex, 0, removed)
      
      return { ...prev, fields }
    })
  }

  const moveFieldUp = (index: number) => {
    if (index > 0) {
      moveField(index, index - 1)
    }
  }

  const moveFieldDown = (index: number) => {
    if (index < form.fields.length - 1) {
      moveField(index, index + 1)
    }
  }

  const addOptionToField = (fieldIndex: number) => {
    const newOption: FormFieldOption = {
      value: `option_${Date.now()}`,
      label: 'Nová možnost'
    }
    
    updateField(fieldIndex, {
      options: [...(form.fields[fieldIndex].options || []), newOption]
    })
  }

  const updateFieldOption = (fieldIndex: number, optionIndex: number, updates: Partial<FormFieldOption>) => {
    const field = form.fields[fieldIndex]
    const options = [...(field.options || [])]
    options[optionIndex] = { ...options[optionIndex], ...updates }
    
    updateField(fieldIndex, { options })
  }

  const removeFieldOption = (fieldIndex: number, optionIndex: number) => {
    const field = form.fields[fieldIndex]
    const options = (field.options || []).filter((_, i) => i !== optionIndex)
    
    updateField(fieldIndex, { options })
  }

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Editor formuláře: {stepInfo?.title || `Krok ${stepId}`}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{stepInfo?.step_type?.toUpperCase()}</Badge>
            <Badge variant={stepInfo?.form_status === 'published' ? 'default' : 'secondary'}>
              {stepInfo?.form_status === 'published' ? 'Publikován' : 'Koncept'}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/forms')}>
            Zpět
          </Button>
          <Button variant="outline" onClick={() => handleSaveForm('draft')} disabled={saving}>
            Uložit koncept
          </Button>
          <Button onClick={() => handleSaveForm('published')} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Ukládání...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Publikovat
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Builder */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Nastavení formuláře
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="form-title">Název formuláře</Label>
                  <Input
                    id="form-title"
                    value={form.title || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Název formuláře..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="form-layout">Rozložení</Label>
                  <Select 
                    value={form.ui?.layout || 'one_column'} 
                    onValueChange={(value) => setForm(prev => ({ 
                      ...prev, 
                      ui: { ...prev.ui, layout: value as 'one_column' | 'two_column' }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_column">Jeden sloupec</SelectItem>
                      <SelectItem value="two_column">Dva sloupce</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="form-description">Popis formuláře</Label>
                <Textarea
                  id="form-description"
                  value={form.description || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Popis formuláře..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fields */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Pole formuláře ({form.fields.length})
                </CardTitle>
                <Button onClick={addField} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Přidat pole
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {form.fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Žádná pole nejsou definována</p>
                  <Button variant="outline" onClick={addField} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Přidat první pole
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {form.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <FieldEditor
                        field={field}
                        index={index}
                        onUpdate={(updates) => updateField(index, updates)}
                        onRemove={() => removeField(index)}
                        onMoveUp={() => moveFieldUp(index)}
                        onMoveDown={() => moveFieldDown(index)}
                        canMoveUp={index > 0}
                        canMoveDown={index < form.fields.length - 1}
                        onAddOption={() => addOptionToField(index)}
                        onUpdateOption={updateFieldOption}
                        onRemoveOption={removeFieldOption}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Náhled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormPreview form={form} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Field Editor Component
interface FieldEditorProps {
  field: FormField
  index: number
  onUpdate: (updates: Partial<FormField>) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  onAddOption: () => void
  onUpdateOption: (fieldIndex: number, optionIndex: number, updates: Partial<FormFieldOption>) => void
  onRemoveOption: (fieldIndex: number, optionIndex: number) => void
}

function FieldEditor({ 
  field, 
  index, 
  onUpdate, 
  onRemove, 
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onAddOption, 
  onUpdateOption, 
  onRemoveOption 
}: FieldEditorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{field.type}</Badge>
          <span className="text-sm font-medium">{field.label}</span>
          {field.required && <Badge variant="destructive" className="text-xs">Povinné</Badge>}
        </div>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onMoveUp} 
            disabled={!canMoveUp}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onMoveDown} 
            disabled={!canMoveDown}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Název pole</Label>
          <Input
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="Název pole"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Typ pole</Label>
          <Select value={field.type} onValueChange={(value) => onUpdate({ type: value as any })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Číslo</SelectItem>
              <SelectItem value="date">Datum</SelectItem>
              <SelectItem value="select">Výběr</SelectItem>
              <SelectItem value="checkbox">Checkbox</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Placeholder</Label>
          <Input
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder="Placeholder text..."
          />
        </div>
        
        <div className="flex items-center space-x-2 pt-8">
          <Checkbox
            checked={field.required || false}
            onCheckedChange={(checked) => onUpdate({ required: Boolean(checked) })}
          />
          <Label>Povinné pole</Label>
        </div>
      </div>

      {field.type === 'text' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Min. délka</Label>
            <Input
              type="number"
              value={field.minLength || ''}
              onChange={(e) => onUpdate({ minLength: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
          <div className="space-y-2">
            <Label>Max. délka</Label>
            <Input
              type="number"
              value={field.maxLength || ''}
              onChange={(e) => onUpdate({ maxLength: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>
      )}

      {field.type === 'number' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Min. hodnota</Label>
            <Input
              type="number"
              value={field.min || ''}
              onChange={(e) => onUpdate({ min: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
          <div className="space-y-2">
            <Label>Max. hodnota</Label>
            <Input
              type="number"
              value={field.max || ''}
              onChange={(e) => onUpdate({ max: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>
      )}

      {field.type === 'select' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Možnosti</Label>
            <Button variant="outline" size="sm" onClick={onAddOption}>
              <Plus className="h-4 w-4 mr-2" />
              Přidat možnost
            </Button>
          </div>
          
          <div className="space-y-2">
            {field.options?.map((option, optionIndex) => (
              <div key={optionIndex} className="flex gap-2">
                <Input
                  placeholder="Hodnota"
                  value={option.value}
                  onChange={(e) => onUpdateOption(index, optionIndex, { value: e.target.value })}
                />
                <Input
                  placeholder="Popis"
                  value={option.label}
                  onChange={(e) => onUpdateOption(index, optionIndex, { label: e.target.value })}
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onRemoveOption(index, optionIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {(!field.options || field.options.length === 0) && (
              <p className="text-sm text-muted-foreground">Žádné možnosti nejsou definovány</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Form Preview Component
function FormPreview({ form }: { form: OnboardingForm }) {
  if (!form.fields || form.fields.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Přidejte pole pro náhled</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      {form.title && <h3 className="font-semibold">{form.title}</h3>}
      {form.description && <p className="text-sm text-muted-foreground">{form.description}</p>}
      
      <Separator />
      
      <div className={`space-y-4 ${form.ui?.layout === 'two_column' ? 'grid grid-cols-2 gap-4' : ''}`}>
        {form.fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label className="text-xs">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            
            {field.type === 'text' && (
              <Input placeholder={field.placeholder} disabled className="h-8" />
            )}
            {field.type === 'number' && (
              <Input type="number" placeholder={field.placeholder} disabled className="h-8" />
            )}
            {field.type === 'date' && (
              <Input type="date" disabled className="h-8" />
            )}
            {field.type === 'select' && (
              <Select disabled>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={field.placeholder || "Vyberte..."} />
                </SelectTrigger>
              </Select>
            )}
            {field.type === 'checkbox' && (
              <div className="flex items-center space-x-2">
                <Checkbox disabled />
                <Label className="text-xs">{field.label}</Label>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}