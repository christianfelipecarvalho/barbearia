'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { BackButton } from '@/components/ui/BackButton'

interface Barber {
  id: string
  userId: string
  bio: string | null
  avatarUrl: string | null
  user: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
}

export default function BarbershopWorkingHoursPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const barbershopId = params.id as string
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user.role !== 'BARBEIRO') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'BARBEIRO' && barbershopId) {
      fetchBarbers()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status, session, barbershopId])

  const fetchBarbers = async () => {
    try {
      const response = await fetch(`/api/barbershops/${barbershopId}/barbers`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        setBarbers(data.barbers || [])
      } else {
        setError('Erro ao carregar barbeiros')
      }
    } catch (error) {
      console.error('Erro ao buscar barbeiros:', error)
      setError('Erro ao carregar barbeiros')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return <Loading fullScreen text="Carregando..." />
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-start gap-2 sm:gap-4">
            <BackButton href={`/app/barbershop/${barbershopId}`} className="flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Horários de Funcionamento</h1>
              <p className="text-xs sm:text-sm opacity-70 mt-1">
                Configure os horários de trabalho de cada barbeiro
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-[var(--error-bg)] p-4 text-[var(--error-foreground)]">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {barbers.length === 0 ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 sm:p-8 text-center">
              <p className="text-sm sm:text-lg opacity-70 mb-4">
                Nenhum barbeiro cadastrado ainda
              </p>
              <Link href={`/app/barbershop/${barbershopId}/barbers`}>
                <Button className="text-sm sm:text-base">Adicionar Barbeiros</Button>
              </Link>
            </div>
          ) : (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Barbeiros</h2>
              <div className="space-y-3 sm:space-y-4">
                {barbers.map((barber) => (
                  <Link
                    key={barber.id}
                    href={`/app/barbershop/${barbershopId}/barbers/${barber.id}/working-hours`}
                    className="flex items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 border border-[var(--card-border)] rounded-lg hover:bg-[var(--hover-bg)] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                      {barber.avatarUrl ? (
                        <img
                          src={barber.avatarUrl}
                          alt={barber.user.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--foreground)] opacity-20 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg sm:text-xl">
                            {barber.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base truncate">
                          {barber.user.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-[var(--foreground)] opacity-70 truncate">
                          {barber.user.email || barber.user.phone || 'Sem contato'}
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
                      <span className="hidden sm:inline">Configurar Horários</span>
                      <span className="sm:hidden">Horários</span>
                      <span className="hidden sm:inline ml-1">→</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

