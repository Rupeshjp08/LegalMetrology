import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, Save, RotateCcw } from 'lucide-react'
import AdminLayout from '../admin/components/AdminLayout'
import {
  DEFAULT_SETTINGS,
  LANGUAGE_OPTIONS,
  TIME_ZONE_OPTIONS,
  SESSION_TIMEOUT_OPTIONS,
  THEME_OPTIONS,
  loadSettings,
  saveToStorage,
  clearStorage,
} from './settingsService'
import '../admin/adminDashboard.css'
import './settings.css'

const SUCCESS_MESSAGE = 'Settings saved successfully.'
const RESET_MESSAGE = 'Settings reset to defaults.'

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`settings-toggle ${checked ? 'settings-toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="settings-toggle__track">
        <span className="settings-toggle__thumb" />
      </span>
    </button>
  )
}

function SettingsRow({ label, hint, control }) {
  return (
    <div className="settings-row">
      <div className="settings-row__label">
        <span className="settings-row__title">{label}</span>
        {hint && <span className="settings-row__hint">{hint}</span>}
      </div>
      <div className="settings-row__control">{control}</div>
    </div>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <section className="dashboard-panel settings-section">
      <div className="dashboard-panel__header">
        <h2 className="dashboard-panel__title">{title}</h2>
        {subtitle && <span className="dashboard-panel__hint">{subtitle}</span>}
      </div>
      <div className="settings-section__body">{children}</div>
    </section>
  )
}

function Settings() {
  const [settings, setSettings] = useState(() => loadSettings())
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const update = (group, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [group]: { ...prev[group], [key]: value },
    }))
  }

  const handleSave = () => {
    saveToStorage(settings)
    showToast(SUCCESS_MESSAGE)
  }

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS)
    clearStorage()
    showToast(RESET_MESSAGE)
  }

  return (
    <AdminLayout>
      <div className="admin-page settings-page">
        <div className="admin-page__header">
          <div>
            <h1 className="admin-page__heading">Settings</h1>
            <p className="admin-page__subheading">
              Manage system preferences and configuration
            </p>
          </div>
        </div>

        {toast && (
          <div
            className={`settings-toast ${
              toast.type === 'success' ? 'settings-toast--success' : ''
            }`}
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>{toast.message}</span>
          </div>
        )}

        <div className="settings-grid">
          <Section title="General Settings" subtitle="Core system information">
            <SettingsRow
              label="System Name"
              control={
                <input
                  className="settings-input"
                  type="text"
                  value={settings.general.systemName}
                  onChange={(e) => update('general', 'systemName', e.target.value)}
                />
              }
            />
            <SettingsRow
              label="Language"
              control={
                <select
                  className="settings-input settings-select"
                  value={settings.general.language}
                  onChange={(e) => update('general', 'language', e.target.value)}
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              }
            />
            <SettingsRow
              label="Time Zone"
              control={
                <select
                  className="settings-input settings-select"
                  value={settings.general.timeZone}
                  onChange={(e) => update('general', 'timeZone', e.target.value)}
                >
                  {TIME_ZONE_OPTIONS.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              }
            />
          </Section>

          <Section title="Notification Settings" subtitle="How alerts are delivered">
            <SettingsRow
              label="Email Notifications"
              hint="Send scan updates by email"
              control={
                <Toggle
                  checked={settings.notifications.email}
                  onChange={(v) => update('notifications', 'email', v)}
                  label="Email Notifications"
                />
              }
            />
            <SettingsRow
              label="Compliance Alert"
              hint="Notify when violations are detected"
              control={
                <Toggle
                  checked={settings.notifications.complianceAlert}
                  onChange={(v) => update('notifications', 'complianceAlert', v)}
                  label="Compliance Alert"
                />
              }
            />
            <SettingsRow
              label="Report Notification"
              hint="Notify when a report is generated"
              control={
                <Toggle
                  checked={settings.notifications.reportNotification}
                  onChange={(v) => update('notifications', 'reportNotification', v)}
                  label="Report Notification"
                />
              }
            />
          </Section>

          <Section title="Security Settings" subtitle="Access and session controls">
            <SettingsRow
              label="Session Timeout"
              hint="Minutes of inactivity before sign-out"
              control={
                <select
                  className="settings-input settings-select"
                  value={settings.security.sessionTimeout}
                  onChange={(e) =>
                    update('security', 'sessionTimeout', Number(e.target.value))
                  }
                >
                  {SESSION_TIMEOUT_OPTIONS.map((mins) => (
                    <option key={mins} value={mins}>
                      {mins} minutes
                    </option>
                  ))}
                </select>
              }
            />
            <SettingsRow
              label="Two-Factor Authentication"
              hint="Require a verification code at sign-in"
              control={
                <Toggle
                  checked={settings.security.twoFactor}
                  onChange={(v) => update('security', 'twoFactor', v)}
                  label="Two-Factor Authentication"
                />
              }
            />
          </Section>

          <Section title="System Preferences" subtitle="Interface and refresh behaviour">
            <SettingsRow
              label="Theme"
              hint="Appearance preference"
              control={
                <select
                  className="settings-input settings-select"
                  value={settings.system.theme}
                  onChange={(e) => update('system', 'theme', e.target.value)}
                >
                  {THEME_OPTIONS.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
              }
            />
            <SettingsRow
              label="Auto Refresh"
              hint="Automatically refresh dashboard data"
              control={
                <Toggle
                  checked={settings.system.autoRefresh}
                  onChange={(v) => update('system', 'autoRefresh', v)}
                  label="Auto Refresh"
                />
              }
            />
          </Section>
        </div>

        <div className="settings-actions">
          <button
            type="button"
            className="settings-btn settings-btn--primary"
            onClick={handleSave}
          >
            <Save size={15} aria-hidden="true" />
            Save Changes
          </button>
          <button
            type="button"
            className="settings-btn settings-btn--ghost"
            onClick={handleReset}
          >
            <RotateCcw size={15} aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}

export default Settings