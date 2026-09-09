/**
 * Centralised API endpoint map for the whole application.
 *
 * Each future module should extend this file with its own endpoints
 * under a descriptive key. Keep URLs out of components.
 */
export const ApiEndpoints = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REQUEST_RESET: '/auth/request-reset',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USERS: {
    LIST: '/users',
    PROFILE: '/users/me',
    UPDATE: (id) => `/users/${id}`,
  },
  PRODUCTS: {
    LIST: '/packaged-products',
    DETAIL: (id) => `/packaged-products/${id}`,
    REGISTER: '/packaged-products',
    UPDATE: (id) => `/packaged-products/${id}`,
    LOOKUP_BY_CODE: (code) => `/packaged-products/lookup/${encodeURIComponent(code)}`,
  },
  INSPECTIONS: {
    LIST: '/inspections',
    DETAIL: (id) => `/inspections/${id}`,
    CREATE: '/inspections',
    SUBMIT_RESPONSE: (id) => `/inspections/${id}/response`,
    RE_INSPECTION: (id) => `/inspections/${id}/re-inspection`,
  },
  COMPLIANCE: {
    ASSESS: '/compliance/assess',
    RULES: '/compliance/rules',
    REPORT: (id) => `/compliance/reports/${id}`,
  },
  COMPANIES: {
    LIST: '/companies',
    DETAIL: (id) => `/companies/${id}`,
    REGISTER: '/companies',
  },
  SCAN: {
    OCR: '/scan/ocr',
    GEMINI_ANALYZE: '/scan/analyze',
    IMAGE_QUALITY: '/scan/image-quality',
  },
  REPORTS: {
    GENERATE: '/reports',
    ANALYTICS: '/reports/analytics',
  },
  ADMIN: {
    AUDIT_LOGS: '/admin/audit-logs',
    SYSTEM_STATUS: '/admin/system-status',
  },
}

export default ApiEndpoints