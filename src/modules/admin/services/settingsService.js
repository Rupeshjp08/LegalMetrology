import { APP_NAME } from '../../../utils/constants'

export const STORAGE_KEY = 'pclmcs.adminSettings'

export const DEFAULT_SETTINGS = {
  general: {
    systemName: APP_NAME,
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

export const LANGUAGE_OPTIONS = ['English', 'हिन्दी', 'தமிழ்', 'বাংলা']

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

export function loadSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const stored = JSON.parse(raw)
    return {
      general: { ...DEFAULT_SETTINGS.general, ...(stored.general || {}) },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(stored.notifications || {}) },
      security: { ...DEFAULT_SETTINGS.security, ...(stored.security || {}) },
      system: { ...DEFAULT_SETTINGS.system, ...(stored.system || {}) },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage unavailable - keep settings in component state only.
  }
}

export function clearSettings() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}