import { BrowserRouter } from 'react-router-dom'
import AppRoutesProvider from './routes/AppRoutes'

/**
 * Application root.
 * Routing is centralised in src/routes and decorated with the
 * AuthContext provider and lazy-loaded page code splitting.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppRoutesProvider />
    </BrowserRouter>
  )
}