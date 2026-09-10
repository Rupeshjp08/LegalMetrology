import { useMemo, useState, useSyncExternalStore } from 'react'
import {
  Search,
  Filter,
  Eye,
  FileText as PdfIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import AdminLayout from '../admin/components/AdminLayout'
import StatusBadge from '../admin/components/StatusBadge'
import {
  getHistory,
  getStatusOptions,
  PAGE_SIZE,
} from './historyService'
import { subscribe, getChangeVersion } from '../shared/scanDataService'
import '../admin/adminDashboard.css'
import './history.css'

function ComplianceScore({ score }) {
  if (score === null || score === undefined) {
    return <span className="score-cell score-cell--empty">—</span>
  }
  const tone =
    score >= 75 ? 'score--high' : score >= 50 ? 'score--mid' : 'score--low'
  return (
    <span className={`score-cell ${tone}`}>
      {score}
      <span className="score-cell__suffix">%</span>
    </span>
  )
}

function ViolationsCell({ count }) {
  if (!count) {
    return <span className="violations-cell violations-cell--none">None</span>
  }
  return (
    <span className={`violations-cell ${count > 1 ? 'violations-cell--many' : ''}`}>
      {count}
    </span>
  )
}

function Pagination({ page, totalPages, onChange }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="history-pagination">
      <span className="history-pagination__info">
        Page {page} of {totalPages}
      </span>
      <div className="history-pagination__controls">
        <button
          type="button"
          className="history-pagination__btn"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`history-pagination__num ${
              p === page ? 'history-pagination__num--active' : ''
            }`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          className="history-pagination__btn"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function ScanHistory() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')
  const [filters, setFilters] = useState({ search: '', status: '', date: '' })
  const [page, setPage] = useState(1)

  const statusOptions = getStatusOptions()

  const changeVersion = useSyncExternalStore(
    (callback) => subscribe(callback),
    getChangeVersion
  )

  const result = useMemo(() => {
    void changeVersion
    return getHistory({ page, pageSize: PAGE_SIZE, filters })
  }, [page, filters, changeVersion])

  const applyFilters = (e) => {
    e.preventDefault()
    setPage(1)
    setFilters({ search, status, date })
  }

  const handleView = (scan) => {
    // TODO(Member 5): Navigate to full scan report once Reports module is built.
    console.log('View scan:', scan)
  }

  const handlePdf = (scan) => {
    // TODO(Member 5): Generate / download PDF report.
    // For now log to console (UI testing).
    console.log('Download PDF for scan:', scan)
  }

  return (
    <AdminLayout>
      <div className="admin-page history-page">
        <div className="admin-page__header">
          <div>
            <h1 className="admin-page__heading">Scan History</h1>
            <p className="admin-page__subheading">
              View and manage previous product scans
            </p>
          </div>
        </div>

        <form className="history-filters" onSubmit={applyFilters}>
          <div className="history-filters__search">
            <Search size={16} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by Product Name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="history-filters__field">
            <label htmlFor="history-status">
              <Filter size={15} aria-hidden="true" />
              <span>Status</span>
            </label>
            <select
              id="history-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="history-filters__field">
            <label htmlFor="history-date">Date</label>
            <input
              id="history-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <button type="submit" className="history-filters__button">
            <Search size={16} aria-hidden="true" />
            Search
          </button>
        </form>

        <div className="dashboard-panel history-panel">
          <div className="recent-scans__scroll">
            <table className="recent-scans__table history-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Product Name</th>
                  <th>Scan Date &amp; Time</th>
                  <th>Compliance Score</th>
                  <th>Status</th>
                  <th>Violations</th>
                  <th>Officer/User</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.scans.map((scan, index) => (
                  <tr key={scan.id}>
                    <td className="history-table__sno">
                      {(result.page - 1) * result.pageSize + index + 1}
                    </td>
                    <td className="product-cell">
                      <span className="product-cell__id">{scan.id}</span>
                      {scan.productName}
                    </td>
                    <td className="date-cell">{scan.scanDateTime}</td>
                    <td>
                      <ComplianceScore score={scan.complianceScore} />
                    </td>
                    <td>
                      <StatusBadge status={scan.status} />
                    </td>
                    <td>
                      <ViolationsCell count={scan.violations} />
                    </td>
                    <td className="officer-cell">{scan.officer}</td>
                    <td>
                      <div className="history-actions">
                        <button
                          type="button"
                          className="history-actions__btn"
                          onClick={() => handleView(scan)}
                          aria-label="View"
                          title="View"
                        >
                          <Eye size={15} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="history-actions__btn history-actions__btn--pdf"
                          onClick={() => handlePdf(scan)}
                          aria-label="PDF"
                          title="Download PDF"
                        >
                          <PdfIcon size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {result.scans.length === 0 && (
                  <tr>
                    <td className="history-table__empty" colSpan="8">
                      No scans found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            onChange={setPage}
          />
        </div>
      </div>
    </AdminLayout>
  )
}

export default ScanHistory
