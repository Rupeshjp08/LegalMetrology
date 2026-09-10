import { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AuthLayout from '../layouts/AuthLayout'
import OfficerLayout from '../layouts/OfficerLayout'
import ProtectedRoute from './ProtectedRoute'
import { routeDefinitions } from './routeConfig'
import { AuthProvider } from '../context/AuthContext'
import LoadingSpinner from '../components/feedback/LoadingSpinner/LoadingSpinner'

function RouteFallback() {
  return (
    <div className="route-fallback">
      <LoadingSpinner size="lg" label="Loading page" />
    </div>
  )
}

/**
 * Registers every route from the centralised routeConfig.
 * Pages are code-split (lazy) and wrapped in the configured layout.
 */
function AppRoutes() {
  const mainRoutes = routeDefinitions.filter((r) => r.layout === 'main')
  const authRoutes = routeDefinitions.filter((r) => r.layout === 'auth')
  const officerRoutes = routeDefinitions.filter((r) => r.layout === 'officer')

  return (
    <Routes>
      <Route element={<MainLayout />}>
        {mainRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Route>

      <Route element={<AuthLayout />}>
        {authRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<OfficerLayout />}>
          {officerRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Route>
    </Routes>
  )
}

/**
 * Root router wrapper. Provides AuthContext and a Suspense fallback
 * for all lazily loaded pages.
 */
export default function AppRoutesProvider() {
  return (
    <AuthProvider>
      <Suspense fallback={<RouteFallback />}>
        <AppRoutes />
      </Suspense>
    </AuthProvider>
  )
}