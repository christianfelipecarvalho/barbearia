'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loading } from '@/components/ui/Loading'
import { BackButton } from '@/components/ui/BackButton'

interface Barbershop {
  id: string
  name: string
  description: string | null
  city: string
  state: string
  logoUrl: string | null
  coverUrl: string | null
  owner: {
    id: string
    name: string
    email: string | null
  }
  isOwner: boolean
  profileId: string
}

interface BarberRequest {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  message: string | null
  createdAt: string
  barbershop: {
    id: string
    name: string
    city: string
    state: string
    logoUrl: string | null
  }
}

interface PublicBarbershop {
  id: string
  name: string
  description: string | null
  city: string
  state: string
  logoUrl: string | null
  coverUrl: string | null
  address: string
}

export default function BarberPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [barbershops, setBarbershops] = useState<Barbershop[]>([])
  const [requests, setRequests] = useState<BarberRequest[]>([])
  const [publicBarbershops, setPublicBarbershops] = useState<PublicBarbershop[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showPublicBarbershops, setShowPublicBarbershops] = useState(false)
  const [selectedBarbershopId, setSelectedBarbershopId] = useState<string | null>(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user.role !== 'BARBEIRO') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'BARBEIRO') {
      fetchData()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status, session])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [barbershopsRes, requestsRes, publicRes] = await Promise.all([
        fetch('/api/barbers/my-barbershops', { cache: 'no-store' }),
        fetch('/api/barbers/my-requests', { cache: 'no-store' }),
        fetch('/api/barbershops/public', { cache: 'no-store' }),
      ])

      let barbershopsData: Barbershop[] = []
      let requestsData: BarberRequest[] = []

      if (barbershopsRes.ok) {
        const data = await barbershopsRes.json()
        barbershopsData = data.barbershops || []
        setBarbershops(barbershopsData)
      }

      if (requestsRes.ok) {
        const data = await requestsRes.json()
        requestsData = data.requests || []
        setRequests(requestsData)
      }

      if (publicRes.ok) {
        const data = await publicRes.json()
        // Filtrar barbearias que o barbeiro já está associado ou já solicitou
        const associatedIds = new Set([
          ...barbershopsData.map((b) => b.id),
          ...requestsData.map((r) => r.barbershop.id),
        ])
        const filtered = (data.barbershops || []).filter(
          (shop: PublicBarbershop) => !associatedIds.has(shop.id)
        )
        setPublicBarbershops(filtered)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestAccess = async () => {
    if (!selectedBarbershopId) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/barbershops/${selectedBarbershopId}/barber-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: requestMessage || null }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao solicitar acesso')
      }

      setShowRequestModal(false)
      setSelectedBarbershopId(null)
      setRequestMessage('')
      await fetchData()
      alert('Solicitação enviada com sucesso!')
    } catch (err: any) {
      alert(err.message || 'Erro ao solicitar acesso')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelRequest = async (requestId: string, barbershopId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta solicitação?')) return

    try {
      const response = await fetch(`/api/barbershops/${barbershopId}/barber-requests/${requestId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao cancelar solicitação')
      }

      await fetchData()
      alert('Solicitação cancelada com sucesso!')
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar solicitação')
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <BackButton href="/" />
            <div>
              <h1 className="text-3xl font-bold">Minhas Barbearias</h1>
              <p className="text-sm opacity-70 mt-1">
                Gerencie suas barbearias e solicite acesso a novas
              </p>
            </div>
          </div>

          {/* Barbearias associadas */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Barbearias Associadas</h2>
            {barbershops.length === 0 ? (
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-8 text-center">
                <p className="opacity-70 mb-4">Você ainda não está associado a nenhuma barbearia</p>
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:opacity-90 transition"
                >
                  Solicitar Acesso a uma Barbearia
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {barbershops.map((shop) => (
                  <Link
                    key={shop.id}
                    href={shop.isOwner ? `/app/barbershop/${shop.id}` : `/app/barber/${shop.id}`}
                    className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 hover:shadow-lg transition"
                  >
                    {shop.logoUrl && (
                      <img
                        src={shop.logoUrl}
                        alt={shop.name}
                        className="w-full h-32 object-cover rounded-md mb-4"
                      />
                    )}
                    <h3 className="text-lg font-semibold mb-2">{shop.name}</h3>
                    <p className="text-sm opacity-70 mb-2">
                      {shop.city}, {shop.state}
                    </p>
                    {shop.isOwner && (
                      <span className="inline-block px-2 py-1 text-xs bg-[var(--primary)] text-[var(--primary-foreground)] rounded">
                        Proprietário
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Solicitações pendentes */}
          {requests.filter((r) => r.status === 'PENDING').length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Solicitações Pendentes</h2>
              <div className="space-y-3">
                {requests
                  .filter((r) => r.status === 'PENDING')
                  .map((request) => (
                    <div
                      key={request.id}
                      className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <h3 className="font-semibold">{request.barbershop.name}</h3>
                        <p className="text-sm opacity-70">
                          {request.barbershop.city}, {request.barbershop.state}
                        </p>
                        <p className="text-xs opacity-50 mt-1">
                          Enviada em {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancelRequest(request.id, request.barbershop.id)}
                        className="px-4 py-2 text-sm border border-[var(--card-border)] rounded-md hover:bg-[var(--hover-bg)] transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Botões para solicitar acesso */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowPublicBarbershops(true)}
              className="px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:opacity-90 transition"
            >
              Ver Barbearias Públicas
            </button>
            <button
              onClick={() => setShowRequestModal(true)}
              className="px-6 py-3 border border-[var(--card-border)] rounded-md hover:bg-[var(--hover-bg)] transition"
            >
              Solicitar com ID da Barbearia
            </button>
          </div>
        </div>
      </div>

      {/* Modal de barbearias públicas */}
      {showPublicBarbershops && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Barbearias Públicas Disponíveis</h3>
              <button
                onClick={() => setShowPublicBarbershops(false)}
                className="text-2xl hover:opacity-70 transition"
              >
                ×
              </button>
            </div>
            <p className="text-sm opacity-70 mb-4">
              Estas barbearias aceitam solicitações públicas de acesso. Clique em uma para solicitar acesso.
            </p>
            {publicBarbershops.length === 0 ? (
              <div className="text-center py-8">
                <p className="opacity-70">Nenhuma barbearia pública disponível no momento</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publicBarbershops.map((shop) => (
                  <div
                    key={shop.id}
                    className="border border-[var(--card-border)] rounded-lg p-4 hover:bg-[var(--hover-bg)] transition cursor-pointer"
                    onClick={() => {
                      setSelectedBarbershopId(shop.id)
                      setShowPublicBarbershops(false)
                      setShowRequestModal(true)
                    }}
                  >
                    {shop.logoUrl && (
                      <img
                        src={shop.logoUrl}
                        alt={shop.name}
                        className="w-full h-32 object-cover rounded-md mb-3"
                      />
                    )}
                    <h4 className="font-semibold mb-1">{shop.name}</h4>
                    <p className="text-sm opacity-70 mb-2">
                      {shop.city}, {shop.state}
                    </p>
                    {shop.description && (
                      <p className="text-xs opacity-60 line-clamp-2">{shop.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de solicitação */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Solicitar Acesso</h3>
            <p className="text-sm opacity-70 mb-4">
              {selectedBarbershopId
                ? 'Envie uma solicitação para esta barbearia.'
                : 'Para solicitar acesso a uma barbearia privada, você precisa do ID da barbearia. Entre em contato com o dono da barbearia para obter o ID.'}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">ID da Barbearia</label>
                <input
                  type="text"
                  value={selectedBarbershopId || ''}
                  onChange={(e) => setSelectedBarbershopId(e.target.value)}
                  placeholder="Cole o ID da barbearia aqui"
                  className="w-full px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Mensagem (opcional)
                </label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Deixe uma mensagem para o dono da barbearia..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleRequestAccess}
                disabled={!selectedBarbershopId || submitting}
                className="flex-1 px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:opacity-90 transition disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar Solicitação'}
              </button>
              <button
                onClick={() => {
                  setShowRequestModal(false)
                  setSelectedBarbershopId(null)
                  setRequestMessage('')
                }}
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

