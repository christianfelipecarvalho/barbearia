import { NextResponse } from 'next/server'
import { BarbershopRepository } from '@/lib/repositories/barbershop.repository'
import { prisma } from '@/lib/prisma'

const barbershopRepository = new BarbershopRepository()

// Função auxiliar para verificar se uma barbearia tem barbeiros disponíveis
async function hasAvailableBarbers(
  barbershopId: string,
  date: string,
  time?: string
): Promise<boolean> {
  try {
    const selectedDate = new Date(date)
    const dayOfWeek = selectedDate.getDay() // 0 = Domingo, 1 = Segunda, etc.

    // Buscar todos os barbeiros da barbearia
    const barbers = await prisma.barberProfile.findMany({
      where: { barbershopId },
      include: {
        workingHours: true,
      },
    })

    // Se não há barbeiros, retornar false
    if (barbers.length === 0) return false

    // Se não foi especificado horário, verificar apenas se há barbeiros trabalhando neste dia
    if (!time) {
      return barbers.some((barber) => {
        const workingHours = barber.workingHours.find(
          (wh) => wh.dayOfWeek === dayOfWeek && wh.isOpen
        )
        return !!workingHours
      })
    }

    // Se foi especificado horário, verificar disponibilidade completa
    for (const barber of barbers) {
      const workingHours = barber.workingHours.find(
        (wh) => wh.dayOfWeek === dayOfWeek && wh.isOpen
      )

      if (!workingHours) continue

      // Verificar se o horário está dentro do horário de trabalho
      const [startHour, startMin] = workingHours.startTime.split(':').map(Number)
      const [endHour, endMin] = workingHours.endTime.split(':').map(Number)
      const [requestHour, requestMin] = time.split(':').map(Number)

      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin
      const requestMinutes = requestHour * 60 + requestMin

      if (requestMinutes < startMinutes || requestMinutes >= endMinutes) {
        continue // Fora do horário de trabalho
      }

      // Verificar se há conflitos com agendamentos existentes
      const appointmentStart = new Date(selectedDate)
      appointmentStart.setHours(requestHour, requestMin, 0, 0)

      // Usar duração padrão de 30 minutos para verificação
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
        return true // Encontrou um barbeiro disponível
      }
    }

    return false // Nenhum barbeiro disponível
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error)
    return false
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city') || undefined
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
    const date = searchParams.get('date') || undefined
    const time = searchParams.get('time') || undefined

    // Buscar barbearias com status ACTIVE ou TRIAL (período de teste)
    const allBarbershops = await barbershopRepository.findActiveBarbershops({
      city,
    })
    
    // Filtrar apenas barbearias ativas (ACTIVE ou TRIAL que não expirou)
    const now = new Date()
    const barbershops = allBarbershops.filter((shop) => {
      if (!shop.subscription) return false
      const status = shop.subscription.status
      if (status === 'ACTIVE') return true
      if (status === 'TRIAL' && shop.subscription.trialEndsAt) {
        return new Date(shop.subscription.trialEndsAt) > now
      }
      return false
    })

    // Buscar serviços de cada barbearia para calcular preços
    const barbershopsWithServices = await Promise.all(
      barbershops.map(async (shop) => {
        const services = await prisma.service.findMany({
          where: {
            barbershopId: shop.id,
            isActive: true,
          },
          select: {
            price: true,
            duration: true,
          },
        })

        const prices = services.map(s => s.price)
        const minServicePrice = prices.length > 0 ? Math.min(...prices) : null
        const maxServicePrice = prices.length > 0 ? Math.max(...prices) : null

        return {
          ...shop,
          minPrice: minServicePrice,
          maxPrice: maxServicePrice,
          servicesCount: services.length,
        }
      })
    )

    // Filtrar por preço se fornecido
    let filtered = barbershopsWithServices
    if (minPrice !== undefined) {
      filtered = filtered.filter(shop => shop.minPrice !== null && shop.minPrice >= minPrice)
    }
    if (maxPrice !== undefined) {
      filtered = filtered.filter(shop => shop.minPrice !== null && shop.minPrice <= maxPrice)
    }

    // Filtrar por disponibilidade de data/horário se fornecido
    if (date) {
      const availabilityChecks = await Promise.all(
        filtered.map(async (shop) => {
          const hasAvailable = await hasAvailableBarbers(shop.id, date, time)
          return hasAvailable ? shop : null
        })
      )
      filtered = availabilityChecks.filter((shop) => shop !== null) as typeof filtered
    }

    return NextResponse.json(filtered)
  } catch (error: any) {
    console.error('Erro ao buscar barbearias:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar barbearias' },
      { status: 500 }
    )
  }
}

