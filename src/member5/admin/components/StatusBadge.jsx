import '../adminDashboard.css'

const STATUS_MAP = {
  'Compliant': 'badge--compliant',
  'Minor Issue': 'badge--minor',
  'Major Violation': 'badge--major',
  'Pending': 'badge--pending',
}

export default function StatusBadge({ status }) {
  const className = STATUS_MAP[status] || 'badge--neutral'
  return <span className={`status-badge ${className}`}>{status}</span>
}
