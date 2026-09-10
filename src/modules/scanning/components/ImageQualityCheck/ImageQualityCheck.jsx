import { classNames } from '../../../../utils/classNames'
import Icon from '../../../../components/ui/Icon/Icon'
import LoadingSpinner from '../../../../components/feedback/LoadingSpinner/LoadingSpinner'
import {
  QUALITY_LEVELS,
} from '../../utils/imageQualityAnalysis'
import ImageQualityCard from '../ImageQualityCard/ImageQualityCard'
import QualityResult, {
  QualityResultLoading,
  QualityResultError,
} from '../QualityResult/QualityResult'
import './ImageQualityCheck.css'

function computeOverall(entries) {
  if (entries.length === 0) return { level: null, analyzing: false, poorCount: 0, warningCount: 0 }
  const analyzing = entries.some((entry) => entry.status === 'loading')
  const failures = entries.filter((entry) => entry.status === 'error')
  const done = entries.filter((entry) => entry.status === 'done' && entry.result)
  const poorCount = entries.filter(
    (entry) => entry.status === 'done' && entry.result && entry.result.level === QUALITY_LEVELS.POOR,
  ).length
  const warningCount = entries.filter(
    (entry) =>
      entry.status === 'done' && entry.result && entry.result.level === QUALITY_LEVELS.WARNING,
  ).length

  let level = QUALITY_LEVELS.GOOD
  if (poorCount > 0 || failures.length > 0) level = QUALITY_LEVELS.POOR
  else if (warningCount > 0) level = QUALITY_LEVELS.WARNING

  return { level, analyzing, poorCount, warningCount, failures: failures.length, done: done.length }
}

const OVERALL_MESSAGES = {
  good: {
    icon: 'check-circle',
    title: 'All images are suitable for processing.',
    body: 'Image quality is sufficient for OCR and label analysis.',
    tone: 'success',
  },
  warning: {
    icon: 'alert-triangle',
    title: 'Some images may affect extraction accuracy.',
    body: 'Image quality may work, but could reduce OCR accuracy. You may continue or improve the images first.',
    tone: 'warning',
  },
  poor: {
    icon: 'alert',
    title: 'One or more images are not suitable for processing.',
    body: 'Please capture or upload clearer images before continuing.',
    tone: 'error',
  },
}

/**
 * Image Quality Check section. Lists every selected image with its
 * live quality analysis and shows an overall readiness summary.
 *
 * Single image: desktop uses a two-column layout with the image
 * preview on the left and the full analysis panel on the right.
 * Multiple images: a per-image grid with score + View / Replace /
 * Remove / Retake actions.
 */
export default function ImageQualityCheck({
  images,
  results = {},
  onView,
  onRemove,
  onReplace,
  onRetake,
  onPickUpload,
  onContinueAnyway,
  className = '',
}) {
  const entries = images.map((image) => ({
    image,
    entry: results[image.id] || { status: 'idle' },
  }))

  const overall = computeOverall(entries.map(({ entry }) => entry))

  if (images.length === 0) {
    return (
      <section className={classNames('iq-section', className)} aria-label="Image quality check">
        <div className="iq-section__empty">
          <Icon name="image" size={24} />
          <span>Add or capture an image to begin the quality check.</span>
        </div>
      </section>
    )
  }

  const overallMessage = OVERALL_MESSAGES[overall.level] || OVERALL_MESSAGES.good

  if (images.length === 1) {
    const { image, entry } = entries[0]
    const singleResult = entry.status === 'done' && entry.result ? entry.result : null

    return (
      <section
        className={classNames('iq-section', 'iq-section--single', className)}
        aria-label="Image quality check"
      >
        <h2 className="iq-section__title">Image Quality Check</h2>

        {overall.analyzing ? (
          <div className="iq-section__analyzing" role="status">
            <LoadingSpinner />
            <span>Checking image quality…</span>
          </div>
        ) : (
          <div
            className={classNames('iq-section__overall', `iq-section__overall--${overall.level}`)}
            role="status"
            aria-label={overallMessage.title}
          >
            <Icon name={overallMessage.icon} size={20} className="iq-section__overall-icon" />
            <div className="iq-section__overall-text">
              <p className="iq-section__overall-title">{overallMessage.title}</p>
              <p className="iq-section__overall-body">{overallMessage.body}</p>
            </div>
          </div>
        )}

        <div className="iq-section__split">
          <div className="iq-section__split-preview">
            <ImageQualityCard
              image={image}
              index={0}
              analysis={entry}
              onView={onView}
              onRemove={onRemove}
              onReplace={onReplace}
              onRetake={onRetake}
              onPickUpload={onPickUpload}
              onContinueAnyway={onContinueAnyway}
              hideResult
            />
          </div>
          <div className="iq-section__split-result">
            {entry.status === 'loading' && <QualityResultLoading />}
            {entry.status === 'error' && (
              <QualityResultError message={entry.message || 'The image could not be analyzed.'} />
            )}
            {entry.status === 'done' && !singleResult && (
              <QualityResultError message="No quality data is available for this image." />
            )}
            {singleResult && <QualityResult result={singleResult} />}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={classNames('iq-section', className)} aria-label="Image quality check">
      <h2 className="iq-section__title">Image Quality Check</h2>

      {overall.analyzing ? (
        <div className="iq-section__analyzing" role="status">
          <LoadingSpinner />
          <span>Checking image quality…</span>
        </div>
      ) : (
        <div
          className={classNames('iq-section__overall', `iq-section__overall--${overall.level}`)}
          role="status"
          aria-label={overallMessage.title}
        >
          <Icon name={overallMessage.icon} size={20} className="iq-section__overall-icon" />
          <div className="iq-section__overall-text">
            <p className="iq-section__overall-title">{overallMessage.title}</p>
            <p className="iq-section__overall-body">{overallMessage.body}</p>
          </div>
        </div>
      )}

      <div className="iq-section__grid">
        {entries.map(({ image, entry }, index) => (
          <ImageQualityCard
            key={image.id}
            image={image}
            index={index}
            analysis={entry}
            onView={onView}
            onRemove={onRemove}
            onReplace={onReplace}
            onRetake={onRetake}
            onPickUpload={onPickUpload}
            onContinueAnyway={onContinueAnyway}
          />
        ))}
      </div>
    </section>
  )
}