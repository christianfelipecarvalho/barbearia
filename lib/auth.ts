import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { UserRepository } from './repositories/user.repository'
import { AuthService } from './services/auth.service'

// UserRole type from Prisma
type UserRole = 'ADMIN_GLOBAL' | 'BARBEIRO' | 'CLIENTE'

const userRepository = new UserRepository()
const authService = new AuthService(userRepository)

export const authOptions: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        phone: { label: 'Phone', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null

        const email = credentials.email as string | undefined
        const phone = credentials.phone as string | undefined
        const password = credentials.password as string | undefined

        return authService.authenticateUser(email, phone, password)
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const email = user.email || (profile as any)?.email

        if (!email) {
          return false
        }

        // Verificar se o usuário já existe
        const existingUser = await userRepository.findByEmail(email)

        if (!existingUser) {
          // Criar novo usuário com Google
          await userRepository.create({
            email,
            name: user.name || (profile as any)?.name || '',
            authProvider: 'GOOGLE',
            role: 'CLIENTE',
          })
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

