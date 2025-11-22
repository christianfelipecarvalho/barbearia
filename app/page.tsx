'use client'

import Link from 'next/link'
import { useTheme } from '@/lib/contexts/theme.context'

export default function HomePage() {
  const { theme } = useTheme()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-[var(--foreground)]">
            Trim Time
          </h1>
          <p className="text-lg text-[var(--foreground)] opacity-70">
            Agende seu horário de forma simples e rápida
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/barbershops"
            className="block w-full rounded-lg bg-[var(--foreground)] px-6 py-3 text-center font-semibold text-[var(--background)] shadow-lg transition hover:opacity-80 active:scale-95"
          >
            Ver Barbearias
          </Link>
          <Link
            href="/auth/signin"
            className="block w-full rounded-lg border-2 border-[var(--foreground)] px-6 py-3 text-center font-semibold text-[var(--foreground)] transition hover:bg-[var(--hover-bg)] active:scale-95"
          >
            Entrar
          </Link>
        </div>

        <div className="pt-8 space-y-2">
          <p className="text-sm text-[var(--foreground)] opacity-70">
            É barbeiro?{' '}
            <Link href="/auth/signup?type=barber" className="font-medium hover:underline">
              Cadastre sua barbearia
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
