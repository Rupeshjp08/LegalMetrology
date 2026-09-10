import { classNames } from '../../../../utils/classNames'
import Icon from '../../../../components/ui/Icon/Icon'
import LoadingSpinner from '../../../../components/feedback/LoadingSpinner/LoadingSpinner'
import {
  QUALITY_LEVELS,
} from '../../utils/imageQualityAnalysis'
import QualityIndicator from '../QualityIndicator/QualityIndicator'
import './QualityResult.css'

const CHECK_ICONS = {
  good: <Icon name="check-circle" size={16} />,
  warning: <Icon name="alert-triangle" size={16} />,
  poor: <Icon name="close" size={16} />,
}

function CheckRow({ check }) {
  return (
    <li className={`quality-result__row quality-result__row--${check.level}`}>
      <span className="quality-result__row-icon" aria-hidden="true">
        {CHECK_ICONS[check.level]}
      </span>
      <span className="quality-result__row-label">{check.label}</span>
      <span className="quality-result__row-value">
        <span className="quality-result__row-text">{check.value}</span>
        <span className="quality-result__row-level">
          {check.level === QUALITY_LEVELS.GOOD
            ? 'Good'
            : check.level === QUALITY_LEVELS.WARNING
              ? 'Fair'
              : 'Poor'}
        </span>
      </span>
    </li>
  )
}

/**
 * Government-style result panel for a completed image quality analysis.
 * Shows every metric, the overall level, the quality score and the
 * concrete reasons behind the outcome.
 */
export default function QualityResult({ result, compact = false, className = '' }) {
  if (!result) return null

  const showProblems = !compact || result.level === QUALITY_LEVELS.POOR

  return (
    <div
      className={classNames(
        'quality-result',
        `quality-result--${result.level}`,
        compact && 'quality-result--compact',
        className,
      )}
      role="status"
      aria-label={`Image quality: ${result.summary}`}
    >
      <header className="quality-result__header">
        <div className="quality-result__heading">
          <p className="quality-result__title">Image Quality Check</p>
          <p className="quality-result__summary">{result.summary}</p>
        </div>
        <div className="quality-result__overall">
          <QualityIndicator level={result.level} />
          <span className="quality-result__score" title="Overall quality score">
            Quality Score: {result.score}%
          </span>
        </div>
      </header>

      <ul className="quality-result__list">
        {result.checks.map((check) => (
          <CheckRow key={check.name} check={check} />
        ))}
      </ul>

      {result.problems.length > 0 && showProblems && (
        <div className="quality-result__problems" role="alert">
          <p className="quality-result__problems-title">
            <Icon name="alert-triangle" size={16} /> Problems detected
          </p>
          <ul className="quality-result__problems-list">
            {result.problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
          {result.suggestions.length > 0 && (
            <ul className="quality-result__suggestions">
              {result.suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export function QualityResultLoading({ className = '' }) {
  return (
    <div
      className={classNames('quality-result quality-result--loading', className)}
      role="status"
      aria-label="Analyzing image quality"
    >
      <LoadingSpinner />
      <span>Analyzing image quality…</span>
    </div>
  )
}

export function QualityResultError({ message = 'The image could not be analyzed.', className = '' }) {
  return (
    <div
      className={classNames('quality-result quality-result--error', className)}
      role="alert"
    >
      <Icon name="alert" size={16} />
      <span>{message}</span>
    </div>
  )
}