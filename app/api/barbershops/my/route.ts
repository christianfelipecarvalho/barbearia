import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { BarbershopRepository } from '@/lib/repositories/barbershop.repository'

const barbershopRepository = new BarbershopRepository()

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || token.role !== 'BARBEIRO') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Retornar todas as barbearias do dono
    const barbershops = await barbershopRepository.findByOwnerId(token.id as string)

    return NextResponse.json({ barbershops }, { status: 200 })
  } catch (error: any) {
    console.error('Erro ao buscar barbearias:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar barbearias' },
      { status: 500 }
    )
  }
}

