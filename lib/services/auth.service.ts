import bcrypt from 'bcryptjs'
import { UserRepository, CreateUserData } from '../repositories/user.repository'

// UserRole type from Prisma
type UserRole = 'ADMIN_GLOBAL' | 'BARBEIRO' | 'CLIENTE'

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  async registerUser(data: {
    name: string
    email?: string
    phone?: string
    password: string
    dateOfBirth?: string
    role?: UserRole
  }): Promise<{ userId: string; dateOfBirth?: string }> {
    const { password, dateOfBirth, ...userData } = data

    // Validar que pelo menos email ou telefone foi fornecido
    if (!userData.email && !userData.phone) {
      throw new Error('Email ou telefone é obrigatório')
    }

    // Verificar se usuário já existe
    const exists = await this.userRepository.existsByEmailOrPhone(
      userData.email,
      userData.phone
    )

    if (exists) {
      throw new Error('Email ou telefone já cadastrado')
    }

    // Hash da senha
    const passwordHash = await this.hashPassword(password)

    // Criar usuário (sem dateOfBirth, que vai no CustomerProfile)
    const createData: CreateUserData = {
      ...userData,
      password: passwordHash,
      authProvider: 'EMAIL',
      role: userData.role || 'CLIENTE',
    }

    const user = await this.userRepository.create(createData)

    return { userId: user.id, dateOfBirth }
  }

  async authenticateUser(
    email?: string,
    phone?: string,
    password?: string
  ): Promise<{ id: string; email: string | null; name: string; role: UserRole } | null> {
    if (!password) {
      return null
    }

    const user = await this.userRepository.findByCredentials({ email, phone })

    if (!user || !user.password) {
      return null
    }

    const isValid = await this.verifyPassword(password, user.password)

    if (!isValid) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }
  }
}

