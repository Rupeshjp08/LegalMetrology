import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../constants'
import LoadingSpinner from '../components/feedback/LoadingSpinner/LoadingSpinner'

/**
 * Guards child routes so they can only be reached by an
 * authenticated (and optionally role-qualified) user.
 */
export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="protected-loading">
        <LoadingSpinner size="lg" label="Checking authentication" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  if (roles?.length && !roles.includes(user?.role)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return <Outlet />
}