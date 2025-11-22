import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { ServiceRepository } from '@/lib/repositories/service.repository'
import { BarbershopRepository } from '@/lib/repositories/barbershop.repository'

const serviceRepository = new ServiceRepository()
const barbershopRepository = new BarbershopRepository()

// PUT - Atualizar serviço
export async function PUT(
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
    const { name, description, price, duration, isActive } = body

    const updated = await serviceRepository.update(serviceId, {
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

    await serviceRepository.delete(serviceId)

    return NextResponse.json({ message: 'Serviço removido com sucesso' })
  } catch (error: any) {
    console.error('Erro ao remover serviço:', error)
    return NextResponse.json(
      { error: 'Erro ao remover serviço' },
      { status: 500 }
    )
  }
}

