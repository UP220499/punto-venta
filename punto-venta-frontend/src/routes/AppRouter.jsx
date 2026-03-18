import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'
import { RequirePermission } from './RequirePermission'
import { PERMISSIONS } from '../lib/permissions'
import { AuthLayout } from '../components/layout/AuthLayout'
import { LoginPage } from '../pages/login/LoginPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { ProductsPage } from '../pages/products/ProductsPage'
import { InventoryPage } from '../pages/inventory/InventoryPage'
import { SalesPage } from '../pages/sales/SalesPage'
import { TicketsHistoryPage } from '../pages/tickets/TicketsHistoryPage'
import { UsersPage } from '../pages/users/UsersPage'
import { RolesPage } from '../pages/roles/RolesPage'
import { PaymentMethodsPage } from '../pages/payment-methods/PaymentMethodsPage'
import { ReportsPage } from '../pages/reports/ReportsPage'

// Redirección reactiva: responde al estado de auth en tiempo real
function RootRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    // Rutas públicas: si ya hay sesión, redirige al dashboard
    element: <PublicRoute />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    // Rutas protegidas: si no hay sesión, redirige al login
    element: <ProtectedRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/products',  element: <RequirePermission code={PERMISSIONS.PRODUCT_READ}><ProductsPage /></RequirePermission> },
          { path: '/inventory', element: <RequirePermission code={PERMISSIONS.INVENTORY_READ}><InventoryPage /></RequirePermission> },
          { path: '/sales',     element: <RequirePermission code={PERMISSIONS.SALE_CREATE}><SalesPage /></RequirePermission> },
          { path: '/tickets',   element: <RequirePermission code={PERMISSIONS.SALE_VIEW}><TicketsHistoryPage /></RequirePermission> },
          { path: '/users',     element: <RequirePermission code={PERMISSIONS.USER_READ}><UsersPage /></RequirePermission> },
          { path: '/roles',            element: <RequirePermission code={PERMISSIONS.ROLE_READ}><RolesPage /></RequirePermission> },
          { path: '/payment-methods', element: <RequirePermission code={PERMISSIONS.PAYMENT_METHOD_READ}><PaymentMethodsPage /></RequirePermission> },
          { path: '/reports',         element: <RequirePermission code={PERMISSIONS.REPORT_READ}><ReportsPage /></RequirePermission> },
          // Agregar nuevas rutas aquí dentro de AuthLayout
        ],
      },
    ],
  },
  {
    // Fallback: cualquier ruta desconocida vuelve al inicio
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
