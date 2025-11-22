'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loading } from '@/components/ui/Loading'
import { BackButton } from '@/components/ui/BackButton'

interface Appointment {
  id: string
  startTime: string
  endTime: string
  status: string
  notes: string | null
  customer: {
    name: string
  }
  service: {
    name: string
    price: number
  } | null
  barberService: {
    name: string
    price: number
  } | null
}

export default function BarberScheduleViewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const barbershopId = params.id as string
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user.role !== 'BARBEIRO') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'BARBEIRO' && barbershopId) {
      fetchAppointments()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status, session, barbershopId, selectedDate])

  const fetchAppointments = async () => {
    try {
      // Buscar perfil do barbeiro
      const barbershopsRes = await fetch('/api/barbers/my-barbershops', { cache: 'no-store' })
      if (barbershopsRes.ok) {
        const data = await barbershopsRes.json()
        const shop = data.barbershops?.find((s: any) => s.id === barbershopId && !s.isOwner)
        if (shop) {
          // Buscar agendamentos do barbeiro
          const startOfDay = new Date(selectedDate)
          startOfDay.setHours(0, 0, 0, 0)
          const endOfDay = new Date(selectedDate)
          endOfDay.setHours(23, 59, 59, 999)

          const appointmentsRes = await fetch(
            `/api/appointments?barberId=${shop.profileId}&startTime=${startOfDay.toISOString()}&endTime=${endOfDay.toISOString()}`,
            { cache: 'no-store' }
          )
          if (appointmentsRes.ok) {
            const appointmentsData = await appointmentsRes.json()
            setAppointments(appointmentsData.appointments || [])
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error)
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

  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-500/20 text-green-600 dark:text-green-400'
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
      case 'COMPLETED':
        return 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-600 dark:text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmado'
      case 'PENDING':
        return 'Pendente'
      case 'COMPLETED':
        return 'Concluído'
      case 'CANCELLED':
        return 'Cancelado'
      case 'NO_SHOW':
        return 'Não compareceu'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <BackButton href={`/app/barber/${barbershopId}`} />
            <div>
              <h1 className="text-3xl font-bold">Minha Agenda</h1>
              <p className="text-sm opacity-70 mt-1">Visualize seus agendamentos</p>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4">
            <label className="block text-sm font-medium mb-2">Data</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {sortedAppointments.length === 0 ? (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-8 text-center">
              <p className="opacity-70">Nenhum agendamento para esta data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{appointment.customer.name}</h3>
                      <p className="text-sm opacity-70 mt-1">
                        {new Date(appointment.startTime).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(appointment.endTime).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${getStatusColor(
                        appointment.status
                      )}`}
                    >
                      {getStatusLabel(appointment.status)}
                    </span>
                  </div>
                  {(appointment.service || appointment.barberService) && (
                    <div className="mb-2">
                      <p className="text-sm font-medium">
                        Serviço:{' '}
                        {appointment.service?.name || appointment.barberService?.name}
                      </p>
                      <p className="text-sm opacity-70">
                        R${' '}
                        {(
                          appointment.service?.price || appointment.barberService?.price || 0
                        ).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {appointment.notes && (
                    <div className="mt-4 p-3 bg-[var(--hover-bg)] rounded-md">
                      <p className="text-sm">{appointment.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

