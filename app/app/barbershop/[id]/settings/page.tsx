'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loading } from '@/components/ui/Loading'
import { BackButton } from '@/components/ui/BackButton'

interface Barbershop {
  id: string
  name: string
  description: string | null
  acceptsPublicRequests: boolean
}

export default function BarbershopSettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const barbershopId = params.id as string
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [acceptsPublicRequests, setAcceptsPublicRequests] = useState(false)

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
      const response = await fetch(`/api/barbershops/${barbershopId}`, { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setBarbershop(data)
        setAcceptsPublicRequests(data.acceptsPublicRequests || false)
      }
    } catch (error) {
      console.error('Erro ao buscar barbearia:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/barbershops/${barbershopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acceptsPublicRequests,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar configurações')
      }

      await fetchBarbershop()
      alert('Configurações salvas com sucesso!')
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar configurações')
    } finally {
      setSaving(false)
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <BackButton href={`/app/barbershop/${barbershopId}`} />
            <h1 className="text-3xl font-bold">Configurações</h1>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Solicitações de Acesso</h2>
              <div className="border border-[var(--card-border)] rounded-md p-4 bg-[var(--hover-bg)]">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptsPublicRequests}
                    onChange={(e) => setAcceptsPublicRequests(e.target.checked)}
                    className="w-5 h-5 rounded accent-[var(--primary)] mt-1"
                  />
                  <div>
                    <span className="font-medium block">Aceitar solicitações públicas de barbeiros</span>
                    <span className="text-sm opacity-70 block mt-2">
                      Se marcado, qualquer barbeiro poderá solicitar acesso à sua barbearia através da lista de barbearias públicas. 
                      Se desmarcado, apenas barbeiros com o ID da barbearia poderão solicitar acesso (barbearia privada).
                    </span>
                    <div className="mt-3 p-3 bg-[var(--card-bg)] rounded-md">
                      <p className="text-xs opacity-70">
                        <strong>ID da sua barbearia:</strong> <code className="bg-[var(--background)] px-2 py-1 rounded">{barbershopId}</code>
                      </p>
                      <p className="text-xs opacity-60 mt-2">
                        Compartilhe este ID com barbeiros que você deseja que solicitem acesso à sua barbearia privada.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-[var(--card-border)]">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
