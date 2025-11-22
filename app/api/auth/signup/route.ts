import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRepository } from '@/lib/repositories/user.repository'
import { AuthService } from '@/lib/services/auth.service'

// UserRole type from Prisma
type UserRole = 'ADMIN_GLOBAL' | 'BARBEIRO' | 'CLIENTE'

const userRepository = new UserRepository()
const authService = new AuthService(userRepository)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, password, dateOfBirth, role } = body

    // Validação básica
    if (!name || !password) {
      return NextResponse.json(
        { error: 'Nome e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Registrar usuário usando o serviço
    const { userId, dateOfBirth: userDateOfBirth } = await authService.registerUser({
      name,
      email,
      phone,
      password,
      dateOfBirth,
      role: (role as UserRole) || 'CLIENTE',
    })

    // Criar perfil específico baseado no role
    if (role === 'CLIENTE') {
      await prisma.customerProfile.create({
        data: {
          userId,
          dateOfBirth: userDateOfBirth ? new Date(userDateOfBirth) : null,
        },
      })
    }
    // Para BARBEIRO, o perfil será criado quando criar a primeira barbearia

    return NextResponse.json(
      { message: 'Conta criada com sucesso', userId },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar conta' },
      { status: 500 }
    )
  }
}

