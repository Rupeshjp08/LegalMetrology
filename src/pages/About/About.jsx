import Card from '../../components/ui/Card/Card'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import { DEPARTMENT_NAME, GOVERNMENT_NAME, MINISTRY_NAME } from '../../utils/constants'
import './About.css'

const OBJECTIVES = [
  {
    title: 'Correct Quantity Assurance',
    description:
      'Verify that the net quantity of packaged commodities matches the declared quantity within statutory tolerance limits.',
  },
  {
    title: 'Standardised Inspection Workflow',
    description:
      'Digitise field inspections, test results and enforcement actions to reduce manual effort and improve accountability.',
  },
  {
    title: 'Consumer Protection',
    description:
      'Provide citizens a transparent channel to raise and track complaints about short-weight and misleading declarations.',
  },
  {
    title: 'Data-Driven Oversight',
    description:
      'Give State Legal Metrology departments consolidated analytics to prioritise checks across commodities and regions.',
  },
]

const LEGAL_FRAMEWORK = {
  act: 'Legal Metrology Act, 2009',
  rules: [
    'Legal Metrology (Packaged Commodities) Rules, 2011',
    'Legal Metrology (General) Rules, 2011',
    'Legal Metrology (Approval of Models) Rules, 2011',
  ],
}

export default function About() {
  return (
    <div className="container">
      <PageHeader
        overline={`${GOVERNMENT_NAME} · ${MINISTRY_NAME}`}
        title="About the System"
        description="Overview of the purpose, objectives and legal basis of the Packaged Commodity Legal Metrology Compliance System."
      />

      <section className="about-section" aria-label="About">
        <Card
          title="Purpose"
          subtitle="A single digital window for packaged commodity compliance."
        >
          <p className="about-copy">
            The system brings together manufacturers, packers, importers, field
            inspectors and consumers on one platform to administer the
            provisions of the Legal Metrology Act for packaged commodities.
            It enables verification of quantity declarations, scheduled
            inspections, transparent reporting and citizen grievance redressal.
          </p>
          <p className="about-copy">
            The application is being designed to operate under the{' '}
            {DEPARTMENT_NAME}, with technical support from designated State
            Legal Metrology departments.
          </p>
          <span className="about-badge">
            <StatusBadge status="in-development" label="Under development" />
          </span>
        </Card>

        <Card title="Objectives" className="about-section__card">
          <ul className="about-objectives">
            {OBJECTIVES.map((objective) => (
              <li key={objective.title} className="about-objectives__item">
                <h3 className="about-objectives__title">{objective.title}</h3>
                <p className="about-objectives__description">
                  {objective.description}
                </p>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Legal Framework" className="about-section__card">
          <p className="about-copy">
            This system is intended to be compliant with the following primary
            legislation and subsidiary rules (for planning purposes):
          </p>
          <ul className="about-list">
            <li className="about-list__item">
              <strong>{LEGAL_FRAMEWORK.act}</strong>
            </li>
            {LEGAL_FRAMEWORK.rules.map((rule) => (
              <li key={rule} className="about-list__item">
                {rule}
              </li>
            ))}
          </ul>
          <p className="about-note">
            <strong>Note:</strong> No compliance rules are implemented in this
            interface preview. Statutory content shown here is indicative only.
          </p>
        </Card>
      </section>
    </div>
  )
}