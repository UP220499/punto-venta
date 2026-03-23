import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useBranding } from '../../lib/useBranding'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/sales': 'Ventas',
  '/tickets': 'Historial de ventas',
  '/products': 'Productos',
  '/inventory': 'Inventario',
  '/reports': 'Reportes',
  '/payment-methods': 'Métodos de pago',
  '/users': 'Usuarios',
  '/roles': 'Roles y permisos',
  '/settings': 'Configuración',
  '/audit': 'Auditoría',
}

export function Topbar() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { primaryColor } = useBranding()
  const pageTitle = PAGE_TITLES[pathname] ?? 'Panel'
  const initial = user?.username?.[0]?.toUpperCase() ?? 'U'
  const primaryRole = user?.roles?.[0] ?? null

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-gray-800 font-semibold text-base">{pageTitle}</h1>

      <div className="flex items-center gap-3">
        {primaryRole && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 uppercase tracking-wide">
            {primaryRole}
          </span>
        )}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: primaryColor }}>
            <span className="text-white text-xs font-bold select-none">{initial}</span>
          </div>
          <span className="text-sm text-gray-700 font-medium hidden sm:block">
            {user?.username ?? 'Usuario'}
          </span>
        </div>
      </div>
    </header>
  )
}
