import { classNames } from '../../../utils/classNames'
import './LoadingSpinner.css'

const SIZES = {
  sm: 'spinner--sm',
  md: 'spinner--md',
  lg: 'spinner--lg',
}

export default function LoadingSpinner({
  size = 'md',
  label = 'Loading',
  className = '',
}) {
  return (
    <div
      className={classNames('spinner', SIZES[size] || SIZES.md, className)}
      role="status"
      aria-label={label}
    >
      <div className="spinner__circle" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
