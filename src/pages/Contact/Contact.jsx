import { useState } from 'react'
import Button from '../../components/ui/Button/Button'
import Card from '../../components/ui/Card/Card'
import Icon from '../../components/ui/Icon/Icon'
import Input from '../../components/ui/Input/Input'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import { DEPARTMENT_NAME, GOVERNMENT_NAME, MINISTRY_NAME } from '../../utils/constants'
import './Contact.css'

const CONTACT_DETAILS = [
  {
    icon: 'phone',
    title: 'Department Helpline',
    lines: 'Toll-free: 1800-11-4000 (placeholder)\nMon–Fri, 09:00–17:30 IST',
  },
  {
    icon: 'mail',
    title: 'Email',
    lines: 'helpdesk-pclm@gov.in\n(placeholder address)',
  },
  {
    icon: 'home',
    title: 'Office Address',
    lines: `Legal Metrology Division\n${DEPARTMENT_NAME}\nKrishi Bhawan, New Delhi - 110001`,
  },
]

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="container">
      <PageHeader
        overline={`${GOVERNMENT_NAME} · ${MINISTRY_NAME}`}
        title="Contact & Help"
        description="Reach the department, or use the enquiry form below. The form is an interface placeholder and does not transmit data."
      />

      <div className="contact-grid">
        <Card
          title="Enquiry Form"
          subtitle="Fill in your details and message."
          className="contact-grid__form"
        >
          {submitted ? (
            <div className="contact__success" role="status">
              <Icon name="check-circle" size={40} />
              <p>
                Your enquiry has been noted. This is a demonstration form — no
                data was sent to any department.
              </p>
              <Button variant="secondary" onClick={() => setSubmitted(false)}>
                Send another enquiry
              </Button>
            </div>
          ) : (
            <form className="contact__form" onSubmit={handleSubmit}>
              <div className="contact__form-row">
                <Input label="Full Name" name="name" placeholder="Your name" required autoComplete="name" />
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="you@example.in"
                  required
                  autoComplete="email"
                />
              </div>
              <Input
                label="Subject"
                name="subject"
                placeholder="Nature of enquiry"
                required
              />
              <label className="contact__field" htmlFor="message">
                <span className="contact__label">
                  Message <span aria-hidden="true">*</span>
                </span>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  className="contact__textarea"
                  placeholder="Write your message…"
                  required
                />
              </label>
              <div className="contact__actions">
                <Button type="submit">Submit Enquiry</Button>
                <Button type="reset" variant="ghost" onClick={() => setSubmitted(false)}>
                  Clear
                </Button>
              </div>
            </form>
          )}
        </Card>

        <div className="contact-side">
          {CONTACT_DETAILS.map((detail) => (
            <Card key={detail.title} className="contact-side__card">
              <div className="contact-side__icon">
                <Icon name={detail.icon} size={22} />
              </div>
              <div>
                <h3 className="contact-side__title">{detail.title}</h3>
                <p className="contact-side__lines">
                  {detail.lines.split('\n').map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </p>
              </div>
            </Card>
          ))}
          <p className="contact-note">
            For statutory notices, refer to the department's official
            publication channels once the portal is launched.
          </p>
        </div>
      </div>
    </div>
  )
}