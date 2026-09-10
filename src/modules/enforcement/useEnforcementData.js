import { useCallback, useEffect, useState } from 'react'
import { getVersion, subscribe } from './store'

/**
 * Reactive data hook for Member 4.
 *
 * Supports both sync loaders (legacy) and async loaders returning a Promise
 * (backend API). Re-runs the loader when the store version changes (e.g. after
 * a response or re-inspection update) so pages stay in sync with the backend.
 *
 * `loader` must be referentially stable – wrap it in useCallback.
 */
export function useEnforcementData(loader, options = {}) {
  const { delay = 450 } = options
  const [version, setVersion] = useState(() => getVersion())
  const [state, setState] = useState(() => ({
    data: null,
    loading: true,
    error: null,
  }))

  useEffect(() => subscribe(() => setVersion(getVersion())), [])

  const run = useCallback(() => {
    let cancelled = false
    setState((prev) => ({ data: prev.data, loading: true, error: null }))

    const timer = window.setTimeout(async () => {
      try {
        const data = await loader()
        if (!cancelled) setState({ data, loading: false, error: null })
      } catch (error) {
        if (!cancelled) {
          setState((prev) => ({ data: prev.data, loading: false, error }))
        }
      }
    }, delay)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loader, delay, version])

  useEffect(() => run(), [run])

  return { ...state, version }
}

/**
 * Small helper for "today" in YYYY-MM-DD used by date inputs.
 */
export function toISODate(value) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

/**
 * Formats an ISO date for display, e.g. "12 Aug 2026".
 * Accepts Date, ISO datetime or YYYY-MM-DD strings.
 */
export function formatDate(iso) {
  if (!iso) return '—'
  let date = iso instanceof Date ? iso : new Date(iso)
  if (Number.isNaN(date.getTime())) {
    date = new Date(`${iso}T00:00:00`)
  }
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}