'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from '@/lib/contexts/theme.context'
import { useState } from 'react'

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (isSigningOut) return
    
    try {
      setIsSigningOut(true)
      await signOut({ redirect: false })
      // Forçar reload completo para limpar todos os chunks
      window.location.href = '/'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      setIsSigningOut(false)
      // Em caso de erro, tentar redirecionar mesmo assim
      window.location.href = '/'
    }
  }

  const isAuthPage = pathname?.startsWith('/auth')

  if (isAuthPage) {
    return null
  }

  const getNavLinks = () => {
    if (!session?.user) return []
    
    if (session.user.role === 'ADMIN_GLOBAL') {
      return [
        { href: '/admin', label: 'Painel Admin' },
      ]
    }
    if (session.user.role === 'BARBEIRO') {
      return [
        { href: '/app/barbershop', label: 'Minha Barbearia' },
        { href: '/app/barbershop/schedule', label: 'Agenda' },
      ]
    }
    if (session.user.role === 'CLIENTE') {
      return [
        { href: '/app/customer', label: 'Início' },
        { href: '/app/customer/book', label: 'Agendar' },
        { href: '/app/customer/appointments', label: 'Meus Agendamentos' },
      ]
    }
    return []
  }

  const navLinks = getNavLinks()

  return (
    <nav className="sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--card-border)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e links principais - Desktop */}
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/" className="text-lg md:text-xl font-bold text-[var(--foreground)]">
              Trim Time
            </Link>
            {session && navLinks.length > 0 && (
              <div className="hidden md:flex gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                      pathname === link.href
                        ? 'bg-[var(--foreground)] text-[var(--background)]'
                        : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
            {!session && (
              <Link
                href="/barbershops"
                className="hidden md:block px-3 py-2 rounded-md text-sm font-medium text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition"
              >
                Barbearias
              </Link>
            )}
          </div>

          {/* Botões do lado direito - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-[var(--hover-bg)] transition"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            {session && (
              <>
                <Link
                  href="/app/settings"
                  className="px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--hover-bg)] rounded-md transition"
                >
                  Configurações
                </Link>
                <span className="text-sm text-[var(--foreground)] opacity-70 hidden lg:inline">
                  {session.user.name}
                </span>
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--hover-bg)] rounded-md transition disabled:opacity-50"
                >
                  {isSigningOut ? 'Saindo...' : 'Sair'}
                </button>
              </>
            )}
            {!session && (
              <Link
                href="/auth/signin"
                className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--hover-bg)] rounded-md transition"
              >
                Entrar
              </Link>
            )}
          </div>

          {/* Mobile: Menu hambúrguer e botões essenciais */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-[var(--hover-bg)] transition"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md hover:bg-[var(--hover-bg)] transition"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Menu mobile expandido */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--card-border)] py-4 space-y-2">
            {session && navLinks.length > 0 && (
              <>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2 rounded-md text-sm font-medium transition ${
                      pathname === link.href
                        ? 'bg-[var(--foreground)] text-[var(--background)]'
                        : 'text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t border-[var(--card-border)] pt-2 mt-2">
                  <Link
                    href="/app/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 rounded-md text-sm font-medium text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition"
                  >
                    Configurações
                  </Link>
                  <div className="px-4 py-2 text-sm text-[var(--foreground)] opacity-70">
                    {session.user.name}
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleSignOut()
                    }}
                    disabled={isSigningOut}
                    className="w-full text-left px-4 py-2 rounded-md text-sm font-medium text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition disabled:opacity-50"
                  >
                    {isSigningOut ? 'Saindo...' : 'Sair'}
                  </button>
                </div>
              </>
            )}
            {!session && (
              <>
                <Link
                  href="/barbershops"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 rounded-md text-sm font-medium text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition"
                >
                  Barbearias
                </Link>
                <Link
                  href="/auth/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 rounded-md text-sm font-medium text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition"
                >
                  Entrar
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

