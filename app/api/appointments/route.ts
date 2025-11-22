import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

// GET - Buscar agendamentos
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const barberId = searchParams.get('barberId')
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')

    const where: any = {}

    // Se for barbeiro, buscar apenas seus agendamentos
    if (token.role === 'BARBEIRO') {
      if (!barberId) {
        // Buscar perfil do barbeiro
        const barberProfile = await prisma.barberProfile.findFirst({
          where: { userId: token.id as string },
        })
        if (barberProfile) {
          where.barberId = barberProfile.id
        } else {
          return NextResponse.json({ appointments: [] })
        }
      } else {
        // Verificar se o barberId pertence ao usuário
        const barberProfile = await prisma.barberProfile.findUnique({
          where: { id: barberId },
        })
        if (!barberProfile || barberProfile.userId !== token.id) {
          return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
        }
        where.barberId = barberId
      }
    } else if (token.role === 'CLIENTE') {
      // Se for cliente, buscar apenas seus agendamentos
      const customerProfile = await prisma.customerProfile.findUnique({
        where: { userId: token.id as string },
      })
      if (customerProfile) {
        where.customerId = customerProfile.id
      } else {
        return NextResponse.json({ appointments: [] })
      }
    }

    // Filtrar por período se fornecido
    if (startTime) {
      where.startTime = { gte: new Date(startTime) }
    }
    if (endTime) {
      where.endTime = { lte: new Date(endTime) }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        customer: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        service: {
          select: {
            name: true,
            price: true,
          },
        },
        barberService: {
          select: {
            name: true,
            price: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    return NextResponse.json({ appointments })
  } catch (error: any) {
    console.error('Erro ao buscar agendamentos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar agendamentos' },
      { status: 500 }
    )
  }
}

// POST - Criar agendamento
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || token.role !== 'CLIENTE') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { barbershopId, barberId, serviceId, barberServiceId, startTime, endTime, notes } = body

    if (!barbershopId || !barberId || (!serviceId && !barberServiceId) || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Verificar se o cliente tem perfil
    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId: token.id as string },
    })

    if (!customerProfile) {
      return NextResponse.json(
        { error: 'Perfil de cliente não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o barbeiro existe e pertence à barbearia
    const barber = await prisma.barberProfile.findUnique({
      where: { id: barberId },
      include: {
        barbershop: true,
      },
    })

    if (!barber || barber.barbershopId !== barbershopId) {
      return NextResponse.json(
        { error: 'Barbeiro não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o serviço existe (se fornecido)
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      })

      if (!service || service.barbershopId !== barbershopId) {
        return NextResponse.json(
          { error: 'Serviço não encontrado' },
          { status: 404 }
        )
      }
    }

    // Verificar se o serviço do barbeiro existe (se fornecido)
    if (barberServiceId) {
      const barberService = await prisma.barberService.findUnique({
        where: { id: barberServiceId },
      })

      if (!barberService || barberService.barberId !== barberId) {
        return NextResponse.json(
          { error: 'Serviço do barbeiro não encontrado' },
          { status: 404 }
        )
      }
    }

    const appointmentStart = new Date(startTime)
    const appointmentEnd = new Date(endTime)

    // Verificar conflitos de agendamento
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        barberId,
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
      return NextResponse.json(
        { error: 'Horário já está ocupado' },
        { status: 400 }
      )
    }

    // Criar agendamento
    const appointment = await prisma.appointment.create({
      data: {
        barbershopId,
        barberId,
        customerId: customerProfile.id,
        serviceId: serviceId || null,
        barberServiceId: barberServiceId || null,
        startTime: appointmentStart,
        endTime: appointmentEnd,
        status: 'PENDING',
        notes: notes || null,
      },
      include: {
        barber: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        service: true,
        barberService: true,
      },
    })

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar agendamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar agendamento' },
      { status: 500 }
    )
  }
}

