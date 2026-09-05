import { useRef, useState } from 'react'
import { classNames } from '../../../utils/classNames'
import Icon from '../../ui/Icon/Icon'
import './Dropdown.css'

export default function Dropdown({
  trigger,
  children,
  align = 'left',
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const close = () => setOpen(false)

  return (
    <div className={classNames('dropdown', className)} ref={ref}>
      <button
        type="button"
        className="dropdown__trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {trigger}
        <Icon name="chevron-down" size={14} className="dropdown__chevron" />
      </button>
      {open && (
        <div
          className={classNames('dropdown__menu', `dropdown__menu--${align}`)}
          role="menu"
        >
          {typeof children === 'function' ? children({ close }) : children}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({ children, onClick, className = '' }) {
  return (
    <button
      type="button"
      className={classNames('dropdown__item', className)}
      role="menuitem"
      onClick={onClick}
    >
      {children}
    </button>
  )
}
