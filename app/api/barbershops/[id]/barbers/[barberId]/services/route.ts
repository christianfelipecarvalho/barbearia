import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { BarberServiceRepository } from '@/lib/repositories/barber-service.repository'
import { BarbershopRepository } from '@/lib/repositories/barbershop.repository'

const barberServiceRepository = new BarberServiceRepository()
const barbershopRepository = new BarbershopRepository()

// GET - Listar serviços de um barbeiro
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

    // Verificar permissões: barbeiro pode ver seus próprios serviços ou dono da barbearia
    const isOwner = barberProfile.barbershop.ownerId === token.id
    const isBarber = barberProfile.userId === token.id

    if (!isOwner && !isBarber && token.role !== 'ADMIN_GLOBAL') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Buscar serviços específicos do barbeiro
    const barberServices = await barberServiceRepository.findByBarberId(barberId)

    // Buscar serviços da barbearia vinculados a este barbeiro
    const linkedServices = await prisma.serviceBarber.findMany({
      where: { barberId },
      include: {
        service: true,
      },
    })

    return NextResponse.json({
      barberServices, // Serviços específicos do barbeiro
      linkedServices: linkedServices.map((ls) => ({
        id: ls.service.id,
        name: ls.service.name,
        description: ls.service.description,
        price: ls.service.price,
        duration: ls.service.duration,
        isActive: ls.service.isActive,
        isLinked: true, // Flag para identificar que é um serviço vinculado
      })),
    })
  } catch (error: any) {
    console.error('Erro ao buscar serviços do barbeiro:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar serviços' },
      { status: 500 }
    )
  }
}

// POST - Criar serviço para um barbeiro
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

    // Apenas o dono pode criar serviços para barbeiros
    if (barberProfile.barbershop.ownerId !== token.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, price, duration, isActive } = body

    if (!name || !price || !duration) {
      return NextResponse.json(
        { error: 'Nome, preço e duração são obrigatórios' },
        { status: 400 }
      )
    }

    const service = await barberServiceRepository.create({
      barberId,
      name,
      description: description || null,
      price: parseFloat(price),
      duration: parseInt(duration),
      isActive: isActive ?? true,
    })

    return NextResponse.json({ service }, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar serviço:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar serviço' },
      { status: 500 }
    )
  }
}

