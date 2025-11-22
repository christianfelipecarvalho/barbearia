import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { BarbershopRepository } from '@/lib/repositories/barbershop.repository'

const barbershopRepository = new BarbershopRepository()

// GET - Listar barbeiros de uma barbearia
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: barbershopId } = await params
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || token.role !== 'BARBEIRO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar se é dono da barbearia
    const barbershop = await barbershopRepository.findById(barbershopId)
    if (!barbershop || barbershop.ownerId !== token.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

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
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ barbers })
  } catch (error: any) {
    console.error('Erro ao buscar barbeiros:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar barbeiros' },
      { status: 500 }
    )
  }
}

// POST - Adicionar barbeiro à barbearia
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: barbershopId } = await params
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
    const { userId, bio, avatarUrl } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe e é barbeiro
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || user.role !== 'BARBEIRO') {
      return NextResponse.json(
        { error: 'Usuário não encontrado ou não é barbeiro' },
        { status: 400 }
      )
    }

    // Verificar se já está associado a esta barbearia
    const existingProfile = await prisma.barberProfile.findUnique({
      where: {
        userId_barbershopId: {
          userId,
          barbershopId,
        },
      },
    })

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Barbeiro já está associado a esta barbearia' },
        { status: 400 }
      )
    }

    // Criar perfil do barbeiro
    const barberProfile = await prisma.barberProfile.create({
      data: {
        userId,
        barbershopId,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
      },
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
    })

    return NextResponse.json({ barber: barberProfile }, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao adicionar barbeiro:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao adicionar barbeiro' },
      { status: 500 }
    )
  }
}

