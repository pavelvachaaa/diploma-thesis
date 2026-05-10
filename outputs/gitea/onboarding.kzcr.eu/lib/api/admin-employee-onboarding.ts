import { api } from '../api'
import type { OnboardingDashboard, OnboardingStep, OnboardingProgress } from './employee_onboarding'

// Admin API functions for managing employee onboarding

// Get employee onboarding dashboard data (admin view)
export const getEmployeeOnboardingDashboard = async (employeeId: string): Promise<OnboardingDashboard> => {
  return api<OnboardingDashboard>(`/admin/employees/${employeeId}/onboarding/dashboard`)
}

// Get employee onboarding steps (admin view)
export const getEmployeeOnboardingSteps = async (employeeId: string): Promise<OnboardingStep[]> => {
  return api<OnboardingStep[]>(`/admin/employees/${employeeId}/onboarding/steps`)
}

// Get employee onboarding progress (admin view)
export const getEmployeeOnboardingProgress = async (employeeId: string): Promise<OnboardingProgress> => {
  return api<OnboardingProgress>(`/admin/employees/${employeeId}/onboarding/progress`)
}

// Get employee step form responses (admin view)
export const getEmployeeStepResponses = async (employeeId: string, stepId: string): Promise<any> => {
  return api(`/admin/employees/${employeeId}/onboarding/steps/${stepId}/responses`)
}