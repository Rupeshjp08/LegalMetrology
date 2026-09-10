import Button from '../../components/ui/Button/Button'
import Card from '../../components/ui/Card/Card'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import { APP_NAME, MODULE_CARDS } from '../../utils/constants'
import './Home.css'

const PORTAL_STEPS = [
  {
    step: '01',
    title: 'Onboard & Register',
    description:
      'Manufacturers, packers and importers register their legal and product information with the State Legal Metrology department.',
  },
  {
    step: '02',
    title: 'Verify Declarations',
    description:
      'Packaged commodity declarations such as net quantity, maximum permissible error and label norms are verified digitally.',
  },
  {
    step: '03',
    title: 'Inspect & Enforce',
    description:
      'Field inspections, test reports and enforcement actions are tracked with a complete audit trail for transparency.',
  },
]

export default function Home() {
  return (
    <div className="container">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__badge">
          <StatusBadge status="in-development" label="Portal Preview" />
          <span className="hero__badge-note">Initial design-system release</span>
        </div>
        <h1 id="hero-title" className="hero__title">
          {APP_NAME}
        </h1>
        <p className="hero__lead">
          A digital compliance platform to verify packaged commodity
          declarations, streamline field inspections and safeguard consumer
          rights on correct quantity disclosure — under the Legal Metrology
          framework of India.
        </p>
        <div className="hero__actions">
          <Button to="/dashboard" icon="arrowRight" iconPosition="right">
            View Compliance Dashboard
          </Button>
          <Button to="/about" variant="outline">
            Know more about this system
          </Button>
        </div>
      </section>

      <section className="notice" aria-label="Important information">
        <p>
          <strong>Advisory:</strong> This portal is an interface preview. Compliance
          features, modules and forms shown here are under development and will be
          published after statutory approvals.
        </p>
      </section>

      <section aria-labelledby="modules-title" className="home-section">
        <div className="home-section__heading">
          <h2 id="modules-title" className="home-section__title">
            Compliance Modules
          </h2>
          <p className="home-section__subtitle">
            Planned services for the packaged commodity supply chain.
          </p>
        </div>
        <div className="module-grid">
          {MODULE_CARDS.map((module) => (
            <Card key={module.title} title={module.title} meta={<StatusBadge status={module.status} />}>
              <p className="module-grid__description">{module.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="process-title" className="home-section">
        <div className="home-section__heading">
          <h2 id="process-title" className="home-section__title">
            How the Portal Works
          </h2>
          <p className="home-section__subtitle">
            A simple three-stage compliance workflow.
          </p>
        </div>
        <ol className="steps">
          {PORTAL_STEPS.map((item) => (
            <li key={item.step} className="steps__item">
              <span className="steps__number" aria-hidden="true">
                {item.step}
              </span>
              <div>
                <h3 className="steps__title">{item.title}</h3>
                <p className="steps__description">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="citizen-title" className="home-section">
        <div className="home-section__heading">
          <h2 id="citizen-title" className="home-section__title">
            For Citizens
          </h2>
          <p className="home-section__subtitle">
            Consumer-focused services planned under this system.
          </p>
        </div>
        <div className="citizen-cards">
          <Card title="Check a Complaint Status">
            <p className="module-grid__description">
              Track the status of a filed legal metrology complaint using your
              reference number.
            </p>
          </Card>
          <Card title="Report Short-Weight Issue">
            <p className="module-grid__description">
              Inform the department about suspected short-fill or
              mislabelling in packaged commodities near you.
            </p>
          </Card>
          <Card title="Public Notices">
            <p className="module-grid__description">
              Access advisories, circulars and statutory notifications related
              to packaged commodity compliance.
            </p>
          </Card>
        </div>
      </section>
    </div>
  )
}