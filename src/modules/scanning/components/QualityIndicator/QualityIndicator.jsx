import { classNames } from '../../../../utils/classNames'
import { QUALITY_LEVELS, QUALITY_LEVEL_LABELS } from '../../utils/imageQualityAnalysis'
import './QualityIndicator.css'

/**
 * Small, accessible status pill for an image quality level.
 * Tone is derived from the level (good / warning / poor).
 */
export default function QualityIndicator({ level, label, className = '', size = 'md' }) {
  const resolvedLevel = Object.prototype.hasOwnProperty.call(QUALITY_LEVEL_LABELS, level)
    ? level
    : QUALITY_LEVELS.WARNING

  const indicatorLabel = label || QUALITY_LEVEL_LABELS[resolvedLevel]

  return (
    <span
      className={classNames(
        'quality-indicator',
        `quality-indicator--${resolvedLevel}`,
        size === 'sm' && 'quality-indicator--sm',
        className,
      )}
      role="status"
      aria-label={`Quality: ${indicatorLabel}`}
    >
      <span className="quality-indicator__dot" aria-hidden="true" />
      <span className="quality-indicator__label">{indicatorLabel}</span>
    </span>
  )
}