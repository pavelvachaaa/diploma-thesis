import { api } from '@/lib/api'

export interface UserRole {
  user_id: string
  role_id: string
  role_name: string
  role_description: string | null
}

export interface OrganizationMembership {
  id: string
  user_id: string
  organization_id: string
  organization_name: string
  expires_at: string | null
  assignment_type: 'auto' | 'manual'
  assigned_by: string | null
  assigned_by_name: string | null
  assigned_at: string
  notes: string | null
  role_name: string
  role_description?: string | null
}

export interface UpdateUserRoleData {
  role: string
}

export interface CreateOrganizationMembershipData {
  organizationId: string
  expiresAt?: string | null
  notes?: string
}

export interface UpdateExpirationData {
  expiresAt: string | null
}

export const getUserRole = async (userId: string): Promise<UserRole> => {
  return api<UserRole>(`/admin/users/${userId}/role`)
}

export const updateUserRole = async (
  userId: string,
  data: UpdateUserRoleData
): Promise<{ message: string; role: UserRole }> => {
  return api<{ message: string; role: UserRole }>(`/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export const getUserOrganizationMemberships = async (userId: string): Promise<OrganizationMembership[]> => {
  return api<OrganizationMembership[]>(`/admin/users/${userId}/organization-memberships`)
}

export const createOrganizationMembership = async (
  userId: string,
  data: CreateOrganizationMembershipData
): Promise<{ message: string; membership: OrganizationMembership }> => {
  return api<{ message: string; membership: OrganizationMembership }>(
    `/admin/users/${userId}/organization-memberships`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  )
}

export const updateOrganizationMembershipExpiration = async (
  membershipId: string,
  data: UpdateExpirationData
): Promise<{ message: string; membership: OrganizationMembership }> => {
  return api<{ message: string; membership: OrganizationMembership }>(
    `/admin/organization-memberships/${membershipId}/expiration`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  )
}

export const deleteOrganizationMembership = async (membershipId: string): Promise<{ message: string }> => {
  return api<{ message: string }>(`/admin/organization-memberships/${membershipId}`, {
    method: 'DELETE',
  })
}
