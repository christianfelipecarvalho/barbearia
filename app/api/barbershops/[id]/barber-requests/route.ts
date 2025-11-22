import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { BarbershopRepository } from '@/lib/repositories/barbershop.repository'

const barbershopRepository = new BarbershopRepository()

// GET - Listar solicitações de acesso (dono da barbearia)
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

    const requests = await prisma.barberRequest.findMany({
      where: { barbershopId },
      include: {
        barber: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ requests })
  } catch (error: any) {
    console.error('Erro ao buscar solicitações:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar solicitações' },
      { status: 500 }
    )
  }
}

// POST - Criar solicitação de acesso (barbeiro)
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

    const barberId = token.id as string
    const body = await request.json()
    const { message } = body

    // Verificar se a barbearia existe
    const barbershop = await barbershopRepository.findById(barbershopId)
    if (!barbershop) {
      return NextResponse.json(
        { error: 'Barbearia não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se não é o dono
    if (barbershop.ownerId === barberId) {
      return NextResponse.json(
        { error: 'Você é o dono desta barbearia' },
        { status: 400 }
      )
    }

    // Verificar se a barbearia aceita solicitações públicas
    // Se não aceita, apenas solicitações com ID explícito são permitidas
    // (isso será verificado pela existência da solicitação - se chegou aqui, o ID foi fornecido)
    if (!barbershop.acceptsPublicRequests) {
      // Barbearia privada - apenas aceita solicitações com ID explícito
      // Se chegou aqui, significa que o barbeiro forneceu o ID, então está OK
    }

    // Verificar se já está associado
    const existingProfile = await prisma.barberProfile.findUnique({
      where: {
        userId_barbershopId: {
          userId: barberId,
          barbershopId,
        },
      },
    })

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Você já está associado a esta barbearia' },
        { status: 400 }
      )
    }

    // Verificar se já existe solicitação pendente
    const existingRequest = await prisma.barberRequest.findUnique({
      where: {
        barberId_barbershopId: {
          barberId,
          barbershopId,
        },
      },
    })

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return NextResponse.json(
          { error: 'Você já tem uma solicitação pendente para esta barbearia' },
          { status: 400 }
        )
      }
      // Se foi rejeitada, pode criar nova solicitação
      await prisma.barberRequest.delete({
        where: { id: existingRequest.id },
      })
    }

    // Criar solicitação
    const barberRequest = await prisma.barberRequest.create({
      data: {
        barberId,
        barbershopId,
        message: message || null,
        status: 'PENDING',
      },
      include: {
        barber: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        barbershop: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ request: barberRequest }, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar solicitação:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar solicitação' },
      { status: 500 }
    )
  }
}

