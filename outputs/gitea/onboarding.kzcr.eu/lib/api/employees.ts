import { api } from '../api'
export * from './employee-documents'
import type { AuditEventsResponse, GetAuditEventsParams } from './audit-events'

export interface Employee {
  id: string
  email: string
  name: string
  surname: string
  phone?: string
  is_active: boolean
  applicant_id?: string
  organization_id: string
  created_at: string
  organization_name?: string
  role_name?: string
  role_description?: string
  generated_password?: string // Only present when creating from applicant
}

export interface EmployeeRole {
  name: string
  description: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface EmployeesResponse {
  data: Employee[]
  pagination: PaginationInfo
}

export interface EmployeesQuery {
  page?: number
  limit?: number
  search?: string
  role?: string
  excludeRole?: string
  organization?: string
}

export interface EmployeeApplicantData {
  employee: Employee
  applicant: any
  history: any[]
  attachments: any[]
  notes: any[]
}

// Get all employees with pagination and filtering
export const getAllEmployees = async (query: EmployeesQuery = {}): Promise<EmployeesResponse> => {
  const params = new URLSearchParams()
  
  if (query.page) params.append('page', query.page.toString())
  if (query.limit) params.append('limit', query.limit.toString())
  if (query.search) params.append('search', query.search)
  if (query.role) params.append('role', query.role)
  if (query.excludeRole) params.append('excludeRole', query.excludeRole)
  if (query.organization) params.append('organization', query.organization)
  
  const queryString = params.toString()
  const url = queryString ? `/admin/employees?${queryString}` : '/admin/employees'
  
  return api<EmployeesResponse>(url)
}

// Get employee by ID
export const getEmployeeById = async (id: string): Promise<Employee> => {
  return api<Employee>(`/admin/employees/${id}`)
}

// Get employee's applicant data
export const getEmployeeApplicantData = async (id: string): Promise<EmployeeApplicantData> => {
  return api<EmployeeApplicantData>(`/admin/employees/${id}/applicant-data`)
}

// Get all employee roles
export const getEmployeeRoles = async (): Promise<EmployeeRole[]> => {
  return api<EmployeeRole[]>('/admin/employees/roles')
}

// Create employee from applicant data
export interface CreateEmployeeFromApplicantData {
  applicant_id: string
  onboarding_workflow_id: string
  start_date?: string
  notes?: string
}

export const createEmployeeFromApplicant = async (data: CreateEmployeeFromApplicantData): Promise<Employee> => {
  return api<Employee>('/admin/employees/from-applicant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

// Send email interfaces
export interface SendEmailToEmployeeData {
  subject: string
  message: string
}

export interface SendEmailResponse {
  success: boolean
  message: string
  messageId?: string
  sentTo?: string
  error?: string
}

// Send email to employee
export const sendEmailToEmployee = async (employeeId: string, data: FormData): Promise<SendEmailResponse> => {
  return api<SendEmailResponse>(`/admin/employees/${employeeId}/send-email`, {
    method: 'POST',
    body: data,
  })
}

// Update employee role interfaces
export interface UpdateEmployeeRoleData {
  role: string  // 'user' | 'hr' | 'admin'
}

export interface UpdateEmployeeRoleResponse {
  message: string
  employee: Employee
}

// Update employee role
export const updateEmployeeRole = async (
  employeeId: string,
  data: UpdateEmployeeRoleData
): Promise<UpdateEmployeeRoleResponse> => {
  return api<UpdateEmployeeRoleResponse>(`/admin/employees/${employeeId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

export interface DeleteEmployeeResponse {
  message: string
  employee: Employee
}

export const deleteEmployee = async (employeeId: string): Promise<DeleteEmployeeResponse> => {
  return api<DeleteEmployeeResponse>(`/admin/employees/${employeeId}`, {
    method: 'DELETE',
  })
}

export type EmployeeAuditEventsQuery = Omit<GetAuditEventsParams, 'actorUserId'>

export const getEmployeeAuditEvents = async (
  employeeId: string,
  params: EmployeeAuditEventsQuery = {}
): Promise<AuditEventsResponse> => {
  const queryParams = new URLSearchParams()

  if (params.page !== undefined) queryParams.append('page', params.page.toString())
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString())
  if (params.category) queryParams.append('category', params.category)
  if (params.action) queryParams.append('action', params.action)
  if (params.status) queryParams.append('status', params.status)
  if (params.resourceType) queryParams.append('resourceType', params.resourceType)
  if (params.resourceId) queryParams.append('resourceId', params.resourceId)
  if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom)
  if (params.dateTo) queryParams.append('dateTo', params.dateTo)

  const queryString = queryParams.toString()
  const url = `/admin/employees/${employeeId}/audit-events${queryString ? `?${queryString}` : ''}`

  return api<AuditEventsResponse>(url)
}
