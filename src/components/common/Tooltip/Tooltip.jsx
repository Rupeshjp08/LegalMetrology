import { useState } from 'react'
import { classNames } from '../../../utils/classNames'
import './Tooltip.css'

export default function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
}) {
  const [visible, setVisible] = useState(false)

  return (
    <span
      className={classNames('tooltip-wrapper', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <span
          className={classNames('tooltip', `tooltip--${position}`)}
          role="tooltip"
        >
          {content}
        </span>
      )}
    </span>
  )
}
