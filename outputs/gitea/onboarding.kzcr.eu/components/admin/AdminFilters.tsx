'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Filter, 
  Search, 
  X, 
  ChevronDown 
} from 'lucide-react'

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterDefinition {
  key: string
  label: string
  type: 'text' | 'select' | 'multiselect' | 'boolean'
  options?: FilterOption[]
  placeholder?: string
  defaultValue?: any
}

export interface AdminFiltersProps {
  filters: FilterDefinition[]
  values: Record<string, any>
  onChange: (values: Record<string, any>) => void
  
  // Search
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  
  // Actions
  onReset?: () => void
  showClearAll?: boolean
  
  // Layout
  variant?: 'inline' | 'dropdown'
  className?: string
}

export function AdminFilters({
  filters,
  values,
  onChange,
  searchPlaceholder = 'Hledat...',
  searchValue = '',
  onSearchChange,
  onReset,
  showClearAll = true,
  variant = 'inline',
  className = ''
}: AdminFiltersProps) {
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const updateFilter = (key: string, value: any) => {
    // Only trigger onChange if value actually changed
    if (values[key] === value) return

    const newValues = { ...values, [key]: value }
    onChange(newValues)
  }
  
  const clearFilter = (key: string) => {
    const newValues = { ...values }
    delete newValues[key]
    onChange(newValues)
  }
  
  const clearAllFilters = () => {
    onChange({})
    if (onSearchChange) onSearchChange('')
    onReset?.()
  }
  
  const getActiveFiltersCount = () => {
    let count = Object.keys(values).filter(key => 
      values[key] !== undefined && 
      values[key] !== null && 
      values[key] !== '' &&
      values[key] !== 'all' &&
      !(Array.isArray(values[key]) && values[key].length === 0)
    ).length
    
    if (searchValue) count++
    
    return count
  }
  
  const renderFilter = (filter: FilterDefinition) => {
    const value = values[filter.key] || filter.defaultValue
    
    switch (filter.type) {
      case 'text':
        return (
          <div key={filter.key} className="space-y-2 mb-3">
            <Label>{filter.label}</Label>
            <Input
              value={value || ''}
              onChange={(e) => updateFilter(filter.key, e.target.value)}
              placeholder={filter.placeholder}
            />
          </div>
        )
      
      case 'select':
        return (
          <div key={filter.key} className="space-y-2 mb-3">
            <Label>{filter.label}</Label>
            <Select
              value={value || filter.defaultValue || ''}
              onValueChange={(newValue) => updateFilter(filter.key, newValue)}
            >
              <SelectTrigger>
                <SelectValue placeholder={filter.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                    {option.count !== undefined && (
                      <span className="ml-auto text-muted-foreground">
                        ({option.count})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      
      case 'multiselect':
        const multiValue = Array.isArray(value) ? value : []
        return (
          <div key={filter.key} className="space-y-2 mb-3">
            <Label>{filter.label}</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {filter.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${filter.key}-${option.value}`}
                    checked={multiValue.includes(option.value)}
                    onCheckedChange={(checked) => {
                      let newValue = [...multiValue]
                      if (checked) {
                        newValue.push(option.value)
                      } else {
                        newValue = newValue.filter(v => v !== option.value)
                      }
                      updateFilter(filter.key, newValue)
                    }}
                  />
                  <Label 
                    htmlFor={`${filter.key}-${option.value}`} 
                    className="cursor-pointer text-sm"
                  >
                    {option.label}
                    {option.count !== undefined && (
                      <span className="ml-1 text-muted-foreground">
                        ({option.count})
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )
      
      case 'boolean':
        return (
          <div key={filter.key} className="space-y-2 mb-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={filter.key}
                checked={!!value}
                onCheckedChange={(checked) => updateFilter(filter.key, checked)}
              />
              <Label htmlFor={filter.key} className="cursor-pointer">
                {filter.label}
              </Label>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }
  
  const activeCount = getActiveFiltersCount()
  
  if (variant === 'dropdown') {
    return (
      <div className={`flex mb-3 items-center gap-2 ${className}`}>
        {/* Search */}
        {onSearchChange && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-10"
            />
          </div>
        )}
        
        {/* Filter dropdown - simplified without Popover */}
        <div className="relative">
          <Button 
            variant="outline" 
            className="relative"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtry
            {activeCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {activeCount}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 p-4 bg-background border border-border rounded-md shadow-lg z-50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filtry</h4>
                  {activeCount > 0 && showClearAll && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      Vymazat vše
                    </Button>
                  )}
                </div>
                
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {filters.map(renderFilter)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and clear all */}
      <div className="flex items-center gap-2">
        {onSearchChange && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-10"
            />
          </div>
        )}
        
        {activeCount > 0 && showClearAll && (
          <Button variant="outline" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-2" />
            Vymazat filtry ({activeCount})
          </Button>
        )}
      </div>
      
      {/* Filters */}
      {filters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filters.map(renderFilter)}
        </div>
      )}
      
      {/* Active filters display */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(values).map(([key, value]) => {
            if (!value || value === 'all' || value === '' || (Array.isArray(value) && value.length === 0)) {
              return null
            }
            
            const filter = filters.find(f => f.key === key)
            if (!filter) return null
            
            let displayValue = value
            if (filter.type === 'select' && filter.options) {
              const option = filter.options.find(opt => opt.value === value)
              displayValue = option?.label || value
            } else if (Array.isArray(value)) {
              displayValue = value.length > 1 ? `${value.length} vybraných` : value[0]
            }
            
            return (
              <Badge key={key} variant="secondary" className="gap-1">
                <span className="text-xs text-muted-foreground">{filter.label}:</span>
                {displayValue}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => clearFilter(key)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
          
          {searchValue && (
            <Badge variant="secondary" className="gap-1">
              <span className="text-xs text-muted-foreground">Hledání:</span>
              {searchValue}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => onSearchChange?.('')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminFilters