'use server'

import { revalidateTag } from 'next/cache'
import { serverApi } from '@/lib/server/api-client'
import { requireAuth } from '@/lib/server/auth'
import type { Organization } from '@/lib/api/organizations'

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string> }

/**
 * Create new organization
 */
export async function createOrganizationAction(
  rawFormData: Partial<Organization>
): Promise<ActionResult<Organization>> {
  try {
    await requireAuth(['super_admin'])

    const organization = await serverApi<Organization>('/admin/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rawFormData),
    })

    revalidateTag('organizations', 'max')

    return { success: true, data: organization }
  } catch (error) {
    console.error('Create organization error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Chyba serveru'
    }
  }
}

/**
 * Update existing organization
 */
export async function updateOrganizationAction(
  id: string,
  rawFormData: Partial<Organization>
): Promise<ActionResult<Organization>> {
  try {
    await requireAuth(['super_admin'])

    const organization = await serverApi<Organization>(
      `/admin/organizations/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rawFormData),
      }
    )

    revalidateTag('organizations', 'max')
    revalidateTag(`organization-${id}`, 'max')

    return { success: true, data: organization }
  } catch (error) {
    console.error('Update organization error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Chyba serveru'
    }
  }
}

/**
 * Delete organization
 */
export async function deleteOrganizationAction(id: string): Promise<ActionResult> {
  try {
    await requireAuth(['super_admin'])

    await serverApi<void>(`/admin/organizations/${id}`, { method: 'DELETE' })

    revalidateTag('organizations', { expire: 0 })

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete organization error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Chyba serveru'
    }
  }
}

export async function uploadOrganizationContactPhotoAction(
  id: string,
  photoFormData: FormData
): Promise<ActionResult<Organization>> {
  try {
    await requireAuth(['super_admin'])

    const organization = await serverApi<Organization>(`/admin/organizations/${id}/contact-photo`, {
      method: 'PUT',
      body: photoFormData
    })

    revalidateTag('organizations', 'max')
    revalidateTag(`organization-${id}`, 'max')

    return { success: true, data: organization }
  } catch (error) {
    console.error('Upload organization photo error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Chyba serveru'
    }
  }
}

export async function deleteOrganizationContactPhotoAction(
  id: string
): Promise<ActionResult<Organization>> {
  try {
    await requireAuth(['super_admin'])

    const organization = await serverApi<Organization>(`/admin/organizations/${id}/contact-photo`, {
      method: 'DELETE'
    })

    revalidateTag('organizations', 'max')
    revalidateTag(`organization-${id}`, 'max')

    return { success: true, data: organization }
  } catch (error) {
    console.error('Delete organization photo error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Chyba serveru'
    }
  }
}
