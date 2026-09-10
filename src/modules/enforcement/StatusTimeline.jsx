import { classNames } from '../../utils/classNames'
import { STATUS_META, ENFORCEMENT_STATUS } from './constants'
import './StatusTimeline.css'

const STEPS = [
  { key: ENFORCEMENT_STATUS.PENDING_RESPONSE },
  { key: ENFORCEMENT_STATUS.RESPONSE_SUBMITTED },
  { key: ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED },
  { key: 'resolution', label: 'Resolution', note: 'Compliant / Violation Confirmed' },
  { key: ENFORCEMENT_STATUS.CASE_CLOSED },
]

const ORDER_INDEX = {
  [ENFORCEMENT_STATUS.PENDING_RESPONSE]: 0,
  [ENFORCEMENT_STATUS.RESPONSE_SUBMITTED]: 1,
  [ENFORCEMENT_STATUS.REINSPECTION_SCHEDULED]: 2,
  [ENFORCEMENT_STATUS.COMPLIANT]: 3,
  [ENFORCEMENT_STATUS.VIOLATION_CONFIRMED]: 3,
  [ENFORCEMENT_STATUS.CASE_CLOSED]: 4,
}

/**
 * Final-status progress ladder for Member 4 enforcement cases.
 * Shows the full lifecycle with the current status highlighted.
 */
export default function StatusTimeline({ status, className = '' }) {
  const currentIndex = ORDER_INDEX[status] ?? -1

  return (
    <ol className={classNames('status-timeline', className)} aria-label="Case status progress">
      {STEPS.map((step, index) => {
        const meta = step.key !== 'resolution' ? STATUS_META[step.key] : null
        const isCurrent = index === currentIndex
        const isPast = currentIndex > index
        const isFuture = currentIndex < index

        return (
          <li
            key={step.key}
            className={classNames(
              'status-timeline__step',
              isCurrent && 'is-current',
              isPast && 'is-past',
              isFuture && 'is-future',
            )}
          >
            <span className="status-timeline__marker" aria-hidden="true" />
            <div className="status-timeline__content">
              <p className="status-timeline__label">{step.label || meta.label}</p>
              {step.note && <p className="status-timeline__note">{step.note}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}