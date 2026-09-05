import { classNames } from '../../../utils/classNames'
import './Card.css'

/**
 * Plain, bordered card used to group content in a hierarchy.
 */
export default function Card({
  title,
  subtitle,
  meta,
  children,
  footer,
  className = '',
  as: Element = 'section',
  ...rest
}) {
  return (
    <Element
      className={classNames('card', (title || subtitle) && 'card--has-header', className)}
      {...rest}
    >
      {(title || subtitle || meta) && (
        <header className="card__header">
          <div className="card__heading">
            {title && <h2 className="card__title">{title}</h2>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {meta && <div className="card__meta">{meta}</div>}
        </header>
      )}
      {children && (
        <div className="card__body">
          {children}
        </div>
      )}
      {footer && <footer className="card__footer">{footer}</footer>}
    </Element>
  )
}