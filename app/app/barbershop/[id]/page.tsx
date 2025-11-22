'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { BackButton } from '@/components/ui/BackButton'

interface Barbershop {
  id: string
  name: string
  description: string | null
  address: string
  city: string
  state: string
  logoUrl: string | null
  coverUrl: string | null
  subscription?: {
    status: string
    trialEndsAt: Date | null
  }
}

export default function BarbershopDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const barbershopId = params.id as string
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user.role !== 'BARBEIRO') {
      router.push('/')
    }
  }, [status, session, router])

  const fetchBarbershop = async () => {
    try {
      const response = await fetch(`/api/barbershops/${barbershopId}`, { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setBarbershop(data)
      } else {
        setError('Barbearia não encontrada')
      }
    } catch (error) {
      console.error('Erro ao buscar barbearia:', error)
      setError('Erro ao carregar barbearia')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'BARBEIRO' && barbershopId) {
      fetchBarbershop()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status, session, barbershopId])

  if (status === 'loading' || loading) {
    return <Loading fullScreen text="Carregando..." />
  }

  if (!session) {
    return null
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <div className="text-center">
          <p className="text-lg text-[var(--error-foreground)]">{error}</p>
          <BackButton href="/app/barbershop" label="Voltar para Minhas Barbearias" className="mt-4" />
        </div>
      </div>
    )
  }

  if (!barbershop) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <Loading fullScreen text="Carregando..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <BackButton href="/app/barbershop" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[var(--foreground)]">
                {barbershop.name}
              </h1>
              <p className="text-[var(--foreground)] opacity-70">
                {barbershop.city}, {barbershop.state}
              </p>
            </div>
          </div>

          {/* Cover Image */}
          {barbershop.coverUrl && (
            <div
              className="w-full h-64 rounded-lg bg-cover bg-center mb-6"
              style={{ backgroundImage: `url(${barbershop.coverUrl})` }}
            />
          )}

          {/* Description */}
          {barbershop.description && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6">
              <p className="text-[var(--foreground)] opacity-80">{barbershop.description}</p>
            </div>
          )}

          {/* Action Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href={`/app/barbershop/${barbershopId}/settings`}>
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-4xl mb-4">⚙️</div>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                  Configurações
                </h2>
                <p className="text-[var(--foreground)] opacity-70">
                  Edite dados da barbearia, logo e horários
                </p>
              </div>
            </Link>

            <Link href={`/app/barbershop/${barbershopId}/barbers`}>
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-4xl mb-4">👥</div>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                  Barbeiros
                </h2>
                <p className="text-[var(--foreground)] opacity-70">
                  Gerencie barbeiros e permissões
                </p>
              </div>
            </Link>

            <Link href={`/app/barbershop/${barbershopId}/barber-requests`}>
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-4xl mb-4">📋</div>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                  Solicitações
                </h2>
                <p className="text-[var(--foreground)] opacity-70">
                  Aprove ou rejeite solicitações de acesso
                </p>
              </div>
            </Link>

            <Link href={`/app/barbershop/${barbershopId}/services`}>
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-4xl mb-4">💇</div>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                  Serviços
                </h2>
                <p className="text-[var(--foreground)] opacity-70">
                  Gerencie serviços, preços e durações
                </p>
              </div>
            </Link>

            <Link href={`/app/barbershop/${barbershopId}/schedule`}>
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-4xl mb-4">📅</div>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                  Agenda
                </h2>
                <p className="text-[var(--foreground)] opacity-70">
                  Veja e gerencie agendamentos
                </p>
              </div>
            </Link>

            <Link href={`/app/barbershop/${barbershopId}/working-hours`}>
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-4xl mb-4">🕐</div>
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                  Horários
                </h2>
                <p className="text-[var(--foreground)] opacity-70">
                  Configure horários de funcionamento
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

