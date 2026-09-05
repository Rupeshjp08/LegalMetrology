import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { classNames } from '../../../utils/classNames'
import { DEPARTMENT_NAME, MINISTRY_NAME, NAV_ITEMS } from '../../../utils/constants'
import Icon from '../../ui/Icon/Icon'
import './Header.css'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="header">
      {/* Government flag-inspired accent strip (not a national flag rendering) */}
      <div className="header__strip" aria-hidden="true">
        <span className="header__strip-lane header__strip-lane--saffron" />
        <span className="header__strip-lane" />
        <span className="header__strip-lane header__strip-lane--green" />
      </div>

      <div className="header__topbar">
        <div className="container header__topbar-inner">
          <p className="header__topbar-text">
            Portal for demonstrating compliance workflows — interface preview
          </p>
          <span className="header__topbar-actions">
            <span className="header__lang" aria-hidden="false">
              <Icon name="globe" size={16} />
              Hindi | English
            </span>
          </span>
        </div>
      </div>

      <div className="header__identity-block">
        <div className="container header__identity">
          <Link
            to="/"
            className="header__brand"
            aria-label={`${MINISTRY_NAME} — home`}
            onClick={closeMenu}
          >
            <img
              src="/emblem.svg"
              alt=""
              className="header__emblem"
              width="64"
              height="64"
            />
            <span className="header__titles">
              <span className="header__govt">GOVERNMENT OF INDIA</span>
              <span className="header__ministry">{MINISTRY_NAME}</span>
              <span className="header__department">
                {DEPARTMENT_NAME} · Legal Metrology &amp; Quality Assurance
              </span>
            </span>
          </Link>

          <div className="header__right">
            <span className="header__portal-name">Packaged Commodity Legal Metrology Compliance System</span>
            <button
              type="button"
              className="header__menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="primary-navigation"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} size={24} />
              <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            </button>
          </div>
        </div>
      </div>

      <nav
        id="primary-navigation"
        className={classNames('header__nav', menuOpen && 'is-open')}
        aria-label="Primary"
      >
        <div className="container">
          <ul className="header__nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.to} className="header__nav-item">
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    classNames('header__nav-link', isActive && 'is-active')
                  }
                  onClick={closeMenu}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  )
}