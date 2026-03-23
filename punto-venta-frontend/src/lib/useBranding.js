import { useQuery } from '@tanstack/react-query'
import { getBranding } from '../features/settings/settingsApi'

const DEFAULTS = {
  business_name: 'Mi Negocio',
  business_subtitle: null,
  brand_logo_url: null,
  brand_primary_color: '#4F46E5',
  brand_surface_dark: '#111827',
}

export function useBranding() {
  const { data } = useQuery({
    queryKey: ['branding'],
    queryFn: getBranding,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
  return {
    businessName:     data?.business_name      || DEFAULTS.business_name,
    businessSubtitle: data?.business_subtitle   || DEFAULTS.business_subtitle,
    logoUrl:          data?.brand_logo_url      || DEFAULTS.brand_logo_url,
    primaryColor:     data?.brand_primary_color || DEFAULTS.brand_primary_color,
    surfaceDark:      data?.brand_surface_dark  || DEFAULTS.brand_surface_dark,
  }
}
