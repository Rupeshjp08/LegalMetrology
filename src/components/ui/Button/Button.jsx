import { Link } from 'react-router-dom'
import { classNames } from '../../../utils/classNames'
import Icon from '../Icon/Icon'
import './Button.css'

const VARIANTS = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
  outline: 'btn--outline',
  danger: 'btn--danger',
  success: 'btn--success',
  ghost: 'btn--ghost',
}

const SIZES = {
  sm: 'btn--sm',
  md: 'btn--md',
  lg: 'btn--lg',
}

/**
 * Government-style button.
 * Rendering modes:
 *  - Button element by default
 *  - Router link when `to` is provided
 *  - Anchor when `href` is provided
 *
 * Variants: primary | secondary | outline | danger | success | ghost
 * Sizes: sm | md | lg
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className = '',
  to,
  href,
  ...rest
}) {
  const isDisabled = disabled || loading

  const classes = classNames(
    'btn',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    className,
    isDisabled && 'is-disabled',
    loading && 'is-loading',
    icon && 'btn--has-icon',
  )

  const content = (
    <>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {!loading && icon && iconPosition === 'left' && (
        <Icon name={icon} size={size === 'sm' ? 16 : 18} className="btn__icon" />
      )}
      <span className="btn__label">{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <Icon name={icon} size={size === 'sm' ? 16 : 18} className="btn__icon" />
      )}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} aria-disabled={isDisabled || undefined} {...rest}>
        {content}
      </Link>
    )
  }

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        aria-disabled={isDisabled || undefined}
        {...rest}
      >
        {content}
      </a>
    )
  }

  return (
    <button type={type} className={classes} disabled={isDisabled} {...rest}>
      {content}
    </button>
  )
}