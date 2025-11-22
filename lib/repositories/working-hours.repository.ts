import { prisma } from '../prisma'
import { WorkingHours } from '@prisma/client'

export interface CreateWorkingHoursData {
  barbershopId: string
  dayOfWeek: number // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  startTime: string // formato HH:mm
  endTime: string // formato HH:mm
  isOpen?: boolean
  gapMinutes?: number // Mantido para compatibilidade, mas não será mais usado
}

export class WorkingHoursRepository {
  async create(data: CreateWorkingHoursData): Promise<WorkingHours> {
    return prisma.workingHours.create({
      data: {
        barbershopId: data.barbershopId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isOpen: data.isOpen ?? true,
        gapMinutes: data.gapMinutes ?? 0,
      },
    })
  }

  async createMany(data: CreateWorkingHoursData[]): Promise<WorkingHours[]> {
    const workingHours = await Promise.all(
      data.map(whData => this.create(whData))
    )
    return workingHours
  }

  async findByBarbershopId(barbershopId: string): Promise<WorkingHours[]> {
    return prisma.workingHours.findMany({
      where: { barbershopId },
      orderBy: { dayOfWeek: 'asc' },
    })
  }

  async update(id: string, data: Partial<CreateWorkingHoursData>): Promise<WorkingHours> {
    return prisma.workingHours.update({
      where: { id },
      data,
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.workingHours.delete({
      where: { id },
    })
  }
}

