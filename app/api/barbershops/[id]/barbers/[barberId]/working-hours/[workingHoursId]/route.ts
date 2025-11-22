import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { BarberWorkingHoursRepository } from '@/lib/repositories/barber-working-hours.repository'

const barberWorkingHoursRepository = new BarberWorkingHoursRepository()

// PUT - Atualizar horário específico
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; barberId: string; workingHoursId: string }> }
) {
  try {
    const { id: barbershopId, barberId, workingHoursId } = await params
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || token.role !== 'BARBEIRO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o horário existe e pertence ao barbeiro
    const workingHours = await prisma.barberWorkingHours.findUnique({
      where: { id: workingHoursId },
      include: {
        barber: {
          include: {
            barbershop: true,
          },
        },
      },
    })

    if (!workingHours || workingHours.barberId !== barberId || workingHours.barber.barbershopId !== barbershopId) {
      return NextResponse.json(
        { error: 'Horário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissões
    const isOwner = workingHours.barber.barbershop.ownerId === token.id
    const isBarber = workingHours.barber.userId === token.id

    if (!isOwner && !isBarber) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { dayOfWeek, startTime, endTime, isOpen } = body

    const updated = await barberWorkingHoursRepository.update(workingHoursId, {
      dayOfWeek,
      startTime,
      endTime,
      isOpen,
    })

    return NextResponse.json({ workingHours: updated })
  } catch (error: any) {
    console.error('Erro ao atualizar horário:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar horário' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar horário específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; barberId: string; workingHoursId: string }> }
) {
  try {
    const { id: barbershopId, barberId, workingHoursId } = await params
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || token.role !== 'BARBEIRO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o horário existe e pertence ao barbeiro
    const workingHours = await prisma.barberWorkingHours.findUnique({
      where: { id: workingHoursId },
      include: {
        barber: {
          include: {
            barbershop: true,
          },
        },
      },
    })

    if (!workingHours || workingHours.barberId !== barberId || workingHours.barber.barbershopId !== barbershopId) {
      return NextResponse.json(
        { error: 'Horário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissões
    const isOwner = workingHours.barber.barbershop.ownerId === token.id
    const isBarber = workingHours.barber.userId === token.id

    if (!isOwner && !isBarber) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    await barberWorkingHoursRepository.delete(workingHoursId)

    return NextResponse.json({ message: 'Horário removido com sucesso' })
  } catch (error: any) {
    console.error('Erro ao remover horário:', error)
    return NextResponse.json(
      { error: 'Erro ao remover horário' },
      { status: 500 }
    )
  }
}

