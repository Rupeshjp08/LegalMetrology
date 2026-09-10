import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import Alert from '../../components/feedback/Alert/Alert'
import Button from '../../components/ui/Button/Button'
import Card from '../../components/ui/Card/Card'
import EmptyState from '../../components/feedback/EmptyState/EmptyState'
import ErrorMessage from '../../components/feedback/ErrorMessage/ErrorMessage'
import Input from '../../components/ui/Input/Input'
import LoadingSpinner from '../../components/feedback/LoadingSpinner/LoadingSpinner'
import Modal from '../../components/ui/Modal/Modal'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import Textarea from '../../components/forms/Textarea/Textarea'
import {
  getNotification,
  scheduleReinspection,
  submitReinspectionResult,
  STATUS_META,
  StatusTimeline,
  useEnforcementData,
  formatDate,
  RESPONSE_TYPE_LABELS,
  INSPECTION_RESULT_OPTIONS,
  ENFORCEMENT_STATUS,
} from '../../modules/enforcement'
import { classNames } from '../../utils/classNames'
import './Reinspection.css'

function Kv({ pairs }) {
  return (
    <dl className="kv">
      {pairs.map(([label, value]) => (
        <div className="kv__item" key={label}>
          <dt className="kv__label">{label}</dt>
          <dd className="kv__value">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function Reinspection() {
  const { id } = useParams()
  const load = useCallback(() => getNotification(id), [id])
  const { data: record, loading, error } = useEnforcementData(load)

  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)

  const [scheduleValues, setScheduleValues] = useState(() => ({
    date: '',
    officerName: '',
  }))
  const [scheduleErrors, setScheduleErrors] = useState({})

  const [resultValues, setResultValues] = useState(() => ({
    result: '',
    remarks: '',
  }))
  const [resultErrors, setResultErrors] = useState({})

  const [acting, setActing] = useState(false)
  const [notice, setNotice] = useState(null)

  const isScheduled =
    Boolean(record?.reinspection?.date) || record?.status === ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED
  const hasResult = Boolean(record?.reinspection?.result)

  const handleOpenSchedule = () => {
    setScheduleValues({
      date: record?.reinspection?.date || '',
      officerName: record?.reinspection?.officerName || record?.inspection?.officer?.name || '',
    })
    setScheduleErrors({})
    setNotice(null)
    setScheduleOpen(true)
  }

  const handleOpenResult = () => {
    setResultValues({
      result: record?.reinspection?.result === 'compliant' ? 'compliant' : '',
      remarks: record?.reinspection?.remarks || '',
    })
    setResultErrors({})
    setNotice(null)
    setResultOpen(true)
  }

  const validateSchedule = () => {
    const errors = {}
    if (!scheduleValues.date) errors.date = 'Please select a re-inspection date.'
    if (!scheduleValues.officerName.trim()) errors.officerName = 'Please enter the officer name.'
    return errors
  }

  const handleSubmitSchedule = async (event) => {
    event.preventDefault()
    const nextErrors = validateSchedule()
    setScheduleErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setActing(true)
    try {
      await scheduleReinspection(record.id, {
        date: scheduleValues.date,
        officerName: scheduleValues.officerName.trim(),
      })
      setActing(false)
      setScheduleOpen(false)
      setNotice({
        tone: 'info',
        title: 'Re-inspection scheduled',
        text: `Re-inspection scheduled for ${formatDate(scheduleValues.date)} with ${scheduleValues.officerName.trim()}. Status updated to Re-inspection Scheduled.`,
      })
    } catch (error) {
      setActing(false)
      setNotice({
        tone: 'danger',
        title: 'Could not schedule re-inspection',
        text: error.message || 'Something went wrong. Please try again.',
      })
    }
  }

  const validateResult = () => {
    const errors = {}
    if (!resultValues.result) errors.result = 'Please select an inspection result.'
    if (!resultValues.remarks.trim()) errors.remarks = 'Please enter remarks for the official record.'
    return errors
  }

  const handleSubmitResult = async (event) => {
    event.preventDefault()
    const nextErrors = validateResult()
    setResultErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setActing(true)
    try {
      await submitReinspectionResult(record.id, {
        result: resultValues.result,
        remarks: resultValues.remarks.trim(),
      })
      setActing(false)
      setResultOpen(false)
      setNotice({
        tone: resultValues.result === 'compliant' ? 'success' : 'danger',
        title:
          resultValues.result === 'compliant'
            ? 'Inspection result submitted — Compliant'
            : 'Inspection result submitted — Still Violated',
        text:
          resultValues.result === 'compliant'
            ? 'The re-inspection confirmed compliance. The case status is now Case Closed.'
            : 'The re-inspection confirmed the violation persists. The case status is now Violation Confirmed.',
      })
    } catch (error) {
      setActing(false)
      setNotice({
        tone: 'danger',
        title: 'Could not submit inspection result',
        text: error.message || 'Something went wrong. Please try again.',
      })
    }
  }

  if (loading) {
    return (
      <div className="container rnsp-state">
        <LoadingSpinner size="lg" label="Loading re-inspection case" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <ErrorMessage
          title="Could not load re-inspection case"
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
          title="Case not found"
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
  const responseLabel = record.response?.type
    ? RESPONSE_TYPE_LABELS[record.response.type] || record.response.type
    : 'No response submitted'

  return (
    <div className="container">
      <Button
        variant="ghost"
        size="sm"
        icon="chevron-left"
        to={`/company-notifications/${record.id}`}
        className="rnsp__back"
      >
        Back to Notification Details
      </Button>

      <PageHeader
        overline={`Re-inspection · ${record.id}`}
        title="Re-inspection"
        description={`Follow-up inspection for ${record.company?.name} — ${record.product?.name} following the notice of violation.`}
        actions={<StatusBadge tone={statusMeta.tone} label={statusMeta.label} />}
      />

      {notice && (
        <Alert tone={notice.tone} title={notice.title} className="rnsp__alert" onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      <div className="rnsp__actions">
        <Button variant="primary" icon="calendar" onClick={handleOpenSchedule}>
          Schedule Re-inspection
        </Button>
        <Button
          variant="primary"
          icon="check"
          disabled={!isScheduled || hasResult}
          onClick={handleOpenResult}
        >
          Submit Inspection Result
        </Button>
      </div>

      <div className="rnsp-grid">
        <div className="rnsp-grid__main">
          <Card title="Case Summary">
            <Kv
              pairs={[
                ['Company Name', record.company?.name],
                ['Product Name', record.product?.name],
                ['Product ID', record.product?.productId],
                ['Batch Number', record.product?.batchNumber],
                ['Net Quantity', record.product?.netQuantity],
              ]}
            />
          </Card>

          <Card title="Previous Violation">
            <Kv
              pairs={[
                ['Violation', record.violation?.title],
                ['Type', record.violation?.type],
                ['Rule / Reference', record.rule?.reference],
              ]}
            />
            <p className="rnsp-desc">{record.violation?.description}</p>
          </Card>

          <Card title="Company Response">
            <Kv
              pairs={[
                ['Response Type', responseLabel],
                ['Response Date', formatDate(record.response?.date)],
              ]}
            />
            <p className="rnsp-response">{record.response?.message || 'No response message recorded.'}</p>
          </Card>

          <Card title="Inspection Result">
            {hasResult ? (
              <>
                <Kv
                  pairs={[
                    [
                      'Result',
                      record.reinspection?.result === 'compliant' ? 'Compliant' : 'Still Violated',
                    ],
                    ['Inspection Date', formatDate(record.reinspection?.date)],
                    ['Verified By', record.reinspection?.officerName],
                    ['Completed On', formatDate(record.reinspection?.completedAt)],
                  ]}
                />
                <p className="rnsp-response rnsp-response--result">{record.reinspection?.remarks}</p>
              </>
            ) : (
              <p className="rnsp-empty-result">
                No inspection result has been submitted yet. Schedule a re-inspection and record its
                outcome using the buttons above.
              </p>
            )}
          </Card>
        </div>

        <div className="rnsp-grid__side">
          <Card title="Re-inspection Details">
            <Kv
              pairs={[
                ['Re-inspection Date', formatDate(record.reinspection?.date)],
                ['Officer Name', record.reinspection?.officerName],
                ['Scheduled On', formatDate(record.reinspection?.scheduledAt)],
              ]}
            />
          </Card>

          <Card title="Final Status">
            <div className="rnsp-status">
              <StatusBadge tone={statusMeta.tone} label={statusMeta.label} />
              <p className="rnsp-status__desc">{statusMeta.description}</p>
            </div>
            <StatusTimeline status={record.status} />
          </Card>
        </div>
      </div>

      <Modal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule Re-inspection"
        footer={
          <>
            <Button variant="secondary" onClick={() => setScheduleOpen(false)} disabled={acting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              form="schedule-form"
              type="submit"
              loading={acting}
              icon="calendar"
            >
              Schedule
            </Button>
          </>
        }
      >
        <form id="schedule-form" className="rnsp-form" onSubmit={handleSubmitSchedule} noValidate>
          <Input
            name="reinspectionDate"
            label="Re-inspection Date"
            type="date"
            required
            hint="Select the on-site verification date."
            value={scheduleValues.date}
            error={scheduleErrors.date}
            onChange={(event) => setScheduleValues((prev) => ({ ...prev, date: event.target.value }))}
          />
          <Input
            name="officerName"
            label="Officer Name"
            required
            placeholder="Name of the inspecting officer"
            value={scheduleValues.officerName}
            error={scheduleErrors.officerName}
            onChange={(event) =>
              setScheduleValues((prev) => ({ ...prev, officerName: event.target.value }))
            }
          />
        </form>
      </Modal>

      <Modal
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        title="Submit Inspection Result"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResultOpen(false)} disabled={acting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              form="result-form"
              type="submit"
              loading={acting}
              icon="check"
            >
              Submit Result
            </Button>
          </>
        }
      >
        <form id="result-form" className="rnsp-form" onSubmit={handleSubmitResult} noValidate>
          <fieldset className="rnsp-form__fieldset">
            <legend className="rnsp-form__legend">
              Inspection Result <span aria-hidden="true">*</span>
            </legend>
            <div
              className={classNames('rnsp-radio', resultErrors.result && 'rnsp-radio--error')}
              role="radiogroup"
              aria-invalid={resultErrors.result ? true : undefined}
            >
              {resultErrors.result && (
                <p className="rnsp-radio__error" role="alert">
                  {resultErrors.result}
                </p>
              )}
              {INSPECTION_RESULT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={classNames(
                    'rnsp-radio__option',
                    resultValues.result === option.value && 'is-selected',
                  )}
                >
                  <input
                    type="radio"
                    name="inspectionResult"
                    value={option.value}
                    checked={resultValues.result === option.value}
                    onChange={(event) => setResultValues((prev) => ({ ...prev, result: event.target.value }))}
                  />
                  <span className="rnsp-radio__dot" aria-hidden="true" />
                  <span className="rnsp-radio__copy">
                    <span className="rnsp-radio__label">{option.label}</span>
                    <span className="rnsp-radio__description">{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Textarea
            name="remarks"
            label="Remarks"
            rows={4}
            required
            placeholder="Record observations, weighing results and any action taken during the re-inspection…"
            value={resultValues.remarks}
            error={resultErrors.remarks}
            onChange={(event) => setResultValues((prev) => ({ ...prev, remarks: event.target.value }))}
          />
        </form>
      </Modal>
    </div>
  )
}