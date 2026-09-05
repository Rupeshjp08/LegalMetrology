import { classNames } from '../../../utils/classNames'
import './Textarea.css'

export default function Textarea({
  id,
  label,
  name,
  hint,
  error,
  required = false,
  disabled = false,
  rows = 4,
  className = '',
  ...rest
}) {
  const textareaId = id || (name ? `textarea-${name}` : undefined)
  const describedBy =
    hint || error ? `${textareaId || 'textarea'}-help` : undefined

  return (
    <div className={classNames('field', disabled && 'field--disabled', className)}>
      {label && (
        <label className="field__label" htmlFor={textareaId}>
          {label}
          {required && (
            <span className="field__required" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      <textarea
        id={textareaId}
        name={name}
        rows={rows}
        disabled={disabled}
        required={required}
        className={classNames('field__input field__textarea', error && 'field__input--error')}
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
