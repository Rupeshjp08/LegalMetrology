import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button/Button'
import Card from '../../components/ui/Card/Card'
import EmptyState from '../../components/feedback/EmptyState/EmptyState'
import ErrorMessage from '../../components/feedback/ErrorMessage/ErrorMessage'
import Icon from '../../components/ui/Icon/Icon'
import Input from '../../components/ui/Input/Input'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import Table from '../../components/ui/Table/Table'
import {
  getNotifications,
  STATUS_META,
  useEnforcementData,
  formatDate,
  ENFORCEMENT_STATUS,
} from '../../modules/enforcement'
import './CompanyNotifications.css'

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: ENFORCEMENT_STATUS.PENDING_RESPONSE, label: STATUS_META[ENFORCEMENT_STATUS.PENDING_RESPONSE].label },
  { value: ENFORCEMENT_STATUS.RESPONSE_SUBMITTED, label: STATUS_META[ENFORCEMENT_STATUS.RESPONSE_SUBMITTED].label },
  { value: ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED, label: STATUS_META[ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED].label },
  { value: ENFORCEMENT_STATUS.COMPLIANT, label: STATUS_META[ENFORCEMENT_STATUS.COMPLIANT].label },
  { value: ENFORCEMENT_STATUS.VIOLATION_CONFIRMED, label: STATUS_META[ENFORCEMENT_STATUS.VIOLATION_CONFIRMED].label },
  { value: ENFORCEMENT_STATUS.CASE_CLOSED, label: STATUS_META[ENFORCEMENT_STATUS.CASE_CLOSED].label },
]

const EMPTY_RECORDS = []

function SummaryCard({ label, count, tone = 'neutral' }) {
  return (
    <div className={`cn-summary cn-summary--${tone}`}>
      <span className="cn-summary__value">{count}</span>
      <span className="cn-summary__label">{label}</span>
    </div>
  )
}

export default function CompanyNotifications() {
  const navigate = useNavigate()
  const load = useCallback(() => getNotifications(), [])
  const { data, loading, error } = useEnforcementData(load)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const records = data || EMPTY_RECORDS

  const summary = useMemo(() => {
    const counts = {
      pendingResponse: 0,
      responseSubmitted: 0,
      reinspectionScheduled: 0,
      resolved: 0,
    }
    records.forEach((record) => {
      if (record.status === ENFORCEMENT_STATUS.PENDING_RESPONSE) counts.pendingResponse += 1
      else if (record.status === ENFORCEMENT_STATUS.RESPONSE_SUBMITTED) counts.responseSubmitted += 1
      else if (record.status === ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED) counts.reinspectionScheduled += 1
      else if (
        record.status === ENFORCEMENT_STATUS.COMPLIANT ||
        record.status === ENFORCEMENT_STATUS.VIOLATION_CONFIRMED ||
        record.status === ENFORCEMENT_STATUS.CASE_CLOSED
      ) {
        counts.resolved += 1
      }
    })
    return counts
  }, [records])

  const filteredRows = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase()
    return records.filter((record) => {
      if (statusFilter !== 'all' && record.status !== statusFilter) return false
      if (!needle) return true
      const haystack = [
        record.id,
        record.company?.name,
        record.product?.name,
        record.product?.productId,
        record.product?.batchNumber,
        record.violation?.title,
        record.rule?.reference,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [records, searchTerm, statusFilter])

  const columns = [
    {
      key: 'company',
      header: 'Company',
      render: (row) => (
        <div className="cn-celled">
          <span className="cn-celled__primary">{row.company?.name}</span>
          <span className="cn-celled__secondary">{row.company?.registrationNo}</span>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (row) => (
        <div className="cn-celled">
          <span className="cn-celled__primary">{row.product?.name}</span>
          <span className="cn-celled__secondary">{row.product?.category}</span>
        </div>
      ),
    },
    {
      key: 'productRef',
      header: 'Product ID / Batch',
      render: (row) => (
        <div className="cn-celled">
          <span className="cn-celled__primary">{row.product?.productId}</span>
          <span className="cn-celled__secondary">{row.product?.batchNumber}</span>
        </div>
      ),
    },
    {
      key: 'violation',
      header: 'Violation',
      render: (row) => (
        <div className="cn-celled">
          <span className="cn-celled__primary">{row.violation?.title}</span>
          <span className="cn-celled__secondary">{row.rule?.reference}</span>
        </div>
      ),
    },
    {
      key: 'inspectionDate',
      header: 'Inspection Date',
      render: (row) => formatDate(row.inspection?.date),
    },
    {
      key: 'noticeDate',
      header: 'Notice Date',
      render: (row) => formatDate(row.notice?.date),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) =>
        STATUS_META[row.status] ? (
          <StatusBadge tone={STATUS_META[row.status].tone} label={STATUS_META[row.status].label} />
        ) : (
          <StatusBadge status={row.status} />
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          icon="eye"
          onClick={() => navigate(`/company-notifications/${row.id}`)}
        >
          View Details
        </Button>
      ),
    },
  ]

  return (
    <div className="container">
      <PageHeader
        overline="PCLMCS · Legal Metrology Enforcement"
        title="Company Notifications"
        description="Show-cause notifications issued to companies for packaged commodity violations, along with responses and re-inspection follow-up."
      />

      {error ? (
        <ErrorMessage
          title="Could not load notifications"
          message={error.message}
          onRetry={() => window.location.reload()}
        />
      ) : (
        <>
          <section className="cn-summary-row" aria-label="Status summary">
            <SummaryCard label="Pending Response" count={summary.pendingResponse} tone="warning" />
            <SummaryCard label="Response Submitted" count={summary.responseSubmitted} tone="info" />
            <SummaryCard label="Re-inspection Scheduled" count={summary.reinspectionScheduled} tone="info" />
            <SummaryCard label="Resolved / Closed" count={summary.resolved} tone="success" />
          </section>

          <Card
            title="Notification Register"
            subtitle="All notifications issued under the Legal Metrology (Packaged Commodities) Rules."
          >
            <div className="cn__toolbar">
              <div className="cn__search">
                <Icon name="search" size={18} className="cn__search-icon" />
                <Input
                  name="search"
                  className="cn__search-input"
                  placeholder="Search company, product, product ID, batch or violation…"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  aria-label="Search notifications"
                />
              </div>
              <div className="cn__filter">
                <label className="cn__filter-label" htmlFor="status-filter">
                  Status
                </label>
                <select
                  id="status-filter"
                  className="cn__select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  {STATUS_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!loading && filteredRows.length === 0 ? (
              <EmptyState
                icon="mail"
                title="No notifications found"
                description={
                  records.length === 0
                    ? 'No company notifications have been issued yet.'
                    : 'No notifications match the current search and filter.'
                }
              />
            ) : (
              <Table
                columns={columns}
                rows={filteredRows}
                loading={loading}
                caption="Company notification register (sample data)"
                emptyMessage="No notifications match the current filters."
              />
            )}
          </Card>
        </>
      )}
    </div>
  )
}