import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { saveUser, saveToken } from '../../services/storage/authStorage'
import Button from '../../components/ui/Button/Button'
import Input from '../../components/ui/Input/Input'
import Icon from '../../components/ui/Icon/Icon'
import { ROUTES, USER_ROLES } from '../../constants'
import './SignupPage.css'

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

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.LEGAL_METROLOGY_OFFICER)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    organization: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const next = {}
    if (!form.fullName.trim()) next.fullName = 'Full name is required'
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email'
    if (!form.organization.trim()) next.organization = 'Organisation name is required'
    if (!form.password) next.password = 'Password is required'
    else if (form.password.length < 6) next.password = 'Minimum 6 characters'
    if (!form.confirmPassword) next.confirmPassword = 'Please confirm your password'
    else if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 800))

      const rolePrefix = {
        [USER_ROLES.LEGAL_METROLOGY_OFFICER]: 'OFF',
        [USER_ROLES.REGISTERED_COMPANY]: 'MFR',
        [USER_ROLES.DEPARTMENT_ADMINISTRATOR]: 'ADM',
      }

      const user = {
        id: `${rolePrefix[selectedRole]}-${Date.now()}`,
        name: form.fullName,
        email: form.email,
        role: selectedRole,
        organization: form.organization,
      }
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
    <form className="sp" onSubmit={handleSubmit} noValidate>
      <div className="sp__head">
        <h1 className="sp__title">Create Account</h1>
        <p className="sp__subtitle">Register for the Legal Metrology Compliance Portal</p>
      </div>

      <fieldset className="sp__roles" aria-label="Select your role">
        <legend className="sr-only">Select your role</legend>
        <div className="sp__role-grid">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              className={`sp__role ${selectedRole === role.id ? 'sp__role--active' : ''}`}
              onClick={() => setSelectedRole(role.id)}
              aria-pressed={selectedRole === role.id}
            >
              <span className="sp__role-icon">
                <Icon name={role.icon} size={20} />
              </span>
              <span className="sp__role-label">{role.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="sp__fields">
        <Input
          label="Full Name"
          name="fullName"
          type="text"
          placeholder="Enter your full name"
          value={form.fullName}
          onChange={update('fullName')}
          error={errors.fullName}
          required
        />
        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="name@organisation.gov.in"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
          required
        />
        <Input
          label="Organisation"
          name="organization"
          type="text"
          placeholder="Department or company name"
          value={form.organization}
          onChange={update('organization')}
          error={errors.organization}
          required
        />
        <div className="sp__field-row">
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Min. 6 characters"
            value={form.password}
            onChange={update('password')}
            error={errors.password}
            required
          />
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            error={errors.confirmPassword}
            required
          />
        </div>
      </div>

      <label className="sp__terms">
        <input type="checkbox" className="sp__checkbox" required />
        <span>
          I agree to the{' '}
          <Link to={ROUTES.TERMS} className="sp__link">Terms of Use</Link>
          {' '}and{' '}
          <Link to={ROUTES.PRIVACY} className="sp__link">Privacy Policy</Link>
        </span>
      </label>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        icon="arrowRight"
        iconPosition="right"
        className="sp__submit"
      >
        Create Account
      </Button>

      <p className="sp__alt">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="sp__link">Sign In</Link>
      </p>
    </form>
  )
}
