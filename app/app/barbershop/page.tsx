'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'

interface Barbershop {
  id: string
  name: string
  description: string | null
  city: string
  state: string
  logoUrl: string | null
  subscription?: {
    status: string
    trialEndsAt: Date | null
  }
}

export default function BarbershopsListPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [barbershops, setBarbershops] = useState<Barbershop[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      if (session?.user.role !== 'BARBEIRO') {
        router.push('/')
      } else {
        // Verificar se é dono de alguma barbearia
        fetchBarbershops()
      }
    }
  }, [status, session, router])

  const fetchBarbershops = async () => {
    try {
      const response = await fetch('/api/barbershops/my', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setBarbershops(data.barbershops || [])
      }
    } catch (error) {
      console.error('Erro ao buscar barbearias:', error)
    } finally {
      setLoading(false)
    }
  }

  // Removido - já está sendo chamado no useEffect acima

  if (status === 'loading' || loading) {
    return <Loading fullScreen text="Carregando..." />
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                Minhas Barbearias
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-[var(--foreground)] opacity-70">
                Gerencie suas barbearias e agendamentos
              </p>
            </div>
            <Link href="/app/barbershop/create" className="w-full sm:w-auto">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0 w-full sm:w-auto">
                + Nova Barbearia
              </Button>
            </Link>
          </div>

          {barbershops.length === 0 ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-md p-6 sm:p-8 text-center">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">✂️</div>
              <p className="text-sm sm:text-base opacity-70 mb-4">
                Você ainda não possui barbearias cadastradas.
              </p>
              <p className="text-xs sm:text-sm opacity-50 mb-6">
                Se você é um barbeiro associado, acesse{' '}
                <Link href="/app/barber" className="text-[var(--primary)] hover:underline">
                  Minhas Barbearias como Barbeiro
                </Link>
              </p>
              <h2 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] mb-2">
                Você ainda não tem barbearias
              </h2>
              <p className="text-sm sm:text-base text-[var(--foreground)] opacity-70 mb-4 sm:mb-6">
                Crie sua primeira barbearia para começar a receber agendamentos
              </p>
              <Link href="/app/barbershop/create" className="inline-block">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                  Criar Primeira Barbearia
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {barbershops.map((barbershop) => (
                <Link
                  key={barbershop.id}
                  href={`/app/barbershop/${barbershop.id}`}
                  className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition cursor-pointer"
                >
                  {barbershop.logoUrl && (
                    <img
                      src={barbershop.logoUrl}
                      alt={barbershop.name}
                      className="w-full h-24 sm:h-32 object-cover rounded-md mb-3 sm:mb-4"
                    />
                  )}
                  <h3 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] mb-1 sm:mb-2">
                    {barbershop.name}
                  </h3>
                  {barbershop.description && (
                    <p className="text-xs sm:text-sm text-[var(--foreground)] opacity-70 mb-2 line-clamp-2">
                      {barbershop.description}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-[var(--foreground)] opacity-60">
                    {barbershop.city}, {barbershop.state}
                  </p>
                  {barbershop.subscription && (
                    <div className="mt-3 sm:mt-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          barbershop.subscription.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : barbershop.subscription.status === 'TRIAL'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {barbershop.subscription.status === 'ACTIVE'
                          ? 'Ativa'
                          : barbershop.subscription.status === 'TRIAL'
                          ? 'Trial'
                          : 'Expirada'}
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
