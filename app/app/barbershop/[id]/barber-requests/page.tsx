'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loading } from '@/components/ui/Loading'
import { BackButton } from '@/components/ui/BackButton'

interface BarberRequest {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  message: string | null
  createdAt: string
  reviewedAt: string | null
  barber: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
}

export default function BarberRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const barbershopId = params.id as string
  const [requests, setRequests] = useState<BarberRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user.role !== 'BARBEIRO') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'BARBEIRO' && barbershopId) {
      fetchRequests()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status, session, barbershopId])

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/barbershops/${barbershopId}/barber-requests`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestAction = async (requestId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      setProcessing(requestId)
      const response = await fetch(
        `/api/barbershops/${barbershopId}/barber-requests/${requestId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: action }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao processar solicitação')
      }

      await fetchRequests()
      alert(`Solicitação ${action === 'APPROVED' ? 'aprovada' : 'rejeitada'} com sucesso!`)
    } catch (err: any) {
      alert(err.message || 'Erro ao processar solicitação')
    } finally {
      setProcessing(null)
    }
  }

  if (status === 'loading' || loading) {
    return <Loading fullScreen text="Carregando..." />
  }

  if (!session) {
    return null
  }

  const pendingRequests = requests.filter((r) => r.status === 'PENDING')
  const processedRequests = requests.filter((r) => r.status !== 'PENDING')

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <BackButton href={`/app/barbershop/${barbershopId}`} />
            <div>
              <h1 className="text-3xl font-bold">Solicitações de Acesso</h1>
              <p className="text-sm opacity-70 mt-1">
                Gerencie solicitações de barbeiros que querem trabalhar na sua barbearia
              </p>
            </div>
          </div>

          {/* Solicitações pendentes */}
          {pendingRequests.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Pendentes ({pendingRequests.length})</h2>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{request.barber.name}</h3>
                        <p className="text-sm opacity-70">{request.barber.email}</p>
                        {request.barber.phone && (
                          <p className="text-sm opacity-70">{request.barber.phone}</p>
                        )}
                        <p className="text-xs opacity-50 mt-2">
                          Solicitado em {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-full">
                        Pendente
                      </span>
                    </div>
                    {request.message && (
                      <div className="mb-4 p-3 bg-[var(--hover-bg)] rounded-md">
                        <p className="text-sm">{request.message}</p>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleRequestAction(request.id, 'APPROVED')}
                        disabled={processing === request.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
                      >
                        {processing === request.id ? 'Processando...' : 'Aprovar'}
                      </button>
                      <button
                        onClick={() => handleRequestAction(request.id, 'REJECTED')}
                        disabled={processing === request.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
                      >
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solicitações processadas */}
          {processedRequests.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Processadas ({processedRequests.length})
              </h2>
              <div className="space-y-3">
                {processedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{request.barber.name}</h3>
                        <p className="text-sm opacity-70">{request.barber.email}</p>
                        {request.reviewedAt && (
                          <p className="text-xs opacity-50 mt-1">
                            {request.status === 'APPROVED' ? 'Aprovado' : 'Rejeitado'} em{' '}
                            {new Date(request.reviewedAt).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 text-xs rounded-full ${
                          request.status === 'APPROVED'
                            ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                            : 'bg-red-500/20 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {request.status === 'APPROVED' ? 'Aprovado' : 'Rejeitado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {requests.length === 0 && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-8 text-center">
              <p className="opacity-70">Nenhuma solicitação encontrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

