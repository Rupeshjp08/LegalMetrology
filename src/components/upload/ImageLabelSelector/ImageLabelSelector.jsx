import { IMAGE_LABELS } from '../../../utils/fileValidation'
import './ImageLabelSelector.css'

/**
 * Reusable selector for the label of an uploaded product image.
 * Options: Front Label, Back Label, Side Label, Other.
 */
export default function ImageLabelSelector({
  id,
  value,
  onChange,
  label = 'Image type',
}) {
  return (
    <div className="label-selector">
      <label className="label-selector__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="label-selector__select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {IMAGE_LABELS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}