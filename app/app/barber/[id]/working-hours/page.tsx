'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loading } from '@/components/ui/Loading'
import { BackButton } from '@/components/ui/BackButton'

interface WorkingHours {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isOpen: boolean
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

export default function BarberWorkingHoursViewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const barbershopId = params.id as string
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([])
  const [loading, setLoading] = useState(true)
  const [barberProfileId, setBarberProfileId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session?.user.role !== 'BARBEIRO') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user.role === 'BARBEIRO' && barbershopId) {
      fetchData()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status, session, barbershopId])

  const fetchData = async () => {
    try {
      // Buscar perfil do barbeiro nesta barbearia
      const barbershopsRes = await fetch('/api/barbers/my-barbershops', { cache: 'no-store' })
      if (barbershopsRes.ok) {
        const data = await barbershopsRes.json()
        const shop = data.barbershops?.find((s: any) => s.id === barbershopId && !s.isOwner)
        if (shop) {
          setBarberProfileId(shop.profileId)
          
          // Buscar horários
          const hoursRes = await fetch(
            `/api/barbershops/${barbershopId}/barbers/${shop.profileId}/working-hours`,
            { cache: 'no-store' }
          )
          if (hoursRes.ok) {
            const hoursData = await hoursRes.json()
            setWorkingHours(hoursData.workingHours || [])
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
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

  // Criar array com todos os dias
  const allDays = Array.from({ length: 7 }, (_, i) => {
    const existing = workingHours.find((wh) => wh.dayOfWeek === i)
    return existing || {
      id: '',
      dayOfWeek: i,
      startTime: '',
      endTime: '',
      isOpen: false,
    }
  })

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <BackButton href={`/app/barber/${barbershopId}`} />
            <div>
              <h1 className="text-3xl font-bold">Meus Horários de Trabalho</h1>
              <p className="text-sm opacity-70 mt-1">
                Visualize seus horários configurados pelo dono da barbearia
              </p>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6">
            <div className="space-y-4">
              {allDays.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className="flex items-center justify-between p-4 border border-[var(--card-border)] rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{DAYS_OF_WEEK[day.dayOfWeek]}</h3>
                    {day.isOpen ? (
                      <p className="text-sm opacity-70 mt-1">
                        {day.startTime} - {day.endTime}
                      </p>
                    ) : (
                      <p className="text-sm opacity-50 mt-1">Fechado</p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 text-xs rounded-full ${
                      day.isOpen
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {day.isOpen ? 'Aberto' : 'Fechado'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                ℹ️ Estes horários foram configurados pelo dono da barbearia. Entre em contato com
                ele para solicitar alterações.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

