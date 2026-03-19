import { useQuery } from '@tanstack/react-query'
import { getSettings } from './settingsApi'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  })
}
