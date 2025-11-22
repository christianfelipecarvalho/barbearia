import { prisma } from '../prisma'
import { BarbershopRepository, CreateBarbershopData } from '../repositories/barbershop.repository'
import { ServiceRepository, CreateServiceData } from '../repositories/service.repository'
import { WorkingHoursRepository, CreateWorkingHoursData } from '../repositories/working-hours.repository'
import { Barbershop } from '@prisma/client'

export interface CreateBarbershopWithDetailsData extends CreateBarbershopData {
  services?: Omit<CreateServiceData, 'barbershopId'>[]
  workingHours?: Omit<CreateWorkingHoursData, 'barbershopId'>[]
}

export class BarbershopService {
  constructor(
    private barbershopRepository: BarbershopRepository,
    private serviceRepository: ServiceRepository,
    private workingHoursRepository: WorkingHoursRepository
  ) {}

  async createBarbershopWithDetails(
    data: CreateBarbershopWithDetailsData
  ): Promise<Barbershop> {
    const { services, workingHours, ownerId, ...barbershopData } = data

    // Criar barbearia e subscription primeiro
    const barbershop = await this.barbershopRepository.create({
      ...barbershopData,
      ownerId,
    })

    // Criar perfil do barbeiro, serviços e horários em uma transação
    await prisma.$transaction(async (tx) => {
      // Criar perfil do barbeiro
      await tx.barberProfile.create({
        data: {
          userId: ownerId,
          barbershopId: barbershop.id,
        },
      })

      // Criar serviços se fornecidos
      if (services && services.length > 0) {
        await Promise.all(
          services.map(service =>
            tx.service.create({
              data: {
                barbershopId: barbershop.id,
                name: service.name,
                description: service.description,
                price: service.price,
                duration: service.duration,
                isActive: service.isActive ?? true,
              },
            })
          )
        )
      }

      // Criar horários de funcionamento se fornecidos
      if (workingHours && workingHours.length > 0) {
        await Promise.all(
          workingHours.map(wh =>
            tx.workingHours.create({
              data: {
                barbershopId: barbershop.id,
                dayOfWeek: wh.dayOfWeek,
                startTime: wh.startTime,
                endTime: wh.endTime,
                isOpen: wh.isOpen ?? true,
                gapMinutes: 0, // Não usar mais gapMinutes, apenas duração do serviço
              },
            })
          )
        )
      }
    })

    return barbershop
  }
}

