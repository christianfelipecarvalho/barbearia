import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

// GET - Listar barbearias do barbeiro (onde ele está associado)
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || token.role !== 'BARBEIRO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const barberId = token.id as string

    const profiles = await prisma.barberProfile.findMany({
      where: { userId: barberId },
      include: {
        barbershop: {
          select: {
            id: true,
            name: true,
            description: true,
            city: true,
            state: true,
            logoUrl: true,
            coverUrl: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const barbershops = profiles.map((profile) => ({
      ...profile.barbershop,
      isOwner: profile.barbershop.owner.id === barberId,
      profileId: profile.id,
    }))

    return NextResponse.json({ barbershops })
  } catch (error: any) {
    console.error('Erro ao buscar barbearias:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar barbearias' },
      { status: 500 }
    )
  }
}

