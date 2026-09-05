import LoadingSpinner from '../LoadingSpinner/LoadingSpinner'
import './LoadingOverlay.css'

export default function LoadingOverlay({ label = 'Loading', visible = true }) {
  if (!visible) return null

  return (
    <div className="loading-overlay" role="status" aria-label={label}>
      <div className="loading-overlay__backdrop" />
      <div className="loading-overlay__content">
        <LoadingSpinner size="lg" label={label} />
        <p className="loading-overlay__text">{label}</p>
      </div>
    </div>
  )
}
