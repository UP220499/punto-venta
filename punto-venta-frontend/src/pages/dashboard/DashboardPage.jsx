import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const KPI_CARDS = [
  {
    title: 'Ventas hoy',
    value: '—',
    note: 'Ver en Reportes',
    color: 'indigo',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Tickets abiertos',
    value: '—',
    note: 'Ver en Historial de ventas',
    color: 'emerald',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
      </svg>
    ),
  },
  {
    title: 'Productos activos',
    value: '—',
    note: 'Ver en Productos',
    color: 'amber',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    title: 'Usuarios activos',
    value: '—',
    note: 'Ver en Usuarios',
    color: 'sky',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
]

const COLOR_CLASSES = {
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-100', dot: 'bg-indigo-400' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100', dot: 'bg-emerald-400' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100', dot: 'bg-amber-400' },
  sky: { bg: 'bg-sky-50', icon: 'text-sky-600', border: 'border-sky-100', dot: 'bg-sky-400' },
}

const QUICK_ACTIONS = [
  {
    label: 'Nueva venta',
    description: 'Registrar ticket de venta',
    to: '/sales',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
    color: 'indigo',
  },
  {
    label: 'Agregar producto',
    description: 'Crear nuevo producto',
    to: '/products',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
    color: 'emerald',
  },
  {
    label: 'Ver reportes',
    description: 'Análisis y estadísticas',
    to: '/reports',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    color: 'amber',
  },
  {
    label: 'Gestionar usuarios',
    description: 'Crear o editar usuarios',
    to: '/users',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    color: 'sky',
  },
]

const ACTION_COLORS = {
  indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100',
  emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
  amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
  sky: 'bg-sky-50 text-sky-600 group-hover:bg-sky-100',
}

export function DashboardPage() {
  const { user } = useAuth()
  const dateStr = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Encabezado de bienvenida */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.username ?? 'Usuario'}
        </h2>
        <p className="text-sm text-gray-500 mt-1 capitalize">{dateStr}</p>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI_CARDS.map((card) => {
          const c = COLOR_CLASSES[card.color]
          return (
            <div
              key={card.title}
              className={`bg-white rounded-xl border ${c.border} p-5 shadow-sm`}
            >
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <div className={`p-2 rounded-lg ${c.bg} ${c.icon}`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{card.value}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot} opacity-60`} />
                <p className="text-xs text-gray-400">{card.note}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Accesos rápidos */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Accesos rápidos</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-gray-300 hover:shadow-md transition-all"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors ${ACTION_COLORS[action.color]}`}>
                {action.icon}
              </div>
              <p className="text-sm font-semibold text-gray-800 leading-tight">{action.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Resumen operativo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-700">Ventas recientes</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Hoy</span>
          </div>
          <p className="text-xs text-gray-400 mb-5">Últimas transacciones del sistema</p>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-gray-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500">Sin ventas registradas</p>
            <p className="text-xs text-gray-400 mt-1">Los tickets del día aparecerán aquí</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-700">Actividad reciente</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Sistema</span>
          </div>
          <p className="text-xs text-gray-400 mb-5">Últimas acciones de usuarios</p>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-gray-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-500">Sin actividad registrada</p>
            <p className="text-xs text-gray-400 mt-1">El historial de acciones aparecerá aquí</p>
          </div>
        </div>

      </div>
    </div>
  )
}
