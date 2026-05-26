import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PublicLayout } from './layouts/PublicLayout'
import { DashboardLayout } from './layouts/DashboardLayout'
import LandingPage from './pages/LandingPage'
import DocsPage from './pages/DocsPage'
import ModelsPage from './pages/ModelsPage'
import DashboardPage from './pages/DashboardPage'
import KeysPage from './pages/KeysPage'
import UsagePage from './pages/UsagePage'
import RoutesPage from './pages/RoutesPage'
import { useAuth } from './hooks/useAuth'

function RequireAuth({ children }) {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">Loading…</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/" replace />
  }

  return children
}

function RedirectIfAuthed({ children }) {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export const router = createBrowserRouter([
  // Public routes
  {
    element: <PublicLayout />,
    children: [
      {
        path: '/',
        element: (
          <RedirectIfAuthed>
            <LandingPage />
          </RedirectIfAuthed>
        ),
      },
      {
        path: '/docs',
        element: <DocsPage />,
      },
      {
        path: '/models',
        element: <ModelsPage />,
      },
    ],
  },

  // Protected dashboard routes
  {
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/keys',
        element: <KeysPage />,
      },
      {
        path: '/usage',
        element: <UsagePage />,
      },
      {
        path: '/routes',
        element: <RoutesPage />,
      },
      {
        path: '/docs',
        element: <DocsPage />,
      },
      {
        path: '/models',
        element: <ModelsPage />,
      },
    ],
  },

  // Catch-all
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
