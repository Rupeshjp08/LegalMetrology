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
const NoticeGenerator = lazy(() => import('../pages/Notices/NoticeGenerator'))
const Admin = lazy(() => import('../pages/Admin/Admin'))
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
    path: ROUTES.NOTICES,
    element: <NoticeGenerator />,
    layout: 'officer',
    requiresAuth: true,
    name: 'Statutory Notices',
  },
  {
    path: ROUTES.ADMIN,
    element: <Admin />,
    layout: 'officer',
    requiresAuth: true,
    name: 'Admin',
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