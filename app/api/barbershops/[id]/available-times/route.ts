import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Buscar horários disponíveis de uma barbearia em uma data específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: barbershopId } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // formato: YYYY-MM-DD

    if (!date) {
      return NextResponse.json(
        { error: 'Data é obrigatória' },
        { status: 400 }
      )
    }

    const selectedDate = new Date(date)
    const dayOfWeek = selectedDate.getDay() // 0 = Domingo, 1 = Segunda, etc.
    
    // Verificar se a data é hoje para filtrar horários passados
    const today = new Date()
    const isToday = selectedDate.toDateString() === today.toDateString()
    const currentTime = today.getHours() * 60 + today.getMinutes() // Minutos desde meia-noite

    // Buscar todos os barbeiros da barbearia
    const barbers = await prisma.barberProfile.findMany({
      where: { barbershopId },
      include: {
        workingHours: true,
      },
    })

    // Coletar todos os horários disponíveis de todos os barbeiros
    const availableTimes = new Set<string>()

    for (const barber of barbers) {
      const workingHours = barber.workingHours.find(
        (wh) => wh.dayOfWeek === dayOfWeek && wh.isOpen
      )

      if (!workingHours) continue

      // Gerar slots de horário (a cada 30 minutos)
      const [startHour, startMin] = workingHours.startTime.split(':').map(Number)
      const [endHour, endMin] = workingHours.endTime.split(':').map(Number)

      const startMinutes = startHour * 60 + startMin
      // Se o horário de término for 00:00, considerar como 24:00 (1440 minutos)
      let endMinutes = endHour * 60 + endMin
      if (endMinutes === 0) {
        endMinutes = 24 * 60 // 1440 minutos = meia-noite do dia seguinte
      }

      // Se for hoje, ajustar o horário inicial para não mostrar horários passados
      let actualStartMinutes = startMinutes
      if (isToday && startMinutes < currentTime) {
        // Começar do próximo slot de 30 minutos após a hora atual
        actualStartMinutes = Math.ceil(currentTime / 30) * 30
        // Garantir que não ultrapasse o horário de término
        if (actualStartMinutes >= endMinutes) {
          continue // Não há horários disponíveis hoje
        }
      }

      // Gerar slots de 30 em 30 minutos
      // Se endMinutes for 1440 (00:00 do dia seguinte), não incluir esse horário
      const maxMinutes = endMinutes === 24 * 60 ? endMinutes - 30 : endMinutes
      
      for (let minutes = actualStartMinutes; minutes < maxMinutes; minutes += 30) {
        const slotHour = Math.floor(minutes / 60) % 24
        const slotMin = minutes % 60
        const timeSlot = `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`
        
        // Verificar se há conflitos com agendamentos existentes
        const appointmentStart = new Date(selectedDate)
        appointmentStart.setHours(slotHour, slotMin, 0, 0)

        const appointmentEnd = new Date(appointmentStart)
        appointmentEnd.setMinutes(appointmentEnd.getMinutes() + 30)

        const conflictingAppointment = await prisma.appointment.findFirst({
          where: {
            barberId: barber.id,
            status: {
              notIn: ['CANCELLED', 'NO_SHOW'],
            },
            OR: [
              {
                startTime: {
                  gte: appointmentStart,
                  lt: appointmentEnd,
                },
              },
              {
                endTime: {
                  gt: appointmentStart,
                  lte: appointmentEnd,
                },
              },
              {
                AND: [
                  { startTime: { lte: appointmentStart } },
                  { endTime: { gte: appointmentEnd } },
                ],
              },
            ],
          },
        })

        if (!conflictingAppointment) {
          availableTimes.add(timeSlot)
        }
      }
    }

    // Converter para array e ordenar
    const sortedTimes = Array.from(availableTimes).sort((a, b) => {
      const [hourA, minA] = a.split(':').map(Number)
      const [hourB, minB] = b.split(':').map(Number)
      return hourA * 60 + minA - (hourB * 60 + minB)
    })

    // Limitar a 6 horários para não sobrecarregar o card
    const limitedTimes = sortedTimes.slice(0, 6)

    return NextResponse.json({ times: limitedTimes, total: sortedTimes.length })
  } catch (error: any) {
    console.error('Erro ao buscar horários disponíveis:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar horários disponíveis' },
      { status: 500 }
    )
  }
}

