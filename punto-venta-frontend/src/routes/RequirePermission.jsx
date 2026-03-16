import { Link } from 'react-router-dom'
import { usePermission } from '../lib/permissions'

/* ── AccessDenied ─────────────────────────────────────────── */

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-8 h-8 text-gray-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-800">Sin acceso</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-xs">
          No tienes permiso para ver esta sección. Contacta a tu administrador si crees que es un error.
        </p>
      </div>
      <Link
        to="/dashboard"
        className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
      >
        Ir al Dashboard
      </Link>
    </div>
  )
}

/* ── RequirePermission ────────────────────────────────────── */

/**
 * Renders children if the current user has the required permission.
 * Shows an AccessDenied screen otherwise (no automatic redirect).
 *
 * Usage:
 *   <RequirePermission code={PERMISSIONS.PRODUCT_READ}>
 *     <ProductsPage />
 *   </RequirePermission>
 */
export function RequirePermission({ code, children }) {
  const canAccess = usePermission(code)
  if (!canAccess) return <AccessDenied />
  return children
}
