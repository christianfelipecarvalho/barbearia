'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
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

interface Barber {
  id: string
  userId: string
  name: string
  email: string | null
  phone: string | null
  bio: string | null
  avatarUrl: string | null
}

export default function BarbershopServicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const barbershopId = params.id as string
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [showBarberSelector, setShowBarberSelector] = useState(false)
  const [selectedServiceForBarbers, setSelectedServiceForBarbers] = useState<Service | null>(null)
  const [selectedBarberIds, setSelectedBarberIds] = useState<string[]>([])
  const [savingBarbers, setSavingBarbers] = useState(false)

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
    if (status === 'authenticated' && session?.user.role === 'BARBEIRO' && barbershopId) {
      fetchServices()
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
        const barbersData = data.barbers.map((b: any) => ({
          id: b.id,
          userId: b.userId,
          name: b.user.name,
          email: b.user.email,
          phone: b.user.phone,
          bio: b.bio,
          avatarUrl: b.avatarUrl,
        }))
        setBarbers(barbersData || [])
      }
    } catch (error) {
      console.error('Erro ao buscar barbeiros:', error)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch(`/api/barbershops/${barbershopId}/services`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      } else {
        setError('Erro ao carregar serviços')
      }
    } catch (error) {
      console.error('Erro ao buscar serviços:', error)
      setError('Erro ao carregar serviços')
    } finally {
      setLoading(false)
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

  const handleEdit = (service: Service) => {
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
        ? `/api/barbershops/${barbershopId}/services/${editingService.id}`
        : `/api/barbershops/${barbershopId}/services`

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
    if (!confirm('Tem certeza que deseja remover este serviço?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/barbershops/${barbershopId}/services/${serviceId}`,
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

  const handleOpenBarberSelector = async (service: Service) => {
    setSelectedServiceForBarbers(service)
    setShowBarberSelector(true)
    setSelectedBarberIds([])

    // Buscar barbeiros já vinculados
    try {
      const response = await fetch(
        `/api/barbershops/${barbershopId}/services/${service.id}/barbers`,
        { cache: 'no-store' }
      )
      if (response.ok) {
        const data = await response.json()
        setSelectedBarberIds(data.barbers.map((b: Barber) => b.id))
      }
    } catch (error) {
      console.error('Erro ao buscar barbeiros vinculados:', error)
    }
  }

  const handleToggleBarber = (barberId: string) => {
    setSelectedBarberIds((prev) =>
      prev.includes(barberId)
        ? prev.filter((id) => id !== barberId)
        : [...prev, barberId]
    )
  }

  const handleSelectAllBarbers = () => {
    if (selectedBarberIds.length === barbers.length) {
      setSelectedBarberIds([])
    } else {
      setSelectedBarberIds(barbers.map((b) => b.id))
    }
  }

  const handleSaveBarbers = async () => {
    if (!selectedServiceForBarbers) return

    setSavingBarbers(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/barbershops/${barbershopId}/services/${selectedServiceForBarbers.id}/barbers`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barberIds: selectedBarberIds }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao vincular barbeiros')
      }

      setShowBarberSelector(false)
      setSelectedServiceForBarbers(null)
      setSelectedBarberIds([])
      alert('Barbeiros vinculados com sucesso!')
    } catch (err: any) {
      setError(err.message || 'Erro ao vincular barbeiros')
    } finally {
      setSavingBarbers(false)
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
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Serviços da Barbearia</h1>
              <p className="text-xs sm:text-sm opacity-70 mt-1">
                Gerencie os serviços oferecidos pela barbearia
              </p>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-green-600 hover:bg-green-700 text-white border-0 text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
            >
              <span className="hidden sm:inline">+ Adicionar Serviço</span>
              <span className="sm:hidden">+</span>
            </Button>
          </div>

          {error && (
            <div className="rounded-md bg-[var(--error-bg)] p-3 sm:p-4 text-[var(--error-foreground)]">
              <p className="text-xs sm:text-sm">{error}</p>
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
                  <Button
                    type="submit"
                    isLoading={saving}
                    className="bg-green-600 hover:bg-green-700 text-white border-0 w-full sm:w-auto"
                  >
                    {editingService ? 'Atualizar' : 'Adicionar'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetForm}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Serviços Cadastrados</h2>
            {services.length === 0 ? (
              <p className="text-sm text-[var(--foreground)] opacity-70">
                Nenhum serviço cadastrado ainda. Adicione serviços para que os clientes possam agendar.
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
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <Button
                        variant="secondary"
                        onClick={() => handleOpenBarberSelector(service)}
                        className="bg-purple-600 hover:bg-purple-700 text-white border-0 text-xs sm:text-sm flex-1 sm:flex-none"
                      >
                        <span className="hidden sm:inline">Vincular Barbeiros</span>
                        <span className="sm:hidden">Barbeiros</span>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleEdit(service)}
                        className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm flex-1 sm:flex-none"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleDelete(service.id)}
                        className="text-red-600 hover:text-red-700 text-xs sm:text-sm flex-1 sm:flex-none"
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal de Seleção de Barbeiros */}
          {showBarberSelector && selectedServiceForBarbers && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold">
                    Vincular Barbeiros - {selectedServiceForBarbers.name}
                  </h2>
                  <button
                    onClick={() => {
                      setShowBarberSelector(false)
                      setSelectedServiceForBarbers(null)
                      setSelectedBarberIds([])
                    }}
                    className="p-2 rounded-md hover:bg-[var(--hover-bg)] transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {barbers.length === 0 ? (
                  <p className="text-sm opacity-70 mb-4">
                    Nenhum barbeiro cadastrado. Adicione barbeiros primeiro.
                  </p>
                ) : (
                  <>
                    <div className="mb-4">
                      <button
                        onClick={handleSelectAllBarbers}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition"
                      >
                        {selectedBarberIds.length === barbers.length
                          ? 'Desmarcar Todos'
                          : 'Selecionar Todos'}
                      </button>
                      <p className="text-xs sm:text-sm opacity-70 mt-2">
                        {selectedBarberIds.length} de {barbers.length} barbeiros selecionados
                      </p>
                    </div>

                    <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                      {barbers.map((barber) => (
                        <label
                          key={barber.id}
                          className="flex items-center gap-3 p-3 border border-[var(--card-border)] rounded-lg hover:bg-[var(--hover-bg)] cursor-pointer transition"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBarberIds.includes(barber.id)}
                            onChange={() => handleToggleBarber(barber.id)}
                            className="w-4 h-4"
                          />
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {barber.avatarUrl ? (
                              <img
                                src={barber.avatarUrl}
                                alt={barber.name}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[var(--foreground)] opacity-20 flex items-center justify-center flex-shrink-0">
                                <span className="text-lg">
                                  {barber.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base truncate">
                                {barber.name}
                              </p>
                              {(barber.email || barber.phone) && (
                                <p className="text-xs sm:text-sm opacity-70 truncate">
                                  {barber.email || barber.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={handleSaveBarbers}
                        isLoading={savingBarbers}
                        className="bg-green-600 hover:bg-green-700 text-white border-0 w-full sm:w-auto"
                      >
                        Salvar
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setShowBarberSelector(false)
                          setSelectedServiceForBarbers(null)
                          setSelectedBarberIds([])
                        }}
                        className="w-full sm:w-auto"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
