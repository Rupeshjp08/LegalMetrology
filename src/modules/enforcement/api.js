import apiClient from '../../services/api/apiClient'
import { ApiEndpoints } from '../../services/api/endpoints'
import { mergeCase } from './adapter'

/**
 * Member 4 API layer.
 *
 * All calls go through the shared `apiClient` (base URL from the environment:
 * `VITE_API_BASE_URL` or the `/api` dev proxy). Errors are normalized so the
 * UI can surface the backend's message directly.
 */

function toError(error) {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    'Something went wrong.'
  const err = new Error(message)
  err.status = error?.response?.status
  return err
}

// ─── Notifications ────────────────────────────────────────────────────────

export async function fetchNotifications() {
  try {
    const { data } = await apiClient.get(ApiEndpoints.MEMBER4.NOTIFICATIONS)
    return data?.data || []
  } catch (error) {
    throw toError(error)
  }
}

export async function fetchNotification(id) {
  try {
    const { data } = await apiClient.get(ApiEndpoints.MEMBER4.NOTIFICATION(id))
    return data?.data || null
  } catch (error) {
    if (error?.response?.status === 404) return null
    throw toError(error)
  }
}

export async function updateNotification(id, patch) {
  try {
    const { data } = await apiClient.put(ApiEndpoints.MEMBER4.NOTIFICATION(id), patch)
    return data?.data || null
  } catch (error) {
    throw toError(error)
  }
}

// ─── Company Responses ────────────────────────────────────────────────────

export async function fetchResponses(notificationId) {
  try {
    const { data } = await apiClient.get(
      ApiEndpoints.MEMBER4.RESPONSES_BY_NOTIFICATION(notificationId),
    )
    return data?.data || []
  } catch (error) {
    if (error?.response?.status === 404) return []
    throw toError(error)
  }
}

export async function createResponse(payload) {
  try {
    const { data } = await apiClient.post(ApiEndpoints.MEMBER4.RESPONSES, payload)
    return data?.data || null
  } catch (error) {
    throw toError(error)
  }
}

// ─── Re-inspections ───────────────────────────────────────────────────────

export async function fetchReinspectionByNotification(notificationId) {
  try {
    const { data } = await apiClient.get(
      ApiEndpoints.MEMBER4.REINSPECTIONS_BY_NOTIFICATION(notificationId),
    )
    return data?.data || null
  } catch (error) {
    if (error?.response?.status === 404) return null
    throw toError(error)
  }
}

export async function updateReinspection(id, patch) {
  try {
    const { data } = await apiClient.put(ApiEndpoints.MEMBER4.REINSPECTION(id), patch)
    return data?.data || null
  } catch (error) {
    throw toError(error)
  }
}

export async function createReinspection(payload) {
  try {
    const { data } = await apiClient.post(ApiEndpoints.MEMBER4.REINSPECTIONS, payload)
    return data?.data || null
  } catch (error) {
    throw toError(error)
  }
}

// ─── Full case loader (notification + latest response + latest re-inspection) ─

export async function fetchEnforcementCase(id) {
  const [notification, responses, reinspection] = await Promise.all([
    fetchNotification(id),
    fetchResponses(id),
    fetchReinspectionByNotification(id),
  ])
  return mergeCase(notification, responses, reinspection)
}

export { mergeCase }