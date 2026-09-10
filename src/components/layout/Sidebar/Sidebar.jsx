import { NavLink } from 'react-router-dom'
import { classNames } from '../../../utils/classNames'
import Icon from '../../ui/Icon/Icon'
import './Sidebar.css'

export default function Sidebar({ items = [], title, className = '' }) {
  return (
    <aside className={classNames('sidebar', className)}>
      {title && <h2 className="sidebar__title">{title}</h2>}
      <nav aria-label={title || 'Sidebar'}>
        <ul className="sidebar__list">
          {items.map((item) => (
            <li key={item.to} className="sidebar__item">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  classNames('sidebar__link', isActive && 'is-active')
                }
              >
                {item.icon && (
                  <Icon name={item.icon} size={18} className="sidebar__icon" />
                )}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="sidebar__badge">{item.badge}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
