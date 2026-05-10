"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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

interface SimpleFormField {
  id: string
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox'
  label: string
  placeholder?: string
  required?: boolean
  options?: Array<{value: string, label: string}>
}

interface SimpleForm {
  id: string
  title: string
  description: string
  fields: SimpleFormField[]
}

export default function SimpleFormBuilder() {
  const searchParams = useSearchParams()
  const stepId = searchParams.get('stepId') || ''

  const [form, setForm] = useState<SimpleForm>({
    id: `step-${stepId}`,
    title: '',
    description: '',
    fields: []
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const addField = () => {
    const newField: SimpleFormField = {
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

  const updateField = (index: number, updates: Partial<SimpleFormField>) => {
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
    if (toIndex < 0 || toIndex >= form.fields.length) return
    
    setForm(prev => {
      const fields = [...prev.fields]
      const [removed] = fields.splice(fromIndex, 1)
      fields.splice(toIndex, 0, removed)
      
      return { ...prev, fields }
    })
  }

  const addOptionToField = (fieldIndex: number) => {
    const newOption = {
      value: `option_${Date.now()}`,
      label: 'Nová možnost'
    }
    
    updateField(fieldIndex, {
      options: [...(form.fields[fieldIndex].options || []), newOption]
    })
  }

  const updateFieldOption = (fieldIndex: number, optionIndex: number, updates: {value?: string, label?: string}) => {
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

  const saveForm = async () => {
    if (!stepId) {
      toast.error('Step ID is missing')
      return
    }

    try {
      setSaving(true)
      
      // Convert to the expected JSONB format
      const jsonbForm = {
        id: form.id,
        schemaVersion: 1,
        title: form.title,
        description: form.description,
        fields: form.fields,
        ui: {
          layout: 'one_column',
          groups: []
        },
        validation: {
          uniqueKeys: [],
          customRules: []
        }
      }
      
      await api(`/admin/onboarding/steps/${stepId}/form`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          form: jsonbForm,
          form_status: 'published'
        })
      })

      toast.success('Formulář byl úspěšně uložen')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save form'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const loadExistingForm = async () => {
    if (!stepId) return

    try {
      setLoading(true)
      
      const data: any = await api(`/admin/onboarding/steps/${stepId}/form`)
      if (data && data.fields) {
        setForm({
          id: data.id || `step-${stepId}`,
          title: data.title || '',
          description: data.description || '',
          fields: data.fields || []
        })
      }
    } catch (err) {
      console.warn('Failed to load existing form:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExistingForm()
  }, [stepId])

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jednoduchý editor formuláře</h1>
          <p className="text-muted-foreground">Krok ID: {stepId}</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={saveForm} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Ukládání...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Uložit formulář
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nastavení formuláře</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="form-title">Název formuláře</Label>
                <Input
                  id="form-title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Název formuláře..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="form-description">Popis formuláře</Label>
                <Textarea
                  id="form-description"
                  value={form.description}
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
                <CardTitle>Pole formuláře ({form.fields.length})</CardTitle>
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
                    <div key={field.id} className="border rounded-lg p-4 space-y-4">
                      {/* Field Header */}
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
                            onClick={() => moveField(index, index - 1)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => moveField(index, index + 1)}
                            disabled={index === form.fields.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => removeField(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Field Configuration */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Název pole</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(index, { label: e.target.value })}
                            placeholder="Název pole"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Typ pole</Label>
                          <Select value={field.type} onValueChange={(value) => updateField(index, { type: value as any })}>
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
                            onChange={(e) => updateField(index, { placeholder: e.target.value })}
                            placeholder="Placeholder text..."
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2 pt-8">
                          <Checkbox
                            checked={field.required || false}
                            onCheckedChange={(checked) => updateField(index, { required: Boolean(checked) })}
                          />
                          <Label>Povinné pole</Label>
                        </div>
                      </div>

                      {/* Select Options */}
                      {field.type === 'select' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Možnosti</Label>
                            <Button variant="outline" size="sm" onClick={() => addOptionToField(index)}>
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
                                  onChange={(e) => updateFieldOption(index, optionIndex, { value: e.target.value })}
                                />
                                <Input
                                  placeholder="Popis"
                                  value={option.label}
                                  onChange={(e) => updateFieldOption(index, optionIndex, { label: e.target.value })}
                                />
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => removeFieldOption(index, optionIndex)}
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
                Náhled formuláře
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                {form.title && <h3 className="font-semibold">{form.title}</h3>}
                {form.description && <p className="text-sm text-muted-foreground">{form.description}</p>}
                
                {form.fields.length > 0 && (
                  <>
                    <hr className="my-4" />
                    <div className="space-y-4">
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
                  </>
                )}
                
                {form.fields.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Přidejte pole pro náhled</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informace o formuláři</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Celkem polí:</span>
                  <div className="text-lg font-bold">{form.fields.length}</div>
                </div>
                <div>
                  <span className="font-medium">Povinná pole:</span>
                  <div className="text-lg font-bold">{form.fields.filter(f => f.required).length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}