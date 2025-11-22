'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BackButton } from '@/components/ui/BackButton'

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userType, setUserType] = useState<'barber' | 'customer'>('customer')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    try {
      const { confirmPassword, ...dataToSend } = formData
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dataToSend,
          role: userType === 'barber' ? 'BARBEIRO' : 'CLIENTE',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao criar conta')
      } else {
        router.push('/auth/signin?registered=true')
      }
    } catch (err) {
      setError('Erro ao criar conta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-4">
          <BackButton href="/auth/signin" />
        </div>
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Crie sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--foreground)] opacity-70">
            Já tem uma conta?{' '}
            <Link href="/auth/signin" className="font-medium text-[var(--primary)] hover:underline">
              Entre aqui
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-[var(--error-bg)] border border-[var(--error-border)] p-4">
              <p className="text-sm text-[var(--error-foreground)]">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Sou:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center text-[var(--foreground)] cursor-pointer">
                <input
                  type="radio"
                  name="userType"
                  value="customer"
                  checked={userType === 'customer'}
                  onChange={(e) => setUserType(e.target.value as 'barber' | 'customer')}
                  className="mr-2 accent-[var(--primary)]"
                />
                Cliente
              </label>
              <label className="flex items-center text-[var(--foreground)] cursor-pointer">
                <input
                  type="radio"
                  name="userType"
                  value="barber"
                  checked={userType === 'barber'}
                  onChange={(e) => setUserType(e.target.value as 'barber' | 'customer')}
                  className="mr-2 accent-[var(--primary)]"
                />
                Barbeiro / Dono de Barbearia
              </label>
            </div>
          </div>

          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="name" className="sr-only">
                Nome completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="relative block w-full rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-[var(--foreground)] placeholder-[var(--foreground)]/50 focus:z-10 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm"
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="relative block w-full rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-[var(--foreground)] placeholder-[var(--foreground)]/50 focus:z-10 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm"
                placeholder="Email (opcional se usar telefone)"
              />
            </div>

            <div>
              <label htmlFor="phone" className="sr-only">
                Telefone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="relative block w-full rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-[var(--foreground)] placeholder-[var(--foreground)]/50 focus:z-10 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm"
                placeholder="Telefone (opcional se usar email)"
              />
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="sr-only">
                Data de nascimento
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="relative block w-full rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-[var(--foreground)] placeholder-[var(--foreground)]/50 focus:z-10 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm"
                placeholder="Data de nascimento"
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="relative block w-full rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-[var(--foreground)] placeholder-[var(--foreground)]/50 focus:z-10 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm"
                placeholder="Senha"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="relative block w-full rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-[var(--foreground)] placeholder-[var(--foreground)]/50 focus:z-10 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm"
                placeholder="Confirmar senha"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] disabled:opacity-50"
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

