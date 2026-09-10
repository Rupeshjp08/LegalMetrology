import {
  LayoutDashboard,
  ScrollText,
  FileText,
  QrCode,
  BarChart3,
  Settings,
  Bell,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import '../adminDashboard.css'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Scan History', icon: ScrollText, path: '/admin/history' },
  { label: 'Reports', icon: FileText, path: '/admin/reports' },
  { label: 'QR Verification', icon: QrCode, path: '/admin/qr-verification' },
  { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
]

function Sidebar() {
  const location = useLocation()

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <span className="admin-sidebar__logo">
          <ShieldCheck size={22} aria-hidden="true" />
        </span>
        <span className="admin-sidebar__brand-text">
          <strong>Legal Metrology</strong>
          <small>Compliance System</small>
        </span>
      </div>

      <nav className="admin-sidebar__nav" aria-label="Admin navigation">
        <ul className="admin-sidebar__list">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = item.path === location.pathname
            const className = `admin-sidebar__link ${
              active ? 'admin-sidebar__link--active' : ''
            }`

            return (
              <li key={item.label}>
                {item.path ? (
                  <Link
                    to={item.path}
                    className={className}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <a
                    href="#"
                    className={className}
                    onClick={(e) => e.preventDefault()}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{item.label}</span>
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="admin-sidebar__footer">
        <p>Legal Metrology (Packaged Commodities) Rules, 2011</p>
      </div>
    </aside>
  )
}

function Header() {
  return (
    <header className="admin-header">
      <div className="admin-header__titles">
        <h1 className="admin-header__ministry">
          Ministry of Consumer Affairs, Food &amp; Public Distribution
        </h1>
        <p className="admin-header__system">
          Packaged Commodities Compliance System
        </p>
      </div>

      <div className="admin-header__actions">
        <button
          type="button"
          className="admin-header__icon-btn"
          aria-label="Notifications"
        >
          <Bell size={20} aria-hidden="true" />
          <span className="admin-header__notif-dot" />
        </button>

        <div className="admin-header__profile">
          <span className="admin-header__avatar" aria-hidden="true">
            AS
          </span>
          <div className="admin-header__profile-meta">
            <strong>Admin</strong>
            <small>Super Admin</small>
          </div>
          <ChevronDown size={16} aria-hidden="true" />
        </div>
      </div>
    </header>
  )
}

function AdminLayout({ children }) {
  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-shell__main">
        <Header />
        <main className="admin-shell__content">{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout
