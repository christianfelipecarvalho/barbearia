'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTheme } from '@/lib/contexts/theme.context'
import Link from 'next/link'
import { Loading } from '@/components/ui/Loading'
import { BackButton } from '@/components/ui/BackButton'

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
  isActive: boolean
}

interface Barbershop {
  id: string
  name: string
  description: string | null
  address: string
  city: string
  state: string
  logoUrl: string | null
  coverUrl: string | null
  services: Service[]
}

export default function BarbershopDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { theme } = useTheme()
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchBarbershop(params.id as string)
    }
  }, [params.id])

  const fetchBarbershop = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/barbershops/${id}`)
      if (response.ok) {
        const data = await response.json()
        setBarbershop(data)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao buscar barbearia' }))
        console.error('Erro ao buscar barbearia:', errorData.error || 'Erro desconhecido')
        // Se for erro 404 ou 403, a barbearia não será encontrada
        if (response.status === 404 || response.status === 403) {
          setBarbershop(null)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar barbearia:', error)
      setBarbershop(null)
    } finally {
      setLoading(false)
    }
  }

  const handleBookService = (serviceId: string) => {
    if (!session) {
      setShowLoginModal(true)
      return
    }
    // Redirecionar para página de agendamento
    router.push(`/barbershops/${params.id}/book?service=${serviceId}`)
  }

  if (loading) {
    return <Loading fullScreen text="Carregando barbearia..." />
  }

  if (!barbershop) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Barbearia não encontrada</h2>
          <BackButton href="/barbershops" label="Voltar para lista" />
        </div>
      </div>
    )
  }

  const activeServices = barbershop.services.filter(s => s.isActive)

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {barbershop.coverUrl && (
        <div className="w-full h-64 md:h-96 relative">
          <img
            src={barbershop.coverUrl}
            alt={barbershop.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <BackButton href="/barbershops" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{barbershop.name}</h1>
              {barbershop.description && (
                <p className="text-lg opacity-70">{barbershop.description}</p>
              )}
              <p className="text-sm opacity-60 mt-2">
                {barbershop.address}, {barbershop.city} - {barbershop.state}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Serviços</h2>
            {activeServices.length === 0 ? (
              <p className="opacity-70">Nenhum serviço disponível no momento</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6"
                  >
                    <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                    {service.description && (
                      <p className="text-sm opacity-70 mb-4">{service.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold">
                          R$ {service.price.toFixed(2)}
                        </p>
                        <p className="text-sm opacity-60">
                          {service.duration} minutos
                        </p>
                      </div>
                      <button
                        onClick={() => handleBookService(service.id)}
                        className="px-6 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-md hover:opacity-80 transition"
                      >
                        Agendar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Login necessário</h3>
            <p className="mb-6 opacity-70">
              Você precisa fazer login ou criar uma conta para agendar um horário.
            </p>
            <div className="flex gap-4">
              <Link
                href={`/auth/signin?callbackUrl=/barbershops/${params.id}`}
                className="flex-1 px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-md text-center hover:opacity-80 transition"
              >
                Entrar
              </Link>
              <Link
                href={`/auth/signup?callbackUrl=/barbershops/${params.id}`}
                className="flex-1 px-4 py-2 border border-[var(--foreground)] rounded-md text-center hover:bg-[var(--hover-bg)] transition"
              >
                Criar conta
              </Link>
              <button
                onClick={() => setShowLoginModal(false)}
                className="px-4 py-2 border border-[var(--card-border)] rounded-md hover:bg-[var(--hover-bg)] transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

