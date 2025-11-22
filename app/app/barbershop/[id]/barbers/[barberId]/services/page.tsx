'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { BackButton } from '@/components/ui/BackButton'

interface BarberService {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
  isActive: boolean
  isLinked?: boolean // Flag para identificar se é serviço vinculado da barbearia
}

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

export default function BarberServicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const barbershopId = params.id as string
  const barberId = params.barberId as string
  const [barber, setBarber] = useState<Barber | null>(null)
  const [services, setServices] = useState<BarberService[]>([])
  const [linkedServices, setLinkedServices] = useState<BarberService[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingService, setEditingService] = useState<BarberService | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    isActive: true,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user.role !== 'BARBEIRO') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'BARBEIRO' && barbershopId && barberId) {
      fetchBarberAndServices()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status, session, barbershopId, barberId])

  const fetchBarberAndServices = async () => {
    try {
      // Buscar barbeiro
      const barbersResponse = await fetch(`/api/barbershops/${barbershopId}/barbers`, {
        cache: 'no-store',
      })
      if (barbersResponse.ok) {
        const barbersData = await barbersResponse.json()
        const foundBarber = barbersData.barbers.find((b: Barber) => b.id === barberId)
        if (foundBarber) {
          setBarber(foundBarber)
        } else {
          setError('Barbeiro não encontrado')
          setLoading(false)
          return
        }
      }

      // Buscar serviços
      await fetchServices()
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch(
        `/api/barbershops/${barbershopId}/barbers/${barberId}/services`,
        { cache: 'no-store' }
      )
      if (response.ok) {
        const data = await response.json()
        setServices(data.barberServices || [])
        setLinkedServices(data.linkedServices || [])
      }
    } catch (error) {
      console.error('Erro ao buscar serviços:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      isActive: true,
    })
    setEditingService(null)
    setShowAddForm(false)
  }

  const handleEdit = (service: BarberService) => {
    // Não permitir editar serviços vinculados
    if (service.isLinked) {
      alert('Este serviço é vinculado da barbearia. Para editá-lo, vá em Serviços da Barbearia.')
      return
    }
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration: service.duration.toString(),
      isActive: service.isActive,
    })
    setShowAddForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const url = editingService
        ? `/api/barbershops/${barbershopId}/barbers/${barberId}/services/${editingService.id}`
        : `/api/barbershops/${barbershopId}/barbers/${barberId}/services`

      const method = editingService ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          duration: parseInt(formData.duration),
          isActive: formData.isActive,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar serviço')
      }

      resetForm()
      await fetchServices()
      alert('Serviço salvo com sucesso!')
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar serviço')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (serviceId: string) => {
    // Verificar se é serviço vinculado
    const isLinked = linkedServices.some((s) => s.id === serviceId)
    if (isLinked) {
      alert('Este serviço é vinculado da barbearia. Para desvinculá-lo, vá em Serviços da Barbearia.')
      return
    }

    if (!confirm('Tem certeza que deseja remover este serviço?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/barbershops/${barbershopId}/barbers/${barberId}/services/${serviceId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao remover serviço')
      }

      await fetchServices()
      alert('Serviço removido com sucesso!')
    } catch (err: any) {
      setError(err.message || 'Erro ao remover serviço')
    }
  }

  if (status === 'loading' || loading) {
    return <Loading fullScreen text="Carregando..." />
  }

  if (!session) {
    return null
  }

  if (error && !barber) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-[var(--error-foreground)] mb-4">{error}</p>
          <BackButton href={`/app/barbershop/${barbershopId}/barbers`} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-start gap-2 sm:gap-4">
            <BackButton href={`/app/barbershop/${barbershopId}/barbers`} className="flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Serviços do Barbeiro</h1>
              {barber && (
                <p className="text-xs sm:text-sm opacity-70 mt-1 truncate">{barber.user.name}</p>
              )}
            </div>
            <Button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
            >
              <span className="hidden sm:inline">+ Adicionar Serviço</span>
              <span className="sm:hidden">+</span>
            </Button>
          </div>

          {error && (
            <div className="rounded-md bg-[var(--error-bg)] p-4 text-[var(--error-foreground)]">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {showAddForm && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
                {editingService ? 'Editar Serviço' : 'Adicionar Serviço'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                    Nome do Serviço *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                    placeholder="Ex: Corte de cabelo"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                    rows={3}
                    placeholder="Descrição do serviço"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                      Duração (minutos) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-xs sm:text-sm">Serviço ativo</label>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" isLoading={saving} className="w-full sm:w-auto">
                    {editingService ? 'Atualizar' : 'Adicionar'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={resetForm} className="w-full sm:w-auto">
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Serviços Vinculados da Barbearia */}
          {linkedServices.length > 0 && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
                Serviços da Barbearia Vinculados
              </h2>
              <p className="text-xs sm:text-sm text-[var(--foreground)] opacity-70 mb-3 sm:mb-4">
                Estes são serviços da barbearia que foram vinculados a este barbeiro. Para gerenciar
                os vínculos, vá em Serviços da Barbearia.
              </p>
              <div className="space-y-3 sm:space-y-4">
                {linkedServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border border-[var(--card-border)] rounded-lg bg-[var(--hover-bg)]/30"
                  >
                    <div className="flex-1 w-full sm:w-auto min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base">
                          {service.name}
                        </h3>
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          Vinculado
                        </span>
                        {!service.isActive && (
                          <span className="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700">
                            Inativo
                          </span>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-xs sm:text-sm text-[var(--foreground)] opacity-70 mt-1">
                          {service.description}
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
                        <span className="text-[var(--foreground)] opacity-70">
                          <strong>Preço:</strong> R$ {service.price.toFixed(2)}
                        </span>
                        <span className="text-[var(--foreground)] opacity-70">
                          <strong>Duração:</strong> {service.duration} min
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/app/barbershop/${barbershopId}/services`}
                      className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Gerenciar vínculo →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Serviços Específicos do Barbeiro */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
              Serviços Específicos do Barbeiro
            </h2>
            <p className="text-xs sm:text-sm text-[var(--foreground)] opacity-70 mb-3 sm:mb-4">
              Estes são serviços exclusivos deste barbeiro. Você pode criar, editar e remover
              estes serviços.
            </p>
            {services.length === 0 ? (
              <p className="text-sm text-[var(--foreground)] opacity-70">
                Nenhum serviço específico cadastrado ainda
              </p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border border-[var(--card-border)] rounded-lg"
                  >
                    <div className="flex-1 w-full sm:w-auto min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base">
                          {service.name}
                        </h3>
                        {!service.isActive && (
                          <span className="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700">
                            Inativo
                          </span>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-xs sm:text-sm text-[var(--foreground)] opacity-70 mt-1">
                          {service.description}
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2 text-xs sm:text-sm">
                        <span className="text-[var(--foreground)] opacity-70">
                          <strong>Preço:</strong> R$ {service.price.toFixed(2)}
                        </span>
                        <span className="text-[var(--foreground)] opacity-70">
                          <strong>Duração:</strong> {service.duration} min
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="secondary"
                        onClick={() => handleEdit(service)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs sm:text-sm flex-1 sm:flex-none"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleDelete(service.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs sm:text-sm flex-1 sm:flex-none"
                      >
                        Remover
                      </Button>
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

