'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
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
}

interface Barber {
  id: string
  name: string
  bio: string | null
  avatarUrl: string | null
  services: Array<{
    id: string
    name: string
    price: number
    duration: number
  }>
}

interface Barbershop {
  id: string
  name: string
  services: Service[]
}

export default function BookAppointmentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const barbershopId = params.id as string
  const initialServiceId = searchParams.get('service')

  const [barbershop, setBarbershop] = useState<Barbershop | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [availableBarbers, setAvailableBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingBarbers, setLoadingBarbers] = useState(false)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/barbershops/${barbershopId}/book${initialServiceId ? `?service=${initialServiceId}` : ''}`)
    }
  }, [status, router, barbershopId, initialServiceId])

  useEffect(() => {
    if (barbershopId) {
      fetchBarbershop()
    }
  }, [barbershopId])

  useEffect(() => {
    if (initialServiceId && barbershop) {
      const service = barbershop.services.find((s) => s.id === initialServiceId)
      if (service) {
        setSelectedService(service)
      }
    }
  }, [initialServiceId, barbershop])

  useEffect(() => {
    if (selectedDate && selectedTime && selectedService) {
      fetchAvailableBarbers()
    } else {
      setAvailableBarbers([])
      setSelectedBarber(null)
    }
  }, [selectedDate, selectedTime, selectedService])

  const fetchBarbershop = async () => {
    try {
      const response = await fetch(`/api/barbershops/${barbershopId}`)
      if (response.ok) {
        const data = await response.json()
        setBarbershop(data)
      }
    } catch (error) {
      console.error('Erro ao buscar barbearia:', error)
      setError('Erro ao carregar barbearia')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableBarbers = async () => {
    setLoadingBarbers(true)
    setSelectedBarber(null)
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        time: selectedTime,
        serviceId: selectedService!.id,
      })
      const response = await fetch(
        `/api/barbershops/${barbershopId}/barbers/availability?${params.toString()}`
      )
      if (response.ok) {
        const data = await response.json()
        setAvailableBarbers(data.barbers || [])
      } else {
        setError('Erro ao buscar barbeiros disponíveis')
      }
    } catch (error) {
      console.error('Erro ao buscar barbeiros:', error)
      setError('Erro ao buscar barbeiros disponíveis')
    } finally {
      setLoadingBarbers(false)
    }
  }

  const handleBook = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !selectedBarber) {
      setError('Preencha todos os campos')
      return
    }

    setBooking(true)
    setError(null)

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const appointmentDate = new Date(selectedDate)
      appointmentDate.setHours(hours, minutes, 0, 0)

      const appointmentEnd = new Date(appointmentDate)
      appointmentEnd.setMinutes(appointmentEnd.getMinutes() + selectedService.duration)

      // Verificar se é serviço do barbeiro ou da barbearia
      const barberService = selectedBarber.services.find((s) => s.id === selectedService.id)
      const isBarberService = !!barberService

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barbershopId,
          barberId: selectedBarber.id,
          serviceId: isBarberService ? null : selectedService.id,
          barberServiceId: isBarberService ? selectedService.id : null,
          startTime: appointmentDate.toISOString(),
          endTime: appointmentEnd.toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar agendamento')
      }

      router.push('/app/customer/appointments?success=true')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar agendamento')
    } finally {
      setBooking(false)
    }
  }

  // Obter data mínima (hoje)
  const today = new Date().toISOString().split('T')[0]

  if (status === 'loading' || loading) {
    return <Loading fullScreen text="Carregando..." />
  }

  if (!session) {
    return null
  }

  if (!barbershop) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Barbearia não encontrada</p>
          <BackButton href="/barbershops" />
        </div>
      </div>
    )
  }

  // Os serviços já vêm filtrados como ativos da API
  const activeServices = barbershop.services || []

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-start gap-2 sm:gap-4">
            <BackButton href={`/barbershops/${barbershopId}`} className="flex-shrink-0 mt-1" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex-1">Agendar Horário</h1>
          </div>

          {error && (
            <div className="rounded-md bg-[var(--error-bg)] p-4 text-[var(--error-foreground)]">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Seleção de Serviço */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">1. Escolha o Serviço</h2>
            {activeServices.length === 0 ? (
              <p className="text-sm sm:text-base opacity-70">Nenhum serviço disponível</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {activeServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`p-3 sm:p-4 border-2 rounded-lg text-left transition ${
                      selectedService?.id === service.id
                        ? 'border-[var(--foreground)] bg-[var(--hover-bg)]'
                        : 'border-[var(--card-border)] hover:border-[var(--foreground)]'
                    }`}
                  >
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">{service.name}</h3>
                    {service.description && (
                      <p className="text-xs sm:text-sm opacity-70 mb-2">{service.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm sm:text-base">R$ {service.price.toFixed(2)}</span>
                      <span className="text-xs sm:text-sm opacity-70">{service.duration} min</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Seleção de Data e Hora */}
          {selectedService && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">2. Escolha Data e Hora</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Data</label>
                  <input
                    type="date"
                    min={today}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2">Hora</label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Seleção de Barbeiro */}
          {selectedDate && selectedTime && selectedService && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">3. Escolha o Barbeiro</h2>
              {loadingBarbers ? (
                <div className="text-center py-6 sm:py-8">
                  <Loading text="Buscando barbeiros disponíveis..." />
                </div>
              ) : availableBarbers.length === 0 ? (
                <p className="text-sm sm:text-base opacity-70">
                  Nenhum barbeiro disponível neste horário. Tente outra data ou hora.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {availableBarbers.map((barber) => {
                    // Verificar se o barbeiro tem o serviço específico ou usar o serviço da barbearia
                    const barberService = barber.services.find((s) => s.id === selectedService.id)
                    const serviceToUse = barberService || selectedService

                    return (
                      <button
                        key={barber.id}
                        onClick={() => setSelectedBarber(barber)}
                        className={`p-3 sm:p-4 border-2 rounded-lg text-left transition ${
                          selectedBarber?.id === barber.id
                            ? 'border-[var(--foreground)] bg-[var(--hover-bg)]'
                            : 'border-[var(--card-border)] hover:border-[var(--foreground)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                          {barber.avatarUrl ? (
                            <img
                              src={barber.avatarUrl}
                              alt={barber.name}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--foreground)] opacity-20 flex items-center justify-center flex-shrink-0">
                              <span className="text-lg sm:text-xl">
                                {barber.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm sm:text-base truncate">{barber.name}</h3>
                            {barber.bio && (
                              <p className="text-xs sm:text-sm opacity-70 line-clamp-2">{barber.bio}</p>
                            )}
                          </div>
                        </div>
                        {barberService && (
                          <div className="mt-2 pt-2 border-t border-[var(--card-border)]">
                            <p className="text-xs sm:text-sm">
                              <strong>Preço:</strong> R$ {barberService.price.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Botão de Confirmar */}
          {selectedService && selectedDate && selectedTime && selectedBarber && (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 sm:p-6">
              <div className="mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Resumo do Agendamento</h2>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm opacity-70">
                  <p>
                    <strong>Serviço:</strong> {selectedService.name} - R${' '}
                    {(selectedBarber.services.find((s) => s.id === selectedService.id)?.price ||
                      selectedService.price).toFixed(2)}
                  </p>
                  <p>
                    <strong>Data:</strong>{' '}
                    {new Date(selectedDate).toLocaleDateString('pt-BR')} às {selectedTime}
                  </p>
                  <p>
                    <strong>Barbeiro:</strong> {selectedBarber.name}
                  </p>
                </div>
              </div>
              <Button onClick={handleBook} isLoading={booking} className="w-full text-sm sm:text-base">
                Confirmar Agendamento
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

