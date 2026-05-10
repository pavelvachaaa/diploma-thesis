import { api } from '../api'

export interface ContractType {
  code: string
  description: string
  created_at?: string
  updated_at?: string
}

// Get all contract types
export const getAllContractTypes = async (): Promise<ContractType[]> => {
  return api<ContractType[]>('/contract_types')
}

// Get contract type by code
export const getContractTypeByCode = async (code: string): Promise<ContractType> => {
  return api<ContractType>(`/contract_types/${code}`)
}

// Create new contract type
export const createContractType = async (contractTypeData: Partial<ContractType>): Promise<ContractType> => {
  return api<ContractType>('/admin/contract-types', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(contractTypeData),
  })
}

// Update contract type
export const updateContractType = async (code: string, contractTypeData: Partial<ContractType>): Promise<ContractType> => {
  return api<ContractType>(`/admin/contract-types/${code}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(contractTypeData),
  })
}

// Delete contract type
export const deleteContractType = async (code: string): Promise<void> => {
  return api<void>(`/admin/contract-types/${code}`, {
    method: 'DELETE',
  })
}