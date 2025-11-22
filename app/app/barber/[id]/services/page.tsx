'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loading } from '@/components/ui/Loading'
import { BackButton } from '@/components/ui/BackButton'

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
  isActive: boolean
  isLinked?: boolean
}

export default function BarberServicesViewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const barbershopId = params.id as string
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [barberProfileId, setBarberProfileId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user.role !== 'BARBEIRO') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'BARBEIRO' && barbershopId) {
      fetchData()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status, session, barbershopId])

  const fetchData = async () => {
    try {
      // Buscar perfil do barbeiro nesta barbearia
      const barbershopsRes = await fetch('/api/barbers/my-barbershops', { cache: 'no-store' })
      if (barbershopsRes.ok) {
        const data = await barbershopsRes.json()
        const shop = data.barbershops?.find((s: any) => s.id === barbershopId && !s.isOwner)
        if (shop) {
          setBarberProfileId(shop.profileId)
          
          // Buscar serviços
          const servicesRes = await fetch(
            `/api/barbershops/${barbershopId}/barbers/${shop.profileId}/services`,
            { cache: 'no-store' }
          )
          if (servicesRes.ok) {
            const servicesData = await servicesRes.json()
            const allServices = [
              ...(servicesData.linkedServices || []).map((s: Service) => ({ ...s, isLinked: true })),
              ...(servicesData.barberServices || []),
            ]
            setServices(allServices)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
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

  const activeServices = services.filter((s) => s.isActive)
  const linkedServices = activeServices.filter((s) => s.isLinked)
  const barberServices = activeServices.filter((s) => !s.isLinked)

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <BackButton href={`/app/barber/${barbershopId}`} />
            <div>
              <h1 className="text-3xl font-bold">Meus Serviços</h1>
              <p className="text-sm opacity-70 mt-1">
                Visualize os serviços que você executa nesta barbearia
              </p>
            </div>
          </div>

          {/* Serviços vinculados da barbearia */}
          {linkedServices.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Serviços da Barbearia</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {linkedServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold">{service.name}</h3>
                      <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded">
                        Vinculado
                      </span>
                    </div>
                    {service.description && (
                      <p className="text-sm opacity-70 mb-4">{service.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold">R$ {service.price.toFixed(2)}</p>
                        <p className="text-sm opacity-60">{service.duration} minutos</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Serviços específicos do barbeiro */}
          {barberServices.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Meus Serviços Específicos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {barberServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6"
                  >
                    <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
                    {service.description && (
                      <p className="text-sm opacity-70 mb-4">{service.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold">R$ {service.price.toFixed(2)}</p>
                        <p className="text-sm opacity-60">{service.duration} minutos</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeServices.length === 0 && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-8 text-center">
              <p className="opacity-70">Nenhum serviço configurado para você ainda</p>
            </div>
          )}

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              ℹ️ Estes serviços foram configurados pelo dono da barbearia. Entre em contato com
              ele para solicitar alterações.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

