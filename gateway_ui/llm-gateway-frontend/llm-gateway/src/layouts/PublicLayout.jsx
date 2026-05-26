import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Logo } from '../components/Logo'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export function PublicLayout() {
  const { signInWithGoogle } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (e) {
      console.error('Sign in error', e)
    }
  }

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-bg-main border-b border-border flex items-center px-6 md:px-10">
        <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
          {/* Left: Logo */}
          <Link to="/" aria-label="LLM Gateway home">
            <Logo size={28} showWordmark={true} />
          </Link>

          {/* Center-Right: Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink
              to="/docs"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? 'text-accent-primary' : 'text-text-primary hover:text-accent-primary'
                }`
              }
            >
              Docs
            </NavLink>
            <NavLink
              to="/models"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? 'text-accent-primary' : 'text-text-primary hover:text-accent-primary'
                }`
              }
            >
              Models
            </NavLink>
          </nav>

          {/* Right: Sign In */}
          <div className="hidden md:flex items-center">
            <button
              onClick={handleSignIn}
              className="bg-accent-primary hover:bg-accent-primary-hover text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
            >
              Sign In
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded text-text-secondary hover:text-text-primary"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 pt-16 bg-bg-main md:hidden">
          <nav className="flex flex-col p-6 gap-4 border-t border-border">
            <NavLink
              to="/docs"
              className="text-base font-medium text-text-primary hover:text-accent-primary py-2"
              onClick={() => setMobileOpen(false)}
            >
              Docs
            </NavLink>
            <NavLink
              to="/models"
              className="text-base font-medium text-text-primary hover:text-accent-primary py-2"
              onClick={() => setMobileOpen(false)}
            >
              Models
            </NavLink>
            <button
              onClick={() => { setMobileOpen(false); handleSignIn() }}
              className="mt-2 bg-accent-primary hover:bg-accent-primary-hover text-white text-sm font-medium px-4 py-2.5 rounded-md text-left transition-colors"
            >
              Sign In
            </button>
          </nav>
        </div>
      )}

      {/* Page content (offset by navbar height) */}
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  )
}
