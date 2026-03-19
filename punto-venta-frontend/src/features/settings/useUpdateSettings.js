import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateSettings } from './settingsApi'

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateSettings,
    // Immediately update the cached settings with the response — no extra refetch needed
    onSuccess: (data) => qc.setQueryData(['settings'], data),
  })
}
