import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import Alert from '../../components/feedback/Alert/Alert'
import Button from '../../components/ui/Button/Button'
import Card from '../../components/ui/Card/Card'
import EmptyState from '../../components/feedback/EmptyState/EmptyState'
import ErrorMessage from '../../components/feedback/ErrorMessage/ErrorMessage'
import Input from '../../components/ui/Input/Input'
import LoadingSpinner from '../../components/feedback/LoadingSpinner/LoadingSpinner'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import Textarea from '../../components/forms/Textarea/Textarea'
import {
  getNotification,
  submitResponse,
  STATUS_META,
  useEnforcementData,
  formatDate,
  RESPONSE_TYPE_OPTIONS,
  RESPONSE_TYPE_LABELS,
} from '../../modules/enforcement'
import { classNames } from '../../utils/classNames'
import './CompanyResponse.css'

function validate(values) {
  const errors = {}
  if (!values.type) {
    errors.type = 'Please select a response type.'
  }
  if (!values.message.trim()) {
    errors.message = 'Please provide a response message.'
  } else if (values.message.trim().length < 10) {
    errors.message = 'Response message must be at least 10 characters.'
  }
  if (!values.date) {
    errors.date = 'Please select the response date.'
  } else {
    const today = new Date().toISOString().slice(0, 10)
    if (values.date > today) {
      errors.date = 'Response date cannot be in the future.'
    }
  }
  return errors
}

export default function CompanyResponse() {
  const { id } = useParams()
  const load = useCallback(() => getNotification(id), [id])
  const { data: record, loading, error } = useEnforcementData(load)

  const existing = record?.response
  const [values, setValues] = useState(() => ({
    type: existing?.type || '',
    message: existing?.message || '',
    date: existing?.date || '',
  }))
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    window.setTimeout(() => {
      submitResponse(record.id, values)
      setSubmitting(false)
      setSuccess(true)
    }, 700)
  }

  if (loading) {
    return (
      <div className="container crsp-state">
        <LoadingSpinner size="lg" label="Loading notification" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <ErrorMessage
          title="Could not load notification"
          message={error.message}
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  if (!record) {
    return (
      <div className="container">
        <EmptyState
          icon="alert"
          title="Notification not found"
          description={`No notification exists with reference ${id}.`}
          action={
            <Button variant="outline" to="/company-notifications">
              Back to Notifications
            </Button>
          }
        />
      </div>
    )
  }

  const statusMeta = STATUS_META[record.status] || {}

  return (
    <div className="container">
      <Button
        variant="ghost"
        size="sm"
        icon="chevron-left"
        to={`/company-notifications/${record.id}`}
        className="crsp__back"
      >
        Back to Notification Details
      </Button>

      <PageHeader
        overline={`Company Response · ${record.id}`}
        title="Company Response"
        description={`${record.company?.name} — ${record.product?.name}. Submit the company's official response to the notice of violation.`}
        actions={<StatusBadge tone={statusMeta.tone} label={statusMeta.label} />}
      />

      <div className="crsp-grid">
        <div className="crsp-grid__main">
          {success ? (
            <div className="crsp-success">
              <Alert tone="success" title="Response submitted successfully">
                The response has been recorded and the case status has been updated to{' '}
                <strong>{STATUS_META['response-submitted'].label}</strong>. The officer will
                evaluate it and may schedule a re-inspection.
              </Alert>
              <Card>
                <h3 className="crsp-success__title">Submitted Response</h3>
                <dl className="kv">
                  <div className="kv__item">
                    <dt className="kv__label">Response Type</dt>
                    <dd className="kv__value">{RESPONSE_TYPE_LABELS[values.type]}</dd>
                  </div>
                  <div className="kv__item">
                    <dt className="kv__label">Response Message</dt>
                    <dd className="kv__value">{values.message}</dd>
                  </div>
                  <div className="kv__item">
                    <dt className="kv__label">Response Date</dt>
                    <dd className="kv__value">{formatDate(values.date)}</dd>
                  </div>
                </dl>
                <div className="crsp-success__actions">
                  <Button variant="outline" to={`/company-notifications/${record.id}`}>
                    View Notification
                  </Button>
                  <Button variant="primary" to={`/re-inspection/${record.id}`} icon="arrowRight">
                    Proceed to Re-inspection
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <Card
              title="Company Response Form"
              subtitle={
                record.response?.submittedAt
                  ? 'A response was previously submitted. Fields are pre-filled — submitting again will replace it.'
                  : 'Record the official response of the company to this notification.'
              }
            >
              <form className="crsp-form" onSubmit={handleSubmit} noValidate>
                <fieldset className="crsp-form__fieldset">
                  <legend className="crsp-form__legend">
                    Response Type <span aria-hidden="true">*</span>
                  </legend>
                  <div
                    className={classNames('crsp-radio', errors.type && 'crsp-radio--error')}
                    role="radiogroup"
                    aria-labelledby="response-type-label"
                    aria-invalid={errors.type ? true : undefined}
                  >
                    {errors.type && (
                      <p className="crsp-radio__error" role="alert">
                        {errors.type}
                      </p>
                    )}
                    {RESPONSE_TYPE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={classNames(
                          'crsp-radio__option',
                          values.type === option.value && 'is-selected',
                        )}
                      >
                        <input
                          type="radio"
                          name="responseType"
                          value={option.value}
                          checked={values.type === option.value}
                          onChange={(event) => handleChange('type', event.target.value)}
                        />
                        <span className="crsp-radio__dot" aria-hidden="true" />
                        <span className="crsp-radio__copy">
                          <span className="crsp-radio__label">{option.label}</span>
                          <span className="crsp-radio__description">{option.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <Textarea
                  name="message"
                  label="Response Message"
                  rows={5}
                  required
                  placeholder="State the company's explanation, supporting facts and any corrective action taken…"
                  value={values.message}
                  error={errors.message}
                  onChange={(event) => handleChange('message', event.target.value)}
                />

                <Input
                  name="responseDate"
                  label="Response Date"
                  type="date"
                  required
                  value={values.date}
                  error={errors.date}
                  onChange={(event) => handleChange('date', event.target.value)}
                />

                <div className="crsp-form__actions">
                  <Button type="submit" variant="primary" icon="check" loading={submitting}>
                    Submit Response
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    to={`/company-notifications/${record.id}`}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        <div className="crsp-grid__side">
          <Card title="Notification Summary">
            <dl className="kv">
              <div className="kv__item">
                <dt className="kv__label">Notification Ref.</dt>
                <dd className="kv__value">{record.id}</dd>
              </div>
              <div className="kv__item">
                <dt className="kv__label">Company</dt>
                <dd className="kv__value">{record.company?.name}</dd>
              </div>
              <div className="kv__item">
                <dt className="kv__label">Product</dt>
                <dd className="kv__value">{record.product?.name}</dd>
              </div>
              <div className="kv__item">
                <dt className="kv__label">Violation</dt>
                <dd className="kv__value">{record.violation?.title}</dd>
              </div>
              <div className="kv__item">
                <dt className="kv__label">Rule</dt>
                <dd className="kv__value">{record.rule?.reference}</dd>
              </div>
              <div className="kv__item">
                <dt className="kv__label">Notice Date</dt>
                <dd className="kv__value">{formatDate(record.notice?.date)}</dd>
              </div>
              <div className="kv__item">
                <dt className="kv__label">Response Due</dt>
                <dd className="kv__value">{formatDate(record.notice?.dueDate)}</dd>
              </div>
              <div className="kv__item">
                <dt className="kv__label">Current Status</dt>
                <dd className="kv__value">
                  <StatusBadge tone={statusMeta.tone} label={statusMeta.label} />
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  )
}