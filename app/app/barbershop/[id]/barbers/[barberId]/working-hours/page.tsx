'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Loading } from '@/components/ui/Loading'
import { BackButton } from '@/components/ui/BackButton'

interface WorkingHours {
  id?: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isOpen: boolean
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

const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

export default function BarberWorkingHoursPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const barbershopId = params.id as string
  const barberId = params.barberId as string
  const [barber, setBarber] = useState<Barber | null>(null)
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user.role !== 'BARBEIRO') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'BARBEIRO' && barbershopId && barberId) {
      fetchBarberAndHours()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status, session, barbershopId, barberId])

  const fetchBarberAndHours = async () => {
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

      // Buscar horários
      const hoursResponse = await fetch(
        `/api/barbershops/${barbershopId}/barbers/${barberId}/working-hours`,
        { cache: 'no-store' }
      )
      if (hoursResponse.ok) {
        const data = await hoursResponse.json()
        const existingHours = data.workingHours || []
        
        // Criar array com todos os dias da semana
        const allDays: WorkingHours[] = Array.from({ length: 7 }, (_, i) => {
          const existing = existingHours.find((wh: WorkingHours) => wh.dayOfWeek === i)
          return existing || {
            dayOfWeek: i,
            startTime: '09:00',
            endTime: '18:00',
            isOpen: false,
          }
        })
        
        setWorkingHours(allDays)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleTimeChange = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setWorkingHours((prev) =>
      prev.map((wh) =>
        wh.dayOfWeek === dayOfWeek ? { ...wh, [field]: value } : wh
      )
    )
  }

  const handleToggleDay = (dayOfWeek: number) => {
    setWorkingHours((prev) =>
      prev.map((wh) =>
        wh.dayOfWeek === dayOfWeek ? { ...wh, isOpen: !wh.isOpen } : wh
      )
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/barbershops/${barbershopId}/barbers/${barberId}/working-hours`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workingHours }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar horários')
      }

      const data = await response.json()
      setWorkingHours(data.workingHours)
      alert('Horários salvos com sucesso!')
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar horários')
    } finally {
      setSaving(false)
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
          <BackButton href={`/app/barbershop/${barbershopId}/working-hours`} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-start gap-2 sm:gap-4">
            <BackButton href={`/app/barbershop/${barbershopId}/working-hours`} className="flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Horários de Trabalho</h1>
              {barber && (
                <p className="text-xs sm:text-sm opacity-70 mt-1 truncate">
                  {barber.user.name}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-[var(--error-bg)] p-4 text-[var(--error-foreground)]">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 sm:p-6">
            <p className="text-xs sm:text-sm opacity-70 mb-4 sm:mb-6">
              Configure os horários de trabalho deste barbeiro para cada dia da semana. Os clientes
              só poderão agendar horários dentro dos períodos que você definir.
            </p>

            <div className="space-y-3 sm:space-y-4">
              {workingHours.map((wh) => (
                <div
                  key={wh.dayOfWeek}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-[var(--card-border)] rounded-lg"
                >
                  <div className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[140px]">
                    <input
                      type="checkbox"
                      checked={wh.isOpen}
                      onChange={() => handleToggleDay(wh.dayOfWeek)}
                      className="w-4 h-4 flex-shrink-0"
                    />
                    <label className="font-medium text-sm sm:text-base">
                      {DAYS_OF_WEEK[wh.dayOfWeek]}
                    </label>
                  </div>

                  {wh.isOpen ? (
                    <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                      <input
                        type="time"
                        value={wh.startTime}
                        onChange={(e) =>
                          handleTimeChange(wh.dayOfWeek, 'startTime', e.target.value)
                        }
                        className="flex-1 sm:flex-none px-2 sm:px-3 py-2 text-sm sm:text-base rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)]"
                      />
                      <span className="opacity-70 text-sm sm:text-base">até</span>
                      <input
                        type="time"
                        value={wh.endTime}
                        onChange={(e) =>
                          handleTimeChange(wh.dayOfWeek, 'endTime', e.target.value)
                        }
                        className="flex-1 sm:flex-none px-2 sm:px-3 py-2 text-sm sm:text-base rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)]"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 text-xs sm:text-sm opacity-60">Fechado</div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 sm:mt-6 flex justify-end">
              <Button onClick={handleSave} isLoading={saving} className="w-full sm:w-auto">
                Salvar Horários
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

