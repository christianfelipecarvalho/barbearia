import { prisma } from '../prisma'
import { Barbershop, SubscriptionStatus } from '@prisma/client'

export interface CreateBarbershopData {
  ownerId: string
  name: string
  description?: string | null
  logoUrl?: string | null
  coverUrl?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  latitude?: number | null
  longitude?: number | null
  acceptsPublicRequests?: boolean
}

export class BarbershopRepository {
  async create(data: CreateBarbershopData): Promise<Barbershop> {
    const now = new Date()
    const trialEndAt = new Date(now)
    trialEndAt.setDate(trialEndAt.getDate() + 30) // 30 dias de trial

    // Criar barbearia e subscription em uma transação
    return prisma.$transaction(async (tx) => {
      const barbershop = await tx.barbershop.create({
        data: {
          name: data.name,
          description: data.description,
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zipCode: data.zipCode,
          latitude: data.latitude,
          longitude: data.longitude,
          logoUrl: data.logoUrl,
          coverUrl: data.coverUrl,
          ownerId: data.ownerId,
          acceptsPublicRequests: data.acceptsPublicRequests ?? false,
        },
      })

      // Criar subscription com trial
      await tx.subscription.create({
        data: {
          barbershopId: barbershop.id,
          status: 'TRIAL',
          trialEndsAt: trialEndAt,
        },
      })

      return barbershop
    })
  }

  async findById(id: string): Promise<Barbershop | null> {
    return prisma.barbershop.findUnique({ 
      where: { id },
      include: { 
        subscription: true,
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        }
      }
    })
  }

  async findByOwnerId(ownerId: string): Promise<Barbershop[]> {
    return prisma.barbershop.findMany({ 
      where: { ownerId },
      include: { subscription: true }
    })
  }

  async updateSubscriptionStatus(
    id: string,
    status: SubscriptionStatus
  ): Promise<void> {
    await prisma.subscription.update({
      where: { barbershopId: id },
      data: { status },
    })
  }

  async findActiveBarbershops(
    filters?: {
      city?: string
      state?: string
      subscriptionStatus?: SubscriptionStatus
    }
  ) {
    const where: any = {
      ...(filters?.city && { city: filters.city }),
      ...(filters?.state && { state: filters.state }),
    }

    const barbershops = await prisma.barbershop.findMany({
      where,
      include: {
        subscription: true,
      },
    })

    // Filtrar por subscriptionStatus se fornecido
    if (filters?.subscriptionStatus) {
      return barbershops.filter(
        (shop) => shop.subscription?.status === filters.subscriptionStatus
      )
    }

    return barbershops
  }

  async checkSubscriptionStatus(barbershopId: string): Promise<SubscriptionStatus> {
    const barbershop = await prisma.barbershop.findUnique({
      where: { id: barbershopId },
      include: { subscription: true }
    })

    if (!barbershop) {
      throw new Error('Barbearia não encontrada')
    }

    const subscription = barbershop.subscription

    if (!subscription) {
      throw new Error('Assinatura não encontrada')
    }

    // Se já está EXPIRED ou ACTIVE, retornar o status atual
    if (subscription.status === 'EXPIRED' || subscription.status === 'ACTIVE') {
      return subscription.status
    }

    // Se está em TRIAL, verificar se expirou
    if (subscription.status === 'TRIAL' && subscription.trialEndsAt) {
      const now = new Date()
      if (now > subscription.trialEndsAt) {
        // Atualizar status para EXPIRED
        await this.updateSubscriptionStatus(barbershopId, 'EXPIRED')
        return 'EXPIRED'
      }
    }

    return subscription.status
  }

  async update(id: string, data: Partial<CreateBarbershopData>): Promise<Barbershop> {
    const updateData: any = {}
    
    if (data.name) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.address !== undefined) updateData.address = data.address
    if (data.city !== undefined) updateData.city = data.city
    if (data.state !== undefined) updateData.state = data.state
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode
    if (data.latitude !== undefined) updateData.latitude = data.latitude
    if (data.longitude !== undefined) updateData.longitude = data.longitude
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl
    if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl
    if (data.acceptsPublicRequests !== undefined) updateData.acceptsPublicRequests = data.acceptsPublicRequests

    return prisma.barbershop.update({
      where: { id },
      data: updateData,
    })
  }
}
