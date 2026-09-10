import { classNames } from '../../../utils/classNames'
import './StatusBadge.css'

const STATUS_TONE_MAP = {
  compliant: 'success',
  approved: 'success',
  verified: 'success',
  active: 'success',
  cleared: 'success',
  resumed: 'success',
  'non-compliant': 'danger',
  rejected: 'danger',
  revoked: 'danger',
  suspended: 'danger',
  denied: 'danger',
  warning: 'danger',
  pending: 'warning',
  'under-review': 'warning',
  'in-progress': 'warning',
  review: 'warning',
  defaulted: 'warning',
  info: 'info',
  draft: 'info',
  inactive: 'neutral',
  cancelled: 'neutral',
  closed: 'neutral',
  'in-development': 'info',
}

function humanise(status) {
  if (typeof status !== 'string') return String(status ?? '')
  return status
    .replace(/[-_]/g, ' ')
    .replace(/\w+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1))
}

/**
 * Accessible status indicator.
 * A computer-friendly tone is derived from the status string unless
 * an explicit `tone` is supplied.
 */
export default function StatusBadge({ status, tone, label, className = '' }) {
  const resolvedTone = tone || STATUS_TONE_MAP[status] || 'neutral'
  const badgeLabel = label || humanise(status)

  return (
    <span
      className={classNames('badge', `badge--${resolvedTone}`, className)}
      role="status"
    >
      <span className="badge__dot" aria-hidden="true" />
      <span className="badge__label">{badgeLabel}</span>
    </span>
  )
}