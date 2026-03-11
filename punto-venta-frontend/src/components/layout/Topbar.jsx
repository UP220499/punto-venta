import { useLocation } from 'react-router-dom'
import { getStoredUser } from '../../lib/session'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/sales': 'Ventas',
  '/products': 'Productos',
  '/inventory': 'Inventario',
  '/reports': 'Reportes',
  '/payment-methods': 'Métodos de pago',
  '/users': 'Usuarios',
  '/roles': 'Roles y permisos',
  '/settings': 'Configuración',
}

export function Topbar() {
  const user = getStoredUser()
  const { pathname } = useLocation()
  const pageTitle = PAGE_TITLES[pathname] ?? 'Panel'

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-gray-800 font-semibold text-base">{pageTitle}</h1>

      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-indigo-600 text-xs font-bold uppercase select-none">
            {user?.username?.[0] ?? 'U'}
          </span>
        </div>
        <span className="text-sm text-gray-700 font-medium">{user?.username ?? 'Usuario'}</span>
      </div>
    </header>
  )
}
