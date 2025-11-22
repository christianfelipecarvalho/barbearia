import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { BarbershopRepository } from '@/lib/repositories/barbershop.repository'

const barbershopRepository = new BarbershopRepository()

// PUT - Aprovar ou rejeitar solicitação (dono da barbearia)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const { id: barbershopId, requestId } = await params
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || token.role !== 'BARBEIRO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é dono da barbearia
    const barbershop = await barbershopRepository.findById(barbershopId)
    if (!barbershop || barbershop.ownerId !== token.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    // Buscar solicitação
    const barberRequest = await prisma.barberRequest.findUnique({
      where: { id: requestId },
      include: {
        barber: true,
      },
    })

    if (!barberRequest || barberRequest.barbershopId !== barbershopId) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      )
    }

    if (barberRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Solicitação já foi processada' },
        { status: 400 }
      )
    }

    // Atualizar solicitação
    const updatedRequest = await prisma.barberRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedAt: new Date(),
      },
    })

    // Se aprovado, criar perfil do barbeiro
    if (status === 'APPROVED') {
      await prisma.barberProfile.create({
        data: {
          userId: barberRequest.barberId,
          barbershopId,
        },
      })
    }

    return NextResponse.json({ request: updatedRequest })
  } catch (error: any) {
    console.error('Erro ao processar solicitação:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}

// DELETE - Cancelar solicitação (barbeiro)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const { id: barbershopId, requestId } = await params
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || token.role !== 'BARBEIRO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const barberId = token.id as string

    // Buscar solicitação
    const barberRequest = await prisma.barberRequest.findUnique({
      where: { id: requestId },
    })

    if (!barberRequest || barberRequest.barberId !== barberId) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      )
    }

    // Só pode cancelar se estiver pendente
    if (barberRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Não é possível cancelar uma solicitação já processada' },
        { status: 400 }
      )
    }

    await prisma.barberRequest.delete({
      where: { id: requestId },
    })

    return NextResponse.json({ message: 'Solicitação cancelada' })
  } catch (error: any) {
    console.error('Erro ao cancelar solicitação:', error)
    return NextResponse.json(
      { error: 'Erro ao cancelar solicitação' },
      { status: 500 }
    )
  }
}

