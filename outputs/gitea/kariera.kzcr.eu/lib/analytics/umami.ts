type UmamiValue = string | number | boolean;
type MaybeUmamiValue = UmamiValue | null | undefined;

type JobAnalyticsContext = {
  job_id: string;
  job_title?: string;
  organization_name?: string;
  department?: string;
};

type UmamiEventPayloads = {
  job_search_submit: {
    had_query: boolean;
    classification?: string;
    location?: string;
    role?: string;
    contract_type?: string;
  };
  job_filter_change: {
    filter_name: string;
    value?: string;
  };
  job_filters_clear: {
    had_query: boolean;
    had_classification: boolean;
    had_location: boolean;
    had_role: boolean;
    had_contract_type: boolean;
  };
  job_apply_click: {
    job_id: string;
    job_title?: string;
    organization_name?: string;
    department?: string;
  };
  job_detail_view: JobAnalyticsContext;
  job_application_form_open: JobAnalyticsContext;
  job_application_form_interaction: JobAnalyticsContext;
  job_application_form_validation_error: JobAnalyticsContext & {
    field_name: string;
    error_type: string;
  };
  job_application_form_abandon: JobAnalyticsContext & {
    had_submit_start: boolean;
  };
  job_application_submit_start: JobAnalyticsContext;
  job_application_submit_success: JobAnalyticsContext;
  job_application_submit_error: JobAnalyticsContext & {
    error_category: string;
    http_status?: number;
  };
  job_seeker_submit_success: {
    preferred_position?: string;
    organization_count: number;
  };
  contact_inquiry_submit_success: {
    has_phone: boolean;
  };
};

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, UmamiValue>) => void;
    };
  }
}

function sanitizePayload(payload: Record<string, MaybeUmamiValue>): Record<string, UmamiValue> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ) as Record<string, UmamiValue>;
}

export function trackUmamiEvent<T extends keyof UmamiEventPayloads>(
  eventName: T,
  payload?: UmamiEventPayloads[T]
) {
  if (typeof window === "undefined" || typeof window.umami?.track !== "function") {
    return;
  }

  if (!payload) {
    window.umami.track(eventName);
    return;
  }

  const sanitizedPayload = sanitizePayload(payload as Record<string, MaybeUmamiValue>);

  if (Object.keys(sanitizedPayload).length === 0) {
    window.umami.track(eventName);
    return;
  }

  window.umami.track(eventName, sanitizedPayload);
}
