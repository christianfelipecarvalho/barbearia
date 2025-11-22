import { prisma } from '../prisma'
import { User, UserRole, AuthProvider } from '@prisma/client'

export interface CreateUserData {
  name: string
  email?: string | null
  phone?: string | null
  password?: string | null
  authProvider?: AuthProvider
  role?: UserRole
}

export interface FindUserByCredentialsParams {
  email?: string
  phone?: string
}

export class UserRepository {
  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({ data })
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } })
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } })
  }

  async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { phone } })
  }

  async findByCredentials(params: FindUserByCredentialsParams): Promise<User | null> {
    const { email, phone } = params

    if (!email && !phone) {
      return null
    }

    return prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    })
  }

  async existsByEmailOrPhone(email?: string, phone?: string): Promise<boolean> {
    if (!email && !phone) {
      return false
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    })

    return !!user
  }
}

