import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { BarbershopRepository } from '@/lib/repositories/barbershop.repository'

const barbershopRepository = new BarbershopRepository()

// DELETE - Remover barbeiro da barbearia
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; barberId: string }> }
) {
  try {
    const { id: barbershopId, barberId } = await params
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || token.role !== 'BARBEIRO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é dono da barbearia
    const barbershop = await barbershopRepository.findById(barbershopId)
    if (!barbershop || barbershop.ownerId !== token.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Verificar se o barbeiro existe
    const barberProfile = await prisma.barberProfile.findUnique({
      where: { id: barberId },
    })

    if (!barberProfile || barberProfile.barbershopId !== barbershopId) {
      return NextResponse.json(
        { error: 'Barbeiro não encontrado' },
        { status: 404 }
      )
    }

    // Não permitir remover o dono
    if (barberProfile.userId === barbershop.ownerId) {
      return NextResponse.json(
        { error: 'Não é possível remover o dono da barbearia' },
        { status: 400 }
      )
    }

    // Remover perfil do barbeiro
    await prisma.barberProfile.delete({
      where: { id: barberId },
    })

    return NextResponse.json({ message: 'Barbeiro removido com sucesso' })
  } catch (error: any) {
    console.error('Erro ao remover barbeiro:', error)
    return NextResponse.json(
      { error: 'Erro ao remover barbeiro' },
      { status: 500 }
    )
  }
}

