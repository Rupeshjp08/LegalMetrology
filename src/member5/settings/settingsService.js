// ============================================================================
// Member 5 - Settings Service
// ----------------------------------------------------------------------------
// Data-access layer for the Settings page. Values persist to localStorage.
//
// CURRENT STATE: localStorage-based (React state + browser persistence).
// LATER: Swap the persistence functions below for real Express / MongoDB API
// calls. The exported function signatures are designed for a future
//   GET /api/settings  -> settings object
//   PUT /api/settings  -> { settings }  (body)
// so the UI component does NOT need to change.
// ============================================================================

export const API_BASE_URL = '/api/settings'

export const STORAGE_KEY = 'member5_settings'

// ----------------------------------------------------------------------------
// Default settings
// ----------------------------------------------------------------------------

export const DEFAULT_SETTINGS = {
  general: {
    systemName: 'Packaged Commodities Compliance System',
    language: 'English',
    timeZone: 'Asia/Kolkata',
  },
  notifications: {
    email: true,
    complianceAlert: true,
    reportNotification: false,
  },
  security: {
    sessionTimeout: 30,
    twoFactor: false,
  },
  system: {
    theme: 'Light',
    autoRefresh: true,
  },
}

// ----------------------------------------------------------------------------
// Language / time-zone / timeout options used by the UI
// ----------------------------------------------------------------------------

export const LANGUAGE_OPTIONS = ['English', 'हिन्दी', 'தமிழ்', 'বাংলা', 'Français']

export const TIME_ZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: '(GMT+05:30) India Standard Time' },
  { value: 'Asia/Dubai', label: '(GMT+04:00) Gulf Standard Time' },
  { value: 'Asia/Kathmandu', label: '(GMT+05:45) Nepal Time' },
  { value: 'Asia/Dhaka', label: '(GMT+06:00) Bangladesh Standard Time' },
  { value: 'Asia/Singapore', label: '(GMT+08:00) Singapore Time' },
  { value: 'Etc/UTC', label: '(GMT+00:00) UTC' },
]

export const SESSION_TIMEOUT_OPTIONS = [10, 15, 30, 45, 60]

export const THEME_OPTIONS = ['Light', 'Dark']

// ----------------------------------------------------------------------------
// Persistence helpers (localStorage for now)
// ----------------------------------------------------------------------------

export function loadSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveToStorage(settings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage unavailable (private mode / quota) - keep settings in state only.
  }
}

export function clearStorage() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

// ----------------------------------------------------------------------------
// Future backend integration points (not used yet)
// ----------------------------------------------------------------------------

export async function fetchSettings() {
  return Promise.resolve(loadSettings())
}

export async function persistSettings(settings) {
  saveToStorage(settings)
  return Promise.resolve(settings)
}