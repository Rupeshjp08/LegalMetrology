import { classNames } from '../../../utils/classNames'
import './Select.css'

export default function Select({
  id,
  label,
  name,
  hint,
  error,
  required = false,
  disabled = false,
  options = [],
  placeholder = 'Select an option',
  className = '',
  ...rest
}) {
  const selectId = id || (name ? `select-${name}` : undefined)
  const describedBy =
    hint || error ? `${selectId || 'select'}-help` : undefined

  return (
    <div className={classNames('field', disabled && 'field--disabled', className)}>
      {label && (
        <label className="field__label" htmlFor={selectId}>
          {label}
          {required && (
            <span className="field__required" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        disabled={disabled}
        required={required}
        className={classNames('field__input field__select', error && 'field__input--error')}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={describedBy} className="field__message field__message--error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={describedBy} className="field__message field__message--hint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
