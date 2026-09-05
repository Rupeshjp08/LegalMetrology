import { useCallback, useState } from 'react'

/**
 * Lightweight modal/layer open-close hook.
 * @returns {{ open: boolean, openModal: fn, closeModal: fn, toggleModal: fn }}
 */
export function useModal(initialOpen = false) {
  const [open, setOpen] = useState(initialOpen)

  const openModal = useCallback(() => setOpen(true), [])
  const closeModal = useCallback(() => setOpen(false), [])
  const toggleModal = useCallback(() => setOpen((prev) => !prev), [])

  return { open, openModal, closeModal, toggleModal }
}