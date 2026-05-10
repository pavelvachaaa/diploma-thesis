"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Save } from "lucide-react"
import type { OnboardingForm, FormResponse, ValidationError, FormField } from "../types"

interface DynamicFormRendererProps {
  form: OnboardingForm
  initialResponse?: FormResponse
  onSubmit: (response: FormResponse) => Promise<void>
  loading?: boolean
  validationErrors?: ValidationError[]
}

export default function DynamicFormRenderer({
  form,
  initialResponse = {},
  onSubmit,
  loading = false,
  validationErrors = []
}: DynamicFormRendererProps) {
  const [formData, setFormData] = useState<FormResponse>(initialResponse)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    setFormData(initialResponse)
    setHasUnsavedChanges(false)
  }, [initialResponse])

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ 
      ...prev, 
      [fieldId]: value 
    }))
    setHasUnsavedChanges(true)
  }

  const getFieldError = (fieldId: string) => {
    return validationErrors.find(error => error.field === fieldId)
  }

  const isFieldVisible = (field: FormField) => {
    if (!field.visibleIf) return true
    
    const dependentValue = formData[field.visibleIf.field]
    return dependentValue === field.visibleIf.equals
  }

  const renderField = (field: FormField) => {
    if (!isFieldVisible(field)) return null

    const error = getFieldError(field.id)
    const value = formData[field.id]

    const fieldContent = (() => {
      switch (field.type) {
        case 'text':
          return (
            <Input
              id={field.id}
              type="text"
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={error ? 'border-red-500' : ''}
              minLength={field.minLength}
              maxLength={field.maxLength}
            />
          )

        case 'number':
          return (
            <Input
              id={field.id}
              type="number"
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value ? Number(e.target.value) : '')}
              className={error ? 'border-red-500' : ''}
              min={field.min}
              max={field.max}
            />
          )

        case 'date':
          return (
            <Input
              id={field.id}
              type="date"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
          )

        case 'select':
          return (
            <Select 
              value={value || ''} 
              onValueChange={(selectedValue) => handleFieldChange(field.id, selectedValue)}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.placeholder || "Vyberte možnost"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )

        case 'checkbox':
          return (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.id}
                checked={Boolean(value)}
                onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
              />
              <Label 
                htmlFor={field.id}
                className="text-sm font-normal cursor-pointer"
              >
                {field.label}
              </Label>
            </div>
          )

        default:
          return (
            <Input
              id={field.id}
              type="text"
              placeholder={field.placeholder}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
          )
      }
    })()

    if (field.type === 'checkbox') {
      return (
        <div key={field.id} className="space-y-2">
          {fieldContent}
          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {error.message}
            </p>
          )}
        </div>
      )
    }

    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.id} className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {fieldContent}
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {error.message}
          </p>
        )}
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
    setHasUnsavedChanges(false)
  }

  const visibleFields = form.fields.filter(isFieldVisible)

  if (visibleFields.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Tento krok neobsahuje žádný formulář k vyplnění.
        </AlertDescription>
      </Alert>
    )
  }

  const renderFormContent = () => {
    if (form.ui?.groups && form.ui.groups.length > 0) {
      return form.ui.groups.map((group, groupIndex) => {
        const groupFields = group.fieldIds
          .map(fieldId => form.fields.find(f => f.id === fieldId))
          .filter((field): field is FormField => field !== undefined && isFieldVisible(field))

        if (groupFields.length === 0) return null

        return (
          <div key={groupIndex} className="space-y-4">
            {group.title && (
              <h4 className="text-lg font-semibold text-gray-900">
                {group.title}
              </h4>
            )}
            <div className={`grid gap-4 ${
              form.ui?.layout === 'two_column' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
            }`}>
              {groupFields.map(renderField)}
            </div>
          </div>
        )
      })
    } else {
      return (
        <div className={`grid gap-4 ${
          form.ui?.layout === 'two_column' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
        }`}>
          {visibleFields.map(renderField)}
        </div>
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          {form.title || 'Formulář'}
        </CardTitle>
        {form.description && (
          <p className="text-sm text-muted-foreground">
            {form.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderFormContent()}

          {hasUnsavedChanges && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Máte neuložené změny. Nezapomeňte formulář uložit.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
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
        </form>
      </CardContent>
    </Card>
  )
}