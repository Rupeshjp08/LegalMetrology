import { useEffect, useState } from 'react'
import Card from '../../components/ui/Card/Card'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Button from '../../components/ui/Button/Button'
import Icon from '../../components/ui/Icon/Icon'
import {
  loadSettings,
  saveSettings,
  clearSettings,
  DEFAULT_SETTINGS,
  LANGUAGE_OPTIONS,
  TIME_ZONE_OPTIONS,
  SESSION_TIMEOUT_OPTIONS,
  THEME_OPTIONS,
} from '../../modules/admin/services/settingsService'
import '../../modules/admin/admin.css'

function Toggle({ checked, onChange, label }) {
  return (
    <label className="m5-toggle">
      <input
        type="checkbox"
        className="m5-toggle__input"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
        role="switch"
      />
      <span className="m5-toggle__track" aria-hidden="true" />
    </label>
  )
}

function SettingRow({ label, hint, control }) {
  return (
    <div className="m5-settings-row">
      <div className="m5-settings-row__text">
        <p className="m5-settings-row__label">{label}</p>
        {hint && <p className="m5-settings-row__hint">{hint}</p>}
      </div>
      <div className="m5-settings-row__control">{control}</div>
    </div>
  )
}

export default function Settings() {
  const [settings, setSettings] = useState(() => loadSettings())
  const [savedNote, setSavedNote] = useState(false)

  useEffect(() => {
    if (!savedNote) return undefined
    const timer = window.setTimeout(() => setSavedNote(false), 3000)
    return () => window.clearTimeout(timer)
  }, [savedNote])

  const updateSection = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }))
  }

  const handleSave = () => {
    saveSettings(settings)
    setSavedNote(true)
  }

  const handleReset = () => {
    clearSettings()
    setSettings(DEFAULT_SETTINGS)
    setSavedNote(false)
  }

  return (
    <div className="m5-page">
      <PageHeader
        overline="PCLMCS · Officer Workspace"
        title="Settings"
        description="Configure how the compliance system behaves in this workspace."
      />

      <div className="m5-settings-form">
        <Card title="General" subtitle="Workspace identity and regional preferences">
          <div className="m5-settings-section">
            <SettingRow
              label="System name"
              hint="Identifier shown on generated documents"
              control={
                <input
                  type="text"
                  className="m5-input"
                  defaultValue={settings.general.systemName}
                  onBlur={(event) =>
                    updateSection('general', 'systemName', event.target.value)
                  }
                  style={{ minWidth: 260 }}
                />
              }
            />
            <SettingRow
              label="Default language"
              control={
                <select
                  className="m5-select"
                  value={settings.general.language}
                  onChange={(event) => updateSection('general', 'language', event.target.value)}
                >
                  {LANGUAGE_OPTIONS.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </select>
              }
            />
            <SettingRow
              label="Time zone"
              control={
                <select
                  className="m5-select"
                  value={settings.general.timeZone}
                  onChange={(event) => updateSection('general', 'timeZone', event.target.value)}
                >
                  {TIME_ZONE_OPTIONS.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              }
            />
          </div>
        </Card>

        <Card title="Notifications" subtitle="Alerts for compliance activity">
          <div className="m5-settings-section">
            <SettingRow
              label="Email notifications"
              hint="Receive system emails for compliance events"
              control={
                <Toggle
                  checked={settings.notifications.email}
                  onChange={(value) => updateSection('notifications', 'email', value)}
                  label="Email notifications"
                />
              }
            />
            <SettingRow
              label="Compliance alerts"
              hint="Get notified when a scan flags a potential violation"
              control={
                <Toggle
                  checked={settings.notifications.complianceAlert}
                  onChange={(value) =>
                    updateSection('notifications', 'complianceAlert', value)
                  }
                  label="Compliance alerts"
                />
              }
            />
            <SettingRow
              label="Report notifications"
              hint="Notify when a compliance report is generated"
              control={
                <Toggle
                  checked={settings.notifications.reportNotification}
                  onChange={(value) =>
                    updateSection('notifications', 'reportNotification', value)
                  }
                  label="Report notifications"
                />
              }
            />
          </div>
        </Card>

        <Card title="Security" subtitle="Session and access safeguards">
          <div className="m5-settings-section">
            <SettingRow
              label="Session timeout"
              hint="Idle time in minutes before the workspace locks"
              control={
                <select
                  className="m5-select"
                  value={settings.security.sessionTimeout}
                  onChange={(event) =>
                    updateSection(
                      'security',
                      'sessionTimeout',
                      Number(event.target.value),
                    )
                  }
                >
                  {SESSION_TIMEOUT_OPTIONS.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} minutes
                    </option>
                  ))}
                </select>
              }
            />
            <SettingRow
              label="Two-factor authentication"
              hint="Require a verification code at sign-in"
              control={
                <Toggle
                  checked={settings.security.twoFactor}
                  onChange={(value) => updateSection('security', 'twoFactor', value)}
                  label="Two-factor authentication"
                />
              }
            />
          </div>
        </Card>

        <Card title="System" subtitle="Workspace appearance and refresh behaviour">
          <div className="m5-settings-section">
            <SettingRow
              label="Theme"
              control={
                <select
                  className="m5-select"
                  value={settings.system.theme}
                  onChange={(event) => updateSection('system', 'theme', event.target.value)}
                >
                  {THEME_OPTIONS.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
              }
            />
            <SettingRow
              label="Auto-refresh"
              hint="Reload inspection data when the records change"
              control={
                <Toggle
                  checked={settings.system.autoRefresh}
                  onChange={(value) => updateSection('system', 'autoRefresh', value)}
                  label="Auto-refresh"
                />
              }
            />
          </div>
        </Card>

        <div className="m5-settings-actions">
          <Button variant="primary" icon="check-circle" onClick={handleSave}>
            Save Settings
          </Button>
          <Button variant="outline" icon="refresh" onClick={handleReset}>
            Reset to Defaults
          </Button>
          {savedNote && (
            <span className="m5-saved-note">
              <Icon name="check-circle" size={16} />
              Settings saved.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}