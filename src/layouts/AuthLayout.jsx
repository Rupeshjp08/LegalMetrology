import { Outlet } from 'react-router-dom'
import { APP_NAME, MINISTRY_NAME } from '../utils/constants'
import ErrorBoundary from '../components/common/ErrorBoundary/ErrorBoundary'
import './AuthLayout.css'

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      {/* Decorative geometric shapes */}
      <span className="auth-layout__ring auth-layout__ring--1" aria-hidden="true" />
      <span className="auth-layout__ring auth-layout__ring--2" aria-hidden="true" />
      <span className="auth-layout__ring auth-layout__ring--3" aria-hidden="true" />
      <span className="auth-layout__dot-grid" aria-hidden="true" />

      <div className="auth-layout__brand">
        <img
          src="/emblem.svg"
          alt="National Emblem of India"
          className="auth-layout__emblem"
          width="56"
          height="56"
        />
        <p className="auth-layout__govt">GOVERNMENT OF INDIA</p>
        <p className="auth-layout__ministry">{MINISTRY_NAME}</p>
        <p className="auth-layout__app">{APP_NAME}</p>
      </div>

      <main className="auth-layout__main">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      <footer className="auth-layout__footer">
        <p>
          &copy; {new Date().getFullYear()} Government of India &mdash; {MINISTRY_NAME}. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
