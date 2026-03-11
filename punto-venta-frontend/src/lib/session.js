const TOKEN_KEY = 'pos_access_token'
const USER_KEY = 'pos_user'

function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Guarda el access_token y extrae la info del usuario del JWT.
 * El backend solo devuelve { access_token }, así que decodificamos
 * el payload para obtener: userId, businessId, username, roles, permissions.
 */
export function setSession(accessToken) {
  localStorage.setItem(TOKEN_KEY, accessToken)
  const payload = decodeJwtPayload(accessToken)
  if (payload) {
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        userId: payload.sub,
        businessId: payload.business_id,
        username: payload.username,
        roles: payload.roles ?? [],
        permissions: payload.permissions ?? [],
      }),
    )
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isAuthenticated() {
  const token = getAccessToken()
  if (!token) return false
  const payload = decodeJwtPayload(token)
  if (!payload) return false
  // Verificar expiración si el token incluye exp
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    clearSession()
    return false
  }
  return true
}
