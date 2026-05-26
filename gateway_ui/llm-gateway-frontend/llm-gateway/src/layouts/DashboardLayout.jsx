import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Logo } from '../components/Logo'
import {
  LayoutDashboard, Key, BarChart2, Network, LogOut, Menu, X, ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/keys', label: 'API Keys', icon: Key },
  { to: '/usage', label: 'Usage', icon: BarChart2 },
  { to: '/routes', label: 'Routing', icon: Network },
]

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/keys': 'API Keys',
  '/usage': 'Usage & Analytics',
  '/routes': 'Routing & Models',
}

function UserAvatar({ user }) {
  const url = user?.user_metadata?.avatar_url
  const name = user?.user_metadata?.full_name || user?.email || '?'
  const initials = name.charAt(0).toUpperCase()

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-7 h-7 rounded-full object-cover border border-border"
      />
    )
  }
  return (
    <div className="w-7 h-7 rounded-full bg-accent-primary/20 border border-border flex items-center justify-center">
      <span className="text-xs font-semibold text-accent-primary">{initials}</span>
    </div>
  )
}

function SidebarContent({ onNavClick, signOut }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#d8cdbd]/60">
        <Logo size={26} showWordmark={true} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5" aria-label="Dashboard navigation">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                isActive
                  ? 'bg-bg-main text-text-primary border-l-[3px] border-accent-primary pl-[calc(0.75rem-3px)] shadow-sm'
                  : 'text-text-secondary hover:bg-bg-main/60 hover:text-text-primary border-l-[3px] border-transparent pl-[calc(0.75rem-3px)]'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {/* Divider */}
        <div className="h-px bg-border my-2" />

        {/* Documentation links */}
        <NavLink
          to="/docs"
          onClick={onNavClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
              isActive
                ? 'bg-bg-main text-text-primary border-l-[3px] border-accent-primary pl-[calc(0.75rem-3px)] shadow-sm'
                : 'text-text-secondary hover:bg-bg-main/60 hover:text-text-primary border-l-[3px] border-transparent pl-[calc(0.75rem-3px)]'
            }`
          }
        >
          Docs
        </NavLink>
        <NavLink
          to="/models"
          onClick={onNavClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
              isActive
                ? 'bg-bg-main text-text-primary border-l-[3px] border-accent-primary pl-[calc(0.75rem-3px)] shadow-sm'
                : 'text-text-secondary hover:bg-bg-main/60 hover:text-text-primary border-l-[3px] border-transparent pl-[calc(0.75rem-3px)]'
            }`
          }
        >
          Models
        </NavLink>
      </nav>

      {/* User block */}
      <div className="p-4 border-t border-[#d8cdbd]/60">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-primary truncate">
              {user?.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-3 flex items-center gap-1.5 text-xs text-text-secondary hover:text-danger transition-colors"
        >
          <LogOut size={12} />
          Sign Out
        </button>
      </div>
    </div>
  )
}

export function DashboardLayout() {
  const { signOut } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Dashboard'

  return (
    <div className="flex h-screen bg-bg-main overflow-hidden">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-bg-sidebar border-r border-border shrink-0">
        <SidebarContent signOut={signOut} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-text-primary/20" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 bg-bg-sidebar border-r border-border"
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent
              onNavClick={() => setSidebarOpen(false)}
              signOut={signOut}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-bg-card border-b border-border flex items-center px-6 shrink-0">
          <button
            className="md:hidden mr-4 p-1.5 rounded text-text-secondary hover:text-text-primary"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>

          <h1 className="text-lg font-bold text-text-primary">{pageTitle}</h1>

          <div className="ml-auto flex items-center gap-2 text-xs text-text-secondary">
            <span>LLM Gateway</span>
            <ChevronRight size={12} />
            <span className="text-text-primary font-medium">{pageTitle}</span>
          </div>
        </header>

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
