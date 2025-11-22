import { prisma } from '../prisma'
import { BarberService } from '@prisma/client'

export interface CreateBarberServiceData {
  barberId: string
  name: string
  description?: string | null
  price: number
  duration: number
  isActive?: boolean
}

export class BarberServiceRepository {
  async create(data: CreateBarberServiceData): Promise<BarberService> {
    return prisma.barberService.create({
      data: {
        barberId: data.barberId,
        name: data.name,
        description: data.description,
        price: data.price,
        duration: data.duration,
        isActive: data.isActive ?? true,
      },
    })
  }

  async createMany(data: CreateBarberServiceData[]): Promise<BarberService[]> {
    const services = await Promise.all(
      data.map(serviceData => this.create(serviceData))
    )
    return services
  }

  async findByBarberId(barberId: string): Promise<BarberService[]> {
    return prisma.barberService.findMany({
      where: { barberId },
      orderBy: { name: 'asc' },
    })
  }

  async findActiveByBarberId(barberId: string): Promise<BarberService[]> {
    return prisma.barberService.findMany({
      where: { 
        barberId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    })
  }

  async update(id: string, data: Partial<CreateBarberServiceData>): Promise<BarberService> {
    return prisma.barberService.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.barberService.delete({
      where: { id },
    })
  }
}

