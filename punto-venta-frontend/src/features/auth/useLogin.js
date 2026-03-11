import { useMutation } from '@tanstack/react-query'
import api from '../../lib/axios'

async function loginRequest(credentials) {
  // POST /auth/login → { access_token: "JWT" }
  const { data } = await api.post('/auth/login', credentials)
  return data
}

// Solo llama a la API. El componente decide qué hacer en onSuccess
// (persistir sesión via AuthContext.login, navegar, etc.)
export function useLogin() {
  return useMutation({ mutationFn: loginRequest })
}
