'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  owner: {
    id: string
    name: string
    email: string | null
  }
  profileId: string
}

export default function BarberBarbershopPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const barbershopId = params.id as string
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user.role !== 'BARBEIRO') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'BARBEIRO' && barbershopId) {
      fetchBarbershop()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status, session, barbershopId])

  const fetchBarbershop = async () => {
    try {
      const response = await fetch('/api/barbers/my-barbershops', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        const shop = data.barbershops?.find((s: Barbershop) => s.id === barbershopId)
        if (shop) {
          setBarbershop(shop)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar barbearia:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return <Loading fullScreen text="Carregando..." />
  }

  if (!session || !barbershop) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <BackButton href="/app/barber" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{barbershop.name}</h1>
              <p className="text-sm opacity-70 mt-1">
                {barbershop.city}, {barbershop.state}
              </p>
            </div>
          </div>

          {barbershop.coverUrl && (
            <div className="w-full h-64 rounded-lg overflow-hidden">
              <img
                src={barbershop.coverUrl}
                alt={barbershop.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {barbershop.description && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6">
              <p className="opacity-80">{barbershop.description}</p>
            </div>
          )}

          {/* Action Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href={`/app/barber/${barbershopId}/working-hours`}>
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-4xl mb-4">🕐</div>
                <h2 className="text-xl font-semibold mb-2">Meus Horários</h2>
                <p className="opacity-70">Visualize seus horários de trabalho</p>
              </div>
            </Link>

            <Link href={`/app/barber/${barbershopId}/schedule`}>
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-4xl mb-4">📅</div>
                <h2 className="text-xl font-semibold mb-2">Minha Agenda</h2>
                <p className="opacity-70">Veja seus agendamentos</p>
              </div>
            </Link>

            <Link href={`/app/barber/${barbershopId}/services`}>
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                <div className="text-4xl mb-4">💇</div>
                <h2 className="text-xl font-semibold mb-2">Meus Serviços</h2>
                <p className="opacity-70">Visualize os serviços que você executa</p>
              </div>
            </Link>
          </div>

          {/* Informações do dono */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Proprietário</h3>
            <p className="font-medium">{barbershop.owner.name}</p>
            {barbershop.owner.email && (
              <p className="text-sm opacity-70 mt-1">{barbershop.owner.email}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

