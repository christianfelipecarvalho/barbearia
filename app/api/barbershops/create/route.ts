import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { BarbershopService } from '@/lib/services/barbershop.service'
import { BarbershopRepository } from '@/lib/repositories/barbershop.repository'
import { ServiceRepository } from '@/lib/repositories/service.repository'
import { WorkingHoursRepository } from '@/lib/repositories/working-hours.repository'

const barbershopRepository = new BarbershopRepository()
const serviceRepository = new ServiceRepository()
const workingHoursRepository = new WorkingHoursRepository()
const barbershopService = new BarbershopService(
  barbershopRepository,
  serviceRepository,
  workingHoursRepository
)

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token || token.role !== 'BARBEIRO') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      services,
      workingHours,
    } = body

    // Validação básica
    if (!name || !address || !city || !state) {
      return NextResponse.json(
        { error: 'Nome, endereço, cidade e estado são obrigatórios' },
        { status: 400 }
      )
    }

    // Permitir múltiplas barbearias por dono

    const barbershop = await barbershopService.createBarbershopWithDetails({
      ownerId: token.id as string,
      name,
      description: description || null,
      address,
      city,
      state,
      zipCode: zipCode || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      acceptsPublicRequests: body.acceptsPublicRequests || false,
      services: services || [],
      workingHours: workingHours || [],
    })

    return NextResponse.json(
      { message: 'Barbearia criada com sucesso', barbershop },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erro ao criar barbearia:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar barbearia' },
      { status: 500 }
    )
  }
}

