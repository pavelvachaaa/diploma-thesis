export interface Job {
  id: string;
  title: string;
  description: string;
  job_role_id: string;
  onboarding_workflow_id: string | null;
  organization_id: string;
  organization_name: string;
  status: string;
  salary_min: number;
  salary_max: number;
  short_description?: string;
  contract_type_code: string[];
  contract_type_labels?: string[];
  department: string;
  publish_date: string;
  expire_date: string | null;
  contact_email: string;
  contact_phone: string;
  contact_name?: string | null;
  contact_linkedin_url?: string | null;
  contact_photo_file_id?: string | null;
  contact_photo_url?: string | null;
  cv_required?: boolean;
  is_department_accredited?: boolean;
  created_at: string;
  contract_type_label: string;
  sections?: {
    benefits?: string[];
    duties?: string[];
    requirements?: string[];
  };
}

export type JobType = 'Plný úvazek' | 'Částečný úvazek' | 'Smlouva' | 'Dočasný';
export type JobSpecialty = 'Ošetřovatelství' | 'Lékařství' | 'Terapie' | 'Radiologie' | 'Urgentní medicína' | 'Farmacie' | 'Administrativa';

export interface JobFilters {
  org?: string;
  location?: string;
  role?: string;
  q?: string;
  contractType?: string;
  classification?: string;
  salaryMin?: number;
  salaryMax?: number;
  accredited?: boolean;
  page?: number;
}

export interface JobsResponse {
  jobs: Job[];
  hasMore: boolean;
  currentPage: number;
  totalCount?: number;
}

export interface Organization {
  id: string;
  name: string;
  seat_location?: string | null;
  address: string | null;
  contact_email: string;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_linkedin_url?: string | null;
  contact_photo_file_id?: string | null;
  contact_photo_url?: string | null;
}

export interface ContractType {
  code: string;
  description: string;
}

export interface JobRole {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  organization_name: string;
  classification_code?: string;
  classification_label?: string;
}

export interface JobRoleClassification {
  code: string;
  label: string;
  description?: string;
}

export interface JobApplication {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  zip?: string;
  education: string;
  field: string;
  experience: string;
  lastEmployer?: string;
  lastPosition?: string;
  cv?: File;
  coverLetter?: File;
  gdprConsent: boolean;
}
