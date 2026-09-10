import { Eye } from 'lucide-react'
import StatusBadge from './StatusBadge'
import '../adminDashboard.css'

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

function RecentScans({ scans, onViewResult }) {
  return (
    <div className="dashboard-panel recent-scans">
      <div className="dashboard-panel__header">
        <h2 className="dashboard-panel__title">Recent Scan Activity</h2>
        <span className="dashboard-panel__hint">Latest 8 scans</span>
      </div>

      <div className="recent-scans__scroll">
        <table className="recent-scans__table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Scan Date &amp; Time</th>
              <th>Compliance Score</th>
              <th>Status</th>
              <th>Violations</th>
              <th>Officer/User</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((scan) => (
              <tr key={scan.id}>
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
                  <button
                    type="button"
                    className="btn-view"
                    onClick={() => onViewResult && onViewResult(scan)}
                  >
                    <Eye size={16} aria-hidden="true" />
                    View
                  </button>
                </td>
              </tr>
            ))}
            {scans.length === 0 && (
              <tr>
                <td className="recent-scans__empty" colSpan="7">
                  No scan data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RecentScans
