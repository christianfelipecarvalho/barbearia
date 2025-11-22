import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { BarbershopRepository } from '@/lib/repositories/barbershop.repository'

const barbershopRepository = new BarbershopRepository()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    const barbershop = await barbershopRepository.findById(id)

    if (!barbershop) {
      return NextResponse.json(
        { error: 'Barbearia não encontrada' },
        { status: 404 }
      )
    }

    // Se estiver autenticado como barbeiro, verificar se é dono
    if (token && token.role === 'BARBEIRO') {
      if (barbershop.ownerId !== token.id) {
        // Verificar se o barbeiro está associado a esta barbearia
        // Por enquanto, apenas o dono pode acessar
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
      }
    } else if (!token) {
      // Para rotas públicas, verificar se a assinatura está ativa ou em trial
      const subscriptionStatus = await barbershopRepository.checkSubscriptionStatus(id)
      // Aceitar barbearias com status ACTIVE ou TRIAL (período de teste)
      if (subscriptionStatus !== 'ACTIVE' && subscriptionStatus !== 'TRIAL') {
        return NextResponse.json(
          { error: 'Barbearia não está disponível' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(barbershop)
  } catch (error: any) {
    console.error('Erro ao buscar barbearia:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar barbearia' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar barbearia
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || token.role !== 'BARBEIRO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const barbershop = await barbershopRepository.findById(id)
    if (!barbershop || barbershop.ownerId !== token.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const updatedBarbershop = await barbershopRepository.update(id, body)

    return NextResponse.json(updatedBarbershop)
  } catch (error: any) {
    console.error('Erro ao atualizar barbearia:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar barbearia' },
      { status: 500 }
    )
  }
}
