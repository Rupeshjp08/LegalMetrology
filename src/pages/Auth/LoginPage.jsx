import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { saveUser, saveToken } from '../../services/storage/authStorage'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import Icon from '../../components/ui/Icon/Icon'
import { ROUTES, USER_ROLES } from '../../constants'
import './LoginPage.css'

const ROLES = [
  {
    id: USER_ROLES.LEGAL_METROLOGY_OFFICER,
    label: 'Legal Inspector',
    icon: 'scale',
    description: 'Field inspection & enforcement',
  },
  {
    id: USER_ROLES.REGISTERED_COMPANY,
    label: 'Manufacturer',
    icon: 'shield',
    description: 'Product registration & compliance',
  },
  {
    id: USER_ROLES.DEPARTMENT_ADMINISTRATOR,
    label: 'Admin',
    icon: 'settings',
    description: 'System administration & oversight',
  },
]

const MOCK_USERS = {
  [USER_ROLES.LEGAL_METROLOGY_OFFICER]: {
    id: 'OFF-2026-001',
    name: 'Rupesh Kumar',
    email: 'officer@metrology.gov.in',
    role: USER_ROLES.LEGAL_METROLOGY_OFFICER,
    jurisdiction: 'Salem Division',
  },
  [USER_ROLES.REGISTERED_COMPANY]: {
    id: 'MFR-2026-001',
    name: 'Arun Mehta',
    email: 'contact@aquapure.co.in',
    role: USER_ROLES.REGISTERED_COMPANY,
    organization: 'AquaPure Beverages Pvt. Ltd.',
  },
  [USER_ROLES.DEPARTMENT_ADMINISTRATOR]: {
    id: 'ADM-2026-001',
    name: 'Sunita Verma',
    email: 'admin@metrology.gov.in',
    role: USER_ROLES.DEPARTMENT_ADMINISTRATOR,
  },
}

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.LEGAL_METROLOGY_OFFICER)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const next = {}
    if (!email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address'
    if (!password) next.password = 'Password is required'
    else if (password.length < 6) next.password = 'Minimum 6 characters required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 600))

      const user = { ...MOCK_USERS[selectedRole], email }
      const token = 'mock-token-' + Date.now()

      saveUser(user)
      saveToken(token)
      await login({ user, token })

      navigate(ROUTES.DASHBOARD)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="lp" onSubmit={handleSubmit} noValidate>
      <div className="lp__head">
        <h1 className="lp__title">Welcome Back</h1>
        <p className="lp__subtitle">Sign in to the Legal Metrology Compliance Portal</p>
      </div>

      <fieldset className="lp__roles" aria-label="Select your role">
        <legend className="sr-only">Select your role</legend>
        <div className="lp__role-grid">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              className={`lp__role ${selectedRole === role.id ? 'lp__role--active' : ''}`}
              onClick={() => setSelectedRole(role.id)}
              aria-pressed={selectedRole === role.id}
            >
              <span className="lp__role-icon">
                <Icon name={role.icon} size={22} />
              </span>
              <span className="lp__role-label">{role.label}</span>
              <span className="lp__role-desc">{role.description}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="lp__fields">
        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="officer@metrology.gov.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />
      </div>

      <div className="lp__options">
        <label className="lp__remember">
          <input type="checkbox" className="lp__checkbox" />
          <span>Remember me</span>
        </label>
        <button type="button" className="lp__forgot">Forgot password?</button>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        icon="arrowRight"
        iconPosition="right"
        className="lp__submit"
      >
        Sign In
      </Button>

      <p className="lp__alt">
        Don&apos;t have an account?{' '}
        <Link to={ROUTES.SIGNUP} className="lp__link">Create one</Link>
      </p>
    </form>
  )
}
