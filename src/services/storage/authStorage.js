const AUTH_STORAGE_KEYS = {
  USER: 'pclmcs.auth.user',
  TOKEN: 'pclmcs.auth.token',
}

export function saveUser(user) {
  localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user))
}

export function getUser() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEYS.USER)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearUser() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER)
}

export function saveToken(token) {
  localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token)
}

export function getToken() {
  return localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN)
}

export function clearToken() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN)
}

export function clearAuth() {
  clearUser()
  clearToken()
}