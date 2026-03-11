import { createContext, useContext, useState } from 'react'
import {
  setSession as persistSession,
  clearSession,
  getStoredUser,
  isAuthenticated as checkStoredAuth,
} from '../lib/session'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Inicializar solo si la sesión almacenada es válida (token presente y no expirado)
  const [user, setUser] = useState(() =>
    checkStoredAuth() ? getStoredUser() : null,
  )

  /**
   * Llamar con el access_token recibido del backend tras un login exitoso.
   * Persiste la sesión y actualiza el estado React para propagar re-renders.
   */
  function login(accessToken) {
    persistSession(accessToken)
    setUser(getStoredUser())
  }

  /**
   * Limpia la sesión completa. El componente que llama maneja la navegación.
   */
  function logout() {
    clearSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
