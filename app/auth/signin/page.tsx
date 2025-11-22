'use client'

import { signIn, useSession } from 'next-auth/react'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { BackButton } from '@/components/ui/BackButton'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || null
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    usePhone: false,
  })

  // Redirecionar automaticamente quando a sessão for carregada
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (callbackUrl) {
        router.push(callbackUrl)
        return
      }
      
      const role = session.user.role
      if (role === 'ADMIN_GLOBAL') {
        router.push('/admin')
      } else if (role === 'BARBEIRO') {
        router.push('/app/barbershop')
      } else {
        router.push('/app/customer')
      }
    }
  }, [session, status, router, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email: formData.usePhone ? undefined : formData.email,
        phone: formData.usePhone ? formData.phone : undefined,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Credenciais inválidas')
        setIsLoading(false)
      } else {
        // Timeout de segurança para desativar loading caso o redirecionamento demore
        setTimeout(() => {
          setIsLoading(false)
        }, 3000)
      }
    } catch (err) {
      setError('Erro ao fazer login')
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    await signIn('google', { callbackUrl: callbackUrl || '/' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-4">
          <BackButton href="/" />
        </div>
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Entre na sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--foreground)] opacity-70">
            Ou{' '}
            <Link 
              href={`/auth/signup-simple${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} 
              className="font-medium hover:underline"
            >
              crie uma nova conta
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={formData.usePhone}
                  onChange={(e) => setFormData({ ...formData, usePhone: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-[var(--foreground)]">Usar telefone</span>
              </label>
            </div>

            {formData.usePhone ? (
              <div>
                <label htmlFor="phone" className="sr-only">
                  Telefone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="relative block w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--foreground)] placeholder-opacity-50 focus:z-10 focus:border-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] sm:text-sm"
                  placeholder="Telefone"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="relative block w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--foreground)] placeholder-opacity-50 focus:z-10 focus:border-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] sm:text-sm"
                  placeholder="Email"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="relative block w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[var(--foreground)] placeholder-opacity-50 focus:z-10 focus:border-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] sm:text-sm"
                placeholder="Senha"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md bg-[var(--foreground)] px-3 py-2 text-sm font-semibold text-[var(--background)] hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)] disabled:opacity-50"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

            <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--card-border)]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-[var(--background)] px-2 text-[var(--foreground)]">Ou continue com</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-[var(--foreground)] bg-[var(--background)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--hover-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foreground)] disabled:opacity-50"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-[var(--foreground)]" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </span>
              Entrar com Google
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--foreground)] border-t-transparent" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}

