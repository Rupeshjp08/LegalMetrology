import { useEffect, useState } from 'react'
import Card from '../../components/ui/Card/Card'
import Table from '../../components/ui/Table/Table'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Button from '../../components/ui/Button/Button'
import Icon from '../../components/ui/Icon/Icon'
import Modal from '../../components/ui/Modal/Modal'
import {
  subscribe,
  getVersion,
  getHistory,
  STATUS_OPTIONS,
  PAGE_SIZE,
} from '../../modules/admin/services/scanHistoryStore'
import '../../modules/admin/admin.css'

const STATUS_FILTER_LABELS = {
  compliant: 'Compliant',
  'non-compliant': 'Non-Compliant',
  pending: 'Pending Review',
  warning: 'Warning',
}

function DetailBody({ record }) {
  if (!record) return null

  const verdict = record.statutoryVerdict || {}
  const counts = verdict.summaryCounts || {}

  return (
    <div className="m5-detail">
      <div className="m5-kv">
        <div className="m5-kv__item">
          <span className="m5-kv__label">Report ID</span>
          <span className="m5-kv__value">{record.id}</span>
        </div>
        <div className="m5-kv__item">
          <span className="m5-kv__label">Product</span>
          <span className="m5-kv__value">{record.productName}</span>
        </div>
        <div className="m5-kv__item">
          <span className="m5-kv__label">Category</span>
          <span className="m5-kv__value">{record.category}</span>
        </div>
        <div className="m5-kv__item">
          <span className="m5-kv__label">Scanned At</span>
          <span className="m5-kv__value">{record.scanDateTime}</span>
        </div>
        <div className="m5-kv__item">
          <span className="m5-kv__label">Status</span>
          <span className="m5-kv__value">
            <StatusBadge status={record.status} />
          </span>
        </div>
        <div className="m5-kv__item">
          <span className="m5-kv__label">Compliance Score</span>
          <span className="m5-kv__value">{record.complianceScore}%</span>
        </div>
      </div>

      <h3 className="m5-section-title">Declarations Summary</h3>
      <div className="m5-kv">
        <div className="m5-kv__item">
          <span className="m5-kv__label">Verified</span>
          <span className="m5-kv__value">{counts.verified || 0}</span>
        </div>
        <div className="m5-kv__item">
          <span className="m5-kv__label">Warnings</span>
          <span className="m5-kv__value">{counts.warnings || 0}</span>
        </div>
        <div className="m5-kv__item">
          <span className="m5-kv__label">Verification Required</span>
          <span className="m5-kv__value">{counts.verificationRequired || 0}</span>
        </div>
        <div className="m5-kv__item">
          <span className="m5-kv__label">Potential Non-Compliance</span>
          <span className="m5-kv__value">{counts.potentialNonCompliance || 0}</span>
        </div>
      </div>

      <h3 className="m5-section-title">Violations</h3>
      {record.violationsList.length ? (
        <ul className="m5-list">
          {record.violationsList.map((violation, index) => (
            <li key={index}>
              <strong>{violation.rule}</strong>
              {violation.statutoryClause ? ` [${violation.statutoryClause}]` : ''}
              {violation.capturedEvidence ? ` — Evidence: ${violation.capturedEvidence}` : ''}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="m5-list">
          <li>No violations were recorded for this inspection.</li>
        </ul>
      )}

      {record.officerAuditTrail.length > 0 && (
        <>
          <h3 className="m5-section-title">Officer Audit Trail</h3>
          <ul className="m5-list">
            {record.officerAuditTrail.map((entry, index) => (
              <li key={index}>
                <strong>{entry.ruleId}</strong> —{' '}
                <StatusBadge status={entry.finalStatus} /> {entry.officerNotes}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default function ScanHistory() {
  const [, setVersionState] = useState(() => getVersion())
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ search: '', status: '', date: '' })
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => subscribe(() => setVersionState(getVersion())), [])

  const { records, total, totalPages, page: activePage } = getHistory({
    page,
    pageSize: PAGE_SIZE,
    filters,
  })

  const updateFilter = (key, value) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setPage(1)
    setFilters({ search: '', status: '', date: '' })
  }

  const hasFilters = Boolean(filters.search || filters.status || filters.date)

  const columns = [
    {
      key: 'id',
      header: 'Report ID',
      render: (row) => <span className="m5-report-id">{row.id}</span>,
    },
    { key: 'productName', header: 'Product' },
    { key: 'category', header: 'Category' },
    { key: 'scanDateTime', header: 'Scanned' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'complianceScore',
      header: 'Score',
      align: 'center',
      render: (row) => `${row.complianceScore}%`,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          className="m5-icon-btn"
          aria-label={`View details of ${row.id}`}
          title="View details"
          onClick={() => {
            setSelectedRecord(row)
            setDetailOpen(true)
          }}
        >
          <Icon name="eye" size={18} />
        </button>
      ),
    },
  ]

  const startIndex = (activePage - 1) * PAGE_SIZE + 1
  const endIndex = Math.min(total, startIndex + records.length - 1)

  return (
    <div className="m5-page">
      <PageHeader
        overline="PCLMCS · Officer Workspace"
        title="Scan History"
        description="Complete audit trail of every compliance inspection recorded on this system."
      />

      <Card
        title="Inspection Records"
        subtitle={total ? `${total} inspection(s) on record` : 'No inspections yet'}
      >
        <div className="m5-filters">
          <div className="m5-filters__row">
            <div className="m5-field" style={{ flex: '1 1 220px' }}>
              <label className="m5-field__label" htmlFor="m5-search">
                Search
              </label>
              <input
                id="m5-search"
                type="search"
                className="m5-input"
                placeholder="Search product or report ID…"
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
              />
            </div>
            <div className="m5-field">
              <label className="m5-field__label" htmlFor="m5-status">
                Status
              </label>
              <select
                id="m5-status"
                className="m5-select"
                value={filters.status}
                onChange={(event) => updateFilter('status', event.target.value)}
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_FILTER_LABELS[status] || status}
                  </option>
                ))}
              </select>
            </div>
            <div className="m5-field">
              <label className="m5-field__label" htmlFor="m5-date">
                Date
              </label>
              <input
                id="m5-date"
                type="date"
                className="m5-input"
                value={filters.date}
                onChange={(event) => updateFilter('date', event.target.value)}
              />
            </div>
            {hasFilters && (
              <Button variant="ghost" icon="refresh" onClick={resetFilters}>
                Reset
              </Button>
            )}
          </div>
        </div>

        <Table
          columns={columns}
          rows={records}
          emptyMessage={
            hasFilters
              ? 'No inspection records match the current filters.'
              : 'No compliance inspections recorded yet. Save a scan from the Compliance module to populate history.'
          }
          caption={`Inspections ${total ? `${startIndex}–${endIndex}` : '0'} of ${total}`}
        />

        {total > PAGE_SIZE && (
          <div className="m5-pagination">
            <span className="m5-pagination__summary">
              Showing {startIndex}–{endIndex} of {total} records
            </span>
            <div className="m5-pagination__controls">
              <Button
                variant="outline"
                size="sm"
                icon="chevron-left"
                disabled={activePage <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <span className="m5-page-indicator">
                Page {activePage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                icon="chevron-right"
                iconPosition="right"
                disabled={activePage >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Inspection Details"
        size="lg"
        footer={
          <Button variant="outline" onClick={() => setDetailOpen(false)}>
            Close
          </Button>
        }
      >
        <DetailBody record={selectedRecord} />
      </Modal>
    </div>
  )
}