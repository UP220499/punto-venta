import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'
import { AuthLayout } from '../components/layout/AuthLayout'
import { LoginPage } from '../pages/login/LoginPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { ProductsPage } from '../pages/products/ProductsPage'
import { InventoryPage } from '../pages/inventory/InventoryPage'

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
          { path: '/products', element: <ProductsPage /> },
          { path: '/inventory', element: <InventoryPage /> },
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
