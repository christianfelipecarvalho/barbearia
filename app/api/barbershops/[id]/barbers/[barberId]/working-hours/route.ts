import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { BarberWorkingHoursRepository } from '@/lib/repositories/barber-working-hours.repository'
import { BarbershopRepository } from '@/lib/repositories/barbershop.repository'

const barberWorkingHoursRepository = new BarberWorkingHoursRepository()
const barbershopRepository = new BarbershopRepository()

// GET - Listar horários de trabalho de um barbeiro
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; barberId: string }> }
) {
  try {
    const { id: barbershopId, barberId } = await params
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o barbeiro existe e pertence à barbearia
    const barberProfile = await prisma.barberProfile.findUnique({
      where: { id: barberId },
      include: {
        barbershop: true,
      },
    })

    if (!barberProfile || barberProfile.barbershopId !== barbershopId) {
      return NextResponse.json(
        { error: 'Barbeiro não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissões: barbeiro pode ver seus próprios horários ou dono da barbearia
    const isOwner = barberProfile.barbershop.ownerId === token.id
    const isBarber = barberProfile.userId === token.id

    if (!isOwner && !isBarber && token.role !== 'ADMIN_GLOBAL') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const workingHours = await barberWorkingHoursRepository.findByBarberId(barberId)

    return NextResponse.json({ workingHours })
  } catch (error: any) {
    console.error('Erro ao buscar horários do barbeiro:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar horários' },
      { status: 500 }
    )
  }
}

// POST - Criar ou atualizar horários de trabalho de um barbeiro
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; barberId: string }> }
) {
  try {
    const { id: barbershopId, barberId } = await params
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || token.role !== 'BARBEIRO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o barbeiro existe e pertence à barbearia
    const barberProfile = await prisma.barberProfile.findUnique({
      where: { id: barberId },
      include: {
        barbershop: true,
      },
    })

    if (!barberProfile || barberProfile.barbershopId !== barbershopId) {
      return NextResponse.json(
        { error: 'Barbeiro não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissões: barbeiro pode editar seus próprios horários ou dono da barbearia
    const isOwner = barberProfile.barbershop.ownerId === token.id
    const isBarber = barberProfile.userId === token.id

    if (!isOwner && !isBarber) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { workingHours } = body

    if (!Array.isArray(workingHours)) {
      return NextResponse.json(
        { error: 'workingHours deve ser um array' },
        { status: 400 }
      )
    }

    // Validar e criar/atualizar horários
    const results = await Promise.all(
      workingHours.map((wh: any) => {
        if (
          typeof wh.dayOfWeek !== 'number' ||
          wh.dayOfWeek < 0 ||
          wh.dayOfWeek > 6 ||
          !wh.startTime ||
          !wh.endTime
        ) {
          throw new Error('Dados inválidos')
        }

        return barberWorkingHoursRepository.upsert({
          barberId,
          dayOfWeek: wh.dayOfWeek,
          startTime: wh.startTime,
          endTime: wh.endTime,
          isOpen: wh.isOpen ?? true,
        })
      })
    )

    return NextResponse.json({ workingHours: results }, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao salvar horários do barbeiro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao salvar horários' },
      { status: 500 }
    )
  }
}

