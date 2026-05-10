export type FieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox';

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: FormFieldOption[];
  visibleIf?: {
    field: string;
    equals: string | number | boolean;
  };
}

export interface FormGroup {
  title: string;
  fieldIds: string[];
}

export interface FormUI {
  layout?: 'one_column' | 'two_column';
  groups?: FormGroup[];
}

export interface FormValidation {
  uniqueKeys?: string[];
  customRules?: string[];
}

export interface OnboardingForm {
  id: string;
  schemaVersion: number;
  title?: string;
  description?: string;
  fields: FormField[];
  ui?: FormUI;
  validation?: FormValidation;
  form_status?: 'draft' | 'published';
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

export interface FormResponse {
  [fieldId: string]: any;
  docReads?: { [documentId: string]: string };
}

export interface StepDetails {
  step: {
    id: string;
    title: string;
    description?: string;
    step_type: 'info' | 'ack' | 'form' | 'quiz' | 'file';
    acknowledgment_text?: string;
    is_mandatory: boolean;
    order_index: number;
    days_from_start?: number;
    duration_days?: number;
    instructions?: string;
    metadata?: any;
  };
  form?: OnboardingForm;
  documents: Array<{
    document_id: string;
    name: string;
    description?: string;
    is_mandatory: boolean;
    file_path?: string;
    file_name?: string;
    mime_type?: string;
    download_url?: string;
  }>;
  userStep: {
    id: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
    acknowledged: boolean;
    form_response?: FormResponse;
    validation_status?: 'unvalidated' | 'valid' | 'invalid';
    submitted_at?: string;
    quiz_score?: number;
    passed?: boolean;
    completed_at?: string;
  };
}