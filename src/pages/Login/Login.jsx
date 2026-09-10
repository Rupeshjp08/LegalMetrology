// src/pages/Login/Login.jsx
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button/Button'
import Card from '../../components/ui/Card/Card'
import { ROUTES } from '../../constants'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleDevLogin = async (role = 'officer') => {
    const mockUser = {
      id: 'OFFICER-2026-01',
      name: 'Rupesh (Legal Metrology Officer)',
      email: 'officer@metrology.gov.in',
      role,
      jurisdiction: 'Salem Division',
    }

    // Call login from AuthContext
    await login({ user: mockUser, token: 'mock-auth-token-dev' })

    // Navigate to Dashboard
    navigate(ROUTES.DASHBOARD || '/dashboard')
  }

  return (
    <div style={{ maxWidth: '420px', margin: '4rem auto', padding: '1rem' }}>
      <Card title="Legal Metrology Portal Sign-In">
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.4 }}>
          Officer authentication for packaged commodity inspection and statutory enforcement.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Button
            variant="primary"
            size="large"
            onClick={() => handleDevLogin('officer')}
            style={{ width: '100%' }}
          >
            Sign In as Inspection Officer
          </Button>

          <Button
            variant="secondary"
            size="small"
            onClick={() => handleDevLogin('admin')}
            style={{ width: '100%' }}
          >
            Sign In as Administrator
          </Button>
        </div>
      </Card>
    </div>
  )
}