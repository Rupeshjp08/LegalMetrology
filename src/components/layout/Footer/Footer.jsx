import { Link } from 'react-router-dom'
import { DEPARTMENT_NAME, GOVERNMENT_NAME, MINISTRY_NAME } from '../../../utils/constants'
import Icon from '../../ui/Icon/Icon'
import './Footer.css'

const DEPARTMENT_LINKS = [
  { label: 'About the Department', to: '/about' },
  { label: 'Legal Metrology Division', to: '/about' },
  { label: 'Compliance Dashboard', to: '/dashboard' },
]

const RESOURCE_LINKS = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Use', to: '/terms' },
  { label: 'Accessibility', to: '/accessibility' },
  { label: 'Help & Support', to: '/contact' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer__main">
        <div className="container footer__grid">
          <div className="footer__col footer__col--identity">
            <div className="footer__identity-heading">
              <img
                src="/emblem.svg"
                alt=""
                className="footer__emblem"
                width="48"
                height="48"
              />
              <div>
                <p className="footer__govt">{GOVERNMENT_NAME}</p>
                <p className="footer__ministry">{MINISTRY_NAME}</p>
              </div>
            </div>
            <p className="footer__about">
              Official portal of the Packaged Commodity Legal Metrology
              Compliance System. This interface preview demonstrates the
              compliance workflow for packaged commodities under the Legal
              Metrology framework.
            </p>
          </div>

          <div className="footer__col">
            <h2 className="footer__heading">{DEPARTMENT_NAME}</h2>
            <ul className="footer__links">
              {DEPARTMENT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__col">
            <h2 className="footer__heading">Resources</h2>
            <ul className="footer__links">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__col">
            <h2 className="footer__heading">Contact</h2>
            <address className="footer__contact">
              <p>
                Legal Metrology Division, Dept. of Consumer Affairs,
                Krishi Bhawan, New Delhi - 110001, India
              </p>
              <p className="footer__contact-row">
                <Icon name="mail" size={16} />
                <span>helpdesk-pclm@gov.in</span>
              </p>
              <p className="footer__contact-row">
                <Icon name="phone" size={16} />
                <span>Toll-free: 1800-11-4000 (placeholder)</span>
              </p>
            </address>
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p>
            &copy; {year} {GOVERNMENT_NAME} - {MINISTRY_NAME}. All rights reserved.
          </p>
          <p>Content on this portal is for demonstration and compliance workflow preview.</p>
        </div>
      </div>
    </footer>
  )
}