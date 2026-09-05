import axios from 'axios'

/**
 * Central Axios client for the application.
 *
 * Configure VITE_API_BASE_URL in a `.env` file to point at the backend
 * gateway. Defaults to a relative `/api` mount so the Vite dev server
 * can proxy requests during development.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('pclmcs.auth.token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pclmcs.auth.token')
      localStorage.removeItem('pclmcs.auth.user')
    }

    if (error.code === 'ECONNABORTED') {
      const timeoutError = new Error('Request timed out. Please try again.')
      timeoutError.isTimeout = true
      return Promise.reject(timeoutError)
    }

    return Promise.reject(error)
  },
)

export default apiClient