import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { ServiceRepository } from '@/lib/repositories/service.repository'
import { BarbershopRepository } from '@/lib/repositories/barbershop.repository'

const serviceRepository = new ServiceRepository()
const barbershopRepository = new BarbershopRepository()

// GET - Listar serviços da barbearia
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: barbershopId } = await params
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    // Verificar se a barbearia existe
    const barbershop = await barbershopRepository.findById(barbershopId)
    if (!barbershop) {
      return NextResponse.json(
        { error: 'Barbearia não encontrada' },
        { status: 404 }
      )
    }

    // Se autenticado como barbeiro, verificar se é dono
    if (token && token.role === 'BARBEIRO') {
      if (barbershop.ownerId !== token.id) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
      }
    }

    const services = await serviceRepository.findByBarbershopId(barbershopId)

    return NextResponse.json({ services })
  } catch (error: any) {
    console.error('Erro ao buscar serviços:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar serviços' },
      { status: 500 }
    )
  }
}

// POST - Criar serviço da barbearia
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
    const { name, description, price, duration, isActive } = body

    if (!name || price === undefined || duration === undefined) {
      return NextResponse.json(
        { error: 'Nome, preço e duração são obrigatórios' },
        { status: 400 }
      )
    }

    const service = await serviceRepository.create({
      barbershopId,
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

