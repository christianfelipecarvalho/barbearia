import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Listar barbearias públicas que aceitam solicitações
export async function GET() {
  try {
    const barbershops = await prisma.barbershop.findMany({
      where: {
        acceptsPublicRequests: true,
        subscription: {
          OR: [
            { status: 'ACTIVE' },
            { status: 'TRIAL' },
          ],
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        city: true,
        state: true,
        logoUrl: true,
        coverUrl: true,
        address: true,
        subscription: {
          select: {
            status: true,
            trialEndsAt: true,
          },
        },
      },
    })

    // Filtrar trials expirados
    const now = new Date()
    const activeBarbershops = barbershops.filter((shop) => {
      if (shop.subscription?.status === 'ACTIVE') return true
      if (shop.subscription?.status === 'TRIAL' && shop.subscription.trialEndsAt) {
        return new Date(shop.subscription.trialEndsAt) > now
      }
      return false
    })

    return NextResponse.json({ barbershops: activeBarbershops })
  } catch (error: any) {
    console.error('Erro ao buscar barbearias públicas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar barbearias públicas' },
      { status: 500 }
    )
  }
}

