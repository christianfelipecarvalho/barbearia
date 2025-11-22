import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BarberWorkingHoursRepository } from '@/lib/repositories/barber-working-hours.repository'

const barberWorkingHoursRepository = new BarberWorkingHoursRepository()

// GET - Buscar barbeiros disponíveis em uma data/hora específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: barbershopId } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // formato: YYYY-MM-DD
    const time = searchParams.get('time') // formato: HH:mm (opcional)
    const serviceId = searchParams.get('serviceId') // ID do serviço (opcional)

    if (!date) {
      return NextResponse.json(
        { error: 'Data é obrigatória' },
        { status: 400 }
      )
    }

    const selectedDate = new Date(date)
    const dayOfWeek = selectedDate.getDay() // 0 = Domingo, 1 = Segunda, etc.

    // Buscar todos os barbeiros da barbearia
    const barbers = await prisma.barberProfile.findMany({
      where: { barbershopId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        workingHours: true,
        services: {
          where: {
            isActive: true,
          },
        },
      },
    })

    // Filtrar barbeiros disponíveis
    const availableBarbers = await Promise.all(
      barbers.map(async (barber) => {
        // Verificar se o barbeiro tem horário configurado para este dia
        const workingHours = barber.workingHours.find(
          (wh) => wh.dayOfWeek === dayOfWeek && wh.isOpen
        )

        if (!workingHours) {
          return null // Barbeiro não trabalha neste dia
        }

        // Se foi especificado um horário, verificar se está dentro do horário de trabalho
        if (time) {
          const [startHour, startMin] = workingHours.startTime.split(':').map(Number)
          const [endHour, endMin] = workingHours.endTime.split(':').map(Number)
          const [requestHour, requestMin] = time.split(':').map(Number)

          const startMinutes = startHour * 60 + startMin
          const endMinutes = endHour * 60 + endMin
          const requestMinutes = requestHour * 60 + requestMin

          if (requestMinutes < startMinutes || requestMinutes >= endMinutes) {
            return null // Fora do horário de trabalho
          }

          // Verificar se há conflitos com agendamentos existentes
          const appointmentStart = new Date(selectedDate)
          appointmentStart.setHours(requestHour, requestMin, 0, 0)

          // Buscar duração do serviço se fornecido
          let serviceDuration = 30 // padrão 30 minutos
          if (serviceId) {
            const service = await prisma.service.findUnique({
              where: { id: serviceId },
            })
            if (service) {
              serviceDuration = service.duration
            } else {
              // Verificar se é um serviço do barbeiro
              const barberService = barber.services.find((s) => s.id === serviceId)
              if (barberService) {
                serviceDuration = barberService.duration
              }
            }
          }

          const appointmentEnd = new Date(appointmentStart)
          appointmentEnd.setMinutes(appointmentEnd.getMinutes() + serviceDuration)

          // Verificar conflitos
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

          if (conflictingAppointment) {
            return null // Barbeiro já tem agendamento neste horário
          }
        }

        // Verificar se o barbeiro oferece o serviço solicitado (se fornecido)
        if (serviceId) {
          const barbershopService = await prisma.service.findUnique({
            where: { id: serviceId },
            include: {
              barbers: {
                select: {
                  barberId: true,
                },
              },
            },
          })

          if (!barbershopService) {
            // Verificar se é um serviço específico do barbeiro
            const hasService = barber.services.some((s) => s.id === serviceId)
            if (!hasService) {
              return null // Barbeiro não oferece este serviço
            }
          } else {
            // Serviço da barbearia - verificar se há barbeiros vinculados
            if (barbershopService.barbers.length > 0) {
              // Se há barbeiros vinculados, apenas esses podem oferecer
              const isLinked = barbershopService.barbers.some(
                (sb) => sb.barberId === barber.id
              )
              if (!isLinked) {
                return null // Barbeiro não está vinculado a este serviço
              }
            }
            // Se não há barbeiros vinculados, todos podem oferecer (comportamento padrão)
          }
        }

        return {
          id: barber.id,
          userId: barber.userId,
          name: barber.user.name,
          email: barber.user.email,
          phone: barber.user.phone,
          bio: barber.bio,
          avatarUrl: barber.avatarUrl,
          workingHours: workingHours,
          services: barber.services,
        }
      })
    )

    // Filtrar nulls
    const filteredBarbers = availableBarbers.filter((b) => b !== null)

    return NextResponse.json({ barbers: filteredBarbers })
  } catch (error: any) {
    console.error('Erro ao buscar barbeiros disponíveis:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar barbeiros disponíveis' },
      { status: 500 }
    )
  }
}

