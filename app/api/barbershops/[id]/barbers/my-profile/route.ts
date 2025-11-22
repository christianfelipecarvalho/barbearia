import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

// GET - Buscar perfil do barbeiro atual nesta barbearia
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

    // Buscar perfil do barbeiro nesta barbearia
    const barberProfile = await prisma.barberProfile.findUnique({
      where: {
        userId_barbershopId: {
          userId: token.id as string,
          barbershopId,
        },
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
        barbershop: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    })

    if (!barberProfile) {
      return NextResponse.json(
        { error: 'Perfil de barbeiro não encontrado nesta barbearia' },
        { status: 404 }
      )
    }

    return NextResponse.json({ barber: barberProfile })
  } catch (error: any) {
    console.error('Erro ao buscar perfil do barbeiro:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar perfil do barbeiro' },
      { status: 500 }
    )
  }
}

