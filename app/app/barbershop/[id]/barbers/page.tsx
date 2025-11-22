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

export default function BarbersManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const barbershopId = params.id as string
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBarberEmail, setNewBarberEmail] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user.role !== 'BARBEIRO') {
      router.push('/')
    }
  }, [status, session, router])

  const fetchBarbers = async () => {
    try {
      const response = await fetch(`/api/barbershops/${barbershopId}/barbers`, { cache: 'no-store' })
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

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'BARBEIRO' && barbershopId) {
      fetchBarbers()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status, session, barbershopId])

  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    setError(null)

    try {
      // Buscar usuário por email
      const userResponse = await fetch(`/api/users/search?email=${encodeURIComponent(newBarberEmail)}`)
      if (!userResponse.ok) {
        throw new Error('Usuário não encontrado')
      }

      const userData = await userResponse.json()
      if (!userData.user || userData.user.role !== 'BARBEIRO') {
        throw new Error('Usuário não é barbeiro')
      }

      // Adicionar barbeiro à barbearia
      const response = await fetch(`/api/barbershops/${barbershopId}/barbers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.user.id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao adicionar barbeiro')
      }

      setNewBarberEmail('')
      setShowAddForm(false)
      fetchBarbers()
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar barbeiro')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveBarber = async (barberId: string) => {
    if (!confirm('Tem certeza que deseja remover este barbeiro?')) {
      return
    }

    try {
      const response = await fetch(`/api/barbershops/${barbershopId}/barbers/${barberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao remover barbeiro')
      }

      fetchBarbers()
    } catch (err: any) {
      setError(err.message || 'Erro ao remover barbeiro')
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <BackButton href={`/app/barbershop/${barbershopId}`} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--foreground)]">
                Gerenciar Barbeiros
              </h1>
              <p className="text-xs sm:text-sm text-[var(--foreground)] opacity-70 mt-1">
                Adicione e remova barbeiros desta barbearia
              </p>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">+ Adicionar Barbeiro</span>
              <span className="sm:hidden">+ Adicionar</span>
            </Button>
          </div>

          {error && (
            <div className="rounded-md bg-[var(--error-bg)] p-4 text-[var(--error-foreground)]">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Add Barber Form */}
          {showAddForm && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Adicionar Barbeiro</h2>
              <form onSubmit={handleAddBarber} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                    Email do Barbeiro
                  </label>
                  <input
                    type="email"
                    required
                    value={newBarberEmail}
                    onChange={(e) => setNewBarberEmail(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                    placeholder="email@exemplo.com"
                  />
                  <p className="text-xs text-[var(--foreground)] opacity-60 mt-1">
                    O barbeiro deve estar cadastrado na plataforma
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" isLoading={adding} className="w-full sm:w-auto">
                    Adicionar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowAddForm(false)
                      setNewBarberEmail('')
                      setError(null)
                    }}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Barbers List */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Barbeiros da Barbearia</h2>
            {barbers.length === 0 ? (
              <p className="text-sm text-[var(--foreground)] opacity-70">
                Nenhum barbeiro adicionado ainda
              </p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {barbers.map((barber) => (
                  <div
                    key={barber.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border border-[var(--card-border)] rounded-lg"
                  >
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
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
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-[var(--foreground)] truncate">
                          {barber.user.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-[var(--foreground)] opacity-70 truncate">
                          {barber.user.email || barber.user.phone || 'Sem contato'}
                        </p>
                        {barber.bio && (
                          <p className="text-xs sm:text-sm text-[var(--foreground)] opacity-60 mt-1 line-clamp-2">
                            {barber.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <Link
                        href={`/app/barbershop/${barbershopId}/barbers/${barber.id}/working-hours`}
                        className="flex-1 sm:flex-none min-w-0"
                      >
                        <button
                          className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors w-full sm:w-auto whitespace-nowrap"
                        >
                          Horários
                        </button>
                      </Link>
                      <Link
                        href={`/app/barbershop/${barbershopId}/barbers/${barber.id}/services`}
                        className="flex-1 sm:flex-none min-w-0"
                      >
                        <button
                          className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-green-500/50 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors w-full sm:w-auto whitespace-nowrap"
                        >
                          Serviços
                        </button>
                      </Link>
                      <button
                        onClick={() => handleRemoveBarber(barber.id)}
                        className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-red-500/50 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex-1 sm:flex-none min-w-0 whitespace-nowrap"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

