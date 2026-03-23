import { useEffect } from 'react'
import { useBranding } from '../lib/useBranding'

/**
 * Sets CSS custom properties on :root so any component can use
 * bg-[--brand], hover:bg-[--brand-hover], etc. without importing useBranding.
 * Render once near the top of the component tree (inside QueryClientProvider).
 */
export function BrandingVars() {
  const { primaryColor, surfaceDark } = useBranding()

  useEffect(() => {
    const s = document.documentElement.style
    s.setProperty('--brand', primaryColor)
    s.setProperty('--brand-surface', surfaceDark)
  }, [primaryColor, surfaceDark])

  return null
}
