import { useMemo, useState } from 'react'
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
  const { open, openModal, closeModal } = useModal()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formSubmitted, setFormSubmitted] = useState(false)
  const rows = SAMPLE_INSPECTIONS

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter
      const needle = searchTerm.trim().toLowerCase()
      const matchesSearch =
        !needle ||
        row.product.toLowerCase().includes(needle) ||
        row.manufacturer.toLowerCase().includes(needle) ||
        row.id.toLowerCase().includes(needle)
      return matchesStatus && matchesSearch
    })
  }, [rows, searchTerm, statusFilter])

  const columns = [
    { key: 'id', header: 'Reference' },
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
      header: 'Observed Qty',
      align: 'right',
      render: (row) => <span className="dashboard__qty">{row.observed}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'testedAt', header: 'Tested On' },
  ]

  const handleFormSubmit = (event) => {
    event.preventDefault()
    setFormSubmitted(true)
  }

  return (
    <div className="container">
      <PageHeader
        overline="Department of Consumer Affairs"
        title="Compliance Dashboard"
        description="Live view of packaged commodity inspections, verification status and enforcement workflow. Data shown is sample data for the interface preview."
        actions={
          <Button icon="plus" onClick={openModal}>
            New Inspection Entry
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
        title="Inspection Records"
        subtitle="Sample records demonstrating the table, search and status components."
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
          caption="Packaged commodity inspection records (sample data)"
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
            <p>Record saved. This is a demonstration — no data was transmitted.</p>
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
              <Input label="Observed Quantity" name="observed" placeholder="e.g. 487 ml" required />
            </div>
            <Input label="Inspection Reference" name="reference" placeholder="PCL/2025/…" hint="Assigned by the field officer." />
          </form>
        )}
      </Modal>
    </div>
  )
}