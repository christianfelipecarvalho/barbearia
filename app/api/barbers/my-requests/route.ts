import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

// GET - Listar solicitações do barbeiro
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || token.role !== 'BARBEIRO') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const barberId = token.id as string

    const requests = await prisma.barberRequest.findMany({
      where: { barberId },
      include: {
        barbershop: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            logoUrl: true,
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

