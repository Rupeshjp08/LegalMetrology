import { Outlet } from 'react-router-dom'
import { APP_NAME, MINISTRY_NAME } from '../utils/constants'
import ErrorBoundary from '../components/common/ErrorBoundary/ErrorBoundary'
import './AuthLayout.css'

/**
 * Minimal centered layout for authentication pages
 * (Login, Forgot Password, etc.).
 */
export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-layout__brand">
        <img
          src="/emblem.svg"
          alt="National Emblem of India"
          className="auth-layout__emblem"
          width="64"
          height="64"
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
          &copy; {new Date().getFullYear()} Government of India. All rights reserved.
        </p>
      </footer>
    </div>
  )
}