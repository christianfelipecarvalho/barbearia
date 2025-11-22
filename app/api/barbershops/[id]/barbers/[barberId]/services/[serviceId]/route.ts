import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { BarberServiceRepository } from '@/lib/repositories/barber-service.repository'

const barberServiceRepository = new BarberServiceRepository()

// PUT - Atualizar serviço
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; barberId: string; serviceId: string }> }
) {
  try {
    const { id: barbershopId, barberId, serviceId } = await params
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || token.role !== 'BARBEIRO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o serviço existe e pertence ao barbeiro
    const service = await prisma.barberService.findUnique({
      where: { id: serviceId },
      include: {
        barber: {
          include: {
            barbershop: true,
          },
        },
      },
    })

    if (!service || service.barberId !== barberId || service.barber.barbershopId !== barbershopId) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      )
    }

    // Apenas o dono pode atualizar serviços
    if (service.barber.barbershop.ownerId !== token.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, price, duration, isActive } = body

    const updated = await barberServiceRepository.update(serviceId, {
      name,
      description,
      price: price !== undefined ? parseFloat(price) : undefined,
      duration: duration !== undefined ? parseInt(duration) : undefined,
      isActive,
    })

    return NextResponse.json({ service: updated })
  } catch (error: any) {
    console.error('Erro ao atualizar serviço:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar serviço' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar serviço
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; barberId: string; serviceId: string }> }
) {
  try {
    const { id: barbershopId, barberId, serviceId } = await params
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || token.role !== 'BARBEIRO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se o serviço existe e pertence ao barbeiro
    const service = await prisma.barberService.findUnique({
      where: { id: serviceId },
      include: {
        barber: {
          include: {
            barbershop: true,
          },
        },
      },
    })

    if (!service || service.barberId !== barberId || service.barber.barbershopId !== barbershopId) {
      return NextResponse.json(
        { error: 'Serviço não encontrado' },
        { status: 404 }
      )
    }

    // Apenas o dono pode deletar serviços
    if (service.barber.barbershop.ownerId !== token.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    await barberServiceRepository.delete(serviceId)

    return NextResponse.json({ message: 'Serviço removido com sucesso' })
  } catch (error: any) {
    console.error('Erro ao remover serviço:', error)
    return NextResponse.json(
      { error: 'Erro ao remover serviço' },
      { status: 500 }
    )
  }
}

