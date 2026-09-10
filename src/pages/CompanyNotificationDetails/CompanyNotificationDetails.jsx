import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import Alert from '../../components/feedback/Alert/Alert'
import Button from '../../components/ui/Button/Button'
import Card from '../../components/ui/Card/Card'
import EmptyState from '../../components/feedback/EmptyState/EmptyState'
import ErrorMessage from '../../components/feedback/ErrorMessage/ErrorMessage'
import LoadingSpinner from '../../components/feedback/LoadingSpinner/LoadingSpinner'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import {
  closeCase,
  getNotification,
  sendNotification,
  STATUS_META,
  StatusTimeline,
  useEnforcementData,
  formatDate,
  ENFORCEMENT_STATUS,
} from '../../modules/enforcement'
import { RESPONSE_TYPE_LABELS } from '../../modules/enforcement'
import './CompanyNotificationDetails.css'

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

export default function CompanyNotificationDetails() {
  const { id } = useParams()
  const load = useCallback(() => getNotification(id), [id])
  const { data: record, loading, error } = useEnforcementData(load)

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  if (loading) {
    return (
      <div className="container cntd-state">
        <LoadingSpinner size="lg" label="Loading notification details" />
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
          description={`No notification exists with reference ${id}. It may have been removed.`}
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
  const officer = record.inspection?.officer || {}

  const handleSendNotification = () => {
    setSending(true)
    setSent(false)
    window.setTimeout(() => {
      sendNotification(record.id)
      setSending(false)
      setSent(true)
    }, 600)
  }

  const responseType =
    record.response?.type && RESPONSE_TYPE_LABELS[record.response.type]
      ? RESPONSE_TYPE_LABELS[record.response.type]
      : 'Not submitted'

  const canCloseCase =
    record.status === ENFORCEMENT_STATUS.COMPLIANT ||
    record.status === ENFORCEMENT_STATUS.VIOLATION_CONFIRMED

  return (
    <div className="container">
      <Button
        variant="ghost"
        size="sm"
        icon="chevron-left"
        to="/company-notifications"
        className="cntd__back"
      >
        Back to Notifications
      </Button>

      <PageHeader
        overline={`Show-cause notification ${record.id}`}
        title={record.company?.name}
        description={`${record.product?.name} · ${record.product?.category} · Violation: ${record.violation?.title}`}
        actions={
          <StatusBadge tone={statusMeta.tone} label={statusMeta.label} />
        }
      />

      {sent && (
        <Alert
          tone="success"
          title="Notification sent successfully"
          className="cntd__alert"
        >
          The show-cause notification has been {sending ? 'sending' : 'issued / re-issued'} to{' '}
          {record.company?.name}. Status updated to{' '}
          <strong>{STATUS_META[ENFORCEMENT_STATUS.PENDING_RESPONSE].label}</strong>.
        </Alert>
      )}

      <div className="cntd__actions">
        <Button
          variant="primary"
          icon="mail"
          loading={sending}
          onClick={handleSendNotification}
        >
          Send Notification
        </Button>
        <Button variant="outline" to={`/company-response/${record.id}`} icon="refresh">
          Company Response
        </Button>
        <Button variant="outline" to={`/re-inspection/${record.id}`} icon="search">
          Re-inspection
        </Button>
        {canCloseCase && (
          <Button
            variant="ghost"
            icon="check"
            onClick={() => {
              closeCase(record.id)
              setSent(false)
            }}
          >
            Close Case
          </Button>
        )}
      </div>

      <div className="cntd-grid">
        <div className="cntd-grid__main">
          <Card title="Violation Details">
            <Kv
              pairs={[
                ['Violation', record.violation?.title],
                ['Type', record.violation?.type],
                ['Severity', record.violation?.severity],
              ]}
            />
            <p className="cntd-desc">{record.violation?.description}</p>
            <div className="cntd-note">
              <span className="cntd-note__label">Penal provision</span>
              <p className="cntd-note__text">{record.violation?.penaltyProvision}</p>
            </div>
          </Card>

          <Card title="Product Information">
            <Kv
              pairs={[
                ['Product Name', record.product?.name],
                ['Product ID', record.product?.productId],
                ['Batch Number', record.product?.batchNumber],
                ['Category', record.product?.category],
                ['MRP (incl. taxes)', record.product?.mrp],
                ['Net Quantity', record.product?.netQuantity],
              ]}
            />
          </Card>

          <Card title="Rule / Statutory Reference">
            <Kv
              pairs={[
                ['Rule', record.rule?.reference],
                ['Act / Provision', record.rule?.actSection],
                ['Category Rule Set', record.rule?.category],
              ]}
            />
          </Card>
        </div>

        <div className="cntd-grid__side">
          <Card title="Current Status">
            <div className="cntd-status">
              <StatusBadge tone={statusMeta.tone} label={statusMeta.label} />
              <p className="cntd-status__desc">{statusMeta.description}</p>
            </div>
            <StatusTimeline status={record.status} />
          </Card>

          <Card title="Company Information">
            <Kv
              pairs={[
                ['Company Name', record.company?.name],
                ['Registration No.', record.company?.registrationNo],
                ['Address', record.company?.address],
                ['Contact Person', record.company?.contactPerson],
                ['Phone', record.company?.phone],
                ['Email', record.company?.email],
              ]}
            />
          </Card>

          <Card title="Inspection & Notice">
            <Kv
              pairs={[
                ['Inspection ID', record.inspection?.id],
                ['Inspection Date', formatDate(record.inspection?.date)],
                ['Inspection Place', record.inspection?.place],
                ['Officer', officer.name],
                ['Officer Designation', officer.designation],
                ['Officer Department', officer.department],
                ['Notice Reference', record.notice?.reference],
                ['Notice Date', formatDate(record.notice?.date)],
                ['Response Due', formatDate(record.notice?.dueDate)],
                ['Company Response', responseType],
              ]}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}