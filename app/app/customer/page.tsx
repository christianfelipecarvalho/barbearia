'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function CustomerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-black">
              Olá, {session.user.name}!
            </h1>
            <p className="mt-2 text-black">
              Escolha uma opção para continuar
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/app/customer/choose-barbershop">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-black">
                <div className="text-4xl mb-4">🏪</div>
                <h2 className="text-xl font-semibold text-black mb-2">
                  Escolher Barbearia
                </h2>
                <p className="text-black">
                  Selecione ou altere sua barbearia principal
                </p>
              </div>
            </Link>

            <Link href="/app/customer/book">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-black">
                <div className="text-4xl mb-4">📅</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Agendar Horário
                </h2>
                <p className="text-gray-600">
                  Agende um novo serviço na sua barbearia
                </p>
              </div>
            </Link>

            <Link href="/app/customer/appointments">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-black">
                <div className="text-4xl mb-4">📋</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Meus Agendamentos
                </h2>
                <p className="text-gray-600">
                  Veja e gerencie seus agendamentos
                </p>
              </div>
            </Link>

            <Link href="/app/customer/search">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border-2 border-transparent hover:border-black">
                <div className="text-4xl mb-4">🔍</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Buscar Horários
                </h2>
                <p className="text-gray-600">
                  Encontre horários disponíveis em todas as barbearias
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

