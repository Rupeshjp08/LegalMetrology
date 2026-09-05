import { classNames } from '../../../utils/classNames'
import './PageHeader.css'

/**
 * Consistent page header block: overline / title / description.
 */
export default function PageHeader({ overline, title, description, actions, className = '' }) {
  return (
    <div className={classNames('page-header', className)}>
      <div className="page-header__text">
        {overline && <p className="page-header__overline">{overline}</p>}
        <h1 className="page-header__title">{title}</h1>
        {description && <p className="page-header__description">{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  )
}