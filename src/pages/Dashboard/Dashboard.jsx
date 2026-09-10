// src/pages/Dashboard/Dashboard.jsx
import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button/Button'
import Card from '../../components/ui/Card/Card'
import Icon from '../../components/ui/Icon/Icon'
import Input from '../../components/ui/Input/Input'
import Modal from '../../components/ui/Modal/Modal'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import StatusBadge from '../../components/ui/StatusBadge/StatusBadge'
import Table from '../../components/ui/Table/Table'
import { useModal } from '../../hooks/useModal'
import { SAMPLE_INSPECTIONS } from '../../utils/constants'
import { ROUTES } from '../../constants'
import './Dashboard.css'

const SUMMARY_CARDS = [
  { label: 'Manufacturers Registered', value: '1,284', tone: 'info' },
  { label: 'Inspections Completed', value: '3,962', tone: 'success' },
  { label: 'Pending Review', value: '148', tone: 'warning' },
  { label: 'Non-Compliant Findings', value: '231', tone: 'danger' },
]

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'compliant', label: 'Compliant' },
  { value: 'non-compliant', label: 'Non-compliant' },
  { value: 'under-review', label: 'Under review' },
  { value: 'pending', label: 'Pending' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { open, openModal, closeModal } = useModal()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [savedInspections, setSavedInspections] = useState([])

  useEffect(() => {
    try {
      const historyJson = localStorage.getItem('pclmcs.inspections_history') || localStorage.getItem('pclmcs.inspections')
      if (historyJson) {
        const parsed = JSON.parse(historyJson)
        if (Array.isArray(parsed)) {
          const mapped = parsed.map((item) => {
            const verdict = item.summary?.overallVerdict || item.results?.verdict || 'COMPLIANT'
            let statusKey = 'compliant'
            if (verdict === 'NON_COMPLIANT' || verdict === 'POTENTIAL_NON_COMPLIANCE') {
              statusKey = 'non-compliant'
            } else if (verdict === 'PENDING_VERIFICATION' || verdict === 'VERIFICATION_REQUIRED') {
              statusKey = 'pending'
            }

            return {
              id: item.inspectionId || item.id || `INS-${Date.now().toString().slice(-4)}`,
              product: item.commodity?.productName || item.commodity?.name || 'Inspected Commodity',
              manufacturer: item.commodity?.manufacturer || 'N/A',
              declared: item.commodity?.netQuantity || 'N/A',
              observed: item.commodity?.mrp || 'N/A',
              status: statusKey,
              testedAt: item.inspectionDate ? new Date(item.inspectionDate).toLocaleDateString('en-IN') : 'Today',
              rawReport: item,
            }
          })
          setSavedInspections(mapped)
        }
      }
    } catch (err) {
      console.warn('Failed to load inspection history from localStorage:', err)
    }
  }, [])

  const rows = useMemo(() => {
    return [...savedInspections, ...SAMPLE_INSPECTIONS]
  }, [savedInspections])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter
      const needle = searchTerm.trim().toLowerCase()
      const matchesSearch =
        !needle ||
        (row.product || '').toLowerCase().includes(needle) ||
        (row.manufacturer || '').toLowerCase().includes(needle) ||
        (row.id || '').toLowerCase().includes(needle)
      return matchesStatus && matchesSearch
    })
  }, [rows, searchTerm, statusFilter])

  const handleRowClick = (row) => {
    if (row.rawReport) {
      navigate(ROUTES.REPORTS || '/reports', { state: { report: row.rawReport } })
    }
  }

  const columns = [
    {
      key: 'id',
      header: 'Reference',
      render: (row) => (
        <span
          style={{ color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => handleRowClick(row)}
        >
          {row.id}
        </span>
      ),
    },
    { key: 'product', header: 'Packaged Commodity' },
    { key: 'manufacturer', header: 'Manufacturer' },
    {
      key: 'declared',
      header: 'Declared Qty',
      align: 'right',
      render: (row) => <span className="dashboard__qty">{row.declared}</span>,
    },
    {
      key: 'observed',
      header: 'Declared MRP',
      align: 'right',
      render: (row) => <span className="dashboard__qty">{row.observed}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'testedAt', header: 'Tested On' },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          icon="eye"
          onClick={() => handleRowClick(row)}
        >
          View Report
        </Button>
      ),
    },
  ]

  const handleFormSubmit = (event) => {
    event.preventDefault()
    setFormSubmitted(true)
  }

  return (
    <div className="container">
      <PageHeader
        overline="Department of Consumer Affairs · Legal Metrology Wing"
        title="Compliance Intelligence Dashboard"
        description="Live view of packaged commodity inspections, verification status and enforcement workflow."
        actions={
          <Button icon="camera" onClick={() => navigate(ROUTES.SCAN || '/scan')}>
            New Product Inspection Scan
          </Button>
        }
      />

      <section className="summary" aria-label="Summary statistics">
        {SUMMARY_CARDS.map((item) => (
          <Card key={item.label} className="summary__card">
            <span className={`summary__value summary__value--${item.tone}`}>
              {item.value}
            </span>
            <span className="summary__label">{item.label}</span>
          </Card>
        ))}
      </section>

      <Card
        title="Recent Statutory Inspection Records"
        subtitle="Saved inspection records from field officer scans and manual inspections."
      >
        <div className="dashboard__toolbar">
          <div className="dashboard__search">
            <Icon name="search" size={18} className="dashboard__search-icon" />
            <Input
              name="search"
              placeholder="Search commodity, manufacturer or reference…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search inspection records"
            />
          </div>
          <div className="dashboard__filter">
            <label className="dashboard__filter-label" htmlFor="status-filter">
              Status
            </label>
            <select
              id="status-filter"
              className="dashboard__select"
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

        <Table
          columns={columns}
          rows={filteredRows}
          caption="Packaged commodity inspection records"
          emptyMessage="No records match the current filters."
        />
      </Card>

      <Modal
        open={open}
        onClose={closeModal}
        title="New Inspection Entry"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" form="inspection-form">
              Save Record
            </Button>
          </>
        }
      >
        {formSubmitted ? (
          <div className="dashboard__form-success" role="status">
            <Icon name="check-circle" size={40} />
            <p>Record saved into local compliance history.</p>
            <Button variant="secondary" onClick={closeModal}>
              Close
            </Button>
          </div>
        ) : (
          <form id="inspection-form" className="dashboard__form" onSubmit={handleFormSubmit}>
            <Input
              label="Packaged Commodity"
              name="product"
              placeholder="e.g. Edible Oil (500 ml)"
              required
            />
            <Input
              label="Manufacturer"
              name="manufacturer"
              placeholder="Registered manufacturer name"
              required
            />
            <div className="dashboard__form-row">
              <Input label="Declared Quantity" name="declared" placeholder="500 ml" required />
              <Input label="Declared MRP" name="observed" placeholder="e.g. ₹120.00" required />
            </div>
            <Input label="Inspection Reference" name="reference" placeholder="INS-2026-…" hint="Assigned by the field officer." />
          </form>
        )}
      </Modal>
    </div>
  )
}