import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header/Header'
import Footer from '../components/layout/Footer/Footer'
import ScrollToTop from '../components/layout/ScrollToTop'
import ErrorBoundary from '../components/common/ErrorBoundary/ErrorBoundary'

/**
 * Public-facing layout with the full government Header, main content
 * area and Footer. Shared by all public pages.
 */
export default function MainLayout() {
  return (
    <div className="app-shell">
      <ScrollToTop />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />
      <ErrorBoundary>
        <main id="main-content" className="main-content">
          <Outlet />
        </main>
      </ErrorBoundary>
      <Footer />
    </div>
  )
}