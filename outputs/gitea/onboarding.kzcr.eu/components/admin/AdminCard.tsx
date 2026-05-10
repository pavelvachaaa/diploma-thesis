'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MoreVertical, Edit, Trash2, Eye } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface AdminCardAction {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
}

export interface AdminCardProps {
  title: string
  description?: string
  children?: React.ReactNode
  
  // Status and badges
  status?: {
    label: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
    color?: string
  }
  badges?: Array<{
    label: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  }>
  
  // Actions
  actions?: AdminCardAction[]
  primaryAction?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'destructive' | 'outline' | 'secondary'
    disabled?: boolean
  }
  
  // States
  loading?: boolean
  error?: string
  
  // Styling
  className?: string
  clickable?: boolean
  onClick?: () => void
  
  // Footer
  footer?: React.ReactNode
}

export function AdminCard({
  title,
  description,
  children,
  status,
  badges = [],
  actions = [],
  primaryAction,
  loading = false,
  error,
  className = '',
  clickable = false,
  onClick,
  footer
}: AdminCardProps) {
  
  if (loading) {
    return (
      <Card className={`${className} ${clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (error) {
    return (
      <Card className={`${className} border-red-200 bg-red-50`}>
        <CardContent className="pt-6">
          <div className="text-red-600 text-sm">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card 
      className={`${className} ${clickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={clickable ? onClick : undefined}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="truncate">{title}</CardTitle>
              {status && (
                <Badge 
                  variant={status.variant || 'default'}
                  style={status.color ? { backgroundColor: status.color } : undefined}
                >
                  {status.label}
                </Badge>
              )}
            </div>
            {description && (
              <CardDescription className="line-clamp-2">
                {description}
              </CardDescription>
            )}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {badges.map((badge, index) => (
                  <Badge 
                    key={index} 
                    variant={badge.variant || 'secondary'}
                    className="text-xs"
                  >
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, index) => {
                  const Icon = action.icon
                  const isDestructive = action.destructive
                  const needsSeparator = index > 0 && (isDestructive !== actions[index - 1].destructive)
                  
                  return (
                    <React.Fragment key={index}>
                      {needsSeparator && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          action.onClick()
                        }}
                        disabled={action.disabled}
                        className={isDestructive ? 'text-red-600 focus:text-red-600' : ''}
                      >
                        {Icon && <Icon className="h-4 w-4 mr-2" />}
                        {action.label}
                      </DropdownMenuItem>
                    </React.Fragment>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      {children && (
        <CardContent>
          {children}
        </CardContent>
      )}
      
      {(primaryAction || footer) && (
        <CardContent className={children ? 'pt-0' : ''}>
          {primaryAction && (
            <Button
              variant={primaryAction.variant || 'default'}
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                primaryAction.onClick()
              }}
              disabled={primaryAction.disabled}
              className="w-full"
            >
              {primaryAction.label}
            </Button>
          )}
          {footer && (
            <div className={primaryAction ? 'mt-3' : ''}>
              {footer}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

// Preset card types for common use cases
export function EmployeeCard({ employee, ...props }: { employee: any } & Omit<AdminCardProps, 'title' | 'description'>) {
  return (
    <AdminCard
      title={`${employee.name} ${employee.surname}`}
      description={employee.email}
      status={{
        label: employee.is_active ? 'Aktivní' : 'Neaktivní',
        variant: employee.is_active ? 'default' : 'secondary'
      }}
      badges={[
        { label: employee.organization_name || 'Bez organizace', variant: 'outline' },
        ...(employee.role_name ? [{ label: employee.role_name, variant: 'secondary' }] : [])
      ]}
      {...props}
    />
  )
}

export function WorkflowCard({ workflow, ...props }: { workflow: any } & Omit<AdminCardProps, 'title' | 'description'>) {
  return (
    <AdminCard
      title={workflow.name}
      description={workflow.description}
      status={{
        label: workflow.is_active ? 'Aktivní' : 'Neaktivní',
        variant: workflow.is_active ? 'default' : 'secondary'
      }}
      badges={[
        { label: workflow.organization_name || 'Bez organizace', variant: 'outline' },
        { label: workflow.is_template ? 'Šablona' : 'Workflow', variant: 'secondary' }
      ]}
      {...props}
    />
  )
}

export function ApplicantCard({ applicant, ...props }: { applicant: any } & Omit<AdminCardProps, 'title' | 'description'>) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'accepted': return 'default'
      case 'rejected': return 'destructive' 
      case 'under_review': return 'secondary'
      default: return 'outline'
    }
  }
  
  return (
    <AdminCard
      title={`${applicant.name} ${applicant.surname}`}
      description={applicant.email}
      status={{
        label: applicant.current_status || 'Nový',
        variant: getStatusVariant(applicant.current_status)
      }}
      badges={[
        { label: applicant.job_title || 'Bez pozice', variant: 'outline' }
      ]}
      {...props}
    />
  )
}