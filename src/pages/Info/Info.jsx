import PageHeader from '../../components/ui/PageHeader/PageHeader'
import { GOVERNMENT_NAME, MINISTRY_NAME } from '../../utils/constants'
import './Info.css'

const INFO_CONTENT = {
  privacy: {
    overline: 'Legal · ' + MINISTRY_NAME,
    title: 'Privacy Policy',
    lead: 'How the portal intends to collect, store and use information.',
    sections: [
      {
        heading: '1. Information We Collect',
        paragraphs: [
          'This is an interface preview. In its planned production form, the portal would collect entity registration details, compliance documents and case-related information from users.',
          'Sensitive personal information will only be processed in line with applicable law and with explicit consent where required.',
        ],
      },
      {
        heading: '2. Use of Information',
        paragraphs: [
          'Collected information will be used solely for administering legal metrology functions, generation of statutory reports and responding to enquiries.',
          'Information will not be disclosed to third parties except where disclosure is required by law or by a competent authority.',
        ],
      },
      {
        heading: '3. Data Retention & Security',
        paragraphs: [
          'Records will be retained for the statutory retention period and protected through access controls, audit trails and encryption in transit.',
          'Users are advised not to submit confidential information through any pilot interface.',
        ],
      },
    ],
  },
  terms: {
    overline: 'Legal · ' + MINISTRY_NAME,
    title: 'Terms of Use',
    lead: 'Conditions for accessing and using the portal.',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        paragraphs: [
          'By accessing this portal you agree to use it lawfully and only for legitimate purposes connected to packaged commodity compliance.',
          'Access to content does not guarantee legal validity of any statement made on the portal during the preview phase.',
        ],
      },
      {
        heading: '2. Accuracy of Information',
        paragraphs: [
          'The department makes reasonable efforts to keep the portal current, however statutory content, contact details and links may change.',
          'Users must verify the latest rules, notifications and forms on official statutory publications.',
        ],
      },
      {
        heading: '3. Limitation of Liability',
        paragraphs: [
          'The Government of India is not liable for any loss arising from reliance on this preview interface. Use of the portal is at the user\u2019s own risk.',
        ],
      },
    ],
  },
  accessibility: {
    overline: 'Legal · ' + MINISTRY_NAME,
    title: 'Accessibility Statement',
    lead: 'Commitment to accessible digital services for all citizens.',
    sections: [
      {
        heading: '1. Standards',
        paragraphs: [
          'The portal is designed with accessibility in mind, including keyboard navigation, focus indicators, semantic landmarks and adequate colour contrast.',
          'Layouts are responsive across desktop, tablet and mobile, and respect reduced-motion preferences.',
        ],
      },
      {
        heading: '2. Feedback',
        paragraphs: [
          'If you encounter a barrier while using the portal, please contact the help desk with a description of the issue and the page involved.',
          'Feedback submitted during the preview helps the department improve usability before production launch.',
        ],
      },
    ],
  },
}

export default function Info({ pageKey }) {
  const content = INFO_CONTENT[pageKey]

  if (!content) return null

  return (
    <div className="container">
      <div className="info-page">
        <PageHeader overline={content.overline} title={content.title} description={content.lead} />
        <div className="info-page__body">
          {content.sections.map((section) => (
            <section key={section.heading} className="info-section">
              <h2 className="info-section__heading">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="info-section__paragraph">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
          <p className="info-page__footnote">
            {GOVERNMENT_NAME} · {MINISTRY_NAME}
          </p>
        </div>
      </div>
    </div>
  )
}