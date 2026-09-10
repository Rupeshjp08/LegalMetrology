/* eslint-disable react/only-export-components */
import { lazy } from 'react'
import { ROUTES } from '../constants'

const Home = lazy(() => import('../pages/Home/Home'))
const LoginPlaceholder = lazy(() => import('../pages/Login/Login'))
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'))
const ScanProduct = lazy(() => import('../pages/ScanProduct/ScanProduct'))
const Compliance = lazy(() => import('../pages/Compliance/Compliance'))
const Inspection = lazy(() => import('../pages/Inspection/Inspection'))
const Company = lazy(() => import('../pages/Company/Company'))
const Reports = lazy(() => import('../pages/Reports/Reports'))
const Admin = lazy(() => import('../pages/Admin/Admin'))
const ScanHistory = lazy(() => import('../pages/ScanHistory/ScanHistory'))
const QRVerification = lazy(() => import('../pages/QRVerification/QRVerification'))
const Analytics = lazy(() => import('../pages/Analytics/Analytics'))
const Settings = lazy(() => import('../pages/Settings/Settings'))
const CompanyNotifications = lazy(() => import('../pages/CompanyNotifications/CompanyNotifications'))
const CompanyNotificationDetails = lazy(() => import('../pages/CompanyNotificationDetails/CompanyNotificationDetails'))
const CompanyResponse = lazy(() => import('../pages/CompanyResponse/CompanyResponse'))
const Reinspection = lazy(() => import('../pages/Reinspection/Reinspection'))
const About = lazy(() => import('../pages/About/About'))
const Contact = lazy(() => import('../pages/Contact/Contact'))
const Info = lazy(() => import('../pages/Info/Info'))
const NotFound = lazy(() => import('../pages/NotFound/NotFound'))

/**
 * Centralised route metadata.
 *
 * `requiresAuth` gates the route behind ProtectedRoute.
 * `roles` (optional) sets the required roles when present.
 * `layout` selects which layout shell wraps the page.
 */
export const routeDefinitions = [
  {
    path: ROUTES.HOME,
    element: <Home />,
    layout: 'main',
    name: 'Home',
  },
  {
    path: ROUTES.LOGIN,
    element: <LoginPlaceholder />,
    layout: 'auth',
    name: 'Login',
  },
  {
    path: ROUTES.DASHBOARD,
    element: <Dashboard />,
    layout: 'officer',
    requiresAuth: true,
    name: 'Dashboard',
  },
  {
    path: ROUTES.SCAN,
    element: <ScanProduct />,
    layout: 'officer',
    requiresAuth: true,
    name: 'Scan Product',
  },
  {
    path: ROUTES.COMPLIANCE,
    element: <Compliance />,
    layout: 'officer',
    requiresAuth: true,
    name: 'Compliance',
  },
  {
    path: ROUTES.INSPECTION,
    element: <Inspection />,
    layout: 'officer',
    requiresAuth: true,
    name: 'Inspection',
  },
  {
    path: ROUTES.COMPANY,
    element: <Company />,
    layout: 'officer',
    requiresAuth: true,
    name: 'Companies',
  },
  {
    path: ROUTES.REPORTS,
    element: <Reports />,
    layout: 'officer',
    requiresAuth: true,
    name: 'Reports',
  },
  {
    path: ROUTES.ADMIN,
    element: <Admin />,
    layout: 'officer',
    requiresAuth: true,
    name: 'Admin',
  },
  {
    path: ROUTES.SCAN_HISTORY,
    element: <ScanHistory />,
    layout: 'officer',
    requiresAuth: true,
    name: 'Scan History',
  },
  {
    path: ROUTES.QR_VERIFICATION,
    element: <QRVerification />,
    layout: 'officer',
    requiresAuth: true,
    name: 'QR Verification',
  },
  {
    path: ROUTES.ANALYTICS,
    element: <Analytics />,
    layout: 'officer',
    requiresAuth: true,
    name: 'Analytics',
  },
  {
    path: ROUTES.SETTINGS,
    element: <Settings />,
    layout: 'officer',
    requiresAuth: true,
    name: 'Settings',
  },
  {
    path: ROUTES.COMPANY_NOTIFICATIONS,
    element: <CompanyNotifications />,
    layout: 'officer',
    requiresAuth: true,
    name: 'Company Notifications',
  },
  {
    path: `${ROUTES.COMPANY_NOTIFICATIONS}/:id`,
    element: <CompanyNotificationDetails />,
    layout: 'officer',
    requiresAuth: true,
    name: 'Notification Details',
  },
  {
    path: `/company-response/:id`,
    element: <CompanyResponse />,
    layout: 'officer',
    requiresAuth: true,
    name: 'Company Response',
  },
  {
    path: `/re-inspection/:id`,
    element: <Reinspection />,
    layout: 'officer',
    requiresAuth: true,
    name: 'Re-inspection',
  },
  {
    path: ROUTES.ABOUT,
    element: <About />,
    layout: 'main',
    name: 'About',
  },
  {
    path: ROUTES.CONTACT,
    element: <Contact />,
    layout: 'main',
    name: 'Contact',
  },
  {
    path: ROUTES.PRIVACY,
    element: <Info pageKey="privacy" />,
    layout: 'main',
    name: 'Privacy Policy',
  },
  {
    path: ROUTES.TERMS,
    element: <Info pageKey="terms" />,
    layout: 'main',
    name: 'Terms of Use',
  },
  {
    path: ROUTES.ACCESSIBILITY,
    element: <Info pageKey="accessibility" />,
    layout: 'main',
    name: 'Accessibility',
  },
  {
    path: '*',
    element: <NotFound />,
    layout: 'main',
    name: 'Not Found',
  },
]

export default routeDefinitions