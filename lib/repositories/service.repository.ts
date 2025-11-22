import { prisma } from '../prisma'
import { Service } from '@prisma/client'

export interface CreateServiceData {
  barbershopId: string
  name: string
  description?: string | null
  price: number
  duration: number
  isActive?: boolean
}

export class ServiceRepository {
  async create(data: CreateServiceData): Promise<Service> {
    return prisma.service.create({
      data: {
        barbershopId: data.barbershopId,
        name: data.name,
        description: data.description,
        price: data.price,
        duration: data.duration,
        isActive: data.isActive ?? true,
      },
    })
  }

  async createMany(data: CreateServiceData[]): Promise<Service[]> {
    const services = await Promise.all(
      data.map(serviceData => this.create(serviceData))
    )
    return services
  }

  async findByBarbershopId(barbershopId: string): Promise<Service[]> {
    return prisma.service.findMany({
      where: { barbershopId },
      orderBy: { name: 'asc' },
    })
  }

  async update(id: string, data: Partial<CreateServiceData>): Promise<Service> {
    return prisma.service.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.service.delete({
      where: { id },
    })
  }
}

