import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../ui/Button/Button'
import Icon from '../../ui/Icon/Icon'
import {
  APP_NAME,
  APP_SHORT_NAME,
  MINISTRY_NAME,
  DEPARTMENT_NAME,
  GOVERNMENT_NAME,
} from '../../../utils/constants'
import { ROUTES } from '../../../constants'
import './IntroOverlay.css'

const INTRO_SESSION_KEY = 'pclmcs.intro.seen'

function shouldShowIntro() {
  try {
    return sessionStorage.getItem(INTRO_SESSION_KEY) !== '1'
  } catch {
    return true
  }
}

const INTRO_FEATURES = [
  {
    icon: 'camera',
    title: 'Add Product Images',
    description: 'Upload, capture or scan packaged commodity labels.',
  },
  {
    icon: 'check-circle',
    title: 'Automatic Quality & Enhancement',
    description: 'Images are quality-checked, cropped and enhanced for accuracy.',
  },
  {
    icon: 'file',
    title: 'Text Extraction',
    description: 'Label text is read with OCR and prepared for compliance review.',
  },
  {
    icon: 'shield',
    title: 'Legal Metrology Compliance',
    description: 'Statutory checks on declaration, quantity and pricing information.',
  },
]

/**
 * Session-intro overlay shown once per browser session, before the
 * login page, explaining the purpose of the portal.
 */
export default function IntroOverlay() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(shouldShowIntro)

  const handleContinue = () => {
    try {
      sessionStorage.setItem(INTRO_SESSION_KEY, '1')
    } catch {
      // Ignore storage failures; the overlay still closes for this visit.
    }
    setOpen(false)
    navigate(ROUTES.LOGIN)
  }

  if (!open) return null

  return (
    <div className="intro-overlay" role="dialog" aria-modal="true" aria-labelledby="intro-overlay-title">
      <div className="intro-overlay__backdrop" aria-hidden="true" />
      <div className="intro-overlay__panel">
        <header className="intro-overlay__header">
          <img
            src="/emblem.svg"
            alt="National Emblem of India"
            className="intro-overlay__emblem"
            width="72"
            height="72"
          />
          <p className="intro-overlay__govt">{GOVERNMENT_NAME}</p>
          <p className="intro-overlay__ministry">{MINISTRY_NAME}</p>
          <p className="intro-overlay__dept">{DEPARTMENT_NAME}</p>
        </header>

        <main className="intro-overlay__body">
          <span className="intro-overlay__badge">{APP_SHORT_NAME}</span>
          <h1 id="intro-overlay-title" className="intro-overlay__title">
            {APP_NAME}
          </h1>
          <p className="intro-overlay__lead">
            A digital inspection tool for authorised officers to capture packaged commodity
            details and verify them against Legal Metrology rules.
          </p>

          <ul className="intro-overlay__features">
            {INTRO_FEATURES.map((feature) => (
              <li key={feature.title} className="intro-overlay__feature">
                <span className="intro-overlay__feature-icon">
                  <Icon name={feature.icon} size={20} />
                </span>
                <span className="intro-overlay__feature-text">
                  <strong>{feature.title}</strong>
                  <span>{feature.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </main>

        <footer className="intro-overlay__footer">
          <Button
            variant="primary"
            size="lg"
            icon="arrowRight"
            iconPosition="right"
            onClick={handleContinue}
          >
            Continue to Sign In
          </Button>
        </footer>
      </div>
    </div>
  )
}