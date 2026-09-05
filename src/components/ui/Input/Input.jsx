import { classNames } from '../../../utils/classNames'
import './Input.css'

/**
 * Labelled text/number input with validation affordances.
 * Uses a generated `id` from `name` when no explicit `id` is passed.
 */
export default function Input({
  id,
  label,
  name,
  hint,
  error,
  required = false,
  disabled = false,
  className = '',
  type = 'text',
  ...rest
}) {
  const inputId = id || (name ? `input-${name}` : undefined)
  const describedBy =
    hint || error ? `${inputId || 'input'}-help` : undefined

  return (
    <div className={classNames('field', disabled && 'field--disabled', className)}>
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
          {required && (
            <span className="field__required" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        disabled={disabled}
        required={required}
        className={classNames('field__input', error && 'field__input--error')}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
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