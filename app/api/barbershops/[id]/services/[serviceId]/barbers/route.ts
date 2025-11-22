import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { BarbershopRepository } from '@/lib/repositories/barbershop.repository'

const barbershopRepository = new BarbershopRepository()

// GET - Listar barbeiros vinculados a um serviço
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const { id: barbershopId, serviceId } = await params
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || token.role !== 'BARBEIRO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o serviço existe e pertence à barbearia
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        barbershop: true,
      },
    })

    if (!service || service.barbershopId !== barbershopId) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se é dono da barbearia
    if (service.barbershop.ownerId !== token.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Buscar barbeiros vinculados ao serviço
    const serviceBarbers = await prisma.serviceBarber.findMany({
      where: { serviceId },
      include: {
        barber: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      barbers: serviceBarbers.map((sb) => ({
        id: sb.barber.id,
        userId: sb.barber.userId,
        name: sb.barber.user.name,
        email: sb.barber.user.email,
        phone: sb.barber.user.phone,
        bio: sb.barber.bio,
        avatarUrl: sb.barber.avatarUrl,
      })),
    })
  } catch (error: any) {
    console.error('Erro ao buscar barbeiros do serviço:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar barbeiros' },
      { status: 500 }
    )
  }
}

// POST - Vincular barbeiros a um serviço
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const { id: barbershopId, serviceId } = await params
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || token.role !== 'BARBEIRO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o serviço existe e pertence à barbearia
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        barbershop: true,
      },
    })

    if (!service || service.barbershopId !== barbershopId) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se é dono da barbearia
    if (service.barbershop.ownerId !== token.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { barberIds } = body

    if (!Array.isArray(barberIds)) {
      return NextResponse.json(
        { error: 'barberIds deve ser um array' },
        { status: 400 }
      )
    }

    // Verificar se todos os barbeiros pertencem à barbearia
    const barbers = await prisma.barberProfile.findMany({
      where: {
        id: { in: barberIds },
        barbershopId,
      },
    })

    if (barbers.length !== barberIds.length) {
      return NextResponse.json(
        { error: 'Um ou mais barbeiros não pertencem a esta barbearia' },
        { status: 400 }
      )
    }

    // Remover todas as vinculações existentes
    await prisma.serviceBarber.deleteMany({
      where: { serviceId },
    })

    // Criar novas vinculações
    if (barberIds.length > 0) {
      await prisma.serviceBarber.createMany({
        data: barberIds.map((barberId: string) => ({
          serviceId,
          barberId,
        })),
      })
    }

    return NextResponse.json({ message: 'Barbeiros vinculados com sucesso' })
  } catch (error: any) {
    console.error('Erro ao vincular barbeiros:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao vincular barbeiros' },
      { status: 500 }
    )
  }
}

