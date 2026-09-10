import { Link } from 'react-router-dom'
import Icon from '../../ui/Icon/Icon'
import './Breadcrumb.css'

export default function Breadcrumb({ items = [], className = '' }) {

  if (!items.length) return null

  return (
    <nav className={`breadcrumb ${className}`} aria-label="Breadcrumb">
      <ol className="breadcrumb__list">
        <li className="breadcrumb__item">
          <Link to="/" className="breadcrumb__link">
            <Icon name="home" size={14} />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={item.to || item.label} className="breadcrumb__item">
              <span className="breadcrumb__separator" aria-hidden="true">
                /
              </span>
              {isLast || !item.to ? (
                <span className="breadcrumb__current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="breadcrumb__link">
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
