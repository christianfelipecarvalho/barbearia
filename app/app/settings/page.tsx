'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTheme } from '@/lib/contexts/theme.context'
import { Button } from '@/components/ui/Button'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--foreground)] border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="mt-2 text-sm opacity-70">
              Gerencie suas preferências e configurações da conta
            </p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--card-border)]">
              <h2 className="text-xl font-semibold">Aparência</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tema
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`px-4 py-2 rounded-md border-2 transition ${
                      theme === 'light'
                        ? 'border-[var(--foreground)] bg-[var(--hover-bg)]'
                        : 'border-[var(--card-border)] hover:border-[var(--foreground)]'
                    }`}
                  >
                    Claro
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-4 py-2 rounded-md border-2 transition ${
                      theme === 'dark'
                        ? 'border-[var(--foreground)] bg-[var(--hover-bg)]'
                        : 'border-[var(--card-border)] hover:border-[var(--foreground)]'
                    }`}
                  >
                    Escuro
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--card-border)]">
              <h2 className="text-xl font-semibold">Conta</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <p className="text-sm opacity-70">{session.user?.name || 'Não informado'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <p className="text-sm opacity-70">{session.user?.email || 'Não informado'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de conta</label>
                <p className="text-sm opacity-70">
                  {session.user?.role === 'ADMIN_GLOBAL' && 'Administrador Global'}
                  {session.user?.role === 'BARBEIRO' && 'Barbeiro / Dono de Barbearia'}
                  {session.user?.role === 'CLIENTE' && 'Cliente'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

