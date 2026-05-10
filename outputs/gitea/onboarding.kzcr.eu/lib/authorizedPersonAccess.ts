import { getPrimaryRole, isAuthorizedPersonOnly } from "@/lib/roleUtils"

export const AUTHORIZED_PERSON_HOME_PATH = "/admin/jobs"
export const ADMIN_HOME_PATH = "/admin/dashboard"
export const ADMIN_OPERATOR_ROLES = ["admin", "hr"] as const
export const ADMIN_OPERATOR_AND_SUPER_ADMIN_ROLES = ["super_admin", "admin", "hr"] as const
export const ADMIN_OPERATOR_AND_AUTHORIZED_PERSON_ROLES = ["admin", "hr", "authorized_person"] as const
export const ADMIN_ONLY_ROLES = ["admin"] as const
export const ADMIN_ONLY_AND_SUPER_ADMIN_ROLES = ["super_admin", "admin"] as const
export const SUPER_ADMIN_ONLY_ROLES = ["super_admin"] as const
export const ADMIN_SHELL_ROLES = ["super_admin", "admin", "hr", "authorized_person"] as const

export type AdminNavKey =
  | "dashboard"
  | "seekers"
  | "contact-inquiries"
  | "specifications"
  | "employees"
  | "applicants"
  | "qualifications"
  | "accreditations"
  | "interviews"
  | "jobs"
  | "job-roles"
  | "organizations"
  | "documents"
  | "onboarding"
  | "notifications"
  | "chat"
  | "audit"
  | "outbox"
  | "settings"
  | "change-password"

export interface AdminNavItemConfig {
  key: AdminNavKey
  href: string
  label: string
  subItems?: Array<{
    href: string
    label: string
  }>
}

type PathTest = (pathname: string) => boolean

const exact = (path: string): PathTest => (pathname) => pathname === path
const prefix = (path: string): PathTest => (pathname) => pathname === path || pathname.startsWith(`${path}/`)

const AUTHORIZED_PERSON_JOB_PATHS: PathTest[] = [
  exact("/admin/jobs"),
  (pathname) => /^\/admin\/jobs\/[^/]+$/.test(pathname),
]

const AUTHORIZED_PERSON_APPLICANT_PATHS: PathTest[] = [
  exact("/admin/applicants"),
  (pathname) => /^\/admin\/applicants\/[^/]+$/.test(pathname),
]

const AUTHORIZED_PERSON_INTERVIEW_PATHS: PathTest[] = [
  exact("/admin/interviews"),
  (pathname) => /^\/admin\/interviews\/[^/]+$/.test(pathname),
]

const SHARED_MUTATING_CAPABILITIES = {
  jobs: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canDuplicate: true,
    canChangeStatus: true,
    canRunMatching: true,
    canConvertSeekers: true,
    canManageAuthorizedPeople: true,
    canUseAiAssistant: true,
  },
  applicants: {
    canMutate: true,
    canSendEmail: true,
    canScheduleInterview: true,
    canManageNotes: true,
    canManageAttachmentStatus: true,
    canViewCvAnalysis: true,
  },
  seekers: {
    canDelete: true,
    canReanalyzeCv: true,
  },
  interviews: {
    canMutate: true,
    canManageParticipants: true,
    canManageAttachments: true,
    canResendInvitation: true,
  },
  ui: {
    showDashboard: true,
    showNotificationBell: true,
    showNotifications: true,
    showSettingsRoot: false,
  },
}

const AUTHORIZED_PERSON_CAPABILITIES = {
  jobs: {
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canDuplicate: false,
    canChangeStatus: false,
    canRunMatching: false,
    canConvertSeekers: false,
    canManageAuthorizedPeople: false,
    canUseAiAssistant: false,
  },
  applicants: {
    canMutate: false,
    canSendEmail: true,
    canScheduleInterview: false,
    canManageNotes: true,
    canManageAttachmentStatus: false,
    canViewCvAnalysis: false,
  },
  seekers: {
    canDelete: false,
    canReanalyzeCv: false,
  },
  interviews: {
    canMutate: false,
    canManageParticipants: false,
    canManageAttachments: false,
    canResendInvitation: false,
  },
  ui: {
    showDashboard: false,
    showNotificationBell: false,
    showNotifications: false,
    showSettingsRoot: false,
  },
}

const HR_NAV_ITEMS: AdminNavItemConfig[] = [
  { key: "dashboard", href: "/admin/dashboard", label: "Dashboard" },
  { key: "seekers", href: "/admin/seekers", label: "Databáze zájemců" },
  { key: "contact-inquiries", href: "/admin/contact-inquiries", label: "Kontaktní dotazy" },
  { key: "applicants", href: "/admin/applicants", label: "Uchazeči" },
  { key: "qualifications", href: "/admin/qualifications", label: "Kvalifikace" },
  { key: "interviews", href: "/admin/interviews", label: "Pohovory" },
  {
    key: "jobs",
    href: "/admin/jobs",
    label: "Pracovní nabídky",
    subItems: [{ href: "/admin/jobs", label: "Seznam nabídek" }],
  },
  { key: "accreditations", href: "/admin/accreditations", label: "Akreditace" },
  { key: "chat", href: "/admin/chat", label: "Chat s uživateli" },
  { key: "notifications", href: "/admin/notifications", label: "Notifikace" },
  {
    key: "settings",
    href: "/admin/settings/notifications",
    label: "Nastavení",
    subItems: [{ href: "/admin/settings/notifications", label: "Notifikace" }],
  },
  { key: "change-password", href: "/admin/change-password", label: "Změnit heslo" },
]

const ADMIN_NAV_ITEMS: AdminNavItemConfig[] = [
  ...HR_NAV_ITEMS.slice(0, 3),
  { key: "specifications", href: "/admin/specifications", label: "Skupiny specifikací" },
  ...HR_NAV_ITEMS.slice(3, 7),
  { key: "job-roles", href: "/admin/job-roles", label: "Pracovní role" },
  { key: "documents", href: "/admin/onboarding-documents", label: "Dokumenty" },
  { key: "accreditations", href: "/admin/accreditations", label: "Akreditace" },
  {
    key: "employees",
    href: "/admin/employees",
    label: "Zaměstnanci",
    subItems: [
      { href: "/admin/employees", label: "Seznam zaměstnanců" },
      { href: "/admin/employees/nastupujici", label: "Nastupující" },
    ],
  },
  {
    key: "onboarding",
    href: "/admin/workflows",
    label: "Onboarding",
    subItems: [
      { href: "/admin/workflows", label: "Workflow" },
      { href: "/admin/onboarding", label: "Formulare" },
    ],
  },
  ...HR_NAV_ITEMS.slice(8),
]

const SUPER_ADMIN_NAV_ITEMS: AdminNavItemConfig[] = [
  ...ADMIN_NAV_ITEMS.slice(0, 10),
  { key: "organizations", href: "/admin/organizations", label: "Organizace" },
  ...ADMIN_NAV_ITEMS.slice(10, 14),
  { key: "audit", href: "/admin/audit-events", label: "Audit logy" },
  { key: "outbox", href: "/admin/outbox", label: "Outbox" },
  ...ADMIN_NAV_ITEMS.slice(14),
]

const AUTHORIZED_PERSON_NAV_ITEMS: AdminNavItemConfig[] = [
  { key: "seekers", href: "/admin/seekers", label: "Databáze zájemců" },
  { key: "applicants", href: "/admin/applicants", label: "Uchazeči" },
  { key: "qualifications", href: "/admin/qualifications", label: "Kvalifikace" },
  { key: "interviews", href: "/admin/interviews", label: "Pohovory" },
  {
    key: "jobs",
    href: "/admin/jobs",
    label: "Pracovní nabídky",
    subItems: [{ href: "/admin/jobs", label: "Seznam nabídek" }],
  },
  { key: "chat", href: "/admin/chat", label: "Chat s uživateli" },
  { key: "change-password", href: "/admin/change-password", label: "Změnit heslo" },
]

const HR_ALLOWED_PATHS: PathTest[] = [
  exact("/admin/dashboard"),
  prefix("/admin/seekers"),
  prefix("/admin/contact-inquiries"),
  prefix("/admin/applicants"),
  prefix("/admin/qualifications"),
  prefix("/admin/interviews"),
  prefix("/admin/jobs"),
  prefix("/admin/accreditations"),
  prefix("/admin/chat"),
  prefix("/admin/notifications"),
  prefix("/admin/settings/notifications"),
  prefix("/admin/change-password"),
]

const ADMIN_ALLOWED_PATHS: PathTest[] = [
  ...HR_ALLOWED_PATHS,
  prefix("/admin/specifications"),
  prefix("/admin/job-roles"),
  prefix("/admin/onboarding-documents"),
  prefix("/admin/workflows"),
  prefix("/admin/onboarding"),
  prefix("/admin/employees"),
]

const AUTHORIZED_PERSON_ALLOWED_PATHS: PathTest[] = [
  prefix("/admin/seekers"),
  ...AUTHORIZED_PERSON_APPLICANT_PATHS,
  exact("/admin/qualifications"),
  ...AUTHORIZED_PERSON_INTERVIEW_PATHS,
  ...AUTHORIZED_PERSON_JOB_PATHS,
  prefix("/admin/chat"),
  prefix("/admin/change-password"),
]

const canAccessByTests = (tests: PathTest[], pathname: string) => tests.some((test) => test(pathname))

export const isAuthorizedPersonPathAllowed = (pathname: string): boolean => {
  return canAccessByTests(AUTHORIZED_PERSON_ALLOWED_PATHS, pathname)
}

export const getAuthorizedPersonNavItems = (): AdminNavItemConfig[] => AUTHORIZED_PERSON_NAV_ITEMS

export const getAdminAccessConfig = (roles: string[]) => {
  const primaryRole = getPrimaryRole(roles)
  const authorizedPersonOnly = isAuthorizedPersonOnly(roles)

  if (primaryRole === "super_admin") {
    return {
      primaryRole,
      authorizedPersonOnly,
      isAdminShellUser: true,
      homePath: ADMIN_HOME_PATH,
      navItems: SUPER_ADMIN_NAV_ITEMS,
      canAccessPath: (pathname: string) => pathname.startsWith("/admin"),
      capabilities: {
        ...SHARED_MUTATING_CAPABILITIES,
        jobs: {
          ...SHARED_MUTATING_CAPABILITIES.jobs,
          canUseAiAssistant: true,
        },
        ui: {
          ...SHARED_MUTATING_CAPABILITIES.ui,
          showSettingsRoot: true,
        },
      },
    }
  }

  if (primaryRole === "admin") {
    return {
      primaryRole,
      authorizedPersonOnly,
      isAdminShellUser: true,
      homePath: ADMIN_HOME_PATH,
      navItems: ADMIN_NAV_ITEMS,
      canAccessPath: (pathname: string) => canAccessByTests(ADMIN_ALLOWED_PATHS, pathname),
      capabilities: SHARED_MUTATING_CAPABILITIES,
    }
  }

  if (primaryRole === "hr") {
    return {
      primaryRole,
      authorizedPersonOnly,
      isAdminShellUser: true,
      homePath: ADMIN_HOME_PATH,
      navItems: HR_NAV_ITEMS,
      canAccessPath: (pathname: string) => canAccessByTests(HR_ALLOWED_PATHS, pathname),
      capabilities: SHARED_MUTATING_CAPABILITIES,
    }
  }

  if (primaryRole === "authorized_person") {
    return {
      primaryRole,
      authorizedPersonOnly,
      isAdminShellUser: true,
      homePath: AUTHORIZED_PERSON_HOME_PATH,
      navItems: AUTHORIZED_PERSON_NAV_ITEMS,
      canAccessPath: (pathname: string) => canAccessByTests(AUTHORIZED_PERSON_ALLOWED_PATHS, pathname),
      capabilities: AUTHORIZED_PERSON_CAPABILITIES,
    }
  }

  return {
    primaryRole,
    authorizedPersonOnly,
    isAdminShellUser: false,
    homePath: "/employee/dashboard",
    navItems: [] as AdminNavItemConfig[],
    canAccessPath: (pathname: string) => !pathname.startsWith("/admin"),
    capabilities: AUTHORIZED_PERSON_CAPABILITIES,
  }
}
