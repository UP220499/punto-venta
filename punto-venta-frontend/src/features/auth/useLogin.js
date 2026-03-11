import { useMutation } from '@tanstack/react-query'
import api from '../../lib/axios'
import { setSession } from '../../lib/session'

async function loginRequest(credentials) {
  // POST /auth/login → { access_token: "JWT" }
  const { data } = await api.post('/auth/login', credentials)
  return data
}

export function useLogin() {
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      setSession(data.access_token)
    },
  })
}
