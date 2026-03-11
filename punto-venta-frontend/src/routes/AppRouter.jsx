import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { isAuthenticated } from '../lib/session'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicRoute } from './PublicRoute'
import { AuthLayout } from '../components/layout/AuthLayout'
import { LoginPage } from '../pages/login/LoginPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'

const router = createBrowserRouter([
  {
    // Ruta raíz: redirige según el estado de sesión
    path: '/',
    element: <Navigate to={isAuthenticated() ? '/dashboard' : '/login'} replace />,
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
