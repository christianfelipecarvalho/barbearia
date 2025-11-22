import { prisma } from '../prisma'
import { BarberWorkingHours } from '@prisma/client'

export interface CreateBarberWorkingHoursData {
  barberId: string
  dayOfWeek: number // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  startTime: string // formato HH:mm
  endTime: string // formato HH:mm
  isOpen?: boolean
}

export class BarberWorkingHoursRepository {
  async create(data: CreateBarberWorkingHoursData): Promise<BarberWorkingHours> {
    return prisma.barberWorkingHours.create({
      data: {
        barberId: data.barberId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isOpen: data.isOpen ?? true,
      },
    })
  }

  async createMany(data: CreateBarberWorkingHoursData[]): Promise<BarberWorkingHours[]> {
    const workingHours = await Promise.all(
      data.map(whData => this.create(whData))
    )
    return workingHours
  }

  async findByBarberId(barberId: string): Promise<BarberWorkingHours[]> {
    return prisma.barberWorkingHours.findMany({
      where: { barberId },
      orderBy: { dayOfWeek: 'asc' },
    })
  }

  async findByBarberIdAndDay(barberId: string, dayOfWeek: number): Promise<BarberWorkingHours | null> {
    return prisma.barberWorkingHours.findUnique({
      where: {
        barberId_dayOfWeek: {
          barberId,
          dayOfWeek,
        },
      },
    })
  }

  async update(id: string, data: Partial<CreateBarberWorkingHoursData>): Promise<BarberWorkingHours> {
    return prisma.barberWorkingHours.update({
      where: { id },
      data,
    })
  }

  async upsert(data: CreateBarberWorkingHoursData): Promise<BarberWorkingHours> {
    return prisma.barberWorkingHours.upsert({
      where: {
        barberId_dayOfWeek: {
          barberId: data.barberId,
          dayOfWeek: data.dayOfWeek,
        },
      },
      update: {
        startTime: data.startTime,
        endTime: data.endTime,
        isOpen: data.isOpen ?? true,
      },
      create: {
        barberId: data.barberId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isOpen: data.isOpen ?? true,
      },
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.barberWorkingHours.delete({
      where: { id },
    })
  }

  async deleteByBarberId(barberId: string): Promise<void> {
    await prisma.barberWorkingHours.deleteMany({
      where: { barberId },
    })
  }
}

