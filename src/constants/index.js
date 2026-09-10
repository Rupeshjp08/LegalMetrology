export const USER_ROLES = {
  LEGAL_METROLOGY_OFFICER: 'legal-metrology-officer',
  DEPARTMENT_ADMINISTRATOR: 'department-administrator',
  REGISTERED_COMPANY: 'registered-company',
  GENERAL_USER: 'general-user',
}

export const ROLE_LABELS = {
  [USER_ROLES.LEGAL_METROLOGY_OFFICER]: 'Legal Metrology Officer',
  [USER_ROLES.DEPARTMENT_ADMINISTRATOR]: 'Department Administrator',
  [USER_ROLES.REGISTERED_COMPANY]: 'Registered Company',
  [USER_ROLES.GENERAL_USER]: 'General User',
}

export const INSPECTION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  UNDER_REVIEW: 'under-review',
  COMPLIANT: 'compliant',
  NON_COMPLIANT: 'non-compliant',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

export const COMPLIANCE_STATUS = {
  COMPLIANT: 'compliant',
  NON_COMPLIANT: 'non-compliant',
  PENDING: 'pending',
  UNDER_REVIEW: 'under-review',
  WARNING: 'warning',
  EXEMPT: 'exempt',
}

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  SUCCESS: 'success',
  ERROR: 'error',
}

export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png']
export const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png']
export const MAX_IMAGE_SIZE_MB = 10
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

export const ROUTES = {
  HOME: '/home',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  SCAN: '/scan',
  COMPLIANCE: '/compliance',
  INSPECTION: '/inspection',
  COMPANY: '/company',
  REPORTS: '/reports',
  NOTICES: '/notices',
  ADMIN: '/admin',
  SCAN_HISTORY: '/admin/history',
  QR_VERIFICATION: '/admin/qr-verification',
  ANALYTICS: '/admin/analytics',
  SETTINGS: '/admin/settings',
  COMPANY_NOTIFICATIONS: '/company-notifications',
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  ACCESSIBILITY: '/accessibility',
}
