import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { classNames } from '../utils/classNames'
import ErrorBoundary from '../components/common/ErrorBoundary/ErrorBoundary'
import Icon from '../components/ui/Icon/Icon'
import './OfficerLayout.css'

const OFFICER_NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/scan', label: 'Scan Product', icon: 'camera' },
  { to: '/compliance', label: 'Compliance', icon: 'scale' },
  { to: '/inspection', label: 'Inspections', icon: 'upload' },
  { to: '/company-notifications', label: 'Company Notifications', icon: 'mail' },
  { to: '/company', label: 'Companies', icon: 'file' },
  { to: '/reports', label: 'Reports', icon: 'file-text' },
  { to: '/admin', label: 'Admin Dashboard', icon: 'shield' },
  { to: '/admin/history', label: 'Scan History', icon: 'history' },
  { to: '/admin/qr-verification', label: 'QR Verification', icon: 'qr' },
  { to: '/admin/analytics', label: 'Analytics', icon: 'chart' },
  { to: '/admin/settings', label: 'Settings', icon: 'settings' },
]

/**
 * Internal layout for officers/administrators with a left sidebar
 * navigation and a compact top bar.
 */
export default function OfficerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="officer-layout">
      <button
        type="button"
        className="officer-layout__sidebar-toggle"
        aria-expanded={sidebarOpen}
        aria-controls="officer-sidebar"
        onClick={() => setSidebarOpen((prev) => !prev)}
      >
        <Icon name={sidebarOpen ? 'close' : 'menu'} size={20} />
      </button>

      <aside
        id="officer-sidebar"
        className={classNames('officer-sidebar', sidebarOpen && 'is-open')}
      >
        <div className="officer-sidebar__brand">
          <img src="/emblem.svg" alt="" className="officer-sidebar__emblem" width="40" height="40" />
          <span className="officer-sidebar__name">
            Legal Metrology<br />Workspace
          </span>
        </div>
        <nav className="officer-sidebar__nav" aria-label="Officer menu">
          {OFFICER_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                classNames('officer-sidebar__link', isActive && 'is-active')
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="officer-sidebar__footer">
          <Link to="/" className="officer-sidebar__link">
            <Icon name="home" size={18} />
            <span>Public Portal</span>
          </Link>
        </div>
      </aside>

      <div className="officer-layout__main">
        <header className="officer-topbar">
          <div>
            <Link to="/" className="officer-topbar__brand">
              <img src="/emblem.svg" alt="" className="officer-topbar__emblem" width="28" height="28" />
              <span>Legal Metrology Workspace</span>
            </Link>
          </div>
          <span className="officer-topbar__user">
            <Icon name="user" size={18} />
            Officer
          </span>
        </header>

        <ErrorBoundary>
          <main className="officer-layout__content">
            <Outlet />
          </main>
        </ErrorBoundary>
      </div>
    </div>
  )
}