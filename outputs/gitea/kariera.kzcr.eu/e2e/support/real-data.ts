export const JOBS_URL = '/kariera/jobs';
export const CONTACT_URL = '/kariera/kontaktuj-nas';
export const JOB_SEEKER_URL = '/kariera/contacts';

export const E2E_JOBS = {
  cvRequired: {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'E2E Zdravotní sestra JIP',
    organization: 'Masarykova nemocnice v Ústí nad Labem',
  },
  noCv: {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'E2E Administrativní pracovník recepce',
    organization: 'Nemocnice Chomutov',
  },
  doctor: {
    id: '33333333-3333-4333-8333-333333333333',
    title: 'E2E Lékař interna',
  },
  partTime: {
    id: '88888888-8888-4888-8888-888888888888',
    title: 'E2E Porodní asistentka',
  },
  hiddenArchived: 'E2E Skrytý archiv',
  hiddenFuture: 'E2E Budoucí pozice',
} as const;

export const E2E_ACTIVE_JOB_COUNT = 9;
export const FIRST_PAGE_JOB_COUNT = 7;
export const NURSE_CLASSIFICATION_LABEL = 'Sestry a záchranáři';
export const NURSE_CLASSIFICATION_CODE = 'nurses_paramedics';
export const PART_TIME_LABEL = 'Zkrácený úvazek';

export function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}.${Math.random().toString(16).slice(2)}@example.test`;
}

export const FAKE_PDF = {
  name: 'cv-e2e.pdf',
  mimeType: 'application/pdf',
  buffer: Buffer.from('%PDF-1.4 e2e pdf content'),
} as const;
