import { useState } from 'react'

/**
 * Stateful hook for the toast notification container.
 * Returns toasts, an addToast(message, tone, duration) helper and
 * a dismissToast(id) helper.
 */
export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = (message, tone = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, tone, duration }])
  }

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toasts, addToast, dismissToast }
}