import 'next-auth'

// UserRole type from Prisma
type UserRole = 'ADMIN_GLOBAL' | 'BARBEIRO' | 'CLIENTE'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      role: UserRole
    }
  }

  interface User {
    id: string
    email?: string | null
    name?: string | null
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
  }
}

